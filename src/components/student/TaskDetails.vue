<template>
  <div class="task-details">
    <div class="header-container">
      <div class="header-content">
        <router-link to="/student/tasks" class="back-link">
          <span class="material-icons">arrow_back</span>
          Back to Tasks
        </router-link>
        <h1>{{ task?.title }}</h1>
        <div class="divider"></div>
      </div>
      <div class="header-background">DETAILS</div>
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
              <button
                @click="openFilePreview(file)"
                class="view-btn">
                <span class="material-icons">visibility</span>
                View
              </button>
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
              <button
                @click="openFilePreview(file)"
                class="view-btn">
                <span class="material-icons">visibility</span>
                View
              </button>
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

    <!-- File Preview Modal (For images and videos) -->
    <div v-if="showFilePreview && !isPdf(previewFile.fileName) && !isDocx(previewFile.fileName)" class="file-preview-modal" @click="closeFilePreview">
      <div class="preview-content" @click.stop>
        <div class="preview-header">
          <h3>{{ previewFile.fileName }}</h3>
          <button class="close-btn" @click="closeFilePreview">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="preview-body">
          <!-- Loading state -->
          <div v-if="previewFile.loading" class="preview-loading">
            <div class="spinner"></div>
            <p>Loading file preview...</p>
          </div>
          
          <!-- Error state -->
          <div v-else-if="previewFile.error" class="preview-error">
            <span class="material-icons">error_outline</span>
            <p>Failed to load file preview</p>
            <a :href="getFullFileUrl(previewFile.fileUrl)" 
               download
               class="download-file-btn">
              <span class="material-icons">download</span>
              Download File
            </a>
          </div>
          
          <!-- Image preview -->
          <img v-else-if="isImage(previewFile.fileName)" 
               :src="previewFile.blobUrl || getFullFileUrl(previewFile.fileUrl)" 
               alt="File preview"
               class="preview-image">
          
          <!-- Video preview -->
          <video v-else-if="isVideo(previewFile.fileName)" 
                 controls
                 class="preview-video">
            <source :src="previewFile.blobUrl || getFullFileUrl(previewFile.fileUrl)" 
                    :type="getVideoType(previewFile.fileName)">
            Your browser does not support video playback.
          </video>
          
          <!-- Other file types - show download prompt -->
          <div v-else class="preview-fallback">
            <div class="fallback-icon">
              <img :src="getFileIcon(previewFile.fileName)" alt="File icon" class="large-file-icon">
            </div>
            <p>This file type cannot be previewed directly.</p>
            <a :href="getFullFileUrl(previewFile.fileUrl)" 
               download
               class="download-file-btn">
              <span class="material-icons">download</span>
              Download File
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Full screen PDF and DOCX viewer -->
    <div v-if="showFilePreview && (isPdf(previewFile.fileName) || isDocx(previewFile.fileName))" class="fullscreen-preview">
      <div class="fullscreen-header">
        <div class="header-left">
          <button class="back-btn" @click="closeFilePreview">
            <span class="material-icons">arrow_back</span>
          </button>
          <h3>{{ previewFile.fileName }}</h3>
        </div>
        <div class="header-actions">
          <a :href="getFullFileUrl(previewFile.fileUrl)" 
             download
             class="download-action">
            <span class="material-icons">download</span>
            Download
          </a>
          <button class="close-fullscreen-btn" @click="closeFilePreview">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
      
      <div class="fullscreen-body">
        <!-- Loading state -->
        <div v-if="previewFile.loading" class="preview-loading">
          <div class="spinner"></div>
          <p>Loading file preview...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="previewFile.error" class="preview-error">
          <span class="material-icons">error_outline</span>
          <p>Failed to load file preview</p>
          <a :href="getFullFileUrl(previewFile.fileUrl)" 
             download
             class="download-file-btn">
            <span class="material-icons">download</span>
            Download File
          </a>
        </div>
        
        <!-- PDF preview -->
        <iframe v-else-if="isPdf(previewFile.fileName)"
                :src="previewFile.blobUrl || getFullFileUrl(previewFile.fileUrl)"
                class="fullscreen-iframe"
                frameborder="0"></iframe>
        
        <!-- DOCX preview using Google Docs Viewer -->
        <iframe v-else-if="isDocx(previewFile.fileName)"
                :src="`https://docs.google.com/viewer?url=${encodeURIComponent(getFullFileUrl(previewFile.fileUrl))}&embedded=true`"
                class="fullscreen-iframe"
                frameborder="0"></iframe>
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

// Add these new refs for file preview
const showFilePreview = ref(false);
const previewFile = ref({});

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

// Add file type detection helpers
const isImage = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
};

const isVideo = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext);
};

const isPdf = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  return ext === 'pdf';
};

const isDocx = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  return ['doc', 'docx'].includes(ext);
};

const getVideoType = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'ogg': return 'video/ogg';
    default: return 'video/mp4';
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

// Add these new methods for file preview
const openFilePreview = async (file) => {
  try {
    // Create a copy of the file object to avoid mutating the original
    previewFile.value = { ...file };
    showFilePreview.value = true;
    
    // For PDFs, images and videos - fetch as blob and create object URL
    if (isPdf(file.fileName) || isImage(file.fileName) || isVideo(file.fileName)) {
      // Show loading state
      previewFile.value.loading = true;
      
      try {
        const response = await fetch(getFullFileUrl(file.fileUrl));
        const blob = await response.blob();
        previewFile.value.blobUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.error(`Error fetching file ${file.fileName}:`, err);
        previewFile.value.error = true;
      } finally {
        previewFile.value.loading = false;
      }
    }
    
    // For DOCX files, we'll use Google Docs Viewer
    // No need to fetch blob, just make sure the file is accessible via URL
    if (isDocx(file.fileName)) {
      previewFile.value.loading = true;
      
      // Just verify the file exists
      try {
        const checkResponse = await fetch(getFullFileUrl(file.fileUrl), { method: 'HEAD' });
        if (!checkResponse.ok) {
          throw new Error(`File not accessible: ${checkResponse.status}`);
        }
      } catch (err) {
        console.error(`Error checking DOCX file ${file.fileName}:`, err);
        previewFile.value.error = true;
      } finally {
        previewFile.value.loading = false;
      }
    }
  } catch(err) {
    console.error("Error preparing file preview:", err);
    previewFile.value.error = true;
  }
};

const closeFilePreview = () => {
  // Clean up the blob URL to prevent memory leaks
  if (previewFile.value && previewFile.value.blobUrl) {
    URL.revokeObjectURL(previewFile.value.blobUrl);
  }
  showFilePreview.value = false;
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
  margin: 1rem 0;
}

.header-background {
  position: absolute;
  top: 30%;
  right: 5rem;
  transform: translateY(-50%);
  font-size: 8rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.03);
  z-index: 0;
  user-select: none;
  pointer-events: none;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #159750;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.back-link:hover {
  transform: translateX(-5px);
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 1.5rem 0;
  width: 100%;
}

/* Card Styles */
.task-info, .task-section, .your-work {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
              0 4px 16px -2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  margin-bottom: 20px;
}

.task-info:hover, .task-section:hover, .your-work:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

/* Button Styles */
.file-select-btn, .submit-btn, .resubmit-btn, .edit-btn {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.file-select-btn:hover, .submit-btn:hover, .resubmit-btn:hover, .edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* File Items */
.file-item {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
  margin-bottom: 8px;
}

.file-item:hover {
  background: #fff;
  border-color: #159750;
}

/* Responsive Design */
@media (max-width: 768px) {
  .task-details {
    padding: 10px;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .header-background {
    font-size: 4rem;
    right: 0.3rem;
  }

  .task-info, .task-section, .your-work {
    padding: 16px;
    border-radius: 12px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .file-actions {
    flex-direction: column;
    gap: 8px;
  }

  .file-select-btn, .submit-btn, .resubmit-btn {
    width: 100%;
    padding: 8px 16px;
  }
}

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.5rem;
  }

  .file-item {
    padding: 8px;
  }

  .file-name {
    font-size: 0.9rem;
  }

  .view-btn, .download-btn {
    padding: 4px;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #5f6368;
}

.loading-state .rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #d93025;
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

/* File Preview Modal Styles */
.file-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(3px);
}

.preview-content {
  background-color: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

/* Add texture layers to header */
.preview-header::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10%;
  width: 50%;
  height: 100%;
  background: linear-gradient(45deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  position: relative;
  z-index: 1;
}

.preview-body {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: #f9f9f9;
  min-height: 300px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background: white;
  border: 1px solid #eee;
}

.preview-video {
  width: 100%;
  max-width: 800px;
  max-height: 70vh;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background: black;
}

.preview-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: white;
  padding: 50px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
}

.large-file-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 10px;
}

.download-file-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(21, 151, 80, 0.2);
}

.download-file-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(21, 151, 80, 0.3);
}

/* Full screen viewer styles */
.fullscreen-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h3 {
  margin: 0;
  font-size: 1.1rem;
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn, .close-fullscreen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover, .close-fullscreen-btn:hover {
  background: rgba(255,255,255,0.25);
  transform: scale(1.05);
}

.download-action {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 20px;
  padding: 6px 15px;
  color: white;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.download-action:hover {
  background: rgba(255,255,255,0.25);
  transform: translateY(-2px);
}

.fullscreen-body {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.fullscreen-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Preview loading and error states */
.preview-loading, .preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  gap: 20px;
  min-height: 300px;
}

.preview-error {
  color: #d32f2f;
}

.preview-error .material-icons {
  font-size: 48px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(21, 151, 80, 0.2);
  border-radius: 50%;
  border-top-color: #159750;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>