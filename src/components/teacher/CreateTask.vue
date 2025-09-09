<template>
  <div class="create-task">
    <div class="header-container">
      <div class="header-content">
        <h1>Create Task<span class="material-icons">add_task</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Create and assign new tasks to your students</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="$router.go(-1)" class="header-btn back-btn">
          <span class="material-icons">arrow_back</span>
          Back
        </button>
      </div>
      <div class="header-background">NEW TASK</div>
    </div>

    <div class="task-form-container">
      <form @submit.prevent="handleSubmit" class="task-form">
        <!-- Subject Selection -->
        <div class="form-group">
          <label>Subject</label>
          <select v-model="selectedSubject" required>
            <option value="">Select a subject</option>
            <option v-for="subject in teacherSubjects" 
                    :key="subject.id" 
                    :value="subject.subject">
              {{ subject.subject.name }} ({{ subject.subject.code }})
            </option>
          </select>
        </div>

        <!-- Task Details -->
        <div class="form-group">
          <label>Title</label>
          <input 
            type="text" 
            v-model="taskData.title" 
            required 
            placeholder="Enter task title"
          >
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea 
            v-model="taskData.description" 
            rows="4" 
            placeholder="Enter task description"
          ></textarea>
        </div>

        <!-- Changed to separate form groups to prevent overlap -->
          <div class="form-group">
            <label>Due Date</label>
            <input 
              type="datetime-local" 
              v-model="taskData.dueDate" 
              required
              :min="minDate"
            >
          </div>

          <div class="form-group">
            <label>Total Score</label>
            <input 
              type="number" 
              v-model="taskData.totalScore" 
              required 
              min="1"
            >
        </div>

        <!-- File Attachment -->
        <div class="form-group">
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
        </div>

        <!-- Student Selection -->
        <div class="form-group">
          <label>Assign to Students</label>
          <div class="student-selection">
            <div class="search-box">
              <input 
                type="text" 
                v-model="studentSearch" 
                placeholder="Search students by name or LRN..."
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
                    @change="selectedStudents = $event.target.checked ? allStudents.map(s => s.lrn) : []"
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
                    :value="student.lrn" 
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
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button type="button" @click="$router.go(-1)" class="cancel-btn">
            Cancel
          </button>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <span class="material-icons">add_task</span>
            {{ isSubmitting ? 'Creating...' : 'Create Task' }}
          </button>
        </div>
      </form>
    </div>
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
    student.firstName.toLowerCase().includes(search) || 
    student.lastName.toLowerCase().includes(search) || 
    student.lrn.toString().includes(search)
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
    
    // Automatically select all students' LRNs
    selectedStudents.value = allStudents.value.map(student => student.lrn);
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
    formData.append('studentLRNs', JSON.stringify(selectedStudents.value.map(lrn => lrn.toString())));
    
    // Append multiple files
    selectedFiles.value.forEach(file => {
      formData.append('files', file);
    });

    await createSubjectTask(selectedSubject.value.id, formData);
    router.push(`/subject/${selectedSubject.value.id}/tasks`);
  } catch (error) {
    console.error('Failed to create task:', error);
    alert('Failed to create task. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadTeacherSubjects();
});
</script>

<style scoped>
.create-task {
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

@media (max-width: 768px) {
  .create-task {
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
  
  .header-actions {
    position: static;
    margin-top: 15px;
    width: 100%;
    justify-content: center;
  }

  .header-btn {
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
  
  .task-form-container {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .task-form {
    gap: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
  
  .submit-btn, .cancel-btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }
  
  .file-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .file-select-btn, .clear-files-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .create-task {
    padding: 5px;
  }
  
  .header-content h1 {
    font-size: 1.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.5rem;
  }
  
  .task-form-container {
    padding: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .task-form {
    gap: 0.75rem;
  }
  
  .form-group {
    gap: 0.25rem;
  }
  
  label {
    font-size: 0.9rem;
  }
  
  input[type="text"],
  input[type="number"],
  input[type="datetime-local"],
  select,
  textarea {
    padding: 0.6rem;
    font-size: 0.9rem;
  }
  
  .students-list {
    max-height: 250px;
  }
  
  .student-item {
    padding: 0.4rem;
  }
  
  .student-info {
    font-size: 0.75rem;
  }
}

.task-form-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
 max-width: 1200px;
  margin: 0 auto;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .task-form-container {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .task-form-container {
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .task-form {
    gap: 0.75rem;
  }
  
  .form-group {
    gap: 0.25rem;
    margin-bottom: 0.3rem;
  }
}

@media (max-width: 480px) {
  .task-form {
  gap: 0.5rem;
  }
  
  .form-group {
    gap: 0.2rem;
    margin-bottom: 0.25rem;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  font-weight: 500;
  color: #333;
}

input[type="text"],
input[type="number"],
input[type="datetime-local"],
select,
textarea {
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  input[type="text"],
  input[type="number"],
  input[type="datetime-local"],
  select,
  textarea {
    padding: 0.5rem;
    font-size: 0.9rem;
    border-radius: 4px;
  }
}

@media (max-width: 480px) {
  input[type="text"],
  input[type="number"],
  input[type="datetime-local"],
  select,
  textarea {
    padding: 0.4rem;
    font-size: 0.85rem;
    border-radius: 4px;
  }
}

.file-input {
  margin-top: 8px;
}

.file-select-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-top: 8px;
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
}

.remove-file:hover {
  background-color: rgba(95, 99, 104, 0.1);
}

.student-selection {
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.search-box {
  padding: 0.75rem;
  border-bottom: 1px solid #ddd;
}

.search-box input {
  width: 100%;
}

.students-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.75rem;
}

.student-item {
  padding: 0.4rem 0.3rem;
  border-bottom: 1px solid #f0f0f0;
}

.student-item:last-child {
  border-bottom: none;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 0.2rem;
}

.student-info {
  color: #666;
  font-size: 0.875rem;
  display: block;
  margin-top: 0.1rem;
}

@media (max-width: 768px) {
  .search-box {
    padding: 0.5rem;
  }
  
  .students-list {
    padding: 0.5rem;
    max-height: 250px;
  }
  
  .student-item {
    padding: 0.3rem 0.2rem;
  }
  
  .checkbox-label {
    font-size: 0.9rem;
  }
  
  .student-info {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .search-box {
    padding: 0.4rem;
  }
  
  .students-list {
    padding: 0.4rem;
    max-height: 220px;
  }
  
  .student-item {
    padding: 0.25rem 0.15rem;
  }
  
  .checkbox-label {
    font-size: 0.85rem;
    gap: 0.3rem;
  }
  
  .student-info {
    font-size: 0.75rem;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.submit-btn,
.cancel-btn {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.3s;
}

@media (max-width: 768px) {
  .form-actions {
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .submit-btn,
  .cancel-btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .form-actions {
    gap: 0.4rem;
    margin-top: 0.4rem;
  }
  
  .submit-btn,
  .cancel-btn {
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }
}

.submit-btn {
  background: #159750;
  color: white;
  border: none;
}

.submit-btn:hover {
  background: #0f7a3d;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
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

.select-all {
  padding: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 0.4rem;
  background-color: #f5f5f5;
}

@media (max-width: 768px) {
  .select-all {
    padding: 0.4rem;
    margin-bottom: 0.3rem;
  }
}

@media (max-width: 480px) {
  .select-all {
    padding: 0.3rem;
    margin-bottom: 0.2rem;
  }
}

.file-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
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

.clear-files-btn:hover {
  background: #fecaca;
}

.selected-files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>