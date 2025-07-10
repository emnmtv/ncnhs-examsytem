<template>
  <div class="attendance-scanner">
    <!-- Alert Notification -->
    <div v-if="showAlert" class="alert-notification" :class="alertType">
      <div class="alert-content">
        <span class="material-icons">{{ alertIcon }}</span>
        <span class="alert-message">{{ alertMessage }}</span>
      </div>
      <button class="alert-close" @click="hideAlert">
        <span class="material-icons">close</span>
      </button>
    </div>
    
    <div class="header-container">
      <div class="header-content">
        <div class="title-row">
          <router-link to="/class-list" class="back-btn">
            <span class="material-icons">arrow_back</span>
          </router-link>
          <h1>Attendance Scanner<span class="material-icons">qr_code_scanner</span></h1>
        </div>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle" v-if="sessionData">{{ sessionData.subject?.name }} - {{ sessionData.title || 'Attendance Session' }}</p>
        </div>
      </div>
      <div class="header-background">SCAN</div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading attendance session...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadSession" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <div v-else class="scanner-container">
      <!-- Camera View -->
      <div class="camera-container">
        <div class="scanner-overlay">
          <div class="scanner-box">
            <div class="scanner-line"></div>
          </div>
        </div>
        <video ref="videoElement" class="camera-feed" autoplay playsinline></video>
      </div>

      <!-- Control Panel -->
      <div class="control-panel">
        <div class="session-info">
          <h3 class="session-title">
            <span class="material-icons">event</span>
            {{ sessionData?.title || 'Attendance Session' }}
          </h3>
          <div class="info-item">
            <span class="label">Subject:</span>
            <span class="value">{{ sessionData?.subject?.name || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Date:</span>
            <span class="value">{{ formatDate(sessionData?.date) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Schedule:</span>
            <span class="value">
              {{ sessionData?.useSubjectSchedule ? 'No time restriction' : 'Manual schedule' }}
            </span>
          </div>
          <div class="info-item" v-if="!sessionData?.useSubjectSchedule && sessionData?.scheduleStartTime">
            <span class="label">Start Time:</span>
            <span class="value">{{ formatTime(sessionData?.scheduleStartTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Late After:</span>
            <span class="value">
              {{ sessionData?.useSubjectSchedule ? 'No late marking' : `${sessionData?.lateThresholdMinutes || 0} minutes` }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Scanned:</span>
            <span class="value">{{ attendanceRecords.length || 0 }} students</span>
          </div>
        </div>
        
        <div class="controls">
          <button @click="toggleCamera" class="control-btn" :disabled="!isCameraAvailable">
            <span class="material-icons">{{ isCameraActive ? 'videocam_off' : 'videocam' }}</span>
            {{ isCameraActive ? 'Stop Camera' : 'Start Camera' }}
          </button>
          <button 
            v-if="hasMultipleCameras" 
            @click="switchCamera" 
            class="control-btn" 
            :disabled="!isCameraAvailable || !isCameraActive"
          >
            <span class="material-icons">flip_camera_android</span>
            Switch Camera
          </button>
          <button @click="toggleTorch" class="control-btn" :disabled="!hasTorch">
            <span class="material-icons">{{ isTorchActive ? 'flashlight_off' : 'flashlight_on' }}</span>
            {{ isTorchActive ? 'Turn Off Flash' : 'Turn On Flash' }}
          </button>
          <router-link to="/class-list" class="control-btn back-to-list">
            <span class="material-icons">list</span>
            Back to Class List
          </router-link>
        </div>
      </div>

      <!-- Recent Scans -->
      <div class="recent-scans">
        <h2>Recently Scanned</h2>
        <div v-if="attendanceRecords.length === 0" class="no-scans">
          <span class="material-icons">info</span>
          <p>No students scanned yet</p>
          <p class="scan-hint">Point the camera at a student's QR code</p>
        </div>
        <div v-else class="scans-list">
          <div v-for="(record, index) in attendanceRecords" :key="index" class="scan-item">
            <div class="student-info">
              <span class="student-name">
                {{ record.student?.lastName || 'Unknown' }}, {{ record.student?.firstName || 'Student' }}
              </span>
              <span class="student-lrn">
                LRN: {{ record.student?.lrn || 'N/A' }}
              </span>
            </div>
            <div class="scan-status" :class="record.status || 'unknown'">
              {{ record.status || 'unknown' }}
              <span class="material-icons">
                {{ record.status === 'present' ? 'check_circle' : record.status === 'late' ? 'schedule' : 'cancel' }}
              </span>
            </div>
            <div class="scan-time">
              {{ formatTime(record.timestamp) }}
              <div class="scan-details" v-if="record.remarks">
                <small>{{ record.remarks }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getAttendanceSessionById, markAttendance, getSessionAttendance } from '@/services/authService';
import jsQR from 'jsqr';

const route = useRoute();
const videoElement = ref(null);
const canvasContext = ref(null);
const loading = ref(true);
const error = ref(null);
const sessionData = ref(null);
const attendanceRecords = ref([]);

// Camera state
const isCameraAvailable = ref(true);
const isCameraActive = ref(false);
const hasTorch = ref(false);
const isTorchActive = ref(false);
const videoStream = ref(null);
const scanInterval = ref(null);
const hasMultipleCameras = ref(false); // Track if device has multiple cameras
const currentFacingMode = ref('environment'); // Track current camera facing mode

// Alert state
const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('info'); // 'success', 'warning', 'error', 'info'
const alertTimeout = ref(null);
const isProcessingQR = ref(false); // Flag to prevent multiple scans

// Alert icon based on type
const alertIcon = computed(() => {
  switch (alertType.value) {
    case 'success': return 'check_circle';
    case 'warning': return 'warning';
    case 'error': return 'error';
    default: return 'info';
  }
});

// Show alert message
const showAlertMessage = (message, type = 'info', duration = 3000) => {
  // Clear any existing timeout
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value);
  }
  
  // Set alert properties
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
  
  // Auto-hide after duration
  alertTimeout.value = setTimeout(() => {
    hideAlert();
  }, duration);
};

// Hide alert message
const hideAlert = () => {
  showAlert.value = false;
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value);
    alertTimeout.value = null;
  }
};

// Function to load the attendance session
const loadSession = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const sessionId = route.params.sessionId;
    if (!sessionId) {
      throw new Error('No session ID provided');
    }
    
    console.log('Loading attendance session with ID:', sessionId);
    
    // Load session data
    const session = await getAttendanceSessionById(parseInt(sessionId));
    
    if (!session) {
      throw new Error('Could not load attendance session data');
    }
    
    console.log('Session data loaded:', session);
    sessionData.value = session;
    
    // Load existing attendance records
    try {
      const records = await getSessionAttendance(parseInt(sessionId));
      console.log('Attendance records loaded:', records);
      
      // Validate and normalize records to ensure they have the required structure
      const validRecords = (records || []).map(record => {
        // Ensure each record has a student property
        if (!record.student) {
          record.student = {
            id: record.studentId || 'unknown',
            firstName: 'Unknown',
            lastName: 'Student',
            lrn: 'N/A'
          };
        }
        
        // Ensure each record has a status
        if (!record.status) {
          record.status = 'unknown';
        }
        
        // Add timestamp if missing
        if (!record.timestamp) {
          record.timestamp = record.createdAt || new Date();
        }
        
        return record;
      });
      
      attendanceRecords.value = validRecords;
    } catch (recordsError) {
      console.error('Error loading attendance records:', recordsError);
      // Don't fail the whole operation if records can't be loaded
      attendanceRecords.value = [];
    }
    
    // Start camera
    await startCamera();
  } catch (err) {
    console.error('Failed to load attendance session:', err);
    error.value = err.message || 'Failed to load attendance session';
  } finally {
    loading.value = false;
  }
};

// Start the camera
const startCamera = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      isCameraAvailable.value = false;
      throw new Error('Camera not available on this device');
    }
    
    // Check if device has multiple cameras
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      hasMultipleCameras.value = videoDevices.length > 1;
      console.log(`Found ${videoDevices.length} video devices:`, videoDevices);
    } catch (err) {
      console.error('Error checking for multiple cameras:', err);
      hasMultipleCameras.value = false;
    }
    
    // Get video stream with best available camera
    const constraints = {
      audio: false,
      video: {
        facingMode: currentFacingMode.value, // Use current facing mode
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    
    videoStream.value = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Check if torch is available
    const track = videoStream.value.getVideoTracks()[0];
    hasTorch.value = track && 'torch' in track.getCapabilities();
    
    // Set video source
    if (videoElement.value) {
      videoElement.value.srcObject = videoStream.value;
      videoElement.value.setAttribute('playsinline', true); // Required for iOS
      videoElement.value.play();
      
      // Create canvas for QR scanning
      const canvas = document.createElement('canvas');
      canvasContext.value = canvas.getContext('2d', { willReadFrequently: true });
      
      // Start scanning
      isCameraActive.value = true;
      startScanning();
    }
  } catch (err) {
    console.error('Error starting camera:', err);
    isCameraAvailable.value = false;
    error.value = 'Could not access camera. Please check your permissions.';
  }
};

// Stop the camera
const stopCamera = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop());
    videoStream.value = null;
  }
  
  if (scanInterval.value) {
    clearInterval(scanInterval.value);
    scanInterval.value = null;
  }
  
  isCameraActive.value = false;
};

// Toggle camera on/off
const toggleCamera = async () => {
  if (isCameraActive.value) {
    stopCamera();
  } else {
    await startCamera();
  }
};

// Switch camera (front/back)
const switchCamera = async () => {
  if (!isCameraActive.value || !isCameraAvailable.value) return;
  
  // If device doesn't have multiple cameras, show a message
  if (!hasMultipleCameras.value) {
    showAlertMessage('Your device only has one camera', 'warning');
    return;
  }
  
  try {
    // Toggle facing mode
    currentFacingMode.value = currentFacingMode.value === 'environment' ? 'user' : 'environment';
    
    // Stop current stream
    if (videoStream.value) {
      videoStream.value.getTracks().forEach(track => track.stop());
    }
    
    // Get new stream with toggled facing mode
    const constraints = {
      audio: false,
      video: {
        facingMode: currentFacingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    
    videoStream.value = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Update video source
    if (videoElement.value) {
      videoElement.value.srcObject = videoStream.value;
      videoElement.value.setAttribute('playsinline', true);
      videoElement.value.play();
    }
    
    // Check if torch is available on new camera
    const track = videoStream.value.getVideoTracks()[0];
    hasTorch.value = track && 'torch' in track.getCapabilities();
    
    // Reset torch state for new camera
    isTorchActive.value = false;
    
    showAlertMessage(`Switched to ${currentFacingMode.value === 'user' ? 'front' : 'back'} camera`, 'success');
  } catch (err) {
    console.error('Error switching camera:', err);
    showAlertMessage('Failed to switch camera', 'error');
  }
};

// Toggle torch/flashlight
const toggleTorch = async () => {
  if (!hasTorch.value || !videoStream.value) return;
  
  try {
    const track = videoStream.value.getVideoTracks()[0];
    isTorchActive.value = !isTorchActive.value;
    
    await track.applyConstraints({
      advanced: [{ torch: isTorchActive.value }]
    });
  } catch (err) {
    console.error('Error toggling torch:', err);
    hasTorch.value = false; // Disable if not supported
  }
};

// Start QR code scanning
const startScanning = () => {
  if (scanInterval.value) {
    clearInterval(scanInterval.value);
  }
  
  scanInterval.value = setInterval(() => {
    if (!isProcessingQR.value) { // Only scan if not already processing
      scanQRCode();
    }
  }, 200); // Scan every 200ms
};

// Process a frame to scan for QR codes
const scanQRCode = () => {
  if (!isCameraActive.value || !videoElement.value || !canvasContext.value) return;
  
  const video = videoElement.value;
  
  // Make sure video is ready
  if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
  
  // Set canvas dimensions to video dimensions
  const canvas = canvasContext.value.canvas;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw current video frame to canvas
  canvasContext.value.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Get image data for scanning
  const imageData = canvasContext.value.getImageData(0, 0, canvas.width, canvas.height);
  
  // Scan for QR code
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert"
  });
  
  if (code) {
    console.log("QR Code detected:", code.data);
    // Add visual feedback when a QR code is detected
    showAlertMessage("QR Code detected! Processing...", "info", 1000);
    processQRCode(code.data);
  }
};

// Process QR code data
const processQRCode = async (qrData) => {
  // Prevent multiple scans in quick succession
  if (isProcessingQR.value) {
    return;
  }
  
  try {
    // Set processing flag to prevent multiple scans
    isProcessingQR.value = true;
    
    // Parse QR code data (assuming it contains student ID or other info)
    let studentData;
    try {
      studentData = JSON.parse(qrData);
      console.log('Parsed QR code data:', studentData);
    } catch (err) {
      // If not valid JSON, try using as is
      studentData = { studentId: qrData };
      console.error('Failed to parse QR code JSON:', err);
    }
    
    // Validate the QR code data structure
    if (!studentData || !studentData.studentId) {
      showAlertMessage('Invalid QR code data', 'error');
      throw new Error('Invalid QR code data: missing studentId');
    }
    
    console.log('Processing QR code for student ID:', studentData.studentId);
    
    // Convert studentId to a number if it's a string
    if (typeof studentData.studentId === 'string') {
      const numericId = parseInt(studentData.studentId);
      if (!isNaN(numericId)) {
        studentData.studentId = numericId;
      }
    }
    
    // Check if this student was already scanned - safely check for student property
    const alreadyScanned = attendanceRecords.value.some(record => {
      // Check if student exists and has an id
      if (!record.student) return false;
      
      // Compare student IDs, handle both string and number types
      const recordId = record.student.id;
      const scannedId = studentData.studentId;
      
      return recordId == scannedId; // Use loose equality to compare string/number
    });
    
    if (alreadyScanned) {
      // Show already scanned message
      console.log('Student already scanned');
      showAlertMessage('This student has already been marked present', 'warning');
      return;
    }
    
    // Make sure sessionData exists and has an id
    if (!sessionData.value || !sessionData.value.id) {
      showAlertMessage('Session data not available', 'error');
      throw new Error('Session data not available');
    }
    
    // Pause scanning while we process this QR code
    if (scanInterval.value) {
      clearInterval(scanInterval.value);
      scanInterval.value = null;
    }
    
    // Show processing message
    showAlertMessage('Processing attendance...', 'info');
    
    // Mark attendance
    let attendance;
    try {
      attendance = await markAttendance(
        sessionData.value.id,
        studentData.studentId,
        'present'
      );
      console.log('Attendance marked, response:', attendance);
    } catch (markError) {
      console.error('Error marking attendance:', markError);
      
      // Handle enrollment errors specifically
      if (markError.message && markError.message.includes('not enrolled')) {
        // Display a more specific error message for enrollment issues
        showAlertMessage('Student not enrolled in this class', 'error', 5000);
        return; // Exit early, don't create a record
      } else {
        // Generic error
        showAlertMessage(`Failed to mark attendance: ${markError.message}`, 'error', 5000);
        // Don't return here, allow fallback record creation
      }
      
      // Create a fallback record if the API call fails
      attendance = null;
    }
    
    // If the error was related to enrollment, we already returned above
    // So if we get here, either the operation succeeded or there was a non-enrollment error
    
    // Create a student object with data from QR or API response
    const studentInfo = {
      id: studentData.studentId,
      firstName: (attendance && attendance.student && attendance.student.firstName) || 
                 studentData.firstName || 'Unknown',
      lastName: (attendance && attendance.student && attendance.student.lastName) || 
                studentData.lastName || 'Student',
      lrn: (attendance && attendance.student && attendance.student.lrn) || 
           studentData.lrn || 'N/A'
    };
    
    // Only add to attendance records if we have a successful attendance marking
    // or if the error wasn't related to enrollment
    if (attendance) {
      // Add to attendance records with safety checks
      const newRecord = {
        // Use attendance properties if available
        ...(attendance || {}),
        // Always set these properties
        timestamp: new Date(),
        studentId: studentData.studentId,
        status: (attendance && attendance.status) || 'present',
        // Ensure student object exists with complete data
        student: studentInfo
      };
      
      // Add the record to the list
      attendanceRecords.value.unshift(newRecord);
      console.log('Added new attendance record:', newRecord);
      
      // Show success message with student name
      const studentName = `${studentInfo.lastName}, ${studentInfo.firstName}`;
      showAlertMessage(`Attendance marked for ${studentName}`, 'success');
    }
    
  } catch (err) {
    console.error('Error processing QR code:', err);
    showAlertMessage(`Error: ${err.message || 'Failed to process QR code'}`, 'error');
  } finally {
    // Resume scanning after a short delay
    setTimeout(() => {
      if (isCameraActive.value && !scanInterval.value) {
        startScanning();
      }
      // Reset processing flag after a delay to prevent rapid rescans
      setTimeout(() => {
        isProcessingQR.value = false;
      }, 2000); // 2-second cooldown between scans
    }, 1000);
  }
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    // Log the raw date string and converted date for debugging
    console.log('Formatting date:', dateString, '→', date.toISOString());
    
    // Format with Philippine timezone (UTC+8)
    return date.toLocaleDateString('en-PH', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'Asia/Manila'
    });
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Error';
  }
};

// Format time for display
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    // Convert to Date object if it's a string
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return 'Invalid Time';
    }
    
    // Log the raw timestamp and converted date for debugging
    console.log('Formatting time:', timestamp, '→', date.toISOString());
    
    // Format with Philippine timezone (UTC+8)
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    });
  } catch (err) {
    console.error('Error formatting time:', err);
    return 'Error';
  }
};

// Clean up on component unmount
onUnmounted(() => {
  stopCamera();
  
  // Clear any alert timeouts
  if (alertTimeout.value) {
    clearTimeout(alertTimeout.value);
  }
});

onMounted(() => {
  loadSession();
});
</script>

<style scoped>
.attendance-scanner {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header-container {
  position: relative;
  margin-bottom: 30px;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
}

.header-background {
  position: absolute;
  top: 20%;
  right: 5rem;
  transform: translateY(-50%);
  font-size: 8rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.03);
  z-index: 0;
  user-select: none;
  pointer-events: none;
  overflow: hidden;
  white-space: nowrap;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 1.5rem 0;
  width: 100%;
  max-width: auto; 
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f5e9;
  color: #159750;
  text-decoration: none;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  background: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.back-btn .material-icons {
  font-size: 1.5rem;
}

/* Scanner container styling */
.scanner-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Camera container */
.camera-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 aspect ratio */
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Camera feed */
.camera-feed {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Scanner overlay */
.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.scanner-box {
  width: 70%;
  height: 70%;
  max-width: 300px;
  max-height: 300px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  position: relative;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #159750;
  box-shadow: 0 0 8px 2px #159750;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  50% { top: 100%; }
  100% { top: 0; }
}

/* Control panel */
.control-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.session-info .session-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.session-info .session-title .material-icons {
  font-size: 1.2rem;
  color: #159750;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.info-item .label {
  font-weight: 600;
  color: #444;
}

.info-item .value {
  color: #159750;
  font-weight: 500;
}

.controls {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: #f0f8f4;
  color: #159750;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: #e0f2e9;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn .material-icons {
  font-size: 1.2rem;
}

.back-to-list {
  background: #f0f8f4;
  color: #159750;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid #159750;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.back-to-list:hover {
  background: #e0f2e9;
  border-color: #159750;
  color: #159750;
}

/* Recent scans section */
.recent-scans {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.recent-scans h2 {
  margin: 0 0 20px 0;
  font-size: 1.3rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-scans {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #888;
  text-align: center;
}

.no-scans .material-icons {
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 15px;
}

.scan-hint {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #aaa;
}

.scans-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.scan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.2s;
}

.scan-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.student-info {
  display: flex;
  flex-direction: column;
}

.student-name {
  font-weight: 600;
  color: #333;
}

.student-lrn {
  font-size: 0.85rem;
  color: #777;
  margin-top: 3px;
}

.scan-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: capitalize;
}

.scan-status.present {
  background: #e8f5e9;
  color: #2e7d32;
}

.scan-status.late {
  background: #fff8e1;
  color: #f57f17;
}

.scan-status.absent {
  background: #ffebee;
  color: #c62828;
}

.scan-status.unknown {
  background: #e0e0e0;
  color: #616161;
}

.scan-time {
  font-size: 0.8rem;
  color: #999;
}

.scan-details {
  margin-top: 4px;
  font-size: 0.75rem;
  color: #666;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Alert notification styles */
.alert-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  animation: slideDown 0.3s ease-out forwards;
}

@keyframes slideDown {
  from {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-message {
  font-weight: 500;
}

.alert-close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.alert-notification.success {
  background: #4caf50;
  color: white;
}

.alert-notification.warning {
  background: #ff9800;
  color: white;
}

.alert-notification.error {
  background: #f44336;
  color: white;
}

.alert-notification.info {
  background: #2196f3;
  color: white;
}

/* States styling */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #f44336;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

/* Responsive design */
@media (max-width: 768px) {
  .attendance-scanner {
    padding: 10px;
  }
  
  .header-background {
    font-size: 3rem;
    top: 60%;
    right: 1rem;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .camera-container {
    padding-bottom: 100%; /* Square ratio on smaller screens */
  }
  
  .scanner-box {
    width: 80%;
    height: 80%;
  }
  
  .controls {
    flex-direction: column;
  }
}

/* Extra adjustments for slim devices */
@media (max-width: 480px) {
  .attendance-scanner {
    padding: 8px;
  }
  
  .header-content h1 {
    font-size: 1.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.5rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .scan-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .scan-status {
    margin-top: 5px;
  }
  
  .scan-time {
    margin-top: 5px;
    align-self: flex-end;
  }
  
  .title-row {
    gap: 10px;
  }
  
  .back-btn {
    width: 32px;
    height: 32px;
  }
  
  .back-btn .material-icons {
    font-size: 1.2rem;
  }
}
</style>
