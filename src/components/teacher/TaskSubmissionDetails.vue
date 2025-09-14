<template>
  <div class="submission-details-container">
    <!-- Header -->
    <div class="details-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          <span class="material-icons">arrow_back</span>
          Back to Submissions
        </button>
        <div class="task-info">
          <h1>{{ task?.title }}</h1>
          <p class="task-meta">
            <span class="meta-item">
              <span class="material-icons">event</span>
              Due: {{ formatDate(task?.dueDate) }}
            </span>
            <span class="meta-item">
              <span class="material-icons">stars</span>
              {{ task?.totalScore }} points
            </span>
          </p>
        </div>
      </div>
      <div class="header-right">
        <div class="student-navigation">
          <button 
            @click="previousStudent" 
            :disabled="currentStudentIndex === 0"
            class="nav-btn prev-btn"
          >
            <span class="material-icons">chevron_left</span>
            Previous
          </button>
          <div class="student-counter">
            {{ currentStudentIndex + 1 }} of {{ totalStudents }}
          </div>
          <button 
            @click="nextStudent" 
            :disabled="currentStudentIndex === totalStudents - 1"
            class="nav-btn next-btn"
          >
            Next
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
        <button @click="downloadAllAsZip" class="download-all-btn" :disabled="!currentSubmission || !currentSubmission.files || currentSubmission.files.length === 0">
          <span class="material-icons">download</span>
          Download All as ZIP
        </button>
        <button @click="saveAndNext" class="save-btn">
          <span class="material-icons">save</span>
          Save & Next
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="details-content">
      <!-- Student Info Bar -->
      <div class="student-info-bar">
        <div class="student-basic-info">
          <h2>{{ currentStudent?.firstName }} {{ currentStudent?.lastName }}</h2>
          <p class="student-details">
            <span v-if="currentStudent?.lrn">LRN: {{ currentStudent.lrn }}</span>
            <span>Grade {{ currentStudent?.gradeLevel }}-{{ currentStudent?.section }}</span>
          </p>
        </div>
        <div class="submission-status">
          <span :class="['status-badge', getSubmissionStatusClass()]">
            {{ getSubmissionStatusText() }}
          </span>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content-grid">
        <!-- Main File Preview Area -->
        <div class="main-preview-area">
        <div v-if="!currentSubmission" class="no-submission">
          <div class="no-submission-icon">
            <span class="material-icons">assignment_turned_in</span>
          </div>
          <h3>No Submission</h3>
          <p>This student has not submitted any work for this task.</p>
        </div>

        <div v-else-if="currentSubmission.files && currentSubmission.files.length > 0" class="file-preview-container">
          <!-- File Preview Header -->
          <div class="file-preview-header">
            <h3>Submitted Files ({{ currentSubmission.files.length }})</h3>
            <div class="file-header-actions">
              <div class="file-meta">
                <span class="meta-item">
                  <span class="material-icons">schedule</span>
                  {{ formatDate(currentSubmission.submittedAt) }}
                </span>
              </div>
              <button @click="downloadAllAsZip" class="download-all-small-btn" :disabled="!currentSubmission.files || currentSubmission.files.length === 0">
                <span class="material-icons">download</span>
                Download All as ZIP
              </button>
            </div>
          </div>

          <!-- File Preview Grid -->
          <div class="file-preview-grid">
            <div 
              v-for="(file, index) in currentSubmission.files" 
              :key="file.id"
              class="file-preview-card"
              :class="{ active: selectedFileIndex === index }"
              @click="selectFile(index)"
            >
              <div class="file-preview-icon">
                <img :src="getFileIcon(file.fileName)" :alt="file.fileName" />
              </div>
              <div class="file-preview-info">
                <p class="file-name">{{ file.fileName }}</p>
                <p class="file-size">{{ formatFileSize(file.fileSize) }}</p>
              </div>
              <div class="file-preview-actions">
                <button @click.stop="previewFile(file)" class="preview-btn">
                  <span class="material-icons">visibility</span>
                </button>
                <button @click.stop="downloadFile(file)" class="download-btn">
                  <span class="material-icons">download</span>
                </button>
              </div>
            </div>
          </div>

          <!-- File Content Preview -->
          <div v-if="selectedFile" class="file-content-preview">
            <div class="preview-header">
              <h4>{{ selectedFile.fileName }}</h4>
              <div class="preview-actions">
                <button @click="openFile(selectedFile)" class="open-btn">
                  <span class="material-icons">open_in_new</span>
                  Open in New Tab
                </button>
                <button @click="downloadFile(selectedFile)" class="download-btn">
                  <span class="material-icons">download</span>
                  Download
                </button>
              </div>
            </div>
            <div class="preview-content">
              <!-- Image Preview -->
              <div v-if="isImageFile(selectedFile.fileName)" class="image-preview">
                <img :src="getFileUrl(selectedFile)" :alt="selectedFile.fileName" />
              </div>
              <!-- PDF Preview -->
              <div v-else-if="isPdfFile(selectedFile.fileName)" class="pdf-preview">
                <iframe :src="getFileUrl(selectedFile)" width="100%" height="600px"></iframe>
              </div>
              <!-- Text Preview -->
              <div v-else-if="isTextFile(selectedFile.fileName)" class="text-preview">
                <pre>{{ fileContent }}</pre>
              </div>
              <!-- Default Preview -->
              <div v-else class="default-preview">
                <div class="preview-icon">
                  <img :src="getFileIcon(selectedFile.fileName)" :alt="selectedFile.fileName" />
                </div>
                <p>Preview not available for this file type</p>
                <button @click="openFile(selectedFile)" class="open-btn">
                  <span class="material-icons">open_in_new</span>
                  Open File
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Comments -->
        <div v-if="currentSubmission && currentSubmission.comment" class="student-comments">
          <h3>Student Comments</h3>
          <div class="comment-box">
            <p>{{ currentSubmission.comment }}</p>
          </div>
        </div>
        </div>

        <!-- Scoring Section -->
        <div class="scoring-section">
        <div class="scoring-header">
          <h3>Scoring</h3>
          <div class="score-display">
            <span class="current-score">{{ currentScore }}/{{ task?.totalScore }}</span>
            <span class="percentage">{{ scorePercentage }}%</span>
          </div>
        </div>

        <div class="scoring-controls">
          <div class="score-input-group">
            <label for="score-input">Score:</label>
            <input 
              id="score-input"
              v-model.number="currentScore" 
              type="number" 
              :min="0" 
              :max="task?.totalScore"
              class="score-input"
              @input="updateScore"
            />
            <span class="score-max">/ {{ task?.totalScore }}</span>
          </div>

          <div class="score-slider-group">
            <label for="score-slider">Quick Score:</label>
            <input 
              id="score-slider"
              v-model.number="currentScore" 
              type="range" 
              :min="0" 
              :max="task?.totalScore"
              class="score-slider"
              @input="updateScore"
            />
            <div class="slider-labels">
              <span>0</span>
              <span>{{ Math.round(task?.totalScore / 2) }}</span>
              <span>{{ task?.totalScore }}</span>
            </div>
          </div>
        </div>

        <div class="teacher-comments">
          <label for="teacher-comment">Teacher Comments:</label>
          <textarea 
            id="teacher-comment"
            v-model="teacherComment"
            placeholder="Add feedback for this student..."
            class="comment-textarea"
            rows="4"
          ></textarea>
        </div>

        <div class="scoring-actions">
          <button @click="saveScore" class="save-score-btn" :disabled="isSaving">
            <span class="material-icons" v-if="!isSaving">save</span>
            <span class="material-icons rotating" v-else>sync</span>
            {{ isSaving ? 'Saving...' : 'Save Score' }}
          </button>
          <button @click="resetScore" class="reset-btn">
            <span class="material-icons">refresh</span>
            Reset
          </button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  getTaskVisibility, 
  getTaskSubmissions,
  scoreSubmission,
  downloadSubmissionFiles,
  downloadAllTaskSubmissions,
  getBaseApiUrl,
  getSubjectTasks
} from '@/services/authService';
import { formatDistanceToNow } from 'date-fns';

// Import file icons
import csvIcon from '@/assets/FileIcons/csv.png';
import docIcon from '@/assets/FileIcons/doc.png';
import jpgIcon from '@/assets/FileIcons/jpg.png';
import pdfIcon from '@/assets/FileIcons/pdf.png';
import pngIcon from '@/assets/FileIcons/png.png';
import pptxIcon from '@/assets/FileIcons/pptx.png';
import txtIcon from '@/assets/FileIcons/txt-file.png';
import videoIcon from '@/assets/FileIcons/video.png';
import xlsIcon from '@/assets/FileIcons/xls.png';
import zipIcon from '@/assets/FileIcons/zip.png';

const route = useRoute();
const router = useRouter();

// Get parameters from route
const taskId = parseInt(route.params.taskId);
const subjectId = parseInt(route.params.subjectId);
const initialStudentIndex = parseInt(route.query.studentIndex) || 0;

// Reactive data
const task = ref(null);
const students = ref([]);
const submissions = ref([]);
const currentStudentIndex = ref(initialStudentIndex);
const currentScore = ref(0);
const teacherComment = ref('');
const isSaving = ref(false);
const loading = ref(true);

// File preview state
const selectedFileIndex = ref(0);
const selectedFile = ref(null);
const fileContent = ref('');

// Computed properties
const currentStudent = computed(() => students.value[currentStudentIndex.value]);
const currentSubmission = computed(() => {
  if (!currentStudent.value || !Array.isArray(submissions.value)) return null;
  return submissions.value.find(s => s.studentId === currentStudent.value.id);
});
const totalStudents = computed(() => students.value.length);
const scorePercentage = computed(() => {
  if (!task.value?.totalScore) return 0;
  return Math.round((currentScore.value / task.value.totalScore) * 100);
});

// Methods
const loadData = async () => {
  try {
    loading.value = true;
    
    // Load task visibility (students)
    const visibility = await getTaskVisibility(taskId);
    console.log('Visibility data:', visibility);
    students.value = visibility.map(v => v.student);
    console.log('Students data:', students.value);
    
    // Load submissions
    const submissionsData = await getTaskSubmissions(taskId);
    console.log('Submissions data:', submissionsData);
    
    // Handle different response formats
    if (Array.isArray(submissionsData)) {
      submissions.value = submissionsData;
    } else if (submissionsData && Array.isArray(submissionsData.data)) {
      submissions.value = submissionsData.data;
    } else if (submissionsData && Array.isArray(submissionsData.submissions)) {
      submissions.value = submissionsData.submissions;
    } else {
      console.warn('Unexpected submissions data format:', submissionsData);
      submissions.value = [];
    }
    
    console.log('Submissions after processing:', submissions.value);
    
    // Load task details using the same method as TaskSubmission
    try {
      const taskData = await getSubjectTasks(subjectId);
      task.value = taskData.tasks.find(t => t.id === taskId);
      
      if (!task.value) {
        throw new Error('Task not found');
      }
      
      console.log('Task data:', task.value);
    } catch (error) {
      console.error('Error loading task details:', error);
      // Fallback task object
      task.value = {
        title: 'Task Submission Details',
        totalScore: 100,
        dueDate: new Date().toISOString()
      };
    }
    
    // Initialize current student data
    console.log('Total students loaded:', students.value.length);
    console.log('Current student index:', currentStudentIndex.value);
    console.log('Current student:', currentStudent.value);
    
    if (currentStudent.value) {
      loadCurrentStudentData();
    } else {
      console.warn('No current student found!');
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
};

const loadCurrentStudentData = () => {
  try {
    if (currentSubmission.value) {
      currentScore.value = currentSubmission.value.score || 0;
      teacherComment.value = currentSubmission.value.teacherComment || '';
      
      // Select first file for preview
      if (currentSubmission.value.files && currentSubmission.value.files.length > 0) {
        selectedFileIndex.value = 0;
        selectedFile.value = currentSubmission.value.files[0];
        loadFileContent(currentSubmission.value.files[0]);
      } else {
        selectedFile.value = null;
        selectedFileIndex.value = 0;
      }
    } else {
      currentScore.value = 0;
      teacherComment.value = '';
      selectedFile.value = null;
      selectedFileIndex.value = 0;
    }
  } catch (error) {
    console.error('Error loading current student data:', error);
    currentScore.value = 0;
    teacherComment.value = '';
    selectedFile.value = null;
    selectedFileIndex.value = 0;
  }
};

const nextStudent = () => {
  if (currentStudentIndex.value < totalStudents.value - 1) {
    currentStudentIndex.value++;
    loadCurrentStudentData();
  }
};

const previousStudent = () => {
  if (currentStudentIndex.value > 0) {
    currentStudentIndex.value--;
    loadCurrentStudentData();
  }
};

const saveAndNext = async () => {
  await saveScore();
  if (currentStudentIndex.value < totalStudents.value - 1) {
    nextStudent();
  }
};

const saveScore = async () => {
  if (!currentStudent.value || !currentSubmission.value) return;
  
  try {
    isSaving.value = true;
    
    // Use submission ID instead of task ID and student ID
    await scoreSubmission(currentSubmission.value.id, {
      score: currentScore.value,
      comment: teacherComment.value
    });
    
    // Update local submission data
    if (Array.isArray(submissions.value)) {
      const submissionIndex = submissions.value.findIndex(s => s.studentId === currentStudent.value.id);
      if (submissionIndex !== -1) {
        submissions.value[submissionIndex].score = currentScore.value;
        submissions.value[submissionIndex].teacherComment = teacherComment.value;
      }
    }
    
    console.log('Score saved successfully');
  } catch (error) {
    console.error('Error saving score:', error);
    alert('Failed to save score. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

const resetScore = () => {
  currentScore.value = 0;
  teacherComment.value = '';
};

const updateScore = () => {
  // Ensure score is within bounds
  if (currentScore.value < 0) currentScore.value = 0;
  if (currentScore.value > task.value?.totalScore) currentScore.value = task.value?.totalScore;
};

const getSubmissionStatusText = () => {
  if (!currentSubmission.value) return 'No Submission';
  return 'Submitted';
};

const getSubmissionStatusClass = () => {
  if (!currentSubmission.value) return 'no-submission';
  return 'submitted';
};

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const iconMap = {
    'csv': csvIcon,
    'doc': docIcon,
    'docx': docIcon,
    'jpg': jpgIcon,
    'jpeg': jpgIcon,
    'pdf': pdfIcon,
    'png': pngIcon,
    'ppt': pptxIcon,
    'pptx': pptxIcon,
    'txt': txtIcon,
    'mp4': videoIcon,
    'avi': videoIcon,
    'mov': videoIcon,
    'xls': xlsIcon,
    'xlsx': xlsIcon,
    'zip': zipIcon,
    'rar': zipIcon
  };
  return iconMap[extension] || txtIcon;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const selectFile = (index) => {
  selectedFileIndex.value = index;
  if (currentSubmission.value && currentSubmission.value.files) {
    selectedFile.value = currentSubmission.value.files[index];
    loadFileContent(currentSubmission.value.files[index]);
  }
};

const previewFile = (file) => {
  const fileIndex = currentSubmission.value.files.findIndex(f => f.id === file.id);
  if (fileIndex !== -1) {
    selectFile(fileIndex);
  }
};

const getFileUrl = (file) => {
  return `${getBaseApiUrl()}/uploads/tasks/${file.fileName}`;
};

const isImageFile = (fileName) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const extension = fileName.split('.').pop()?.toLowerCase();
  return imageExtensions.includes(extension);
};

const isPdfFile = (fileName) => {
  return fileName.toLowerCase().endsWith('.pdf');
};

const isTextFile = (fileName) => {
  const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'log'];
  const extension = fileName.split('.').pop()?.toLowerCase();
  return textExtensions.includes(extension);
};

const loadFileContent = async (file) => {
  if (isTextFile(file.fileName)) {
    try {
      const response = await fetch(getFileUrl(file));
      if (response.ok) {
        fileContent.value = await response.text();
      } else {
        fileContent.value = 'Unable to load file content';
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      fileContent.value = 'Error loading file content';
    }
  }
};

const openFile = (file) => {
  // Open file in new tab
  const fileUrl = getFileUrl(file);
  window.open(fileUrl, '_blank');
};

const downloadFile = async (file) => {
  try {
    await downloadSubmissionFiles(taskId, file.id);
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('Failed to download file. Please try again.');
  }
};

const downloadAllAsZip = async () => {
  if (!currentSubmission.value || !currentSubmission.value.files || currentSubmission.value.files.length === 0) {
    alert('No files to download');
    return;
  }

  try {
    // Download all files as ZIP using the same method as TaskSubmission
    const blob = await downloadAllTaskSubmissions(taskId);
    
    // Use FileSaver to save the zip file
    const FileSaver = (await import('file-saver')).default;
    
    // Create filename with student name
    const studentName = `${currentStudent.value.firstName}_${currentStudent.value.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
    const zipFileName = `${studentName}_submission_files.zip`;
    
    FileSaver.saveAs(blob, zipFileName);
  } catch (error) {
    console.error('Error downloading files as ZIP:', error);
    alert('Failed to download files as ZIP. Please try again.');
  }
};

const goBack = () => {
  router.go(-1);
};

// Watch for student index changes
watch(currentStudentIndex, () => {
  loadCurrentStudentData();
});

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.submission-details-container {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* Header */
.details-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.back-btn:hover {
  background: #5a6268;
}

.task-info h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.task-meta {
  margin: 0.25rem 0 0 0;
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.student-navigation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.nav-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.nav-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.student-counter {
  background: #e9ecef;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  color: #495057;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.save-btn:hover {
  background: #218838;
  transform: translateY(-1px);
}

.download-all-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #17a2b8;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.download-all-btn:hover:not(:disabled) {
  background: #138496;
  transform: translateY(-1px);
}

.download-all-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Main Content */
.details-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  overflow: hidden;
}

.main-content-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1rem;
  height: 100%;
  overflow: hidden;
}

/* Student Info Bar */
.student-info-bar {
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Main Preview Area */
.main-preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* File Preview Container */
.file-preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.file-preview-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.download-all-small-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #17a2b8;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s;
}

.download-all-small-btn:hover:not(:disabled) {
  background: #138496;
  transform: translateY(-1px);
}

.download-all-small-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.file-preview-header h3 {
  margin: 0;
  color: #333;
}

.file-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  max-height: 200px;
  overflow-y: auto;
}

.file-preview-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 200px;
  flex: 0 0 auto;
}

.file-preview-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0,123,255,0.15);
}

.file-preview-card.active {
  border-color: #007bff;
  background: #f8f9ff;
}

.file-preview-icon img {
  width: 32px;
  height: 32px;
}

.file-preview-info {
  flex: 1;
  min-width: 0;
}

.file-preview-info .file-name {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-preview-info .file-size {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
}

.file-preview-actions {
  display: flex;
  gap: 0.5rem;
}

.preview-btn,
.download-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.preview-btn:hover,
.download-btn:hover {
  background: #0056b3;
}

/* File Content Preview */
.file-content-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.preview-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h4 {
  margin: 0;
  color: #333;
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
}

.open-btn,
.download-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.open-btn:hover,
.download-btn:hover {
  background: #218838;
}

.preview-content {
  flex: 1;
  padding: 1rem;
  overflow: auto;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.pdf-preview iframe {
  border: none;
  border-radius: 8px;
}

.text-preview pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  overflow: auto;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.default-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.preview-icon img {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.6;
}

/* Student Comments */
.student-comments {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
}

.student-comments h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.comment-box {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.comment-box p {
  margin: 0;
  color: #333;
  line-height: 1.5;
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.student-basic-info h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.student-details {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  display: flex;
  gap: 1rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.no-submission {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.submitted {
  background: #d4edda;
  color: #155724;
}

/* Submission Content */
.submission-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.no-submission {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.no-submission-icon {
  font-size: 4rem;
  color: #dee2e6;
  margin-bottom: 1rem;
}

.no-submission h3 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.submission-info {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.submission-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
  color: #666;
}

.files-section h3,
.comments-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0,123,255,0.15);
}

.file-icon img {
  width: 32px;
  height: 32px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.download-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.download-btn:hover {
  background: #0056b3;
}

.comment-box {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.comment-box p {
  margin: 0;
  color: #333;
  line-height: 1.5;
}

/* Scoring Section */
.scoring-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: 100%;
  overflow-y: auto;
}

.scoring-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.scoring-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.score-display {
  text-align: right;
}

.current-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #007bff;
}

.percentage {
  display: block;
  font-size: 0.9rem;
  color: #666;
}

.scoring-controls {
  margin-bottom: 1.5rem;
}

.score-input-group,
.score-slider-group {
  margin-bottom: 1rem;
}

.score-input-group label,
.score-slider-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.score-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-input {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
}

.score-max {
  color: #666;
  font-weight: 600;
}

.score-slider {
  width: 100%;
  margin-bottom: 0.5rem;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
}

.teacher-comments {
  margin-bottom: 1.5rem;
}

.teacher-comments label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.comment-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  font-size: 0.9rem;
}

.scoring-actions {
  display: flex;
  gap: 0.75rem;
}

.save-score-btn,
.reset-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s;
}

.save-score-btn {
  background: #28a745;
  color: white;
}

.save-score-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.save-score-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .details-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .scoring-section {
    position: static;
  }
}

@media (max-width: 768px) {
  .details-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .header-left,
  .header-right {
    justify-content: center;
  }
  
  .student-navigation {
    order: 1;
  }
  
  .save-btn {
    order: 2;
  }
  
  .details-content {
    padding: 1rem;
  }
  
  .files-grid {
    grid-template-columns: 1fr;
  }
}
</style>
