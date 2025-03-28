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
          <div class="info-value">
            {{ formatDateFull(task.dueDate) }}
            <span class="relative-date">({{ formatRelativeDate(task.dueDate) }})</span>
          </div>
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
          <div v-if="task.files && task.files.length > 0" class="files-list">
            <div v-for="file in task.files" :key="file.id" class="file-item">
              <img :src="getFileIcon(file.fileName)" :alt="getFileType(file.fileName)" class="file-icon">
              <span class="file-name">{{ file.fileName }}</span>
              <a :href="getFullFileUrl(file.fileUrl)" 
                 target="_blank" 
                 class="view-btn">
                <span class="material-icons">visibility</span>
                View
              </a>
              <a :href="getFullFileUrl(file.fileUrl)" 
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
          
          <!-- Show submitted files -->
          <div v-if="task.submission" class="file-preview">
            <div v-for="file in task.submission.files" :key="file.id" class="file-item">
              <img :src="getFileIcon(file.fileName)" :alt="getFileType(file.fileName)" class="file-icon">
              <span class="file-name">{{ file.fileName }}</span>
              <a :href="getFullFileUrl(file.fileUrl)" 
                 target="_blank" 
                 class="view-btn">
                <span class="material-icons">visibility</span>
                View
              </a>
              <!-- Only show X button in edit mode -->
              <button 
                v-if="editMode"
                @click="removeFile(file.id)" 
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
                multiple
                style="display: none"
              >

              <!-- Show selected files -->
              <div v-if="selectedFiles.length > 0" class="selected-files">
                <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file">
                  <img :src="getFileIcon(file.name)" :alt="getFileType(file.name)" class="file-icon">
                  <span class="file-name">{{ file.name }}</span>
                  <button 
                    @click="removeSelectedFile(index)" 
                    class="remove-btn"
                    type="button"
                  >
                    <span class="material-icons">close</span>
                  </button>
                </div>
              </div>

              <!-- Resubmit button -->
              <button 
                v-if="selectedFiles.length > 0"
                @click="handleEditSubmission"
                :disabled="submitting"
                class="resubmit-btn"
              >
                {{ submitting ? 'Resubmitting...' : 'Resubmit Assignment' }}
              </button>

              <!-- Cancel button -->
              <button 
                @click="cancelEdit"
                class="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- File upload button for new submission -->
          <div v-if="!task.submission" class="file-upload">
            <input 
              type="file"
              ref="fileInput"
              @change="handleFileChange"
              multiple
              style="display: none"
            >
            <div class="file-actions">
              <button @click="$refs.fileInput.click()" class="file-select-btn">
                <span class="material-icons">attach_file</span>
                Add Files
              </button>
              <button 
                v-if="selectedFiles.length > 0"
                @click="clearAllFiles" 
                class="clear-files-btn"
              >
                <span class="material-icons">delete</span>
                Clear All
              </button>
            </div>
            
            <!-- Show selected files -->
            <div v-if="selectedFiles.length > 0" class="selected-files-list">
              <div v-for="(file, index) in selectedFiles" 
                   :key="index" 
                   class="selected-file">
                <img :src="getFileIcon(file.name)" :alt="getFileType(file.name)" class="file-icon">
                <span class="file-name">{{ file.name }}</span>
                <button 
                  @click="removeSelectedFile(index)" 
                  class="remove-file"
                  type="button"
                >
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>

            <!-- Submit button -->
            <button 
              v-if="selectedFiles.length > 0"
              @click="handleSubmitTask"
              :disabled="submitting"
              class="submit-btn"
            >
              {{ submitting ? 'Submitting...' : 'Submit Assignment' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getStudentTaskDetails, submitTask as submitTaskToServer, editSubmission, deleteFile } from '@/services/authService';
import { getBaseApiUrl as getBaseApiUrlUtils } from '@/services/authService';
import Swal from 'sweetalert2'; // Import SweetAlert only for deletion
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

// Add fileInput ref
const fileInput = ref(null);
const route = useRoute();
const taskId = parseInt(route.params.taskId);
const task = ref(null);
const loading = ref(true);
const error = ref(null);
const selectedFiles = ref([]);
const submitting = ref(false);
const editMode = ref(false);

onMounted(() => {
  loadTaskDetails();
});

const loadTaskDetails = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    if (isNaN(taskId)) {
      error.value = "Invalid task ID";
      return;
    }
    
    task.value = await getStudentTaskDetails(taskId);
  } catch (err) {
    console.error('Error loading task details:', err);
    error.value = err.message || 'Failed to load task details';
  } finally {
    loading.value = false;
  }
};

const formatDateFull = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get full file URL
const getFullFileUrl = (url) => {
  return `${getBaseApiUrlUtils()}${url}`;
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

const handleFileChange = (event) => {
  const newFiles = Array.from(event.target.files);
  const validFiles = newFiles.filter(file => {
    if (file.size > 300 * 1024 * 1024) { // 300MB limit
      alert(`File ${file.name} is larger than 300MB`);
      return false;
    }
    return true;
  });
  
  // Append new files to existing ones instead of replacing
  selectedFiles.value = [...selectedFiles.value, ...validFiles];
  
  // Clear the input so the same file can be selected again if needed
  if (fileInput.value) fileInput.value.value = '';
};

const removeSelectedFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

const handleSubmitTask = async () => {
  if (selectedFiles.value.length === 0) {
    alert('Please select at least one file to submit');
    return;
  }

  try {
    submitting.value = true;
    const formData = new FormData();
    
    // Append each file to the formData
    selectedFiles.value.forEach(file => {
      formData.append('files', file);
    });
    
    // Set upload type to submissions
    formData.append('uploadType', 'submissions');

    const result = await submitTaskToServer(taskId, formData);
    
    // Update the task data without refreshing
    if (result && result.submission) {
      task.value.submission = {
        id: result.submission.id,
        files: result.submission.files,
        submittedAt: result.submission.submittedAt,
        score: null,
        comment: null
      };
    }
    
    selectedFiles.value = [];
  
  } catch (err) {
    console.error('Error submitting task:', err);
    alert('Failed to submit task: ' + (err.message || 'Unknown error'));
  } finally {
    submitting.value = false;
  }
};

const startEdit = () => {
  editMode.value = true;
  selectedFiles.value = [];
};

const cancelEdit = () => {
  editMode.value = false;
  selectedFiles.value = [];
};

const handleEditSubmission = async () => {
  if (selectedFiles.value.length === 0) {
    alert('Please select at least one file to submit');
    return;
  }

  try {
    submitting.value = true;
    const formData = new FormData();
    
    // Append each file to the formData
    selectedFiles.value.forEach(file => {
      formData.append('files', file);
    });
    
    // Set upload type to submissions
    formData.append('uploadType', 'submissions');

    const result = await editSubmission(task.value.submission.id, formData);
    
    // Update the task data without refreshing
    if (result && result.submission) {
      // Add new files to the existing files array
      if (result.submission.files) {
        const newFiles = result.submission.files.filter(
          newFile => !task.value.submission.files.some(existingFile => existingFile.id === newFile.id)
        );
        task.value.submission.files = [...task.value.submission.files, ...newFiles];
      }
      
      // Update submission date
      task.value.submission.submittedAt = result.submission.submittedAt;
    }
    
    selectedFiles.value = [];
    editMode.value = false;
    
  } catch (err) {
    console.error('Error editing submission:', err);
    alert('Failed to update submission: ' + (err.message || 'Unknown error'));
  } finally {
    submitting.value = false;
  }
};

// Add this function to show relative dates
const formatRelativeDate = (date) => {
  if (!date) return '';
  const now = new Date();
  const taskDate = new Date(date);
  
  // Calculate difference in days
  const diffTime = taskDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffTime < 0) {
    return 'Past due';
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else {
    return `Due in ${diffDays} days`;
  }
};

// Add clear all files function
const clearAllFiles = () => {
  selectedFiles.value = [];
};

// Use SweetAlert only for the removeFile function
const removeFile = async (fileId) => {
  const result = await Swal.fire({
    title: 'Remove File',
    text: 'Are you sure you want to remove this file?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, remove it!'
  });
  
  if (!result.isConfirmed) {
    return;
  }
  
  try {
    // Show loading state
    Swal.fire({
      title: 'Removing...',
      text: 'Please wait while the file is being removed',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    await deleteFile(fileId);
    
    // Remove the file from the UI
    task.value.submission.files = task.value.submission.files.filter(file => file.id !== fileId);
    
    Swal.fire({
      title: 'Success!',
      text: 'File has been removed successfully',
      icon: 'success',
      confirmButtonColor: '#1a73e8'
    });
  } catch (err) {
    console.error('Error removing file:', err);
    Swal.fire({
      title: 'Removal Failed',
      text: err.message || 'An error occurred while removing the file',
      icon: 'error',
      confirmButtonColor: '#1a73e8'
    });
  }
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
  display: flex;
  align-items: center;
  gap: 5px;
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

.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-files {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.relative-date {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: 0.5rem;
  color: #5f6368;
}

.info-value {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

/* Add these new styles */
.file-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.file-select-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.clear-files-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.selected-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 1rem;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.remove-file {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #5f6368;
  cursor: pointer;
  border-radius: 12px;
}

.remove-file:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style> 