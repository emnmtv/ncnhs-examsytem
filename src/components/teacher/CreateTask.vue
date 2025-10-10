<template>
  <div class="create-task-container">
    <div class="header-container">
      <div class="header-content">
        <h1>Create New Task<span class="material-icons">add_task</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Create and assign new tasks to your students</p>
        </div>
      </div>
      <div class="header-background">CREATE</div>
    </div>

    <form @submit.prevent="handleSubmit" class="task-form">
      <!-- Task Details Card -->
      <div class="card task-details-card">
        <div class="card-header">
          <h2><span class="material-icons">info</span> Task Details</h2>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label>Subject *</label>
            <select v-model="selectedSubject" required class="form-select">
              <option value="">Select a subject</option>
              <option v-for="subject in teacherSubjects" 
                      :key="subject.id" 
                      :value="subject.subject">
                {{ subject.subject.name }} ({{ subject.subject.code }})
              </option>
            </select>
            <small>Select the subject this task is for</small>
          </div>

          <div class="form-group full-width">
            <label>Task Title *</label>
            <input 
              type="text" 
              v-model="taskData.title" 
              required 
              placeholder="Enter task title"
              class="form-input"
            >
            <small>Give your task a descriptive title</small>
          </div>

          <div class="form-group full-width">
            <label>Description</label>
            <textarea 
              v-model="taskData.description" 
              rows="4" 
              placeholder="Enter task description"
              class="form-textarea"
            ></textarea>
            <small>Provide detailed instructions for your students (optional)</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Due Date *</label>
              <input 
                type="datetime-local" 
                v-model="taskData.dueDate" 
                required
                :min="minDate"
                class="form-input"
              >
              <small>When should students submit this task?</small>
            </div>

            <div class="form-group">
              <label>Total Score *</label>
              <input 
                type="number" 
                v-model="taskData.totalScore" 
                required 
                min="1"
                class="form-input"
              >
              <small>Maximum points for this task</small>
            </div>
          </div>
        </div>
      </div>

      <!-- File Attachments Card -->
      <div class="card file-attachments-card">
        <div class="card-header">
          <h2><span class="material-icons">attach_file</span> File Attachments</h2>
        </div>
        <div class="card-body">
          <div class="form-group full-width">
            <label>Attachments (Optional)</label>
            <div class="file-input">
              <input 
                type="file"
                ref="fileInput"
                @change="handleFileChange"
                multiple
                style="display: none"
              >
              <div class="file-actions">
                <button 
                  type="button" 
                  @click="$refs.fileInput.click()"
                  class="file-select-btn"
                >
                  <span class="material-icons">attach_file</span>
                  Select Files
                </button>
                <button 
                  v-if="selectedFiles.length > 0"
                  type="button"
                  @click="selectedFiles = []"
                  class="clear-files-btn"
                >
                  <span class="material-icons">clear_all</span>
                  Clear All
                </button>
              </div>
              <div class="selected-files-list">
                <div v-for="(file, index) in selectedFiles" 
                     :key="index" 
                     class="selected-file">
                  <img :src="getFileIcon(file.name)" :alt="getFileType(file.name)" class="file-icon">
                  <span class="file-name">{{ file.name }}</span>
                  <button 
                    type="button"
                    @click="removeFile(index)" 
                    class="remove-file"
                  >
                    <span class="material-icons">close</span>
                  </button>
                </div>
              </div>
            </div>
            <small>Upload supporting files for your task (documents, images, etc.)</small>
          </div>
        </div>
      </div>

      <!-- Student Assignment Card -->
      <div class="card student-assignment-card">
        <div class="card-header">
          <h2><span class="material-icons">people</span> Student Assignment</h2>
        </div>
        <div class="card-body">
          <div class="form-group full-width">
            <label>Assign to Students *</label>
            <div class="student-selection">
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="studentSearch" 
                  placeholder="Search students by name or LRN..."
                  class="form-input"
                >
              </div>
              <div v-if="isLoadingStudents" class="loading-students">
                <span class="material-icons-round rotating">sync</span>
                <p>Loading students...</p>
              </div>
              <div v-else-if="allStudents.length === 0" class="no-students">
                <p>No students found in the selected sections</p>
              </div>
              <div v-else class="students-list">
                <div class="select-all">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      :checked="selectedStudents.length === allStudents.length" 
                      @change="selectedStudents = $event.target.checked ? allStudents.map(s => s.id) : []"
                    >
                    <strong>Select All Students</strong>
                  </label>
                </div>
                <div v-for="student in filteredStudents" 
                     :key="student.id" 
                     class="student-item">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      :value="student.id" 
                      v-model="selectedStudents"
                    >
                    {{ student.firstName }} {{ student.lastName }} 
                    <span class="student-info">
                      (LRN: {{ student.lrn }} | Grade {{ student.gradeLevel }}-{{ student.section }})
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <small>Select which students should receive this task</small>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <div class="action-buttons">
          <button 
            type="button" 
            class="reset-button" 
            @click="$router.go(-1)"
          >
            <span class="material-icons-round">arrow_back</span>
            Cancel
          </button>
          
          <button 
            type="submit" 
            class="create-button"
            :disabled="isSubmitting"
          >
            <span class="material-icons-round">add_task</span>
            {{ isSubmitting ? 'Creating...' : 'Create Task' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  getTeacherAssignedSubjects, 
  createSubjectTask, 
  getStudentsBySection,
  getSubjectDirectStudents 
} from '@/services/authService';
// Import file icons
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
import powerpointIcon from '@/assets/FileIcons/pptx.png';
import defaultIcon from '@/assets/FileIcons/doc.png';

const router = useRouter();
const route = useRoute();
const teacherSubjects = ref([]);
const selectedSubject = ref('');
const studentSearch = ref('');
const selectedStudents = ref([]);
const isSubmitting = ref(false);
const allStudents = ref([]);
const isLoadingStudents = ref(false);

const taskData = ref({
  title: '',
  description: '',
  dueDate: '',
  totalScore: 1
});

const fileInput = ref(null);
const selectedFiles = ref([]);

// Get minimum date (current date and time)
const minDate = computed(() => {
  const now = new Date();
  return now.toISOString().slice(0, 16);
});

// Filter students based on search
const filteredStudents = computed(() => {
  if (!studentSearch.value) return allStudents.value;
  
  const search = studentSearch.value.toLowerCase();
  return allStudents.value.filter(student => 
    (student.firstName && student.firstName.toLowerCase().includes(search)) || 
    (student.lastName && student.lastName.toLowerCase().includes(search)) || 
    (student.lrn && student.lrn.toString().includes(search))
  );
});

// Load teacher's subjects
const loadTeacherSubjects = async () => {
  try {
    teacherSubjects.value = await getTeacherAssignedSubjects();
    
    // If subjectId is provided in the route, select that subject
    if (route.params.subjectId) {
      const subjectId = parseInt(route.params.subjectId);
      const foundSubject = teacherSubjects.value.find(s => s.subject.id === subjectId);
      if (foundSubject) {
        selectedSubject.value = foundSubject.subject;
      }
    }
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
};

// Load students from all sections of the selected subject and directly assigned students
const loadStudentsFromSections = async () => {
  if (!selectedSubject.value) return;
  
  try {
    isLoadingStudents.value = true;
    allStudents.value = [];
    selectedStudents.value = [];
    
    console.log('Selected subject:', selectedSubject.value);
    
    // Get students from each section if sections exist
    if (selectedSubject.value.sections && selectedSubject.value.sections.length > 0) {
      console.log('Fetching students from sections:', selectedSubject.value.sections);
      for (const section of selectedSubject.value.sections) {
        const sectionStudents = await getStudentsBySection(section.grade, section.section);
        console.log(`Found ${sectionStudents.length} students in grade ${section.grade} section ${section.section}`);
        allStudents.value = [...allStudents.value, ...sectionStudents];
      }
    } else {
      console.log('No sections found for this subject');
    }
    
    // Get directly assigned students
    try {
      console.log('Fetching directly assigned students for subject ID:', selectedSubject.value.id);
      const directStudentsResponse = await getSubjectDirectStudents(selectedSubject.value.id);
      console.log('Direct students response:', directStudentsResponse);
      
      if (directStudentsResponse && directStudentsResponse.data) {
        // The direct students are returned in a different format
        // Each item has a student property containing the actual student data
        const directStudentsData = directStudentsResponse.data;
        console.log(`Found ${directStudentsData.length} directly assigned students records`);
        
        // Extract the student objects from the response
        const directStudents = directStudentsData.map(item => item.student);
        console.log('Extracted direct students:', directStudents);
        
        // Add direct students to the allStudents array, avoiding duplicates
        for (const directStudent of directStudents) {
          if (!allStudents.value.some(student => student.id === directStudent.id)) {
            allStudents.value.push(directStudent);
          }
        }
      } else {
        console.log('No direct students found or invalid response format');
      }
    } catch (error) {
      console.error('Failed to load direct students:', error);
    }
    
    console.log(`Total students found: ${allStudents.value.length}`);
    
    // Automatically select all students' IDs
    selectedStudents.value = allStudents.value.map(student => student.id);
  } catch (error) {
    console.error('Failed to load students:', error);
  } finally {
    isLoadingStudents.value = false;
  }
};

// Watch for changes in selected subject
watch(selectedSubject, (newSubject) => {
  if (newSubject) {
    loadStudentsFromSections();
  } else {
    allStudents.value = [];
    selectedStudents.value = [];
  }
});

// Handle file selection
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

// Remove selected file
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
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
    case 'ppt':
    case 'pptx':
      return powerpointIcon;
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
    case 'ppt':
    case 'pptx':
      return 'PowerPoint Presentation';
    default:
      return 'File';
  }
};

// Handle form submission
const handleSubmit = async () => {
  try {
    isSubmitting.value = true;

    if (!selectedSubject.value) {
      alert('Please select a subject');
      return;
    }

    if (selectedStudents.value.length === 0) {
      alert('Please select at least one student');
      return;
    }

    const formData = new FormData();
    formData.append('title', taskData.value.title);
    formData.append('description', taskData.value.description || '');
    formData.append('dueDate', taskData.value.dueDate);
    formData.append('totalScore', taskData.value.totalScore);
    // Use student IDs directly since selectedStudents now contains IDs
    const studentIds = selectedStudents.value;
    formData.append('studentIds', JSON.stringify(studentIds));
    
    // Append multiple files
    selectedFiles.value.forEach(file => {
      formData.append('files', file);
    });

    await createSubjectTask(selectedSubject.value.id, formData);
    router.push(`/subject/${selectedSubject.value.id}/tasks`);
  } catch (error) {
    console.error('Failed to create task:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      subjectId: selectedSubject.value?.id,
      studentCount: selectedStudents.value.length,
      taskData: taskData.value
    });
    
    let errorMessage = 'Failed to create task. Please try again.';
    if (error.message) {
      errorMessage = `Failed to create task: ${error.message}`;
    }
    alert(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadTeacherSubjects();
});
</script>

<style scoped>
.create-task-container {
  max-width: 1200px;
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
  gap: 12px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
}

.header-actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.header-btn {
  background: #f5f5f5;
  color: #333;
  padding: 8px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
}

.header-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.header-btn .material-icons {
  font-size: 1.2rem;
}

.back-btn {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.back-btn:hover {
  background: linear-gradient(135deg, #5a6268 0%, #343a40 100%);
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

/* Card Styles */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 25px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* Add texture layer to card headers */
.card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 50%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.03) 25%,
      rgba(255, 255, 255, 0.03) 75%,
      transparent 100%
    );
  pointer-events: none;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.card-body {
  padding: 25px;
}

/* Form Styles */
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  margin-bottom: 20px;
}

.form-group.full-width {
  flex: 1 1 100%;
}

.form-group:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 1rem;
  background-color: white;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
  transform: translateY(-1px);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.reset-button,
.create-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.reset-button {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.reset-button:hover {
  background-color: #e0e0e0;
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.create-button {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}

.create-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
  opacity: 0.3;
  z-index: 0;
}

.create-button:hover {
  background: linear-gradient(135deg, #388E3C, #2E7D32);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
}

.create-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.reset-button .material-icons-round,
.create-button .material-icons-round {
  font-size: 1.2rem;
  position: relative;
  z-index: 1;
}

/* File Input Styles */
.file-input {
  margin-top: 8px;
}

.file-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.file-select-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  color: #1976d2;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.file-select-btn:hover {
  background: linear-gradient(135deg, #bbdefb, #90caf9);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
}

.clear-files-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #dc2626;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.clear-files-btn:hover {
  background: linear-gradient(135deg, #fecaca, #fca5a5);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
}

.selected-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.file-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.file-name {
  flex: 1;
  color: #202124;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file {
  background: none;
  border: none;
  color: #5f6368;
  padding: 4px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-file:hover {
  background-color: rgba(95, 99, 104, 0.1);
  color: #dc2626;
}

/* Student Selection Styles */
.student-selection {
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.student-selection:focus-within {
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
}

.search-box {
  padding: 15px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
}

.search-box .form-input {
  border: none;
  background: white;
  margin: 0;
}

.students-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 15px;
}

.student-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.student-item:last-child {
  border-bottom: none;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: #159750;
}

.student-info {
  color: #666;
  font-size: 0.85rem;
  display: block;
  margin-top: 2px;
}

.select-all {
  padding: 12px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 8px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.loading-students,
.no-students {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .create-task-container {
    padding: 10px;
  }
  
  .header-container {
    padding: 0;
    margin-bottom: 20px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }

  .form-actions {
    flex-direction: column;
    gap: 15px;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .reset-button,
  .create-button {
    width: 100%;
    justify-content: center;
  }

  .header-background {
    font-size: 3rem;
    top: 60%;
    right: 1rem;
  }
  
  .divider {
    margin: 1rem 0;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .card-body {
    padding: 15px;
  }

  .card-header h2 {
    font-size: 1.2rem;
  }

  .file-actions {
    flex-direction: column;
    gap: 8px;
  }

  .file-select-btn, .clear-files-btn {
    width: 100%;
    justify-content: center;
  }

  .students-list {
    max-height: 250px;
  }
}

@media (max-width: 480px) {
  .create-task-container {
    padding: 5px;
  }
  
  .header-content h1 {
    font-size: 1.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.5rem;
  }

  .card-body {
    padding: 12px;
  }

  .card-header {
    padding: 15px;
  }

  .card-header h2 {
    font-size: 1.1rem;
  }

  .form-input,
  .form-select,
  .form-textarea {
    padding: 10px 12px;
    font-size: 0.9rem;
  }

  .reset-button,
  .create-button {
    padding: 12px 20px;
    font-size: 0.95rem;
  }
  
  .students-list {
    max-height: 220px;
  }
  
  .student-item {
    padding: 6px 0;
  }
  
  .student-info {
    font-size: 0.75rem;
  }
}


</style>