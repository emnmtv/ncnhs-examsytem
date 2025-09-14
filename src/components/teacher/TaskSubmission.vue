<template>
  <div class="task-visibility">
    <div class="header-container">
      <div class="header-content">
        <h1>
          Task Submissions
          <span class="material-icons">visibility</span>
        </h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Manage which students can see this task</p>
        </div>
      </div>
      <div class="header-background">ACCESS</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading student access...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadTaskVisibility" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <div v-else class="content-container">
      <div class="task-info-card">
        <div class="task-header">
          <div class="back-button-container">
            <button @click="$router.go(-1)" class="back-button">
              <span class="material-icons">arrow_back</span>
              Back
            </button>
          </div>
          <div class="task-title-section">
            <h2>{{ task?.title }}</h2>
            <div class="task-meta-badges">
              <span class="meta-badge due-date">
                <span class="material-icons">event</span>
                Due: {{ formatDate(task?.dueDate) }}
                <span class="exact-date">({{ formatExactDate(task?.dueDate) }})</span>
              </span>
              <span class="meta-badge score">
                <span class="material-icons">stars</span>
                {{ task?.totalScore }} points
              </span>
            </div>
          </div>
        </div>
        
        <p class="task-description">{{ task?.description || 'No description provided' }}</p>
        
        <div v-if="task.files && task.files.length > 0" class="task-files-list">
          <div class="files-label">Attachments:</div>
          <div class="files-buttons">
            <div v-for="file in task.files" :key="file.id" class="file-button">
              <img :src="getFileIcon(file.fileName)" :alt="getFileType(file.fileName)" class="file-icon">
              <span class="file-name">{{ file.fileName }}</span>
              <div class="button-actions">
                <span 
                  @click="openFilePreview(file)"
                   class="action-link view">
                  <span class="material-icons">visibility</span>
                </span>
                <a :href="getFullFileUrl(file.fileUrl)" 
                   download
                   class="action-link download">
                  <span class="material-icons">download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="visibility-container">
        <div class="visibility-header">
          <div class="header-left">
            <h3>Students with Access</h3>
            <div class="view-toggle">
              <button 
                @click="viewMode = 'cards'" 
                :class="['toggle-btn', { active: currentViewMode === 'cards' }]"
              >
                <span class="material-icons">grid_view</span>
                Cards
              </button>
              <button 
                @click="viewMode = 'table'" 
                :class="['toggle-btn', { active: currentViewMode === 'table' }]"
              >
                <span class="material-icons">table_view</span>
                Table
              </button>
            </div>
          </div>
          <div class="visibility-actions">
            <button @click="downloadAllSubmissions" class="action-btn download-btn">
              <span class="material-icons">download</span>
              Download All
            </button>
            <button @click="showAddStudentsModal = true" class="action-btn add-btn">
              <span class="material-icons">person_add</span>
              Add Students
            </button>
            <button 
              @click="removeSelectedStudents" 
              class="action-btn remove-btn"
              :disabled="!selectedStudents.length"
            >
              <span class="material-icons">person_remove</span>
              Remove Selected
            </button>
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="search-filter">
          <div class="search-box">
            <span class="material-icons">search</span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search students..."
            >
          </div>
          <div class="filter-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="showBySection">
              Group by Section
            </label>
            <select v-model="statusFilter" class="status-filter">
              <option value="all">All Students</option>
              <option value="submitted">Submitted</option>
              <option value="no_submission">No Submission</option>
              <option value="late">Late Submission</option>
              <option value="on_time">On-time Submission</option>
            </select>
          </div>
        </div>

        <!-- Table View -->
        <div :class="['table-container', { hidden: currentViewMode !== 'table' }]">
          <table class="students-table">
            <thead>
              <tr>
                <th class="col-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="selectedStudents.length === filteredStudents.length"
                    @change="selectedStudents = $event.target.checked ? filteredStudents.map(s => s.lrn) : []"
                  >
                </th>
                <th class="col-number">#</th>
                <th class="col-name">Name</th>
                <th class="col-lrn">LRN</th>
                <th class="col-section">Section</th>
                <th class="col-status">Status</th>
                <th class="col-submission">Submission</th>
                <th class="col-score">Score</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(student, index) in filteredStudents" :key="student.id" class="student-row">
                <td class="col-checkbox">
                  <input 
                    type="checkbox" 
                    :value="student.lrn" 
                    v-model="selectedStudents"
                  >
                </td>
                <td class="col-number">{{ index + 1 }}</td>
                <td class="col-name">
                  <div class="student-name">
                    <span class="name">{{ student.lastName }}, {{ student.firstName }}</span>
                    <span class="email">{{ student.email || 'No email' }}</span>
                  </div>
                </td>
                <td class="col-lrn">{{ student.lrn || 'N/A' }}</td>
                <td class="col-section">Grade {{ student.gradeLevel }}-{{ student.section }}</td>
                <td class="col-status">
                  <span :class="['status-badge', getSubmissionStatus(student).class]">
                    {{ getSubmissionStatus(student).text }}
                  </span>
                </td>
                <td class="col-submission">
                  <div class="submission-files">
                    <div v-if="student.submission">
                      <div class="submission-actions">
                        <button v-if="student.submission.files.length > 1" 
                                @click="openFilesModal(student.submission)"
                                class="view-files-btn">
                          <span class="material-icons">folder_open</span>
                          View {{ student.submission.files.length }} Files
                        </button>
                        
                        <button @click="openSubmissionDetails(student.submission)"
                                class="action-btn score-btn">
                          <span class="material-icons">edit</span>
                          Score
                        </button>
                      </div>
                      
                      <div v-if="student.submission.files.length === 1" class="file-item">
                        <img :src="getFileIcon(student.submission.files[0].fileName)" 
                             :alt="getFileType(student.submission.files[0].fileName)" 
                             class="file-icon">
                        <span class="file-name">{{ student.submission.files[0].fileName }}</span>
                        <div class="file-actions">
                          <button 
                            @click="openFilePreview(student.submission.files[0])"
                             class="file-btn view-file-btn">
                            <span class="material-icons">visibility</span>
                            View
                          </button>
                          <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                             download
                             class="file-btn download-file-btn">
                            <span class="material-icons">download</span>
                          </a>
                        </div>
                      </div>
                      
                      <div v-else class="no-files">
                        <span class="material-icons">info</span>
                        No files submitted
                      </div>
                    </div>
                  </div>
                </td>
                <td class="col-score">
                  <div v-if="hasSubmission(student)" class="table-score-input">
                    <input 
                      type="number" 
                      v-model="submissionScores[student.id]" 
                      :min="0" 
                      :max="task.totalScore"
                      class="score-input-field"
                    >
                    <span class="total-score">/ {{ task.totalScore }}</span>
                  </div>
                  <span v-else>-</span>
                </td>
                <td class="col-actions">
                  <div v-if="hasSubmission(student)" class="table-actions">
                    <textarea 
                      v-model="submissionComments[student.id]" 
                      placeholder="Add a comment..."
                      class="comment-input-field"
                    ></textarea>
                    <button 
                      @click="submitScore(student)" 
                      class="table-score-btn"
                    >
                      <span class="material-icons">save</span>
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards View -->
        <div :class="['cards-view', { active: currentViewMode === 'cards' }]">
          <div v-if="showBySection" class="sections-container">
            <div v-for="(students, section) in groupedStudents" :key="section" class="section-group">
              <div class="section-header">
                <h4>{{ section }}</h4>
                <span class="student-count">{{ students.length }} students</span>
              </div>
              <div class="students-grid">
                <div v-for="student in students" :key="student.id" class="student-card">
                  <div class="card-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :value="student.lrn" 
                        v-model="selectedStudents"
                      >
                      <span class="student-name">
                        {{ student.lastName }}, {{ student.firstName }}
                      </span>
                    </label>
                    <span :class="['status-badge', getSubmissionStatus(student).class]">
                      {{ getSubmissionStatus(student).text }}
                    </span>
                  </div>
                  <div class="card-body">
                    <div class="student-info">
                      <p><strong>LRN:</strong> {{ student.lrn }}</p>
                      <p><strong>Section:</strong> Grade {{ student.gradeLevel }}-{{ student.section }}</p>
                      <p v-if="hasSubmission(student)">
                        <strong>Submitted:</strong> {{ formatSubmissionDate(getStudentSubmission(student)) }}
                      </p>
                      <p v-if="hasSubmission(student)">
                        <strong>Score:</strong> {{ getStudentScore(student) }}
                      </p>
                      <div class="submission-files">
                        <div v-if="student.submission">
                          <div class="submission-actions">
                            <button v-if="student.submission.files.length > 1" 
                                    @click="openFilesModal(student.submission)"
                                    class="view-files-btn">
                              <span class="material-icons">folder_open</span>
                              View {{ student.submission.files.length }} Files
                            </button>
                            
                            <button @click="openSubmissionDetails(student.submission)"
                                    class="action-btn score-btn">
                              <span class="material-icons">edit</span>
                              Score
                            </button>
                          </div>
                          
                          <div v-if="student.submission.files.length === 1" class="file-item">
                            <img :src="getFileIcon(student.submission.files[0].fileName)" 
                                 :alt="getFileType(student.submission.files[0].fileName)" 
                                 class="file-icon">
                            <span class="file-name">{{ student.submission.files[0].fileName }}</span>
                            <div class="file-actions">
                              <button 
                                @click="openFilePreview(student.submission.files[0])"
                                 class="file-btn view-file-btn">
                                <span class="material-icons">visibility</span>
                                View
                              </button>
                              <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                                 download
                                 class="file-btn download-file-btn">
                                <span class="material-icons">download</span>
                              </a>
                            </div>
                          </div>
                          
                          <div v-else class="no-files">
                            <span class="material-icons">info</span>
                            No files submitted
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="card-actions">
                      <!-- Remove this button -->
                      <!-- <button 
                        v-if="hasSubmission(student)"
                        @click="viewSubmission(student)" 
                        class="action-btn view-btn"
                      >
                        <span class="material-icons">assignment</span>
                        View Submission
                      </button> -->
                    </div>
                    <div v-if="hasSubmission(student)" class="scoring-section">
                      <div class="score-input">
                        <label>Score:</label>
                        <input 
                          type="number" 
                          v-model="submissionScores[student.id]" 
                          :min="0" 
                          :max="task.totalScore"
                        >
                        <span class="total-score">/ {{ task.totalScore }}</span>
                      </div>
                      <div class="comment-input">
                        <label>Comment:</label>
                        <textarea 
                          v-model="submissionComments[student.id]" 
                          rows="2"
                          placeholder="Add a comment..."
                        ></textarea>
                      </div>
                      <button 
                        @click="submitScore(student)" 
                        class="score-btn"
                      >
                        <span class="material-icons">save</span>
                        Save Score
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Flat Cards Grid -->
          <div v-else class="students-grid">
            <div v-for="student in filteredStudents" :key="student.id" class="student-card">
              <div class="card-header">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :value="student.lrn" 
                    v-model="selectedStudents"
                  >
                  <span class="student-name">
                    {{ student.lastName }}, {{ student.firstName }}
                  </span>
                </label>
                <span :class="['status-badge', getSubmissionStatus(student).class]">
                  {{ getSubmissionStatus(student).text }}
                </span>
              </div>
              <div class="card-body">
                <div class="student-info">
                  <p><strong>LRN:</strong> {{ student.lrn }}</p>
                  <p><strong>Section:</strong> Grade {{ student.gradeLevel }}-{{ student.section }}</p>
                  <p v-if="hasSubmission(student)">
                    <strong>Submitted:</strong> {{ formatSubmissionDate(getStudentSubmission(student)) }}
                  </p>
                  <p v-if="hasSubmission(student)">
                    <strong>Score:</strong> {{ getStudentScore(student) }}
                  </p>
                  <div class="submission-files">
                    <div v-if="student.submission">
                      <div class="submission-actions">
                        <button v-if="student.submission.files.length > 1" 
                                @click="openFilesModal(student.submission)"
                                class="view-files-btn">
                          <span class="material-icons">folder_open</span>
                          View {{ student.submission.files.length }} Files
                        </button>
                        
                        <button @click="openSubmissionDetails(student.submission)"
                                class="action-btn score-btn">
                          <span class="material-icons">edit</span>
                          Score
                        </button>
                      </div>
                      
                      <div v-if="student.submission.files.length === 1" class="file-item">
                        <img :src="getFileIcon(student.submission.files[0].fileName)" 
                             :alt="getFileType(student.submission.files[0].fileName)" 
                             class="file-icon">
                        <span class="file-name">{{ student.submission.files[0].fileName }}</span>
                        <div class="file-actions">
                          <button 
                            @click="openFilePreview(student.submission.files[0])"
                             class="file-btn view-file-btn">
                            <span class="material-icons">visibility</span>
                            View
                          </button>
                          <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                             download
                             class="file-btn download-file-btn">
                            <span class="material-icons">download</span>
                          </a>
                        </div>
                      </div>
                      
                      <div v-else class="no-files">
                        <span class="material-icons">info</span>
                        No files submitted
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-actions">
                  <!-- Remove this button -->
                  <!-- <button 
                    v-if="hasSubmission(student)"
                    @click="viewSubmission(student)" 
                    class="action-btn view-btn"
                  >
                    <span class="material-icons">assignment</span>
                    View Submission
                  </button> -->
                </div>
                <div v-if="hasSubmission(student)" class="scoring-section">
                  <div class="score-input">
                    <label>Score:</label>
                    <input 
                      type="number" 
                      v-model="submissionScores[student.id]" 
                      :min="0" 
                      :max="task.totalScore"
                    >
                    <span class="total-score">/ {{ task.totalScore }}</span>
                  </div>
                  <div class="comment-input">
                    <label>Comment:</label>
                    <textarea 
                      v-model="submissionComments[student.id]" 
                      rows="2"
                      placeholder="Add a comment..."
                    ></textarea>
                  </div>
                  <button 
                    @click="submitScore(student)" 
                    class="score-btn"
                  >
                    <span class="material-icons">save</span>
                    Save Score
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Students Modal -->
    <div v-if="showAddStudentsModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Add Students to Task</h3>
          <button @click="showAddStudentsModal = false" class="close-btn">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loadingAvailableStudents" class="loading-state">
            <span class="material-icons-round rotating">sync</span>
            <p>Loading students...</p>
          </div>
          <div v-else-if="!availableStudents.length" class="empty-state">
            <span class="material-icons">school</span>
            <p>No additional students available</p>
          </div>
          <div v-else>
            <div class="search-box modal-search">
              <span class="material-icons">search</span>
              <input 
                type="text" 
                v-model="modalSearchQuery" 
                placeholder="Search students..."
              >
            </div>
            <div class="select-all">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  :checked="selectedAvailableStudents.length === availableStudents.length" 
                  @change="toggleSelectAllAvailable"
                >
                <strong>Select All Available Students</strong>
              </label>
            </div>
            <div class="students-list modal-students-list">
              <div v-for="student in filteredAvailableStudents" :key="student.id" class="student-item">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :value="student.id" 
                    v-model="selectedAvailableStudents"
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
        <div class="modal-footer">
          <button @click="showAddStudentsModal = false" class="cancel-btn">
            Cancel
          </button>
          <button 
            @click="addSelectedStudents" 
            class="submit-btn"
            :disabled="!selectedAvailableStudents.length"
          >
            <span class="material-icons">person_add</span>
            Add {{ selectedAvailableStudents.length }} Students
          </button>
        </div>
      </div>
    </div>

    <!-- Add this modal for viewing multiple files -->
    <div v-if="showFilesModal" class="files-modal" @click="closeFilesModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Student Submission</h3>
          <button class="close-btn" @click="closeFilesModal">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="student-info-panel">
            <div class="student-avatar">
              <span class="avatar-text">{{ getInitials(selectedSubmission?.student) }}</span>
            </div>
            <div class="student-details">
              <h4>{{ selectedSubmission?.student?.lastName || '' }}, {{ selectedSubmission?.student?.firstName || '' }}</h4>
              <div class="student-meta">
                <div class="meta-item">
                  <span class="material-icons">badge</span>
                  <span>LRN: {{ selectedSubmission?.student?.lrn || 'N/A' }}</span>
                </div>
                <div class="meta-item">
                  <span class="material-icons">school</span>
                  <span>Grade {{ selectedSubmission?.student?.gradeLevel || 'N/A' }}-{{ selectedSubmission?.student?.section || 'N/A' }}</span>
                </div>
                <div class="meta-item">
                  <span class="material-icons">event</span>
                  <span>Submitted: {{ formatSubmissionDate(selectedSubmission) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="files-header">
            <h4>Submitted Files ({{ selectedSubmission?.files?.length || 0 }})</h4>
            <button 
              @click="downloadStudentSubmission()"
              class="download-all-btn"
              v-if="selectedSubmission?.files?.length > 0">
              <span class="material-icons">download</span>
              Download All Files
            </button>
          </div>
          
          <div v-if="selectedSubmission.files && selectedSubmission.files.length > 0" class="files-grid">
            <div v-for="file in selectedSubmission.files" 
                 :key="file.id" 
                 class="file-card">
              <div class="file-card-content">
              <img :src="getFileIcon(file.fileName)" :alt="getFileType(file.fileName)" class="file-icon">
                <span class="file-name" :title="file.fileName">{{ file.fileName }}</span>
              </div>
              <div class="file-actions">
                <button 
                  @click="openFilePreview(file)"
                  class="file-btn view-file-btn">
                  <span class="material-icons">visibility</span>
                  View
                </button>
                <a :href="getFullFileUrl(file.fileUrl)" 
                   download
                   class="file-btn download-file-btn">
                  <span class="material-icons">download</span>
                  Download
                </a>
              </div>
            </div>
          </div>
          <div v-else class="no-files-message">
            <span class="material-icons">description_off</span>
            <p>No files available</p>
          </div>
          
          <div class="scoring-section">
            <h4>Scoring</h4>
            <div class="score-form">
              <div class="score-input-group">
                <label for="modal-score">Score:</label>
                <div class="score-input-wrapper">
                  <input 
                    type="number" 
                    id="modal-score"
                    v-model="submissionScores[selectedSubmission?.student?.id]" 
                    :min="0" 
                    :max="task.totalScore"
                    class="score-input-field"
                  >
                  <span class="total-score">/ {{ task.totalScore }}</span>
                </div>
              </div>
              <div class="comment-input-group">
                <label for="modal-comment">Comment:</label>
                <textarea 
                  id="modal-comment"
                  v-model="submissionComments[selectedSubmission?.student?.id]" 
                  placeholder="Add feedback for the student..."
                  class="comment-input-field"
                  rows="3"
                ></textarea>
              </div>
              <button 
                @click="submitScoreFromModal()" 
                class="save-score-btn"
              >
                <span class="material-icons">save</span>
                Save Score
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File preview modal -->
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  getTaskVisibility, 
  getSubjectTasks, 
  getStudentsBySection,
  addTaskVisibility,
  removeTaskVisibility,
  getTaskSubmissions,
  scoreSubmission,
  getBaseApiUrl,
  getSectionsBySubject,
  downloadAllTaskSubmissions,
  downloadSubmissionFiles,
  getSubjectDirectStudents
} from '@/services/authService';
import { formatDistanceToNow } from 'date-fns';
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
import defaultIcon from '@/assets/FileIcons/doc.png';
import powerpointIcon from '@/assets/FileIcons/pptx.png';

const route = useRoute();
const router = useRouter();

const subjectId = parseInt(route.params.subjectId);
const taskId = parseInt(route.params.taskId);
const task = ref(null);
const visibleStudents = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const selectedStudents = ref([]);
const showBySection = ref(false);

// Modal state
const showAddStudentsModal = ref(false);
const availableStudents = ref([]);
const loadingAvailableStudents = ref(false);
const selectedAvailableStudents = ref([]);
const modalSearchQuery = ref('');
const isSubmitting = ref(false);

const viewMode = ref('table');

// Reactive window width for responsive design
const windowWidth = ref(window.innerWidth);

// Computed property to handle responsive view mode
const currentViewMode = computed(() => {
  // On mobile (768px and below), force cards view
  if (windowWidth.value <= 768) {
    console.log('Mobile view: forcing cards mode');
    return 'cards';
  }
  // On desktop, use the selected view mode
  console.log('Desktop view: using', viewMode.value);
  return viewMode.value;
});
const statusFilter = ref('all');
const submissionScores = ref({});
const submissionComments = ref({});

// Add these new refs for the modal
const showFilesModal = ref(false);
const selectedSubmission = ref({
  student: {
    firstName: '',
    lastName: '',
    lrn: '',
    gradeLevel: '',
    section: ''
  },
  files: [],
  submittedAt: null,
  id: null
});

// Add these new refs for file preview
const showFilePreview = ref(false);
const previewFile = ref({});

// Filter visible students based on search
const filteredStudents = computed(() => {
  let students = visibleStudents.value;
  
  // Apply search filter
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    students = students.filter(student => 
      student.firstName.toLowerCase().includes(search) || 
      student.lastName.toLowerCase().includes(search) || 
      (student.lrn && student.lrn.toString().includes(search))
    );
  }
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    students = students.filter(student => {
      const status = getSubmissionStatus(student);
      switch (statusFilter.value) {
        case 'submitted':
          return hasSubmission(student);
        case 'no_submission':
          return !hasSubmission(student);
        case 'late':
          return status.class === 'late';
        case 'on_time':
          return status.class === 'submitted';
        case 'scored':
          return hasSubmission(student) && getStudentSubmission(student).score !== null;
        case 'unscored':
          return hasSubmission(student) && getStudentSubmission(student).score === null;
        default:
          return true;
      }
    });
  }
  
  return students;
});

// Group students by section
const groupedStudents = computed(() => {
  const groups = {};
  
  visibleStudents.value.forEach(student => {
    const sectionKey = `Grade ${student.gradeLevel}-${student.section}`;
    if (!groups[sectionKey]) {
      groups[sectionKey] = [];
    }
    groups[sectionKey].push(student);
  });
  
  return groups;
});

// Filter available students based on search
const filteredAvailableStudents = computed(() => {
  if (!modalSearchQuery.value) return availableStudents.value;
  
  const search = modalSearchQuery.value.toLowerCase();
  return availableStudents.value.filter(student => 
    student.firstName.toLowerCase().includes(search) || 
    student.lastName.toLowerCase().includes(search) || 
    (student.lrn && student.lrn.toString().includes(search))
  );
});

// Format date for display
const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Add this function to format the exact date and time
const formatExactDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Toggle select all available students
const toggleSelectAllAvailable = (event) => {
  if (event.target.checked) {
    selectedAvailableStudents.value = availableStudents.value.map(s => s.id);
  } else {
    selectedAvailableStudents.value = [];
  }
};

// Load task visibility data
const loadTaskVisibility = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Get task details
    const taskData = await getSubjectTasks(subjectId);
    task.value = taskData.tasks.find(t => t.id === taskId);
    
    if (!task.value) {
      error.value = 'Task not found';
      return;
    }
    
    // Get visibility data
    const visibility = await getTaskVisibility(taskId);
    visibleStudents.value = visibility.map(v => v.student);
  } catch (err) {
    error.value = 'Failed to load task visibility. Please try again.';
    console.error('Error loading task visibility:', err);
  } finally {
    loading.value = false;
  }
};

// Load available students (not already in visibility)
const loadAvailableStudents = async () => {
  try {
    loadingAvailableStudents.value = true;
    
    // Get all students from the subject's sections and direct assignments
    const allStudents = [];
    
    // Get sections for this subject
    const sectionsData = await getSectionsBySubject(subjectId);
    const sections = sectionsData.sections || [];
    
    console.log('Subject sections:', sections);
    
    // Get students from each section
    for (const section of sections) {
      try {
        const sectionStudents = await getStudentsBySection(section.grade, section.section);
        allStudents.push(...sectionStudents);
      } catch (err) {
        console.error(`Error loading students for section ${section.grade}-${section.section}:`, err);
      }
    }
    
    console.log('Students from sections:', allStudents.length);
    
    // Get directly assigned students
    try {
      const directStudentsResponse = await getSubjectDirectStudents(subjectId);
      console.log('Direct students response:', directStudentsResponse);
      
      if (directStudentsResponse && directStudentsResponse.data) {
        // Extract student data from response
        const directStudents = directStudentsResponse.data.map(item => item.student);
        console.log(`Found ${directStudents.length} directly assigned students`);
        console.log('Direct students data:', directStudents);
        
        // Add direct students to all students array (avoiding duplicates by ID)
        const existingIds = new Set(allStudents.map(s => s.id));
        for (const student of directStudents) {
          if (!existingIds.has(student.id)) {
            allStudents.push(student);
            existingIds.add(student.id);
          }
        }
      }
    } catch (err) {
      console.error('Error loading direct students:', err);
    }
    
    console.log('Total students (sections + direct):', allStudents.length);
    console.log('Visible students:', visibleStudents.value.length);
    console.log('Visible student IDs:', visibleStudents.value.map(s => s.id));
    
    // Filter out students who already have visibility (using IDs instead of LRNs)
    const visibleIds = visibleStudents.value.map(s => s.id);
    availableStudents.value = allStudents.filter(s => !visibleIds.includes(s.id));
    
    console.log('Available students after filtering:', availableStudents.value.length);
    console.log('Available student names:', availableStudents.value.map(s => `${s.firstName} ${s.lastName}`));
    
  } catch (err) {
    console.error('Error loading available students:', err);
  } finally {
    loadingAvailableStudents.value = false;
  }
};

// Add selected students to task visibility
const addSelectedStudents = async () => {
  if (!selectedAvailableStudents.value.length) return;
  
  try {
    isSubmitting.value = true;
    await addTaskVisibility(taskId, selectedAvailableStudents.value);
    
    // Refresh the list and close modal
    await loadTaskData();
    showAddStudentsModal.value = false;
    selectedAvailableStudents.value = [];
  } catch (err) {
    console.error('Error adding students:', err);
    alert('Failed to add students. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

// Remove selected students from visibility
const removeSelectedStudents = async () => {
  if (!selectedStudents.value.length) return;
  
  try {
    isSubmitting.value = true;
    await removeTaskVisibility(taskId, selectedStudents.value);
    
    // Refresh the list
    await loadTaskVisibility();
    selectedStudents.value = [];
  } catch (err) {
    console.error('Error removing students:', err);
    alert('Failed to remove students. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

// Watch for modal open to load available students
watch(showAddStudentsModal, (isOpen) => {
  if (isOpen) {
    loadAvailableStudents();
  }
});

// Get submission status for a student
const getSubmissionStatus = (student) => {
  const submission = getStudentSubmission(student);
  if (!submission) {
    return { text: 'No Submission', class: 'no-submission' };
  }
  
  const submittedDate = new Date(submission.submittedAt);
  const dueDate = new Date(task.value.dueDate);
  
  if (submittedDate > dueDate) {
    return { text: 'Late', class: 'late' };
  }
  
  if (submission.score !== null) {
    return { text: 'Scored', class: 'scored' };
  }
  
  return { text: 'Submitted', class: 'submitted' };
};

// Get student's submission
const getStudentSubmission = (student) => {
  return student.submission;
};

// Check if student has submitted
const hasSubmission = (student) => {
  return !!student.submission;
};

// Get student's score
const getStudentScore = (student) => {
  const submission = getStudentSubmission(student);
  if (!submission?.score) return 'Not Scored';
  return `${submission.score}/${task.value.totalScore}`;
};

// Format submission date
const formatSubmissionDate = (submission) => {
  if (!submission || !submission.submittedAt) return 'No Submission';
  return new Date(submission.submittedAt).toLocaleString();
};

// Load task data and submissions
const loadTaskData = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Get task details
    const taskData = await getSubjectTasks(subjectId);
    task.value = taskData.tasks.find(t => t.id === taskId);

    if (!task.value) {
      error.value = 'Task not found';
      return;
    }

    // Get submissions
    const submissionsData = await getTaskSubmissions(taskId);
    const submissions = submissionsData.submissions || [];
    
    console.log('Submissions loaded:', submissions); // Debug log
    
    // Initialize scores and comments from existing submissions
    submissions.forEach(sub => {
      if (sub.score !== null) {
        submissionScores.value[sub.studentId] = sub.score;
      }
      if (sub.comment) {
        submissionComments.value[sub.studentId] = sub.comment;
      }
    });

    // Get task visibility if needed
    const visibility = await getTaskVisibility(taskId);
    
    // Map students with their submissions
    visibleStudents.value = visibility.map(v => {
      const studentSubmission = submissions.find(s => s.studentId === v.student.id);
      return {
        ...v.student,
        submission: studentSubmission
      };
    });

    console.log('Visible students with submissions:', visibleStudents.value); // Debug log

  } catch (err) {
    error.value = 'Failed to load task data. Please try again.';
    console.error('Error loading task data:', err);
  } finally {
    loading.value = false;
  }
};

// Helper functions
const getFullFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  const cleanUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
  return `${getBaseApiUrl()}/${cleanUrl}`;
};

// Submit score function
const submitScore = async (student) => {
  try {
    console.log('Submitting score for student:', student.id); // Debug log
    
    const submission = student.submission;
    if (!submission) {
      console.error('No submission found for student:', student.id);
      alert('No submission found for this student');
      return;
    }

    const score = submissionScores.value[student.id];
    const comment = submissionComments.value[student.id] || '';

    console.log('Score data:', { submissionId: submission.id, score, comment }); // Debug log

    await scoreSubmission(submission.id, { score, comment });

    // Update the local submission data
    submission.score = score;
    submission.comment = comment;

    alert('Score saved successfully');
  } catch (error) {
    console.error('Error saving score:', error);
    alert('Failed to save score. Please try again.');
  }
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
    default:
      return 'File';
  }
};

// Add these new functions for the modal
const openFilesModal = (submission) => {
  console.log("Opening modal with submission:", submission); // Debug log
  
  // Find the student associated with this submission
  const student = visibleStudents.value.find(s => s.submission && s.submission.id === submission.id);
  
  selectedSubmission.value = {
    ...submission,
    student: student || {
      firstName: 'Unknown',
      lastName: 'Student',
      lrn: 'N/A',
      gradeLevel: 'N/A',
      section: 'N/A'
    }
  };
  
  showFilesModal.value = true;
};

const openSubmissionDetails = (submission) => {
  // Find the student associated with this submission
  const student = visibleStudents.value.find(s => s.submission && s.submission.id === submission.id);
  const studentIndex = visibleStudents.value.findIndex(s => s.id === student.id);
  
  // Navigate to the submission details page
  router.push({
    name: 'TaskSubmissionDetails',
    params: {
      taskId: taskId,
      subjectId: subjectId
    },
    query: {
      studentIndex: studentIndex
    }
  });
};

const closeFilesModal = () => {
  showFilesModal.value = false;
  // Reset selectedSubmission to default state instead of null
  selectedSubmission.value = {
    student: {
      firstName: '',
      lastName: '',
      lrn: '',
      gradeLevel: '',
      section: ''
    },
    files: [],
    submittedAt: null,
    id: null
  };
};

// Get student initials for avatar
const getInitials = (student) => {
  if (!student || !student.firstName || !student.lastName) return 'ST';
  return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
};

// Submit score from the modal
const submitScoreFromModal = () => {
  if (!selectedSubmission.value || !selectedSubmission.value.student) return;
  
  const student = {
    id: selectedSubmission.value.student.id,
    submission: selectedSubmission.value
  };
  
  submitScore(student);
  // Don't close the modal to allow for multiple score updates
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

onMounted(() => {
  loadTaskData();
  
  // Add window resize listener for responsive view
  const handleResize = () => {
    windowWidth.value = window.innerWidth;
  };
  
  window.addEventListener('resize', handleResize);
  
  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
});

// Add this new function
const downloadAllSubmissions = async () => {
  try {
    // Check if there are any students with submissions
    const studentsWithSubmissions = visibleStudents.value.filter(student => 
      student.submission && student.submission.files && student.submission.files.length > 0
    );
    
    if (studentsWithSubmissions.length === 0) {
      alert('No submissions available to download.');
      return;
    }
    
    // Show loading indicator
    loading.value = true;
    
    // Use the backend endpoint to download all submissions for this task
    const blob = await downloadAllTaskSubmissions(taskId);
    
    // Use FileSaver to save the zip file
    const FileSaver = (await import('file-saver')).default;
    const taskName = task.value.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    FileSaver.saveAs(blob, `${taskName}_all_submissions.zip`);
    
  } catch (err) {
    console.error('Error downloading all submissions:', err);
    alert('Failed to download submissions. Please try again.');
  } finally {
    loading.value = false;
  }
};

// Add function to download student submission files
const downloadStudentSubmission = async () => {
  if (!selectedSubmission.value || !selectedSubmission.value.id) return;
  
  try {
    // Show loading indicator
    loading.value = true;
    
    // Use the backend endpoint to download submission files
    const blob = await downloadSubmissionFiles(selectedSubmission.value.id);
    
    // Use FileSaver to save the zip file
    const FileSaver = (await import('file-saver')).default;
    const studentName = `${selectedSubmission.value.student.lastName}_${selectedSubmission.value.student.firstName}`;
    const fileName = `${studentName}_submission.zip`.toLowerCase().replace(/[^a-z0-9_.]/g, '_');
    FileSaver.saveAs(blob, fileName);
    
  } catch (err) {
    console.error('Error downloading submission files:', err);
    alert('Failed to download submission files. Please try again.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.task-visibility {
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

/* Task Info Card with gradient */
.task-info-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  transition: all 0.3s;
  margin-bottom: 2rem;
}

.task-header {
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  padding: 25px;
  position: relative;
  overflow: hidden;
}

.back-button-container {
  margin-bottom: 15px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.back-button .material-icons {
  font-size: 18px;
}

/* Main paint swipe */
.task-header::after {
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

/* Secondary paint swipe */
.task-header::before {
  content: '';
  position: absolute;
  top: -20%;
  right: 20%;
  width: 30%;
  height: 200%;
  background: linear-gradient(45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.02) 30%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 70%,
    transparent 100%
  );
  transform: skewX(-35deg);
  pointer-events: none;
}

.task-title-section {
  position: relative;
  z-index: 1;
}

.task-title-section h2 {
  color: white;
  margin: 0 0 15px 0;
  font-size: 1.5rem;
}

.task-meta-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.task-description {
  padding: 25px;
  color: #555;
  line-height: 1.6;
  border-bottom: 1px solid #eee;
  margin: 0;
}

/* Updated card styles */
.card-header {
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  background: white;
  border-radius: 6px;
  padding: 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #159750;
  color: white;
}

/* File buttons and actions */
.task-files-list {
  padding: 0 25px 25px 25px;
}

.files-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.file-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 12px 15px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
  max-width: 300px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.file-button:hover {
  background: #f1f3f4;
  border-color: #dadce0;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
}

/* Actions buttons with consistent colors */
.visibility-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.add-btn {
  background: #159750;
  color: white;
  box-shadow: 0 2px 5px rgba(21, 151, 80, 0.2);
}

.add-btn:hover {
  background: #107040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(21, 151, 80, 0.3);
}

.remove-btn {
  background: #f44336;
  color: white;
  box-shadow: 0 2px 5px rgba(244, 67, 54, 0.2);
}

.remove-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
}

/* Updated search and filter styles */
.search-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  gap: 1rem;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  outline: none;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-filter {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.students-table th:first-child {
  border-top-left-radius: 12px;
}

.students-table th:last-child {
  border-top-right-radius: 12px;
}

.students-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.student-row:hover {
  background: #f8f9fa;
}

/* Column Styles */
.col-checkbox {
  width: 50px;
  text-align: center;
}

.col-number {
  width: 60px;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.col-name {
  min-width: 200px;
}

.student-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name .name {
  font-weight: 600;
  color: #333;
}

.student-name .email {
  font-size: 0.85rem;
  color: #666;
}

.col-lrn {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.col-section {
  text-align: center;
  font-weight: 500;
}

.col-status {
  text-align: center;
}

.col-submission {
  min-width: 200px;
}

.col-score {
  text-align: center;
  min-width: 120px;
}

.col-actions {
  min-width: 200px;
}

/* Style the table checkboxes */
th input[type="checkbox"],
td input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.7);
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

td input[type="checkbox"] {
  border-color: #ddd;
}

/* Table score input styles */
.table-score-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input-field {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
}

.table-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.comment-input-field {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  width: 150px;
  resize: vertical;
  min-height: 32px;
}

.table-score-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
}

.table-score-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Card header styles */
.card-header {
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Main paint swipe */
.card-header::after {
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

/* Secondary paint swipe */
.card-header::before {
  content: '';
  position: absolute;
  top: -20%;
  right: 20%;
  width: 30%;
  height: 200%;
  background: linear-gradient(45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.02) 30%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 70%,
    transparent 100%
  );
  transform: skewX(-35deg);
  pointer-events: none;
}

.checkbox-label {
  position: relative;
  z-index: 1;
  color: white;
}

.student-name {
  font-weight: 500;
  margin-left: 8px;
}

.status-badge {
  position: relative;
  z-index: 1;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
}

/* Add back grid layout */
.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.student-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  transition: all 0.3s;
}

.student-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}

.visibility-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.toggle-btn.active {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #1565c0;
}

.status-filter {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.submitted {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.late {
  background: #fff3e0;
  color: #ef6c00;
}

.status-badge.no-submission {
  background: #ffebee;
  color: #c62828;
}

.status-badge.scored {
  background: #e3f2fd;
  color: #1565c0;
}

.visibility-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.add-btn {
  background: #e8f5e9;
  color: #2e7d32;
}

.remove-btn {
  background: #ffebee;
  color: #c62828;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  outline: none;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.sections-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-group {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h4 {
  margin: 0;
  font-size: 1rem;
}

.student-count {
  font-size: 0.75rem;
  color: #666;
  background: #e0e0e0;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.students-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.student-item {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.student-item:last-child {
  border-bottom: none;
}

.student-info {
  color: #666;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.select-all {
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-search {
  margin-bottom: 1rem;
}

.modal-students-list {
  max-height: 300px;
}

.submit-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn {
  background: #159750;
  color: white;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* States */
.loading-state,
.empty-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-state .material-icons-round,
.empty-state .material-icons,
.error-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9e9e9e;
}

.error-state .material-icons-round {
  color: #f44336;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

@media (max-width: 768px) {
  .task-visibility {
    padding: 10px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 3rem;
    top: 60%;
    right: 1rem;
  }
  
  .visibility-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-left {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .visibility-actions {
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .action-btn .material-icons {
    font-size: 16px;
  }
  
  .search-filter {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-options {
    width: 100%;
    flex-direction: row;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .status-filter {
    flex: 1;
    min-width: 140px;
  }
  
  .students-grid {
    grid-template-columns: 1fr;
  }
  
  /* Improve card internal responsiveness */
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 15px;
  }
  
  .card-header .checkbox-label {
  width: 100%;
  }
  
  .card-header .status-badge {
    align-self: flex-start;
  }
  
  .card-body {
    padding: 15px;
  }
  
  .student-info p {
    flex-wrap: wrap;
  }
  
  .student-info p strong {
    min-width: auto;
    margin-right: 8px;
  }
  
  .scoring-section {
    padding: 15px;
  }
  
  .score-input {
    flex-wrap: wrap;
  }
  
  .comment-input textarea {
    min-height: 60px;
  }
  
  .submission-files {
    margin-top: 10px;
  }
  
  .file-item {
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .file-actions {
    width: 100%;
    justify-content: flex-start;
    margin-top: 5px;
    display: flex;
    flex-direction: row;
  }
  
  .file-btn, .action-link {
    flex: 1;
    padding: 6px 8px;
    font-size: 0.75rem;
    display: flex;
    justify-content: center;
  }
  
  .file-btn .material-icons, .action-link .material-icons {
    font-size: 16px;
    margin-right: 2px;
  }
  
  /* Table view responsiveness improvements */
  .students-table {
    overflow-x: auto;
  }
  
  /* Section grouping responsiveness */
  .section-group {
    margin-bottom: 15px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  gap: 8px;
    padding: 12px;
  }
  
  .student-count {
    align-self: flex-start;
  }
  
  .task-meta-badges {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .file-button {
    max-width: none;
    width: 100%;
  }
  
  /* Modal adjustments for mobile */
  .modal-container,
  .preview-content {
    width: 95%;
    max-height: 80vh;
  }
  
  .preview-body {
    padding: 10px;
  }
  
  .preview-image,
  .preview-video {
    max-height: 60vh;
  }
  
  .student-info-panel {
    flex-direction: column;
  }
  
  .student-meta {
    flex-direction: column;
  gap: 8px;
  }
  
  .files-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .view-files-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
    max-width: none;
  }
  
  .view-files-btn .material-icons {
    font-size: 16px;
  }
  
  /* Improve file card styling in modal */
  .file-card {
    padding: 10px;
  }
  
  .file-card .file-icon {
    width: 30px;
    height: 30px;
  }
  
  .file-card .file-actions {
    flex-direction: row;
    gap: 5px;
  }
  
  .file-card .file-btn {
    flex: 1;
    padding: 5px;
    font-size: 0.75rem;
  }
  
  .file-card .file-btn .material-icons {
    font-size: 14px;
  }
  
  /* Force cards view on mobile */
  .table-container {
    display: none;
  }
  
  .cards-view {
    display: block;
  }
  
  .view-toggle {
    display: none; /* Hide toggle on mobile since we force cards */
  }
}

/* Desktop - Show view toggle */
@media (min-width: 769px) {
  .view-toggle {
    display: flex;
  }
}

/* View mode visibility - controlled by JavaScript */
.table-container {
  display: block;
}

.cards-view {
  display: none;
}

/* When cards mode is active */
.cards-view.active {
  display: block;
}

.table-container.hidden {
  display: none;
}

/* Extra small devices */
@media (max-width: 480px) {
  .task-visibility {
    padding: 5px;
  }
  
  .header-content h1 {
    font-size: 1.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.5rem;
  }
  
  .divider {
    margin: 0.75rem 0;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .card-body {
    padding: 10px;
  }
  
  .student-info p {
    font-size: 0.9rem;
    margin: 5px 0;
  }
  
  .action-btn {
    padding: 6px 10px;
    font-size: 0.75rem;
    min-width: 100px;
  }
  
  .action-btn .material-icons {
    font-size: 14px;
  }
  
  .scoring-section {
    padding: 10px;
  }
  
  .score-input label,
  .comment-input label {
    font-size: 0.9rem;
  }
  
  .score-input input {
    width: 60px;
    padding: 6px;
  }
  
  .score-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .preview-content {
    width: 98%;
  }
  
  .preview-header {
    padding: 12px 16px;
  }
  
  .preview-header h3 {
    font-size: 1rem;
  }
  
  .close-btn {
    width: 28px;
    height: 28px;
  }
  
  .large-file-icon {
    width: 60px;
    height: 60px;
  }
  
  .download-file-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
  
  .files-grid {
    grid-template-columns: 1fr;
  }
  
  .visibility-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .visibility-actions .action-btn {
    flex-basis: calc(50% - 0.25rem);
    min-width: 0;
  }
  
  .file-btn, .action-link {
    padding: 5px;
    font-size: 0.7rem;
  }
  
  .file-btn .material-icons, .action-link .material-icons {
    font-size: 14px;
    margin-right: 0;
  }
}

/* Improvements for student card layout */
.card-body {
  padding: 20px;
}

.student-info {
  margin-bottom: 15px;
}

.student-info p {
  margin: 10px 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.submission-files {
  margin-top: 15px;
}

.file-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.file-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.scoring-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
  margin-top: 15px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05) inset;
}

.score-input {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.score-input input {
  width: 80px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05) inset;
}

.comment-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 15px;
  font-family: inherit;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05) inset;
}

.score-btn {
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  width: 100%;
  box-shadow: 0 2px 5px rgba(21, 151, 80, 0.2);
}

.score-btn:hover {
  background: #107040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(21, 151, 80, 0.3);
}

/* Add these styles */
.file-preview {
  flex: 1;
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
  object-fit: contain;
}

.file-name {
  flex: 1;
  color: #202124;
  font-size: 14px;
}

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

/* Update existing styles */
.submission-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 15px;
}

.task-header {
  margin-bottom: 1.5rem;
}

.task-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-meta-badges {
  display: flex;
  gap: 1rem;
}

.meta-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.meta-badge.due-date {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.meta-badge.score {
  background: #e3f2fd;
  color: #1565c0;
}

.task-files-list {
  margin-top: 1rem;
}

.files-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
  padding-left: 1rem;
}

.files-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
}

.file-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-size: 0.875rem;
  max-width: 300px;
  transition: all 0.2s;
}

.file-button:hover {
  background: #f1f3f4;
  border-color: #dadce0;
}

.file-button .file-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.file-button .file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.button-actions {
  display: flex;
  gap: 0.25rem;
}

.action-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  color: #5f6368;
  text-decoration: none;
  transition: all 0.2s;
}

.action-link:hover {
  background: rgba(0, 0, 0, 0.1);
}

.action-link.view {
  color: #1a73e8;
}

.action-link.download {
  color: #1976D2;
}

.action-link .material-icons {
  font-size: 18px;
}

.exact-date {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: 0.25rem;
}

/* Add these styles for the modal */
.files-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: white;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

/* Add texture layers to header */
.modal-header::after {
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

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  position: relative;
  z-index: 1;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.student-info-panel {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.student-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 500;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(21, 151, 80, 0.2);
}

.student-details {
  flex: 1;
}

.student-details h4 {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  color: #202124;
}

.student-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #5f6368;
  font-size: 0.9rem;
  background-color: #f8f9fa;
  padding: 6px 12px;
  border-radius: 20px;
}

.meta-item .material-icons {
  font-size: 18px;
  color: #1aac5a;
}

.files-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.files-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #202124;
}

.download-all-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #e3f2fd;
  color: #1565c0;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.download-all-btn:hover {
  background-color: #bbdefb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.file-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.file-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
  border-color: #ccc;
}

.file-card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.file-card .file-icon {
  width: 48px;
  height: 48px;
}

.file-card .file-name {
  font-size: 0.9rem;
  text-align: center;
  color: #333;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-card .file-actions {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.file-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  font-weight: 500;
  background-color: #fafafa;
}

.view-file-btn {
  color: #2e7d32;
  border-right: 1px solid #f0f0f0;
}

.view-file-btn:hover {
  background-color: #e8f5e9;
}

.download-file-btn {
  color: #1565c0;
}

.download-file-btn:hover {
  background-color: #e3f2fd;
}

.scoring-section {
  background-color: #f8f9fa;
  padding: 24px;
  border-radius: 12px;
}

.scoring-section h4 {
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  color: #202124;
}

.score-form {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.score-input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-input-group label, .comment-input-group label {
  font-size: 0.95rem;
  color: #5f6368;
  font-weight: 500;
}

.score-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input-field {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  width: 80px;
}

.total-score {
  font-size: 1rem;
  color: #5f6368;
}

.comment-input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  font-size: 0.95rem;
}

.save-score-btn {
  grid-column: span 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(21, 151, 80, 0.2);
  margin-top: 10px;
}

.save-score-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(21, 151, 80, 0.3);
}

.no-files-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px dashed #ccc;
}

.no-files-message .material-icons {
  font-size: 48px;
  color: #9e9e9e;
}

.no-files-message p {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .files-modal {
    padding: 10px;
    align-items: flex-end;
}

  .modal-content {
    width: 100%;
    max-width: none;
    height: 90vh;
    border-radius: 16px 16px 0 0;
    max-height: none;
}

  .modal-header {
    padding: 16px;
  }
  
  .modal-header h3 {
    font-size: 1.1rem;
}

  .modal-body {
    padding: 16px;
  }
  
  .student-info-panel {
    gap: 12px;
    padding-bottom: 16px;
    margin-bottom: 16px;
}

  .student-avatar {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .student-details h4 {
    font-size: 1rem;
    margin-bottom: 8px;
  }
  
  .student-meta {
    gap: 8px;
}

  .meta-item {
    font-size: 0.8rem;
    padding: 4px 10px;
}

  .meta-item .material-icons {
    font-size: 16px;
  }
  
  .files-header h4 {
    font-size: 1rem;
}

  .download-all-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
}

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    padding-bottom: 16px;
    margin-bottom: 16px;
}

  .file-card-content {
    padding: 12px;
}

  .file-card .file-icon {
    width: 40px;
    height: 40px;
  }
  
  .file-card .file-name {
    font-size: 0.8rem;
  }
  
  .file-btn {
    padding: 10px 6px;
    font-size: 0.8rem;
}

  .scoring-section {
    padding: 16px;
}

  .score-form {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .save-score-btn {
    grid-column: 1;
    padding: 10px;
}
}

@media (max-width: 480px) {
  .files-modal {
    padding: 0;
}

  .modal-content {
    height: 100vh;
  width: 100%;
    border-radius: 0;
  }
  
  .modal-header {
    padding: 12px 16px;
}

  .modal-body {
    padding: 12px;
  }
  
  .student-info-panel {
  flex-direction: column;
  align-items: center;
  text-align: center;
    gap: 10px;
}

  .student-meta {
    justify-content: center;
  }
  
  .files-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
}

  .download-all-btn {
    width: 100%;
    justify-content: center;
  }
  
  .files-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .file-card-content {
    padding: 10px;
  }
  
  .file-card .file-icon {
    width: 36px;
    height: 36px;
  }
  
  .file-card .file-actions {
    flex-direction: column;
  }
  
  .file-btn {
    padding: 8px 4px;
    font-size: 0.75rem;
    border-right: none;
    border-top: 1px solid #f0f0f0;
  }
  
  .view-file-btn {
    border-right: none;
  }
  
  .scoring-section {
    padding: 12px;
  border-radius: 8px;
  }
  
  .scoring-section h4 {
    font-size: 1rem;
    margin-bottom: 12px;
}

  .score-input-field,
  .comment-input-field {
    padding: 8px 10px;
}

  .save-score-btn {
    padding: 10px;
    font-size: 0.9rem;
  }
}

/* Other existing styles remain unchanged */

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
  padding: 10px 16px;
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h3 {
  margin: 0;
  font-size: 1rem;
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn, .close-fullscreen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
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
  gap: 4px;
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 16px;
  padding: 5px 12px;
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

@media (max-width: 768px) {
  .fullscreen-header {
    padding: 8px 12px;
  }
  
  .header-left {
    gap: 8px;
  }
  
  .header-left h3 {
    font-size: 0.9rem;
    max-width: 50vw;
  }
  
  .back-btn, .close-fullscreen-btn {
    width: 28px;
    height: 28px;
  }
  
  .back-btn .material-icons, 
  .close-fullscreen-btn .material-icons {
    font-size: 18px;
  }
  
  .download-action {
    padding: 4px 10px;
    font-size: 0.85rem;
  }
  
  .download-action .material-icons {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .fullscreen-header {
    padding: 6px 10px;
  }
  
  .header-left {
    gap: 6px;
  }
  
  .header-left h3 {
    font-size: 0.8rem;
    max-width: 40vw;
  }
  
  .back-btn, .close-fullscreen-btn {
    width: 24px;
    height: 24px;
  }
  
  .back-btn .material-icons, 
  .close-fullscreen-btn .material-icons {
    font-size: 16px;
  }
  
  .download-action {
    padding: 3px 8px;
    font-size: 0.8rem;
  }
  
  .download-action .material-icons {
    font-size: 14px;
  }
}

/* Add these new styles to the end of the existing styles */
.download-btn {
  background: #e3f2fd;
  color: #1565c0;
  margin-right: 10px;
}

.download-btn:hover {
  background: #bbdefb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(21, 101, 192, 0.3);
}

.file-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
}

.file-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.file-card .file-icon {
  width: 40px;
  height: 40px;
  margin: 0 auto;
}

.file-card .file-name {
  font-size: 0.9rem;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card .file-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-btn, .download-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.view-btn {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.view-btn:hover {
  background-color: #c8e6c9;
}

.download-action-btn {
  background-color: #e3f2fd;
  color: #1565c0;
}

.download-action-btn:hover {
  background-color: #bbdefb;
}

.file-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.view-file-btn {
  background-color: #e8f5e9;
  color: #2e7d32;
  margin-right: 5px;
}

.download-file-btn {
  background-color: #e3f2fd;
  color: #1565c0;
}

/* Improve student card styling */
.student-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.student-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}

.card-header {
  position: relative;
}

.card-body {
  padding: 15px;
}

.student-info {
  margin-bottom: 15px;
}

.student-info p {
  margin: 8px 0;
  font-size: 0.95rem;
}

/* Make modals more responsive */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 85vh;
  }
  
  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .file-card {
    padding: 10px;
  }
  
  .view-btn, .download-action-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .files-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .modal-body {
    padding: 10px;
  }
  
  .student-info-panel {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .student-meta {
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
}

/* Additional styles for View Files button */
.view-files-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  width: 100%;
  max-width: 200px;
  margin-bottom: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.view-files-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* Score button styles */
.score-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.score-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.score-btn .material-icons {
  font-size: 18px;
}

/* Submission actions container */
.submission-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
  border: 1px solid #eee;
}

.file-item:hover {
  background: #f1f3f4;
  border-color: #ddd;
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
}

.file-actions {
  display: flex;
  margin-left: auto;
  gap: 5px;
}

/* Improved file button styles */
.file-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.view-file-btn {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.view-file-btn:hover {
  background-color: #c8e6c9;
}

.download-file-btn {
  background-color: #e3f2fd;
  color: #1565c0;
}

.download-file-btn:hover {
  background-color: #bbdefb;
}

/* Update action-link to match file-btn */
.action-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  background-color: transparent;
  border: none;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.action-link.view {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.action-link.view:hover {
  background-color: #c8e6c9;
}

.action-link.download {
  background-color: #e3f2fd;
  color: #1565c0;
}

.action-link.download:hover {
  background-color: #bbdefb;
}

/* Update the student item styling in the modal */
.modal-students-list .student-item {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-students-list .student-item:last-child {
  border-bottom: none;
}

.modal-students-list .checkbox-label {
  color: #333; /* Ensure text is dark and readable */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.modal-students-list .student-info {
  color: #666; /* Secondary text is slightly lighter but still readable */
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

/* Fix the select all checkbox label color */
.select-all .checkbox-label {
  color: #333; /* Ensure text is dark and readable */
}

/* Fix modal styling for better text contrast */
.modal-container .modal-header {
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.modal-container .modal-header::after {
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

.modal-container .modal-header h3 {
  margin: 0;
  color: white; /* Ensure header text is white */
  position: relative;
  z-index: 1;
}

.modal-container .close-btn {
  color: white; /* Ensure close button is white */
}

.modal-container .modal-body {
  background: white;
  color: #333;
}

.modal-container .empty-state {
  color: #666;
}

.modal-search input {
  color: #333;
}

/* Ensure submit button has proper contrast */
.modal-container .submit-btn {
  background: #159750;
  color: white;
}
</style>