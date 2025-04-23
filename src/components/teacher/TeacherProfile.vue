<template>
  <div class="profile-page">
    <div class="header-container">
      <div class="header-content">
        <h1>Teacher Profile<span class="material-icons">school</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View and manage your professional information</p>
        </div>
      </div>
      <div class="header-background">PROFILE</div>
    </div>
    
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading your profile...</p>
    </div>
    
    <div v-else class="profile-content">
      <!-- Profile Card -->
      <ProfileCard :profile="profile" />
      
      <!-- Edit Profile Form -->
      <div class="edit-section" :class="{ 'editing': isEditing }">
        <div class="section-header">
          <h2>
            <span class="material-icons-round">person</span>
            Profile Information
          </h2>
          <button 
            @click="toggleEditMode" 
            :class="['edit-btn', isEditing ? 'cancel' : '']"
          >
            <span class="material-icons-round">{{ isEditing ? 'close' : 'edit' }}</span>
            {{ isEditing ? 'Cancel' : 'Edit Profile' }}
          </button>
        </div>

        <form @submit.prevent="handleUpdate" class="profile-form">
          <!-- Profile Picture Section -->
          <div v-if="isEditing" class="profile-picture-section">
            <div class="picture-container">
              <div class="profile-img-wrapper">
                <img v-if="profileImageUrl" :src="profileImageUrl" alt="Profile picture" class="profile-img" />
                <div v-else class="profile-img-placeholder">
                  <span class="material-icons-round">account_circle</span>
                </div>
              </div>
              <div class="picture-actions">
                <label for="profile-picture-upload" class="upload-btn">
                  <span class="material-icons-round">add_a_photo</span>
                  Upload Photo
                </label>
                <input 
                  type="file" 
                  id="profile-picture-upload" 
                  @change="handleImageChange" 
                  accept="image/*" 
                  class="file-input"
                />
                <button type="button" class="camera-btn" @click="toggleCamera">
                  <span class="material-icons-round">camera_alt</span>
                  Use Camera
                </button>
                <button v-if="profileImageUrl" type="button" class="remove-btn" @click="removeProfilePicture">
                  <span class="material-icons-round">delete</span>
                  Remove
                </button>
              </div>
            </div>
            <p class="picture-hint">Upload a square image for best results. Max size: 5MB.</p>
            
            <!-- Webcam capture component -->
            <div v-if="showCamera" class="webcam-container">
              <div class="webcam-header">
                <h3>Take a profile picture</h3>
                <button type="button" class="close-webcam" @click="closeCamera">
                  <span class="material-icons-round">close</span>
                </button>
              </div>
              <div class="webcam-view">
                <video ref="video" width="400" height="300" autoplay></video>
                <canvas ref="canvas" width="400" height="300" style="display: none;"></canvas>
                <div v-if="hasMultipleCameras" class="camera-select-container">
                  <select 
                    class="camera-select" 
                    :value="selectedCameraId"
                    @change="changeCamera($event.target.value)"
                    aria-label="Select camera"
                  >
                    <option v-for="camera in availableCameras" :key="camera.id" :value="camera.id">
                      {{ camera.label }}
                    </option>
                  </select>
                  <span class="material-icons-round">videocam_switch</span>
                </div>
              </div>
              <div class="webcam-actions">
                <button type="button" class="capture-btn" @click="captureImage">
                  <span class="material-icons-round">photo_camera</span>
                  Take Photo
                </button>
                <button v-if="imageCaptured" type="button" class="retry-btn" @click="retryCapture">
                  <span class="material-icons-round">refresh</span>
                  Retry
                </button>
                <button v-if="imageCaptured" type="button" class="use-photo-btn" @click="useCapture">
                  <span class="material-icons-round">check</span>
                  Use Photo
                </button>
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>First Name</label>
              <div class="input-wrapper">
                <span class="material-icons-round">badge</span>
                <input 
                  v-model="profile.firstName" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Last Name</label>
              <div class="input-wrapper">
                <span class="material-icons-round">badge</span>
                <input 
                  v-model="profile.lastName" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <span class="material-icons-round">email</span>
                <input 
                  v-model="profile.email" 
                  type="email" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Department</label>
              <div class="input-wrapper">
                <span class="material-icons-round">business</span>
                <input 
                  v-model="profile.department" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                  placeholder="Enter your department"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Domain</label>
              <div class="input-wrapper">
                <span class="material-icons-round">school</span>
                <input 
                  v-model="profile.domain" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                  placeholder="Enter your teaching domain"
                />
              </div>
            </div>

            <div class="form-group full-width">
              <label>Address</label>
              <div class="input-wrapper">
                <span class="material-icons-round">home</span>
                <input 
                  v-model="profile.address" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          <!-- Password Change Section -->
          <div v-if="isEditing" class="password-section">
            <div class="password-header" @click="togglePasswordFields">
              <h3>
                <span class="material-icons-round">lock</span>
                Change Password
              </h3>
              <span class="material-icons-round toggle-icon">
                {{ showPasswordFields ? 'expand_less' : 'expand_more' }}
              </span>
            </div>
            
            <div v-if="showPasswordFields" class="password-fields">
              <div class="form-group">
                <label>New Password</label>
                <div class="input-wrapper password-input">
                  <span class="material-icons-round">lock</span>
                  <input 
                    v-model="passwordData.password" 
                    :type="showPassword ? 'text' : 'password'" 
                    placeholder="Enter new password"
                    class="editable"
                  />
                  <button 
                    type="button" 
                    class="toggle-password-btn" 
                    @click="togglePasswordVisibility('password')"
                  >
                    <span class="material-icons-round">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                <p class="password-hint">Password must be at least 8 characters long</p>
              </div>
              
              <div class="form-group">
                <label>Confirm Password</label>
                <div class="input-wrapper password-input">
                  <span class="material-icons-round">lock_clock</span>
                  <input 
                    v-model="passwordData.confirmPassword" 
                    :type="showConfirmPassword ? 'text' : 'password'" 
                    placeholder="Confirm new password"
                    class="editable"
                  />
                  <button 
                    type="button" 
                    class="toggle-password-btn" 
                    @click="togglePasswordVisibility('confirmPassword')"
                  >
                    <span class="material-icons-round">
                      {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isEditing" class="form-actions">
            <button type="submit" class="save-btn">
              <span class="material-icons-round">save</span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { fetchUserProfile, updateProfile, getFullImageUrl ,deleteProfilePicture} from '@/services/authService';
import ProfileCard from '../shared/ProfileCard.vue';
import Swal from 'sweetalert2';

const profile = ref({
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  domain: '',
  department: '',
  role: '',
  createdAt: '',
  profilePicture: null
});

// Add profile picture data
const imageFile = ref(null);
const imagePreview = ref(null);

// Computed property for profile image URL
const profileImageUrl = computed(() => {
  if (imagePreview.value) {
    return imagePreview.value;
  } else if (profile.value.profilePicture) {
    return getFullImageUrl(profile.value.profilePicture);
  }
  return null;
});

// Add password fields
const passwordData = ref({
  password: '',
  confirmPassword: ''
});

// Add show password toggles
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const loading = ref(true);
const isEditing = ref(false);
const showPasswordFields = ref(false);

// Add webcam related refs
const video = ref(null);
const canvas = ref(null);
const showCamera = ref(false);
const imageCaptured = ref(false);
let stream = null;

// First, update the data properties
const hasMultipleCameras = ref(false);
const availableCameras = ref([]);
const selectedCameraId = ref('');

onMounted(async () => {
  await loadProfile();
});

const loadProfile = async () => {
  try {
    loading.value = true;
    const data = await fetchUserProfile();
    profile.value = data;
    // Reset image preview when loading new profile data
    imagePreview.value = null;
    imageFile.value = null;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to Load Profile',
      text: 'There was an error loading your profile data.',
      confirmButtonColor: '#2196F3'
    });
  } finally {
    loading.value = false;
  }
};

// Handle image selection
const handleImageChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: 'error',
      title: 'File Too Large',
      text: 'Profile picture must be less than 5MB',
      confirmButtonColor: '#2196F3'
    });
    event.target.value = null;
    return;
  }
  
  // Store the file for upload
  imageFile.value = file;
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Remove profile picture
const removeProfilePicture = async () => {
  try {
    await deleteProfilePicture();
    imageFile.value = null;
    imagePreview.value = null;
    profile.value.profilePicture = null;
    Swal.fire({
      icon: 'success',
      title: 'Profile Picture Removed',
      text: 'Your profile picture has been removed successfully.',
      confirmButtonColor: '#2196F3'
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to Remove Profile Picture',
      text: err.message || 'Failed to remove profile picture',
      confirmButtonColor: '#2196F3'
    });
  }
};

const handleUpdate = async () => {
  try {
    // Validate password if user is changing it
    if (showPasswordFields.value) {
      if (!passwordData.value.password) {
        throw new Error('Please enter a new password');
      }
      
      if (passwordData.value.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      if (passwordData.value.password !== passwordData.value.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Add password to profile data for update
      profile.value.password = passwordData.value.password;
    }
    
    // Show loading state
    const loadingAlert = Swal.fire({
      title: 'Updating Profile',
      html: 'Please wait while we update your profile...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      showConfirmButton: false
    });
    
    // Prepare form data if there's an image to upload
    let updatedProfile = { ...profile.value };
    
    if (imageFile.value) {
      // If uploading a new image, convert it to base64 for API
      const reader = new FileReader();
      const imagePromise = new Promise((resolve) => {
        reader.onload = () => {
          updatedProfile.profilePicture = reader.result;
          resolve();
        };
      });
      reader.readAsDataURL(imageFile.value);
      await imagePromise;
    }
    
    await updateProfile(updatedProfile);
    
    // Close loading alert
    loadingAlert.close();
    
    // Reset password fields
    passwordData.value.password = '';
    passwordData.value.confirmPassword = '';
    showPasswordFields.value = false;
    showPassword.value = false;
    showConfirmPassword.value = false;
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Profile Updated!',
      text: 'Your profile has been updated successfully.',
      confirmButtonColor: '#2196F3',
      timer: 2000,
      timerProgressBar: true
    });
    
    isEditing.value = false;
    
    // Reload profile to get updated data from server
    await loadProfile();
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: err.message || 'Failed to update profile',
      confirmButtonColor: '#2196F3'
    });
  }
};

const toggleEditMode = () => {
  if (isEditing.value) {
    // Confirm before canceling edit
    Swal.fire({
      title: 'Cancel Editing?',
      text: 'Any unsaved changes will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2196F3',
      cancelButtonColor: '#f44336',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'Continue editing'
    }).then((result) => {
      if (result.isConfirmed) {
        isEditing.value = false;
        showPasswordFields.value = false;
        passwordData.value.password = '';
        passwordData.value.confirmPassword = '';
        showPassword.value = false;
        showConfirmPassword.value = false;
        
        // Reset image preview and file
        imagePreview.value = null;
        imageFile.value = null;
        
        loadProfile(); // Reload original data
      }
    });
  } else {
    isEditing.value = true;
  }
};

const togglePasswordFields = () => {
  showPasswordFields.value = !showPasswordFields.value;
  if (!showPasswordFields.value) {
    passwordData.value.password = '';
    passwordData.value.confirmPassword = '';
    showPassword.value = false;
    showConfirmPassword.value = false;
  }
};

// Toggle password visibility
const togglePasswordVisibility = (field) => {
  if (field === 'password') {
    showPassword.value = !showPassword.value;
  } else if (field === 'confirmPassword') {
    showConfirmPassword.value = !showConfirmPassword.value;
  }
};

// Add this new function to get all available cameras
const getAvailableCameras = async () => {
  try {
    console.log('Getting available cameras...');
    
    // Request permission first to get accurate device labels
    const initialStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    initialStream.getTracks().forEach(track => track.stop());
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    console.log('Found video devices:', videoDevices.length);
    
    // Clear and populate the available cameras array
    availableCameras.value = videoDevices.map((device, index) => {
      const label = device.label || `Camera ${index + 1}`;
      console.log(`Camera ${index + 1}: ${label} (${device.deviceId})`);
      return {
        id: device.deviceId,
        label: label,
        index: index
      };
    });
    
    hasMultipleCameras.value = availableCameras.value.length > 1;
    console.log('Multiple cameras detected:', hasMultipleCameras.value);
    
    // If no camera selected yet, select the first one
    if (!selectedCameraId.value && availableCameras.value.length > 0) {
      selectedCameraId.value = availableCameras.value[0].id;
      console.log('Auto-selected first camera:', selectedCameraId.value);
    }
  } catch (err) {
    console.error('Error enumerating cameras:', err);
    hasMultipleCameras.value = false;
    availableCameras.value = [];
  }
};

// Update the openCamera function to use the selected camera ID
const openCamera = async () => {
  showCamera.value = true;
  
  try {
    console.log('Opening camera...');
    
    // Close any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    
    // Check for available cameras
    await getAvailableCameras();
    
    // Prepare constraints based on selected camera
    let constraints;
    
    if (selectedCameraId.value) {
      console.log('Using specific camera device ID:', selectedCameraId.value);
      constraints = {
        video: {
          deviceId: { exact: selectedCameraId.value },
          width: { ideal: 400 },
          height: { ideal: 300 }
        },
        audio: false
      };
    } else {
      console.log('No specific camera selected, using default');
      constraints = {
        video: {
          width: { ideal: 400 },
          height: { ideal: 300 }
        },
        audio: false
      };
    }
    
    console.log('Requesting camera with constraints:', JSON.stringify(constraints));
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('Camera stream acquired successfully');
    console.log('Active video tracks:', stream.getVideoTracks().map(t => t.label));
    
    if (video.value) {
      video.value.srcObject = stream;
      console.log('Video element updated with stream');
      
      // Add event listener to detect when video is playing
      video.value.onloadedmetadata = () => {
        console.log('Video metadata loaded, playing...');
        video.value.play().catch(err => console.error('Failed to play video:', err));
      };
    }
  } catch (err) {
    console.error('Error accessing camera:', err);
    
    // Check for specific permission errors
    let errorMessage = 'Could not access your camera.';
    let errorHelp = '';
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMessage = 'Camera access was denied.';
      errorHelp = `
        <div class="error-help">
          <p>To fix this issue:</p>
          <ol>
            <li>Click on the camera icon in your browser's address bar</li>
            <li>Select "Always allow" for this site</li>
            <li>Refresh the page and try again</li>
          </ol>
          <div class="browser-specific">
            <p><strong>Chrome/Edge users:</strong> Settings → Privacy and Security → Site Settings → Camera</p>
            <p><strong>Firefox users:</strong> Settings → Privacy & Security → Permissions → Camera</p>
            <p><strong>Safari users:</strong> Preferences → Websites → Camera</p>
            <p><strong>Mobile users:</strong> Check your device permissions in Settings</p>
          </div>
        </div>
      `;
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage = 'No camera device was found.';
      errorHelp = 'Please connect a camera to your device and try again.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMessage = 'Your camera is already in use by another application.';
      errorHelp = 'Please close other applications that might be using your camera.';
    } else if (err.name === 'OverconstrainedError') {
      errorMessage = 'The requested camera configuration is not supported.';
      errorHelp = 'Your device may not support the selected camera mode.';
      
      // Try without specific deviceId
      try {
        console.log('Trying to open camera without specific constraints');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        });
        
        if (video.value) {
          video.value.srcObject = stream;
          return; // If successful, return early
        }
      } catch (fallbackErr) {
        console.error('Fallback camera access also failed:', fallbackErr);
      }
    }
    
    Swal.fire({
      icon: 'error',
      title: 'Camera Error',
      html: `<p>${errorMessage}</p>${errorHelp}`,
      confirmButtonText: 'Got It',
      confirmButtonColor: '#4CAF50',
      showCancelButton: false
    });
    
    // Show fallback option
    setTimeout(() => {
      Swal.fire({
        title: 'Alternative Option',
        text: 'If you continue having camera issues, you can upload a photo instead.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Upload Photo Instead',
        cancelButtonText: 'Try Camera Again',
        confirmButtonColor: '#2196F3',
        cancelButtonColor: '#4CAF50'
      }).then((result) => {
        if (result.isConfirmed) {
          // Trigger file input click
          document.getElementById('profile-picture-upload').click();
        } else {
          // Try camera again
          toggleCamera();
        }
      });
    }, 5000); // Show after 5 seconds
    
    showCamera.value = false;
  }
};

// Create a function to change camera
const changeCamera = async (cameraId) => {
  try {
    console.log('Changing to camera with ID:', cameraId);
    
    // Update the selected camera
    selectedCameraId.value = cameraId;
    
    // If already captured, reset
    if (imageCaptured.value) {
      retryCapture();
    }
    
    // Stop current stream first
    if (stream) {
      console.log('Stopping current camera stream...');
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label);
        track.stop();
      });
      stream = null;
    }
    
    // Add a small delay before reopening camera
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use the specific camera ID
    const constraints = {
      video: {
        deviceId: { exact: cameraId },
        width: { ideal: 400 },
        height: { ideal: 300 }
      },
      audio: false
    };
    
    console.log('Requesting camera with constraints:', JSON.stringify(constraints));
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('New stream acquired:', stream.id);
    console.log('Video tracks:', stream.getVideoTracks().map(t => t.label));
    
    if (video.value) {
      video.value.srcObject = stream;
      console.log('Video element updated with new stream');
    }
    
    // Show a toast notification
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    
    const selectedCamera = availableCameras.value.find(camera => camera.id === cameraId);
    
    Toast.fire({
      icon: 'success',
      title: `Switched to ${selectedCamera ? selectedCamera.label : 'new camera'}`
    });
    
  } catch (err) {
    console.error('Error switching camera:', err);
    
    // Try fallback if device ID constraint fails
    if (err.name === 'OverconstrainedError') {
      console.log('Exact device ID constraint failed, trying default camera...');
      
      try {
        // Fall back to default camera
        const fallbackConstraints = { video: true, audio: false };
        
        console.log('Trying fallback constraints:', JSON.stringify(fallbackConstraints));
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        
        if (video.value) {
          video.value.srcObject = stream;
          console.log('Fallback stream applied successfully');
        }
        
        return; // If we succeed with fallback, return early
      } catch (fallbackErr) {
        console.error('Fallback camera acquisition also failed:', fallbackErr);
      }
    }
    
    // If we got here, both attempts failed
    Swal.fire({
      icon: 'error',
      title: 'Camera Switch Failed',
      text: 'Unable to switch to the selected camera. It may no longer be available.',
      confirmButtonColor: '#4CAF50'
    });
  }
};

const closeCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  showCamera.value = false;
  imageCaptured.value = false;
};

const captureImage = () => {
  if (!video.value || !canvas.value) return;
  
  const context = canvas.value.getContext('2d');
  // Draw the video frame to the canvas
  context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height);
  
  // Convert to data URL
  const dataUrl = canvas.value.toDataURL('image/jpeg');
  
  // Pause the video to show the captured frame
  video.value.pause();
  
  // Set the captured image as the preview
  imagePreview.value = dataUrl;
  imageCaptured.value = true;
};

const retryCapture = () => {
  if (video.value) {
    // Resume the video
    video.value.play();
  }
  imageCaptured.value = false;
};

const useCapture = async () => {
  if (!imagePreview.value) return;
  
  // Convert base64 to blob for upload
  const response = await fetch(imagePreview.value);
  const blob = await response.blob();
  
  // Create a File object from the blob
  const file = new File([blob], "webcam-profile.jpg", { type: "image/jpeg" });
  
  // Set the file to be uploaded
  imageFile.value = file;
  
  // Close the camera interface
  closeCamera();
};

// Clean up camera on component unmount
onUnmounted(() => {
  closeCamera();
});

// Camera methods
const toggleCamera = () => {
  if (showCamera.value) {
    closeCamera();
  } else {
    // Show camera permission instruction first
    Swal.fire({
      title: 'Camera Access Required',
      html: `
        <div class="permission-guide">
          <p>This feature requires camera access. Please allow when prompted.</p>
          <div class="permission-steps">
            <div class="step">
              <span class="material-icons-round">info</span>
              <p>Look for the camera permission popup in your browser</p>
            </div>
            <div class="step">
              <span class="material-icons-round">check_circle</span>
              <p>Click "Allow" when prompted</p>
            </div>
            <div class="step">
              <span class="material-icons-round">settings</span>
              <p>If no prompt appears, check your browser settings</p>
            </div>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continue',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4CAF50'
    }).then((result) => {
      if (result.isConfirmed) {
        openCamera();
      }
    });
  }
};
</script>

<style scoped>
.profile-page {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: hidden;
  overflow-x: hidden;
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
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  padding-left: 1%;
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

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.edit-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  color: #333;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #e8f5e9;
  color: #2e7d32;
}

.edit-btn:hover {
  background: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.edit-btn.cancel {
  background: #ffebee;
  color: #c62828;
}

.edit-btn.cancel:hover {
  background: #ffcdd2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Profile Picture Section */
.profile-picture-section {
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 2rem;
}

.picture-container {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.profile-img-wrapper {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  color: #9e9e9e;
}

.profile-img-placeholder .material-icons-round {
  font-size: 4rem;
}

.picture-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-btn:hover {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.remove-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #e53935;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.file-input {
  display: none;
}

.picture-hint {
  font-size: 0.8rem;
  color: #666;
  margin: 0.5rem 0 0 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .material-icons-round {
  position: absolute;
  left: 1rem;
  color: #666;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.input-wrapper.password-input input {
  padding-right: 3rem; /* Make room for the toggle button */
}

.toggle-password-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
}

.toggle-password-btn:hover {
  color: #4CAF50;
}

.input-wrapper input.editable {
  background: white;
  cursor: text;
}

.input-wrapper input:not(.editable) {
  cursor: default;
}

.input-wrapper input.editable:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
  outline: none;
}

/* Password section styles */
.password-section {
  margin-top: 2rem;
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.password-header:hover {
  background-color: #f5f5f5;
}

.password-header h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.toggle-icon {
  color: #666;
}

.password-fields {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.password-hint {
  font-size: 0.8rem;
  color: #666;
  margin: 0.25rem 0 0 0;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  background: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.rotating {
  animation: rotate 2s linear infinite;
  font-size: 3rem;
  color: #159750;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 10px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 4rem;
    top: 30%;
    right: 0.3rem;
  }
  
  .divider {
    margin: 0.5rem 0;
  }

  .edit-section {
    padding: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .edit-btn {
    width: 100%;
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .password-fields {
    grid-template-columns: 1fr;
  }

  .save-btn {
    width: 100%;
    justify-content: center;
  }
  
  /* Profile picture responsive styles */
  .picture-container {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  
  .profile-img-wrapper {
    width: 120px;
    height: 120px;
  }
  
  .picture-actions {
    width: 100%;
  }
}

.webcam-container {
  margin-top: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.webcam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.webcam-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.close-webcam {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1.2rem;
}

.webcam-view {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
}

.webcam-view video {
  width: 100%;
  height: auto;
  display: block;
}

.webcam-actions {
  display: flex;
  justify-content: center;
  margin-top: 15px;
  gap: 10px;
}

.capture-btn, .retry-btn, .use-photo-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.capture-btn {
  background-color: #4CAF50;
  color: white;
}

.retry-btn {
  background-color: #FF9800;
  color: white;
}

.use-photo-btn {
  background-color: #2196F3;
  color: white;
}

.camera-btn {
  background-color: #673AB7;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.camera-btn:hover, .capture-btn:hover, .retry-btn:hover, .use-photo-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .webcam-container {
    padding: 10px;
  }
  
  .webcam-view {
    max-width: 100%;
  }
  
  .webcam-actions {
    flex-wrap: wrap;
  }
  
  .capture-btn, .retry-btn, .use-photo-btn, .camera-btn {
    flex: 1;
    min-width: 100px;
  }
}

.permission-guide {
  text-align: left;
  margin: 0 auto;
}

.permission-steps {
  margin-top: 15px;
}

.step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 10px;
}

.step .material-icons-round {
  color: #4CAF50;
}

.error-help {
  text-align: left;
  margin-top: 15px;
  padding: 10px;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.error-help ol {
  margin: 10px 0;
  padding-left: 20px;
}

.browser-specific {
  margin-top: 15px;
  font-size: 0.9em;
  color: #666;
}

.browser-specific p {
  margin: 5px 0;
}

/* Add this new style for the switch camera button */
.switch-camera-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switch-camera-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.camera-select-container {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 20px;
  color: white;
  padding: 5px 30px 5px 15px;
  display: flex;
  align-items: center;
  min-width: 120px;
  max-width: 200px;
  transition: all 0.2s ease;
}

.camera-select-container:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.camera-select {
  background: transparent;
  border: none;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 4px 0;
  cursor: pointer;
  width: 100%;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.camera-select:focus {
  outline: none;
}

.camera-select option {
  background-color: #333;
  color: white;
  padding: 8px;
}

.camera-select-container .material-icons-round {
  position: absolute;
  right: 8px;
  font-size: 18px;
  color: white;
  pointer-events: none;
}
</style>
