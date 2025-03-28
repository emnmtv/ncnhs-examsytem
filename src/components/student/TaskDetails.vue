<template>
  <div class="task-details">
    <div class="header-container">
      <div class="header-content">
        <router-link to="/student/tasks" class="back-link">
          <span class="material-icons">arrow_back</span>
          Back
        </router-link>
        <h1>{{ task?.title }}</h1>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading task details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
    </div>

    <!-- Task Details -->
    <div v-else-if="task" class="task-content">
      <div class="task-info">
        <div class="info-row">
          <div class="info-label">Instructor:</div>
          <div class="info-value">{{ task.teacher.firstName }} {{ task.teacher.lastName }}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Date Posted:</div>
          <div class="info-value">{{ formatDateFull(task.createdAt) }}</div>
          <div class="info-label due-date">Due date:</div>
          <div class="info-value">{{ formatDateFull(task.dueDate) }}</div>
        </div>
      </div>

      <div class="task-section">
        <div class="section-label">Instructions</div>
        <div class="section-content">
          {{ task.description || 'No instruction' }}
        </div>
      </div>

      <div class="task-section">
        <div class="section-label">Attachments</div>
        <div class="section-content">
          <div v-if="task.fileUrl" class="file-preview">
            <div class="file-item">
              <img :src="getFileIcon(task.fileName)" :alt="getFileType(task.fileName)" class="file-icon">
              <span class="file-name">{{ task.fileName }}</span>
              <a :href="getFullFileUrl(task.fileUrl)" 
                 target="_blank" 
                 class="view-btn">
                <span class="material-icons">visibility</span>
                View
              </a>
              <a :href="getFullFileUrl(task.fileUrl)" 
                 download
                 class="download-btn">
                <span class="material-icons">download</span>
              </a>
            </div>
          </div>
          <div v-else class="no-attachments">
            <span class="material-icons">info</span>
            No attachments
          </div>
        </div>
      </div>

      <div class="your-work">
        <h2>Your Work</h2>
        <div class="files-section">
          <div class="files-label">Files Uploaded</div>
          
          <!-- Show submitted file -->
          <div v-if="task.submission" class="file-preview">
            <div class="file-item">
              <img :src="getFileIcon(task.submission.fileName)" :alt="getFileType(task.submission.fileName)" class="file-icon">
              <span class="file-name">{{ task.submission.fileName }}</span>
              <a :href="getFullFileUrl(task.submission.fileUrl)" 
                 target="_blank" 
                 class="view-btn">
                <span class="material-icons">visibility</span>
                View
              </a>
              <!-- Only show X button in edit mode -->
              <button 
                v-if="editMode"
                @click="removeFile" 
                class="remove-btn"
                type="button"
                aria-label="Remove file"
              >
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Add Edit button when not in edit mode -->
            <button 
              v-if="!editMode"
              @click="startEdit"
              class="edit-btn"
            >
              Edit Uploaded Files
            </button>

            <!-- Edit mode controls -->
            <div v-if="editMode" class="edit-controls">
              <!-- Attach file button -->
              <button 
                @click="$refs.fileInput.click()" 
                class="attach-btn"
                type="button"
              >
                <span class="material-icons">add</span>
                Attach file
              </button>

              <!-- Hidden file input -->
              <input 
                type="file"
                ref="fileInput"
                @change="handleFileChange"
                style="display: none"
              >

              <!-- Show Resubmit button only when new file is selected -->
              <button 
                v-if="editingFile"
                @click="handleEditSubmission"
                :disabled="submitting"
                class="resubmit-btn"
              >
                {{ submitting ? 'Resubmitting...' : 'Resubmit Assignment' }}
              </button>

              <!-- Add Cancel button -->
              <button 
                @click="cancelEdit"
                class="cancel-btn"
              >
                Resubmit Assignment
              </button>
            </div>
          </div>

          <!-- File upload button -->
          <div v-if="!task.submission" class="file-upload">
            <input 
              type="file"
              ref="fileInput"
              @change="handleFileChange"
              style="display: none"
            >
            <button @click="$refs.fileInput.click()" class="upload-btn">
              Edit Uploaded Files
            </button>
          </div>

          <!-- Submit button -->
          <button 
            v-if="selectedFile" 
            @click="handleSubmitTask"
            :disabled="submitting"
            class="submit-btn"
          >
            {{ submitting ? 'Submitting...' : 'Turn in' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getStudentTaskDetails, submitTask as submitTaskToServer, getBaseApiUrl, editSubmission } from '@/services/authService';
import { formatDistanceToNow } from 'date-fns';
import csvIcon from '@/assets/FileIcons/csv.png';
import docIcon from '@/assets/FileIcons/doc.png';
import imgIcon from '@/assets/FileIcons/img.png';
import jpgIcon from '@/assets/FileIcons/jpg.png';
import pdfIcon from '@/assets/FileIcons/pdf.png';
import pngIcon from '@/assets/FileIcons/png.png';
import txtIcon from '@/assets/FileIcons/txt-file.png';
import videoIcon from '@/assets/FileIcons/video.png';

import xlsIcon from '@/assets/FileIcons/xls.png';
import zipIcon from '@/assets/FileIcons/zip.png';
import defaultIcon from '@/assets/FileIcons/doc.png'; // fallback icon

const route = useRoute();
const taskId = route.params.taskId;

const task = ref(null);
const loading = ref(true);
const error = ref(null);
const selectedFile = ref(null);
const submitting = ref(false);
const fileInput = ref(null);
const editMode = ref(false);
const editingFile = ref(null);

// Load task details on mount
onMounted(() => {
  loadTaskDetails();
});

// Load task details
const loadTaskDetails = async () => {
  try {
    loading.value = true;
    error.value = null;
    task.value = await getStudentTaskDetails(taskId);
  } catch (err) {
    console.error('Error loading task details:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Handle file selection
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      event.target.value = '';
      return;
    }
    selectedFile.value = file;
  }
};

// Submit task
const handleSubmitTask = async () => {
  if (!selectedFile.value) return;
  
  try {
    submitting.value = true;
    await submitTaskToServer(taskId, selectedFile.value);
    await loadTaskDetails(); // Reload task details
  } catch (err) {
    console.error('Error submitting task:', err);
    alert('Failed to submit task. Please try again.');
  } finally {
    submitting.value = false;
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
  }
};

// Format full date
const formatDateFull = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Get full file URL
const getFullFileUrl = (fileUrl) => {
  return `${getBaseApiUrl()}${fileUrl}`;
};

// Get file icon based on file name
const getFileIcon = (fileName) => {
  if (!fileName) return defaultIcon;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return pdfIcon;
    case 'doc':
    case 'docx':
      return docIcon;
    case 'xls':
    case 'xlsx':
      return xlsIcon;
    case 'csv':
      return csvIcon;
    case 'txt':
      return txtIcon;
    case 'jpg':
    case 'jpeg':
      return jpgIcon;
    case 'png':
      return pngIcon;
    case 'gif':
    case 'bmp':
      return imgIcon;
    case 'mp4':
    case 'avi':
    case 'mov':
      return videoIcon;
    case 'zip':
    case 'rar':
      return zipIcon;
    default:
      return defaultIcon;
  }
};

// Get file type based on file name
const getFileType = (fileName) => {
  if (!fileName) return 'Unknown';
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'PDF Document';
    case 'doc':
    case 'docx':
      return 'Word Document';
    case 'xls':
    case 'xlsx':
      return 'Excel Spreadsheet';
    case 'csv':
      return 'CSV File';
    case 'txt':
      return 'Text File';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return 'Image';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'Video';
    case 'zip':
    case 'rar':
      return 'Archive';
    default:
      return 'File';
  }
};

// Update removeFile function
const removeFile = async () => {
  try {
    submitting.value = true;
    // Send empty file to update submission
    await editSubmission(task.value.submission.id, null);
    await loadTaskDetails(); // Reload task details
    editMode.value = false;
    editingFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
  } catch (err) {
    console.error('Error removing file:', err);
    alert('Failed to remove file. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Update handleEditSubmission to handle null file case
const handleEditSubmission = async () => {
  try {
    submitting.value = true;
    await editSubmission(task.value.submission.id, editingFile.value);
    await loadTaskDetails(); // Reload task details
    editMode.value = false;
    editingFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
  } catch (err) {
    console.error('Error editing submission:', err);
    alert('Failed to edit submission. Please try again.');
  } finally {
    submitting.value = false;
  }
};

// Start edit
const startEdit = () => {
  editMode.value = true;
};

// Cancel edit
const cancelEdit = () => {
  editMode.value = false;
  editingFile.value = null;
};
</script>

<style scoped>
.task-details {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #1a73e8;
  text-decoration: none;
  margin-bottom: 20px;
}

.task-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-label {
  font-weight: 500;
  margin-right: 10px;
  min-width: 100px;
}

.due-date {
  margin-left: 20px;
}

.task-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.section-label {
  font-weight: 500;
  margin-bottom: 10px;
}

.your-work {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.files-section {
  margin-top: 20px;
}

.files-label {
  font-weight: 500;
  margin-bottom: 10px;
}

.file-preview {
  margin: 10px 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.file-icon {
  width: 24px;
  height: 24px;
}

.file-name {
  flex: 1;
  color: #202124;
  font-size: 14px;
}

.check-icon {
  color: #34A853;
}

.upload-btn {
  background: none;
  border: none;
  color: #1a73e8;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
}

.upload-btn:hover {
  text-decoration: underline;
}

.submit-btn {
  display: block;
  width: 100%;
  margin-top: 20px;
  background: #1a73e8;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

/* Add these new styles for the attachment section */
.view-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #1a73e8;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.view-btn:hover {
  background-color: rgba(26, 115, 232, 0.1);
}

.download-btn {
  color: #5f6368;
  text-decoration: none;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.download-btn:hover {
  background-color: rgba(95, 99, 104, 0.1);
}

.no-attachments {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5f6368;
  font-size: 14px;
}

.no-attachments .material-icons {
  font-size: 20px;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #1a73e8;
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn:hover {
  background-color: rgba(26, 115, 232, 0.1);
}

.edit-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  color: #5f6368;
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background-color: rgba(95, 99, 104, 0.1);
}

.remove-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: rgba(26, 115, 232, 0.1);
}

.edit-controls {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.attach-btn {
  background: none;
  border: none;
  color: #1a73e8;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
}

.attach-btn:hover {
  text-decoration: underline;
}

.resubmit-btn {
  display: block;
  width: 100%;
  margin-top: 20px;
  background: #1a73e8;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}
</style> 