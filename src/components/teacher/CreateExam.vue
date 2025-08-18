<template>
  <div class="create-exam-container">
    <div class="header-container">
      <div class="header-content">
        <h1>{{ isEditing ? 'Edit Exam' : 'Create New Exam' }}<span class="material-icons">assignment_add</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Design your exam with various question types</p>
        </div>
      </div>
      <div class="header-background">{{ isEditing ? 'EDIT' : 'CREATE' }}</div>
    </div>

    <!-- Add validation feedback -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <form @submit.prevent="handleSubmit" class="exam-form">
      <!-- Exam Details Card -->
      <div class="card exam-details-card">
        <div class="card-header">
          <h2><i class="fas fa-info-circle"></i> Exam Details</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label for="testCode">Test Code *</label>
              <div class="input-with-button">
                <input 
                  v-model="examData.testCode" 
                  type="text" 
                  id="testCode" 
                  required
                  :class="{ 'error': error && !examData.testCode }"
                />
                <button 
                  type="button" 
                  class="generate-button"
                  @click="generateTestCode"
                  title="Generate random test code"
                >
                  <span class="material-icons">autorenew</span>
                </button>
              </div>
              <small v-if="error && !examData.testCode" class="error-text">
                Test code is required
              </small>
            </div>
            
            <div class="form-group">
              <label for="classCode">Class Code</label>
              <input 
                v-model="examData.classCode" 
                type="text" 
                id="classCode" 
                placeholder="e.g., 10A-MATH" 
                required 
                class="uppercase-input"
              />
              <small>Identifier for the class taking this exam (automatically uppercase)</small>
            </div>
          </div>
          
          <div class="form-group full-width">
            <label for="examTitle">Exam Title</label>
            <input 
              v-model="examData.title" 
              type="text" 
              id="examTitle" 
              placeholder="e.g., MIDTERM EXAMINATION IN MATHEMATICS" 
              required 
              class="uppercase-input"
            />
            <small>Descriptive title that appears on the exam (automatically uppercase)</small>
          </div>
        </div>
      </div>
      
      <!-- Exam Settings Card -->
      <div class="card exam-settings-card">
        <div class="card-header">
          <h2><i class="fas fa-cogs"></i> Exam Settings</h2>
          <div class="settings-toggles">
            <button 
              type="button" 
              class="settings-toggle"
              :class="{ active: activeSettingsTab === 'timer' }"
              @click="toggleSettingsTab('timer')"
            >
              <i class="fas fa-clock"></i> Timer
            </button>
            <button 
              type="button" 
              class="settings-toggle"
              :class="{ active: activeSettingsTab === 'schedule' }"
              @click="toggleSettingsTab('schedule')"
            >
              <i class="fas fa-calendar-alt"></i> Schedule
            </button>
            <button 
              type="button" 
              class="settings-toggle"
              :class="{ active: activeSettingsTab === 'attempts' }"
              @click="toggleSettingsTab('attempts')"
            >
              <i class="fas fa-redo"></i> Attempts
            </button>
            <button 
              type="button" 
              class="settings-toggle"
              :class="{ active: activeSettingsTab === 'history' }"
              @click="toggleSettingsTab('history')"
            >
              <i class="fas fa-history"></i> History
            </button>
          </div>
        </div>
        <div class="card-body">
          <!-- Timer Settings - Collapsible -->
          <div class="settings-section" v-show="activeSettingsTab === 'timer'">
            <div class="form-row">
              <div class="form-group full-width">
                <label for="durationMinutes">Time Limit (minutes)</label>
                <input 
                  v-model.number="examData.durationMinutes" 
                  type="number" 
                  id="durationMinutes" 
                  min="1"
                  placeholder="e.g., 60 (leave empty for no limit)"
                />
                <small>Set a time limit for completing the exam. Leave empty for unlimited time.</small>
              </div>
            </div>
          </div>
          
          <!-- Schedule Settings - Collapsible -->
          <div class="settings-section" v-show="activeSettingsTab === 'schedule'">
            <div class="form-row">
              <div class="form-group">
                <label for="startDateTime">Start Date & Time</label>
                <input 
                  v-model="examData.startDateTime" 
                  type="datetime-local" 
                  id="startDateTime"
                />
                <small>When the exam becomes available (leave empty for immediate availability)</small>
              </div>
              
              <div class="form-group">
                <label for="endDateTime">End Date & Time</label>
                <input 
                  v-model="examData.endDateTime" 
                  type="datetime-local" 
                  id="endDateTime"
                />
                <small>When the exam expires (leave empty for no expiration)</small>
              </div>
            </div>
          </div>
          
          <!-- Attempts Settings - Collapsible -->
          <div class="settings-section" v-show="activeSettingsTab === 'attempts'">
            <div class="form-row">
              <div class="form-group">
                <label for="maxAttempts">Maximum Attempts</label>
                <input 
                  v-model.number="examData.maxAttempts" 
                  type="number" 
                  id="maxAttempts" 
                  min="1"
                  placeholder="e.g., 3 (leave empty for unlimited)"
                />
                <small>Maximum number of times a student can take this exam (leave empty for unlimited)</small>
              </div>
              
              <div class="form-group">
                <label for="attemptSpacing">Time Between Attempts (minutes)</label>
                <input 
                  v-model.number="examData.attemptSpacing" 
                  type="number" 
                  id="attemptSpacing" 
                  min="0"
                  placeholder="e.g., 60 (leave empty for no waiting period)"
                />
                <small>Minimum waiting time between attempts in minutes (leave empty for no waiting period)</small>
              </div>
            </div>
          </div>
          
          <!-- Exam History Settings - Collapsible -->
          <div class="settings-section" v-show="activeSettingsTab === 'history'">
            <div class="form-row">
              <div class="form-group full-width">
                <div class="toggle-switch-container">
                  <label class="toggle-label">
                    <span class="toggle-text">Allow Students to View Exam History</span>
                    <small>When enabled, students can see their previous attempts, answers, and scores for this exam</small>
                  </label>
                  <div class="toggle-switch">
                    <input 
                      type="checkbox" 
                      id="studentExamHistory" 
                      v-model="examData.studentExamHistory"
                      class="toggle-input"
                    />
                    <label for="studentExamHistory" class="toggle-slider"></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Questions Section -->
      <div class="card exam-questions-card">
        <div class="card-header">
          <h2><i class="fas fa-question-circle"></i> Questions</h2>
        </div>
        <div class="card-body">
          <!-- Empty state when no questions exist -->
          <div v-if="questions.length === 0" class="no-questions">
            <div class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-clipboard-list"></i>
              </div>
              <p>No questions added yet</p>
              <p class="empty-subtext">Click the button below to add your first question</p>
            </div>
          </div>
          
          <transition-group name="question-transition" tag="div" class="questions-list">
            <div 
              v-for="(question, index) in questions" 
              :key="index" 
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">Question {{ index + 1 }}</span>
                <div class="question-actions">
                  <button 
                    type="button" 
                    class="action-btn ai-improve-btn" 
                    @click="improveQuestionWithAI(question, index)"
                    title="Improve with AI"
                  >
                    <span class="material-icons-round">psychology</span>
                  </button>
                  <button 
                    type="button" 
                    class="action-btn duplicate-btn" 
                    @click="duplicateQuestion(index)"
                    title="Duplicate question"
                  >
                    <span class="material-icons-round">content_copy</span>
                  </button>
                  <button 
                    type="button" 
                    class="action-btn remove-btn" 
                    @click="confirmRemoveQuestion(index)"
                    title="Remove question"
                  >
                    <span class="material-icons-round">delete</span>
                  </button>
                </div>
              </div>
              
              <div class="question-content">
                <div class="form-group">
                  <label>Question Text</label>
                  <div class="question-input-wrapper">
                  <textarea 
                    v-model="question.text" 
                    required 
                    placeholder="Enter your question here"
                  ></textarea>
                    <button 
                      type="button"
                      v-if="question.text && question.text.trim && question.text.trim().length > 10"
                      class="detect-options-btn"
                      @click="detectOptionsWithAI(question, index)"
                      title="AI will analyze your question and suggest the most appropriate answer"
                    >
                      <span class="material-icons">auto_fix_high</span>
                      {{ question.type === 'multipleChoice' ? 'AI: Detect Answer & Options' : 
                         question.type === 'true_false' ? 'AI: Detect True/False' : 
                         question.type === 'enumeration' ? 'AI: Detect Items' : 'AI: Analyze Question' }}
                    </button>
                  </div>
                </div>
                
                <!-- Add image upload section -->
                <div class="form-group image-upload-section">
                  <label>Question Image (Optional)</label>
                  <div class="image-upload-container">
                    <div v-if="question.imageUrl" class="image-preview">
                      <img :src="getImageUrl(question.imageUrl)" alt="Question image" />
                      <button 
                        type="button" 
                        class="remove-image-btn" 
                        @click="removeImage(question)"
                        title="Remove image"
                      >
                        <span class="material-icons-round">close</span>
                      </button>
                    </div>
                    <div v-else class="upload-placeholder">
                      <input 
                        type="file" 
                        :id="`question-${index}-image`" 
                        @change="(e) => handleImageUpload(e, question)"
                        accept="image/*"
                        class="file-input"
                      />
                      <label :for="`question-${index}-image`" class="upload-label">
                        <span class="material-icons-round">add_photo_alternate</span>
                        <span>Upload Image</span>
                      </label>
                    </div>
                  </div>
                  <small>Supported formats: JPG, PNG, GIF (max 5MB)</small>
                </div>
                
                <div class="question-type-selector">
                  <label>Question Type</label>
                  <div class="type-buttons">
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.type === 'multipleChoice' }"
                      @click="setQuestionType(question, 'multipleChoice')"
                    >
                      <span class="material-icons-round">radio_button_checked</span>
                      Multiple Choice
                    </button>
                    
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.type === 'true_false' }"
                      @click="setQuestionType(question, 'true_false')"
                    >
                      <span class="material-icons-round">rule</span>
                      True/False
                    </button>
                    
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.type === 'enumeration' }"
                      @click="setQuestionType(question, 'enumeration')"
                    >
                      <span class="material-icons-round">format_list_numbered</span>
                      Enumeration
                    </button>
                  </div>
                </div>
                
                <!-- Multiple Choice Options -->
                <div v-if="question.type === 'multipleChoice'" class="options-section">
                  <div class="options-header">
                    <h4>Answer Options</h4>
                    <div class="option-header-buttons">
                      <button 
                        type="button" 
                        class="ai-options-btn"
                        @click="generateOptionsWithAI(question, index)"
                        title="Add options based on your specified correct answer"
                      >
                        <span class="material-icons-round">psychology</span>
                        Based on Answer
                      </button>
                      <button 
                        type="button" 
                        class="add-option-btn"
                        @click="addOption(question)"
                      >
                        <span class="material-icons-round">add</span>
                        Add Option
                      </button>
                    </div>
                  </div>
                  
                  <div class="options-list">
                    <div 
                      v-for="(option, optIndex) in question.options" 
                      :key="optIndex" 
                      class="option-item"
                    >
                      <input 
                        type="radio" 
                        :name="`question-${index}-correct`" 
                        :id="`question-${index}-option-${optIndex}`"
                        :value="option" 
                        v-model="question.correctAnswer"
                        :disabled="!option.trim()"
                      />
                      <input 
                        v-model="question.options[optIndex]"
                        type="text" 
                        :placeholder="`Option ${optIndex + 1}`"
                        required
                      />
                      <button 
                        type="button" 
                        class="remove-option-btn"
                        @click="removeOption(question, optIndex)"
                        title="Remove option"
                        :disabled="question.options.length <= 2"
                      >
                        <span class="material-icons-round">close</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- True/False Options -->
                <div v-if="question.type === 'true_false'" class="true-false-section">
                  <div class="true-false-options">
                    <div class="true-false-option">
                      <input 
                        type="radio" 
                        :id="`question-${index}-true`" 
                        :name="`question-${index}-answer`"
                        value="true" 
                        v-model="question.correctAnswer"
                      />
                      <label :for="`question-${index}-true`">True</label>
                    </div>
                    <div class="true-false-option">
                      <input 
                        type="radio" 
                        :id="`question-${index}-false`" 
                        :name="`question-${index}-answer`"
                        value="false" 
                        v-model="question.correctAnswer"
                      />
                      <label :for="`question-${index}-false`">False</label>
                    </div>
                  </div>
                </div>
                
                <!-- Short Answer/Enumeration -->
                <div v-if="question.type === 'enumeration'" class="short-answer-section">
                  <div class="form-group">
                    <label>Correct Answer</label>
                    <input 
                      v-model="question.correctAnswer" 
                      type="text" 
                      placeholder="Enter the correct answer" 
                      required 
                      class="uppercase-input"
                    />
                    <small>Case-insensitive, exact match required for grading (automatically uppercase)</small>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
          
          <div class="questions-actions">
            <button 
              type="button" 
              class="add-question-button"
              @click="addQuestion"
            >
              <span class="material-icons-round">add_circle</span>
              Add New Question
            </button>

            <button 
              type="button" 
              class="import-question-button"
              @click="showQuestionBankModal = true"
            >
              <span class="material-icons">library_books</span>
              Import from Bank
            </button>
            
            <button 
              type="button" 
              class="ai-generate-button"
              @click="generateAIQuestions"
            >
              <span class="material-icons">psychology</span>
              Generate with AI
            </button>
            
            <button 
              type="button" 
              class="document-upload-button"
              @click="showDocumentUploadModal = true"
            >
              <span class="material-icons">upload_file</span>
              Extract from Document
            </button>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <div class="action-buttons">
          <button 
            type="button" 
            class="reset-button" 
            @click="resetForm"
          >
            <span class="material-icons-round">refresh</span>
            Reset
          </button>
          
          <button 
            type="button" 
            class="draft-button" 
            @click="saveAsDraft"
          >
            <span class="material-icons-round">save</span>
            Save as Draft
          </button>
          
          <button 
            type="submit" 
            class="publish-button"
            :disabled="!questions.length"
          >
            <span class="material-icons-round">publish</span>
            {{ isEditing ? 'Update' : 'Publish' }} Exam
          </button>
        </div>
      </div>
    </form>

    <!-- Replace Question Bank Modal with Side Panel -->
    <div 
      class="side-panel"
      :class="{ 'is-open': showQuestionBankModal }"
    >
      <div class="side-panel-header">
        <h2>
          <span class="material-icons">library_books</span>
          Question Bank
        </h2>
        <button class="close-btn" @click="closeQuestionBankModal">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="side-panel-content">
        <!-- Filters -->
        <div class="filters-section">
          <div class="search-box">
            <input 
              v-model="bankSearchQuery" 
              type="text" 
              placeholder="Search questions..."
            >
            <span class="material-icons">search</span>
          </div>

          <div class="filter-group">
            <select v-model="selectedBankFolder">
              <option value="">All Folders</option>
              <option v-for="folder in bankFolders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
              </option>
            </select>

            <select v-model="selectedBankSubject">
              <option value="">All Subjects</option>
              <option v-for="subject in bankSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>

            <select v-model="selectedBankDifficulty">
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <!-- Questions List -->
        <div class="bank-questions-list">
          <div 
            v-for="question in filteredBankQuestions" 
            :key="question.id" 
            class="bank-question-card"
            :class="{ selected: selectedBankQuestions.includes(question.id) }"
            @click="toggleQuestionSelection(question)"
          >
            <div class="question-header">
              <span class="question-type">{{ formatQuestionType(question.questionType) }}</span>
              <span class="difficulty-badge" :class="question.difficulty">
                {{ question.difficulty }}
              </span>
            </div>

            <div class="question-content">
              <p class="question-text">{{ question.questionText }}</p>
              
              <div v-if="question.imageUrl" class="question-image">
                <img :src="getImageUrl(question.imageUrl)" alt="Question image">
              </div>

              <div class="question-meta">
                <span v-if="question.folder" class="folder">
                  <span class="material-icons">folder</span>
                  {{ question.folder.name }}
                </span>
                <span v-if="question.subject" class="subject">
                  <span class="material-icons">subject</span>
                  {{ question.subject }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="side-panel-footer">
        <div class="selection-info">
          {{ selectedBankQuestions.length }} questions selected
        </div>
        <button 
          class="import-btn" 
          @click="importSelectedQuestions"
          :disabled="selectedBankQuestions.length === 0"
        >
          <span class="material-icons">add_circle</span>
          Import Selected
        </button>
      </div>
    </div>

    <!-- Document Upload Modal -->
    <div 
      class="side-panel document-panel"
      :class="{ 'is-open': showDocumentUploadModal }"
    >
      <div class="side-panel-header">
        <h2>
          <span class="material-icons">upload_file</span>
          Extract Questions from Document/Text
        </h2>
        <button class="close-btn" @click="closeDocumentUploadModal">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="side-panel-content">
        <!-- AI Model Selection -->
        <div class="model-selection">
          <label for="ai-model">AI Model:</label>
          <select id="ai-model" v-model="selectedAiModel" @change="updatePreferredModel">
            <option v-for="model in availableAiModels" :key="model.id" :value="model.id">
              {{ model.provider }} / {{ model.name }}
            </option>
          </select>
          <small>Select the AI model to use for question extraction</small>
        </div>
        
        <!-- Tab Navigation -->
        <div class="document-tabs">
          <button 
            class="tab-button" 
            :class="{ active: documentTab === 'file' }"
            @click="documentTab = 'file'"
          >
            <span class="material-icons">upload_file</span>
            Document Upload
          </button>
          <button 
            class="tab-button" 
            :class="{ active: documentTab === 'text' }"
            @click="documentTab = 'text'"
          >
            <span class="material-icons">text_fields</span>
            Text Input
          </button>
        </div>

        <!-- File Upload Tab -->
        <div v-if="documentTab === 'file'">
          <div class="upload-instructions">
            <p>Upload a PDF  file containing exam questions. The AI will automatically extract and format the questions for your exam.</p>
            <p class="smaller">Supported formats: PDF (max 10MB)</p>
          </div>

          <div class="document-upload-area" @click="triggerFileUpload" @dragover.prevent @drop.prevent="handleFileDrop">
            <input 
              type="file" 
              ref="documentFileInput" 
              @change="handleDocumentUpload"
              accept=".pdf,.docx"
              class="file-input"
              style="display: none;"
            />
            
            <div v-if="!documentFile" class="upload-placeholder">
              <span class="material-icons large-icon">upload_file</span>
              <p>Drag and drop your file here or click to browse</p>
              <p class="smaller">PDF or DOCX format</p>
            </div>
            
            <div v-else class="file-info">
              <span class="material-icons file-icon">
                {{ documentFile.name.endsWith('.pdf') ? 'picture_as_pdf' : 'description' }}
              </span>
              <div class="file-details">
                <p class="file-name">{{ documentFile.name }}</p>
                <p class="file-size">{{ formatFileSize(documentFile.size) }}</p>
              </div>
              <button type="button" class="remove-file-btn" @click.stop="removeDocumentFile">
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Text Input Tab -->
        <div v-if="documentTab === 'text'">
          <div class="upload-instructions">
            <p>Paste or type your exam questions directly. The AI will automatically analyze and format the questions for your exam.</p>
            <p class="smaller">Paste multiple questions with their answers for best results</p>
          </div>

          <div class="text-input-area">
            <textarea 
              v-model="documentText" 
              placeholder="Paste or type your exam questions and answers here..."
              rows="10"
              class="document-text-input"
            ></textarea>
            <button 
              type="button" 
              class="analyze-text-btn" 
              @click="processTextInput"
              :disabled="!documentText || documentText.length < 10 || documentProcessing"
            >
              <span class="material-icons">psychology</span>
              Analyze Text
            </button>
          </div>
        </div>

        <div v-if="documentProcessing" class="processing-status">
          <div class="spinner"></div>
          <p>Processing {{ documentTab === 'file' ? 'document' : 'text' }}... This may take a minute.</p>
        </div>

        <div v-if="documentResult" class="document-result">
          <div class="result-header">
            <h3>Extracted Questions ({{ documentResult.length }})</h3>
          </div>
          
          <div class="result-questions">
            <div 
              v-for="(question, index) in documentResult" 
              :key="index"
              class="result-question-item"
            >
              <div class="result-question-header">
                <span class="question-number">Question {{ index + 1 }}</span>
                <span class="question-type">{{ formatQuestionType(question.type) }}</span>
              </div>
              <p class="question-text">{{ question.text }}</p>
              
              <div v-if="question.type === 'multipleChoice'" class="question-options">
                <p 
                  v-for="(option, optIndex) in question.options" 
                  :key="optIndex"
                  :class="{ 'correct-answer': option === question.correctAnswer }"
                >
                  {{ optIndex + 1 }}. {{ option }}
                </p>
              </div>
              
              <div v-else-if="question.type === 'true_false'" class="question-options">
                <p :class="{ 'correct-answer': question.correctAnswer === 'true' }">True</p>
                <p :class="{ 'correct-answer': question.correctAnswer === 'false' }">False</p>
              </div>
              
              <div v-else class="question-answer">
                <p><strong>Answer:</strong> {{ question.correctAnswer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="side-panel-footer">
        <button 
          class="cancel-btn" 
          @click="closeDocumentUploadModal"
        >
          Cancel
        </button>
        <button 
          class="import-btn" 
          @click="importDocumentQuestions"
          :disabled="!documentResult || documentResult.length === 0 || documentProcessing"
        >
          <span class="material-icons">add_circle</span>
          Add to Exam
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createExam, fetchTeacherExams, updateExam, uploadImage, getFullImageUrl, getQuestionBankItems } from '../../services/authService';
import aiService from '../../services/aiService';
import fileProcessingService from '../../services/textProcessingService';
import Swal from 'sweetalert2';

export default {
  name: 'CreateExam',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const isEditing = ref(false);
    const examData = ref({
      testCode: '',
      classCode: '',
      title: '',
      isDraft: false,
      userId: localStorage.getItem('userId'),
      durationMinutes: null,
      startDateTime: '',
      endDateTime: '',
      maxAttempts: null,
      attemptSpacing: null,
      studentExamHistory: true
    });
    
    // Add state for active settings tab
    const activeSettingsTab = ref('timer'); // Default to timer tab
    
    // Function to toggle between settings tabs
    const toggleSettingsTab = (tab) => {
      activeSettingsTab.value = activeSettingsTab.value === tab ? null : tab;
    };
    const questions = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const showQuestionBankModal = ref(false);
    const bankQuestions = ref([]);
    const selectedBankQuestions = ref([]);
    const bankSearchQuery = ref('');
    const selectedBankFolder = ref('');
    const selectedBankSubject = ref('');
    const selectedBankDifficulty = ref('');
    const STORAGE_KEY = 'exam_creation_progress'; // Key for local storage

    // Document upload functionality
    const documentFileInput = ref(null);
    const documentFile = ref(null);
    const documentProcessing = ref(false);
    const documentResult = ref(null);
    const showDocumentUploadModal = ref(false);
    // Text input functionality
    const documentTab = ref('file'); // Default to file upload tab
    const documentText = ref('');
    
    // AI Model selection
    const availableAiModels = ref([]);
    const selectedAiModel = ref('');
    
    // Load available AI models
    onMounted(async () => {
      // Load available AI models
      try {
        availableAiModels.value = aiService.getAvailableModels();
        
        // Set the selected model to the current preferred model or first available
        if (availableAiModels.value.length > 0) {
          const savedModel = localStorage.getItem('preferred_ai_model');
          selectedAiModel.value = savedModel || availableAiModels.value[0].id;
        }
      } catch (error) {
        console.error('Error loading AI models:', error);
      }
      
      const examId = route.query.examId;
      if (examId) {
        isEditing.value = true;
        try {
          const exams = await fetchTeacherExams();
          const exam = exams.find(e => e.id === parseInt(examId));
          if (exam) {
            examData.value = {
              testCode: exam.testCode,
              classCode: exam.classCode,
              title: exam.examTitle,
              isDraft: exam.isDraft,
              userId: exam.userId,
              durationMinutes: exam.durationMinutes || null,
              startDateTime: exam.startDateTime ? new Date(exam.startDateTime).toISOString().slice(0, 16) : '',
              endDateTime: exam.endDateTime ? new Date(exam.endDateTime).toISOString().slice(0, 16) : '',
              maxAttempts: exam.maxAttempts || null,
              attemptSpacing: exam.attemptSpacing || null,
              studentExamHistory: exam.studentExamHistory !== undefined ? exam.studentExamHistory : true
            };
            questions.value = exam.questions.map(q => ({
              text: q.questionText,
              type: q.questionType,
              options: Array.isArray(q.options) ? q.options : [],
              correctAnswer: q.correctAnswer,
              imageUrl: q.imageUrl ? '/uploads/' + q.imageUrl.split('/').pop() : null // Fix image URL format
            }));
          }
        } catch (error) {
          console.error('Error loading exam:', error);
          Swal.fire('Error', 'Failed to load exam data', 'error');
        }
      } else {
        // Try to load saved progress if not editing
        const hasSavedProgress = loadProgressFromLocalStorage();
        if (hasSavedProgress) {
          Swal.fire({
            title: 'Saved Progress Found',
            text: 'Would you like to continue where you left off?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, continue',
            cancelButtonText: 'No, start fresh'
          }).then((result) => {
            if (!result.isConfirmed) {
              resetForm();
            }
          });
        }
      }
      loadBankQuestions();
    });

    // Update preferred AI model
    const updatePreferredModel = () => {
      if (aiService.setPreferredModel && selectedAiModel.value) {
        aiService.setPreferredModel(selectedAiModel.value);
      }
    };

    const triggerFileUpload = () => {
      documentFileInput.value.click();
    };

    const handleFileDrop = (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (isValidDocumentFile(file)) {
          documentFile.value = file;
        } else {
          Swal.fire('Invalid File', 'Please upload a PDF or DOCX file (max 10MB)', 'error');
        }
      }
    };

    const handleDocumentUpload = (event) => {
      const file = event.target.files[0];
      if (file && isValidDocumentFile(file)) {
        documentFile.value = file;
      } else if (file) {
        Swal.fire('Invalid File', 'Please upload a PDF or DOCX file (max 10MB)', 'error');
      }
    };

    const isValidDocumentFile = (file) => {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const validExtensions = ['.pdf', '.docx'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      return (
        validTypes.includes(file.type) || 
        validExtensions.includes(fileExtension)
      ) && file.size <= maxSize;
    };

    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + ' bytes';
      else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const removeDocumentFile = () => {
      documentFile.value = null;
      if (documentFileInput.value) {
        documentFileInput.value.value = '';
      }
    };

    const processDocumentFile = async () => {
      if (!documentFile.value) return;

      try {
        documentProcessing.value = true;
        documentResult.value = null;

        // Use the processing service to extract questions from the file
        // Pass the selected AI model to the processing service
        const result = await fileProcessingService.processDocumentFile(
          documentFile.value,
          selectedAiModel.value
        );
        
        documentResult.value = result;
      } catch (error) {
        console.error('Error processing document:', error);
        Swal.fire('Processing Error', 'Failed to process the document. Please try again.', 'error');
      } finally {
        documentProcessing.value = false;
      }
    };

    // New function to process text input
    const processTextInput = async () => {
      if (!documentText.value || documentText.value.length < 10) return;

      try {
        documentProcessing.value = true;
        documentResult.value = null;

        // Use the processing service to extract questions from the text
        // Pass the selected AI model to the processing service
        const result = await fileProcessingService.processTextInput(
          documentText.value,
          selectedAiModel.value
        );
        
        documentResult.value = result;
      } catch (error) {
        console.error('Error processing text:', error);
        Swal.fire('Processing Error', 'Failed to analyze the text. Please try again.', 'error');
      } finally {
        documentProcessing.value = false;
      }
    };

    // Watch for file changes to automatically process
    watch(documentFile, (newFile) => {
      if (newFile) {
        processDocumentFile();
      } else {
        documentResult.value = null;
      }
    });

    const importDocumentQuestions = () => {
      if (!documentResult.value || documentResult.value.length === 0) return;

      // Add extracted questions to the exam
      documentResult.value.forEach(extractedQuestion => {
        questions.value.push({
          text: extractedQuestion.text,
          type: extractedQuestion.type,
          options: extractedQuestion.options || [],
          correctAnswer: extractedQuestion.correctAnswer,
          imageUrl: null
        });
      });

      closeDocumentUploadModal();
      
      Swal.fire({
        icon: 'success',
        title: 'Questions Added',
        text: `${documentResult.value.length} questions have been added to your exam.`,
        timer: 2000,
        showConfirmButton: false
      });
    };

    const closeDocumentUploadModal = () => {
      showDocumentUploadModal.value = false;
      // Don't reset file and results so user can still add them if they reopen
    };

    // Add watchers to convert inputs to uppercase
    watch(() => examData.value.testCode, (newValue) => {
      if (newValue) {
        examData.value.testCode = newValue.toUpperCase();
      }
      saveProgressToLocalStorage();
    });

    watch(() => examData.value.classCode, (newValue) => {
      if (newValue) {
        examData.value.classCode = newValue.toUpperCase();
      }
      saveProgressToLocalStorage();
    });

    watch(() => examData.value.title, (newValue) => {
      if (newValue) {
        examData.value.title = newValue.toUpperCase();
      }
      saveProgressToLocalStorage();
    });

    // Watch for changes in questions array to save progress
    watch(questions, () => {
      saveProgressToLocalStorage();
    }, { deep: true });

    // Save exam creation progress to local storage
    const saveProgressToLocalStorage = () => {
      if (isEditing.value) return; // Don't save if editing an existing exam
      
      // Only save if there's meaningful data entered
      const hasExamData = examData.value.testCode || examData.value.classCode || examData.value.title;
      const hasQuestions = questions.value.length > 0;
      
      if (!hasExamData && !hasQuestions) return; // Don't save empty forms
      
      const progress = {
        examData: examData.value,
        questions: questions.value
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    };

    // Load exam progress from local storage
    const loadProgressFromLocalStorage = () => {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          examData.value = progress.examData;
          questions.value = progress.questions;
          return true;
        } catch (e) {
          console.error('Error parsing saved progress:', e);
        }
      }
      return false;
    };

    // Clear progress from local storage
    const clearLocalStorageProgress = () => {
      localStorage.removeItem(STORAGE_KEY);
    };

    // Handle image upload
    const handleImageUpload = async (event, question) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'Image size should not exceed 5MB', 'error');
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        Swal.fire('Error', 'Only JPG, PNG, and GIF images are supported', 'error');
        return;
      }
      
      try {
        // Show loading indicator
        Swal.fire({
          title: 'Uploading...',
          text: 'Please wait while we upload your image',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Create an image element to resize the image
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = async () => {
          try {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions (max width/height of 800px)
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round(height * (MAX_SIZE / width));
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round(width * (MAX_SIZE / height));
                height = MAX_SIZE;
              }
            }
            
            // Resize the image
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get the resized image as base64 with reduced quality
            const resizedImage = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
            
            // Use the service to upload the image
            const data = await uploadImage(resizedImage);
            // Store the image URL with /uploads/ prefix
            question.imageUrl = '/uploads/' + data.imageUrl.split('/').pop();
            Swal.close();
          } catch (error) {
            console.error('Image upload error:', error);
            Swal.fire('Error', 'Failed to upload image', 'error');
          }
        };
        
        img.onerror = () => {
          Swal.fire('Error', 'Failed to process image', 'error');
        };
      } catch (error) {
        console.error('Image upload error:', error);
        Swal.fire('Error', 'Failed to upload image', 'error');
      }
    };
    
    // Remove image from question
    const removeImage = (question) => {
      question.imageUrl = null;
    };

    const handleSubmit = async () => {
      await submitExam(false);
    };

    const saveAsDraft = async () => {
      await submitExam(true);
    };

    const submitExam = async (isDraft = false) => {
      try {
        loading.value = true;
        error.value = null;

        // Validate required fields
        if (!examData.value.testCode || !examData.value.classCode || !examData.value.title) {
          throw new Error('Please fill in all required fields');
        }

        // Validate questions
        if (!questions.value.length) {
          throw new Error('Please add at least one question');
        }

        // Format questions
        const formattedQuestions = questions.value.map(q => ({
          questionText: q.text,
          questionType: q.type,
          options: q.type === 'true_false' ? ['true', 'false'] : 
                   q.type === 'enumeration' ? [] : 
                   q.options,
          correctAnswer: q.correctAnswer,
          imageUrl: q.imageUrl // Include imageUrl in formatted questions
        }));

        if (isEditing.value) {
          await updateExam(route.query.examId, {
            testCode: examData.value.testCode,
            classCode: examData.value.classCode,
            examTitle: examData.value.title,
            questions: formattedQuestions,
            isDraft: isDraft,
            status: isDraft ? 'draft' : 'pending',
            durationMinutes: examData.value.durationMinutes,
            startDateTime: examData.value.startDateTime ? new Date(examData.value.startDateTime) : undefined,
            endDateTime: examData.value.endDateTime ? new Date(examData.value.endDateTime) : undefined,
            maxAttempts: examData.value.maxAttempts,
            attemptSpacing: examData.value.attemptSpacing,
            studentExamHistory: examData.value.studentExamHistory
          });
        } else {
          await createExam(
            examData.value.testCode,
            examData.value.classCode,
            examData.value.title,
            formattedQuestions,
            localStorage.getItem('userId'),
            isDraft,
            examData.value.durationMinutes,
            examData.value.startDateTime ? new Date(examData.value.startDateTime) : undefined,
            examData.value.endDateTime ? new Date(examData.value.endDateTime) : undefined,
            examData.value.maxAttempts,
            examData.value.attemptSpacing,
            examData.value.studentExamHistory
          );
        }

        // Clear saved progress after successful submission
        clearLocalStorageProgress();

        // Show success message
        Swal.fire({
          title: 'Success!',
          text: `Exam ${isEditing.value ? 'updated' : 'created'} successfully`,
          icon: 'success',
          confirmButtonColor: '#4CAF50'
        });

        // Redirect to manage exams page
        router.push('/manage-exams');
      } catch (err) {
        console.error('Error creating/updating exam:', err);
        error.value = err.message;
        Swal.fire({
          title: 'Error',
          text: err.message || 'Failed to create/update exam',
          icon: 'error',
          confirmButtonColor: '#f44336'
        });
      } finally {
        loading.value = false;
      }
    };

    const validateExam = () => {
      if (!examData.value.testCode || !examData.value.classCode || !examData.value.title) {
        return false;
      }
      if (!questions.value.length) {
        return false;
      }
      return questions.value.every(validateQuestion);
    };

    const validateQuestion = (question) => {
      if (!question.text || !question.type || !question.correctAnswer) {
        return false;
      }
      if (question.type === 'multipleChoice' && (!question.options || question.options.length < 2)) {
        return false;
      }
      return true;
    };

    const isFormValid = computed(() => {
      return validateExam();
    });

    const handleQuestionTypeChange = (question) => {
      if (!question) return;

      // Only reset options if the type has actually changed
      if (question.type === 'true_false') {
        question.options = ['true', 'false'];
        question.correctAnswer = '';
      } else if (question.type === 'enumeration') {
        question.options = [];
        question.correctAnswer = '';
      } else if (question.type === 'multipleChoice' && 
                 (!Array.isArray(question.options) || question.options.join(',') === 'true,false')) {
        // Only reset multiple choice options if coming from true/false or if options are invalid
        question.options = ['', '', '', ''];
        question.correctAnswer = '';
      }
    };

    const addQuestion = () => {
      questions.value.push({
        text: '',
        type: 'multipleChoice',
        options: ['', ''],
        correctAnswer: '',
        imageUrl: null
      });
    };

    // Watch all questions to ensure enumeration answers are uppercase
    watch(questions, (newQuestions) => {
      newQuestions.forEach(question => {
        if (question.type === 'enumeration' && question.correctAnswer) {
          question.correctAnswer = question.correctAnswer.toUpperCase();
        }
      });
    }, { deep: true });

    const setQuestionType = (question, type) => {
      if (question.type === type) return;
      
      const oldType = question.type;
      question.type = type;
      
      // Only handle options reset if type actually changed
      if (oldType !== type) {
        handleQuestionTypeChange(question);
      }
    };

    const duplicateQuestion = (index) => {
      const original = questions.value[index];
      
      // Create a deep copy of the question
      const duplicate = JSON.parse(JSON.stringify(original));
      
      // Optionally modify the copy (e.g., add "Copy" to the question text)
      duplicate.text = `${original.text} (Copy)`;
      
      // Insert the copy after the original
      questions.value.splice(index + 1, 0, duplicate);
      
      // Show feedback
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      
      Toast.fire({
        icon: 'success',
        title: 'Question duplicated'
      });
    };

    const confirmRemoveQuestion = (index) => {
      Swal.fire({
        title: 'Remove Question?',
        text: 'This action cannot be undone',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        cancelButtonColor: '#9e9e9e',
        confirmButtonText: 'Yes, remove it'
      }).then((result) => {
        if (result.isConfirmed) {
          removeQuestion(index);
        }
      });
    };

    const removeQuestion = (index) => {
      questions.value.splice(index, 1);
    };

    const addOption = (question) => {
      if (!Array.isArray(question.options)) {
        question.options = [];
      }
      question.options.push('');
    };

    const removeOption = (question, optionIndex) => {
      question.options.splice(optionIndex, 1);
      if (question.correctAnswer === question.options[optionIndex]) {
        question.correctAnswer = '';
      }
    };

    const resetForm = () => {
      examData.value = {
        testCode: '',
        classCode: '',
        title: '',
        isDraft: false,
        userId: localStorage.getItem('userId'),
        durationMinutes: null,
        startDateTime: '',
        endDateTime: '',
        maxAttempts: null,
        attemptSpacing: null,
        studentExamHistory: true
      };
      questions.value = [];
      
      // Clear saved progress when form is reset
      clearLocalStorageProgress();
    };

    const getImageUrl = (imageUrl) => {
      return getFullImageUrl(imageUrl);
    };

    const loadBankQuestions = async () => {
      try {
        const response = await getQuestionBankItems();
        bankQuestions.value = response.questions;
      } catch (error) {
        console.error('Error loading bank questions:', error);
        Swal.fire('Error', 'Failed to load questions from bank', 'error');
      }
    };

    const bankFolders = computed(() => {
      // Create a map to store unique folders by ID
      const folderMap = new Map();
      
      // Process each question with a folder
      bankQuestions.value
        .filter(q => q.folder && q.folder.id)
        .forEach(q => {
          // Only add each folder once by using its ID as the map key
          if (!folderMap.has(q.folder.id)) {
            folderMap.set(q.folder.id, { 
              id: q.folder.id, 
              name: q.folder.name 
            });
          }
        });
      
      // Convert the map values to an array
      return Array.from(folderMap.values());
    });

    const bankSubjects = computed(() => {
      const subjects = new Set(bankQuestions.value
        .filter(q => q.subject)
        .map(q => q.subject));
      return Array.from(subjects);
    });

    const filteredBankQuestions = computed(() => {
      return bankQuestions.value.filter(q => {
        const matchesSearch = !bankSearchQuery.value || 
          q.questionText.toLowerCase().includes(bankSearchQuery.value.toLowerCase());
        
        const matchesFolder = !selectedBankFolder.value || 
          (q.folder && q.folder.id === selectedBankFolder.value);
        
        const matchesSubject = !selectedBankSubject.value || 
          q.subject === selectedBankSubject.value;
        
        const matchesDifficulty = !selectedBankDifficulty.value || 
          q.difficulty === selectedBankDifficulty.value;

        return matchesSearch && matchesFolder && matchesSubject && matchesDifficulty;
      });
    });

    const toggleQuestionSelection = (question) => {
      const index = selectedBankQuestions.value.indexOf(question.id);
      if (index === -1) {
        selectedBankQuestions.value.push(question.id);
      } else {
        selectedBankQuestions.value.splice(index, 1);
      }
    };

    const importSelectedQuestions = () => {
      const selectedQuestions = bankQuestions.value.filter(q => 
        selectedBankQuestions.value.includes(q.id)
      );

      // Add selected questions to the exam
      selectedQuestions.forEach(q => {
        questions.value.push({
          text: q.questionText,
          type: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          imageUrl: q.imageUrl
        });
      });

      closeQuestionBankModal();
      Swal.fire('Success', `${selectedQuestions.length} questions imported`, 'success');
    };

    const closeQuestionBankModal = () => {
      showQuestionBankModal.value = false;
      selectedBankQuestions.value = [];
      bankSearchQuery.value = '';
      selectedBankFolder.value = '';
      selectedBankSubject.value = '';
      selectedBankDifficulty.value = '';
    };

    const formatQuestionType = (type) => {
      const types = {
        multiple_choice: 'Multiple Choice',
        multipleChoice: 'Multiple Choice',
        true_false: 'True/False',
        enumeration: 'Enumeration'
      };
      return types[type] || type;
    };

    const generateTestCode = () => {
      // Generate a simple numeric code like Quizizz (6-8 digits)
      const codeLength = Math.floor(Math.random() * 3) + 6; // Random length between 6-8 digits
      let code = '';
      
      // First digit shouldn't be 0
      code += Math.floor(Math.random() * 9) + 1;
      
      // Generate the rest of the digits
      for (let i = 1; i < codeLength; i++) {
        code += Math.floor(Math.random() * 10);
      }
      
      examData.value.testCode = code;
    };

    // Add AI functions for exam creation
    const generateAIQuestions = async () => {
      const { value: formValues } = await Swal.fire({
        title: '<span class="ai-modal-title"><i class="material-icons">psychology</i> Generate AI Questions</span>',
        html: `
          <div class="ai-modal-container">
            <div class="ai-modal-intro">
              <p>Let AI assist you in creating exam questions. Provide the details below, and the AI will generate relevant questions for your exam.</p>
            </div>
            
            <div class="ai-form-fields">
              <div class="ai-form-group">
                <label for="swal-subject">Subject</label>
                <input id="swal-subject" class="swal2-input ai-input" placeholder="e.g., Mathematics">
              </div>
              
              <div class="ai-form-group">
                <label for="swal-topic">Topic</label>
                <input id="swal-topic" class="swal2-input ai-input" placeholder="e.g., Quadratic Equations">
              </div>
              
              <div class="ai-form-row">
                <div class="ai-form-group half">
                  <label for="swal-count">Number of Questions</label>
                  <select id="swal-count" class="swal2-select ai-select">
                    <option value="1">1</option>
                    <option value="3" selected>3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                  </select>
                </div>
                
                <div class="ai-form-group half">
                  <label for="swal-difficulty">Difficulty</label>
                  <select id="swal-difficulty" class="swal2-select ai-select">
                    <option value="easy">Easy</option>
                    <option value="medium" selected>Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              
              <div class="ai-form-group">
                <label for="swal-type">Question Type</label>
                <select id="swal-type" class="swal2-select ai-select">
                  <option value="multiple_choice" selected>Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="enumeration">Enumeration</option>
                </select>
              </div>
            </div>
          </div>
        `,
        customClass: {
          container: 'ai-modal-custom-container',
          popup: 'ai-modal-popup',
          header: 'ai-modal-header',
          title: 'ai-modal-title',
          closeButton: 'ai-modal-close',
          content: 'ai-modal-content',
          input: 'ai-modal-input',
          actions: 'ai-modal-actions',
          confirmButton: 'ai-modal-confirm',
          cancelButton: 'ai-modal-cancel',
          footer: 'ai-modal-footer',
          validationMessage: 'ai-modal-validation'
        },
        backdrop: 'rgba(0, 0, 0, 0.7)',
        showClass: {
          popup: 'animate__animated animate__fadeIn animate__faster'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOut animate__faster'
        },
        buttonsStyling: false,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '<i class="material-icons">auto_fix_high</i> Generate',
        cancelButtonText: '<i class="material-icons">close</i> Cancel',
        preConfirm: () => {
          return {
            subject: document.getElementById('swal-subject').value,
            topic: document.getElementById('swal-topic').value,
            count: document.getElementById('swal-count').value,
            difficulty: document.getElementById('swal-difficulty').value,
            type: document.getElementById('swal-type').value
          };
        }
      });

      if (!formValues) return;
      
      if (!formValues.subject || !formValues.topic) {
        Swal.fire({
          icon: 'error',
          title: 'Missing Information',
          text: 'Subject and topic are required to generate questions.',
          customClass: {
            popup: 'ai-modal-popup',
            title: 'ai-modal-title',
            content: 'ai-modal-content',
            confirmButton: 'ai-modal-confirm'
          },
          buttonsStyling: false
        });
        return;
      }

      try {
        Swal.fire({
          title: '<span class="ai-loading-title"><i class="material-icons rotating">settings</i> Generating Questions</span>',
          html: '<p class="ai-loading-text">Please wait while the AI generates your questions...</p><div class="ai-loading-progress"></div>',
          allowOutsideClick: false,
          showConfirmButton: false,
          customClass: {
            popup: 'ai-loading-popup',
            title: 'ai-loading-title',
            content: 'ai-loading-content'
          },
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const aiQuestions = await aiService.generateExamQuestions(
          formValues.subject,
          formValues.topic,
          Number(formValues.count),
          formValues.difficulty,
          formValues.type
        );

        // Add generated questions to the exam
        aiQuestions.forEach(q => {
          const newQuestion = {
            text: q.questionText || q.text || "Generated question",
            type: formValues.type === 'multiple_choice' ? 'multipleChoice' : 
                  formValues.type === 'true_false' ? 'true_false' : 'enumeration',
            options: Array.isArray(q.options) ? q.options.filter(opt => opt) : [],
            correctAnswer: q.correctAnswer || "",
            imageUrl: null
          };
          
          // Make sure all fields are defined to prevent trim() errors
          if (!newQuestion.text) newQuestion.text = "Generated question";
          if (!newQuestion.correctAnswer) newQuestion.correctAnswer = "";
          if (!Array.isArray(newQuestion.options)) newQuestion.options = [];
          
          // For multiple choice questions, ensure we have options
          if (newQuestion.type === 'multipleChoice' && newQuestion.options.length < 2) {
            newQuestion.options = ['Option A', 'Option B', 'Option C', 'Option D'];
            if (!newQuestion.correctAnswer) {
              newQuestion.correctAnswer = 'Option A';
            }
          }
          
          // For true/false, ensure correctAnswer is valid
          if (newQuestion.type === 'true_false') {
            newQuestion.correctAnswer = newQuestion.correctAnswer.toString().toLowerCase() === 'true' ? 'true' : 'false';
          }
          
          questions.value.push(newQuestion);
        });

        Swal.fire({
          icon: 'success',
          title: '<span class="ai-success-title">Questions Generated!</span>',
          html: `<p class="ai-success-text">${aiQuestions.length} questions have been added to your exam.</p>`,
          customClass: {
            popup: 'ai-success-popup',
            title: 'ai-success-title',
            content: 'ai-success-content',
            confirmButton: 'ai-success-confirm'
          },
          buttonsStyling: false
        });
      } catch (error) {
        console.error('AI question generation failed:', error);
        Swal.fire({
          icon: 'error',
          title: '<span class="ai-error-title">Generation Failed</span>',
          html: '<p class="ai-error-text">There was an error generating questions. Please try again later.</p>',
          customClass: {
            popup: 'ai-error-popup',
            title: 'ai-error-title',
            content: 'ai-error-content',
            confirmButton: 'ai-error-confirm'
          },
          buttonsStyling: false
        });
      }
    };

    const improveQuestionWithAI = async (question, index) => {
      try {
        const subject = examData.value.title.split(' ').pop() || 'General';
        
        Swal.fire({
          title: 'Improving Question',
          text: 'Please wait while the AI improves your question...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const improvedText = await aiService.improveQuestionWording(question.text, subject);
        
        // Update the question
        questions.value[index].text = improvedText;

        Swal.fire({
          icon: 'success',
          title: 'Question Improved!',
          text: 'The AI has improved your question wording.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('AI question improvement failed:', error);
        Swal.fire({
          icon: 'error',
          title: 'Improvement Failed',
          text: 'There was an error improving the question. Please try again later.'
        });
      }
    };

    const generateOptionsWithAI = async (question, index) => {
      if (question.type !== 'multipleChoice') return;
      
      if (!question.text) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Information',
          text: 'Please enter the question first.'
        });
        return;
      }
      
      // If no correct answer provided, we'll use AI to detect one
      if (!question.correctAnswer) {
        return detectOptionsWithAI(question, index);
      }

      try {
        Swal.fire({
          title: 'Generating Options',
          text: 'Please wait while the AI generates answer options...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const options = await aiService.generateMultipleChoiceOptions(
          question.text,
          question.correctAnswer
        );
        
        // Update the question's options
        questions.value[index].options = options;

        Swal.fire({
          icon: 'success',
          title: 'Options Generated!',
          text: 'The AI has generated answer options for your question.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('AI option generation failed:', error);
        Swal.fire({
          icon: 'error',
          title: 'Generation Failed',
          text: 'There was an error generating options. Please try again later.'
        });
      }
    };
    
    const detectOptionsWithAI = async (question, index) => {
      if (!question.text.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Missing Question',
          text: 'Please enter a question first.'
        });
        return;
      }

      try {
        Swal.fire({
          title: 'Analyzing Question',
          html: '<p>Please wait while the AI analyzes your question and determines the best answer format...</p><div class="ai-loading-progress"></div>',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Get the best question type and answer from AI
        const result = await aiService.detectQuestionTypeAndAnswer(question.text, question.type);
        
        if (result) {
          // If AI detected a different question type, ask user if they want to change it
          if (question.type && result.questionType && question.type !== result.questionType) {
            const { isConfirmed } = await Swal.fire({
              icon: 'question',
              title: 'Question Type Suggestion',
              html: `The AI suggests this may be better as a <b>${formatQuestionType(result.questionType)}</b> question. Would you like to change it?`,
              showCancelButton: true,
              confirmButtonText: 'Yes, change it',
              cancelButtonText: 'No, keep current type'
            });
            
            if (isConfirmed) {
              // Change the question type
              setQuestionType(question, result.questionType);
            } else if (result.questionType !== question.type) {
              // If user doesn't want to change type, reanalyze with forced type
              Swal.fire({
                title: 'Reanalyzing Question',
                html: '<p>Generating answer for your specified question type...</p><div class="ai-loading-progress"></div>',
                allowOutsideClick: false,
                didOpen: () => {
                  Swal.showLoading();
                }
              });
              
              const typeResult = await aiService.detectQuestionTypeAndAnswer(question.text, question.type);
              // Update result to use the forced type result
              Object.assign(result, typeResult);
            }
          }
          
          // Based on question type, update the fields
          if (result.questionType === 'multipleChoice' || question.type === 'multipleChoice') {
            if (result.options && result.options.length > 0) {
              questions.value[index].options = result.options;
              questions.value[index].correctAnswer = result.correctAnswer;
              
              Swal.fire({
                icon: 'success',
                title: 'Options Generated!',
                html: `
                  <p>The AI has generated multiple choice options with a suggested answer.</p>
                  <p style="margin-top:10px;font-weight:600;color:#388E3C">Suggested correct answer: ${result.correctAnswer}</p>
                `,
                timer: 3000,
                showConfirmButton: false
              });
            }
          } else if (result.questionType === 'true_false' || question.type === 'true_false') {
            // For true/false, just set the correct answer
            questions.value[index].correctAnswer = result.answer;
            
            Swal.fire({
              icon: 'success',
              title: 'Answer Detected!',
              html: `
                <p>The AI suggests the correct answer is:</p>
                <p style="margin-top:10px;font-weight:600;color:#388E3C;font-size:1.2rem;text-transform:uppercase;">${result.answer}</p>
              `,
              timer: 3000,
              showConfirmButton: false
            });
          } else if (result.questionType === 'enumeration' || question.type === 'enumeration') {
            // For enumeration, set the correct answer
            questions.value[index].correctAnswer = result.answer;
            
            Swal.fire({
              icon: 'success',
              title: 'Enumeration Items Detected!',
              html: `
                <p>The AI suggests these items for enumeration:</p>
                <p style="margin-top:10px;font-weight:600;color:#388E3C;line-height:1.5;">${result.answer}</p>
              `,
              timer: 3500,
              showConfirmButton: false
            });
          }
        } else {
          throw new Error('Failed to analyze question');
        }
      } catch (error) {
        console.error('AI question analysis failed:', error);
        Swal.fire({
          icon: 'error',
          title: 'Analysis Failed',
          text: 'There was an error analyzing the question. Please try again or manually set the answer.'
        });
      }
    };

    return {
      examData,
      questions,
      isEditing,
      isFormValid,
      addQuestion,
      removeQuestion,
      duplicateQuestion,
      confirmRemoveQuestion,
      addOption,
      removeOption,
      setQuestionType,
      handleSubmit,
      saveAsDraft,
      resetForm,
      handleQuestionTypeChange,
      handleImageUpload,
      removeImage,
      getImageUrl,
      showQuestionBankModal,
      bankQuestions,
      selectedBankQuestions,
      bankSearchQuery,
      selectedBankFolder,
      selectedBankSubject,
      selectedBankDifficulty,
      bankFolders,
      bankSubjects,
      filteredBankQuestions,
      toggleQuestionSelection,
      importSelectedQuestions,
      closeQuestionBankModal,
      formatQuestionType,
      saveProgressToLocalStorage,
      loadProgressFromLocalStorage,
      clearLocalStorageProgress,
      generateTestCode,
      generateAIQuestions,
      improveQuestionWithAI,
      generateOptionsWithAI,
      detectOptionsWithAI,
      activeSettingsTab,
      toggleSettingsTab,
      error,
      // Document upload related
      documentFileInput,
      documentFile,
      documentProcessing,
      documentResult,
      showDocumentUploadModal,
      triggerFileUpload,
      handleFileDrop,
      handleDocumentUpload,
      removeDocumentFile,
      processDocumentFile,
      formatFileSize,
      importDocumentQuestions,
      closeDocumentUploadModal,
      documentTab,
      documentText,
      processTextInput,
      availableAiModels,
      selectedAiModel,
      updatePreferredModel
    };
  }
};
</script>

<style scoped>
/* Update the container width */
.create-exam-container {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: hidden;
  overflow-x: hidden;
}

/* Keep the form width constrained for better readability */
.exam-form {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Fix the header background */
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
  right: 10%;
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

/* Update card styling to match other components */
.card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s;
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

.card-header .question-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.card-body {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.full-width {
  width: 100%;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #444;
}

input[type="text"],
textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  background-color: #ffffff;
}

input[type="text"]:focus,
textarea:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
  outline: none;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

small {
  display: block;
  margin-top: 5px;
  color: #757575;
  font-size: 0.85rem;
}

/* Questions Styling */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.question-item {
  background-color: white;
  border: none;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.question-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.question-header {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
  color: white;
  position: relative;
  overflow: hidden;
}

/* Add texture layer to question headers */
.question-header::before {
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

.question-number {
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.question-actions {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.question-actions button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.question-actions button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.question-content {
  padding: 20px;
}

/* Question Type Selector */
.question-type-selector {
  margin: 20px 0;
}

.type-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.type-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-button:hover {
  background-color: #e8f5e9;
  border-color: #81c784;
  color: #2e7d32;
}

.type-button.active {
  background-color: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.type-button .material-icons-round {
  font-size: 20px;
}

/* Options Styling */
.options-section {
  margin-top: 20px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 20px;
}

.options-header {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.options-header h4 {
  font-size: 1.1rem;
  color: #333;
  margin: 0;
  padding: 0;
}

.add-option-button {
  padding: 6px 12px;
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 4px;
  color: #2E7D32;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.add-option-button:hover {
  background-color: #f1f8e9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.2);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #bdbdbd;
}

.option-item.correct-answer {
  border-color: #4CAF50;
  background-color: #f1f8e9;
}

.option-radio {
  display: flex;
  align-items: center;
  gap: 6px;
}

.option-input {
  flex: 1;
}

.remove-option-button {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  padding: 5px;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.remove-option-button:hover {
  opacity: 1;
}

/* True/False Styling */
.true-false-section {
  margin-top: 20px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 20px;
}

.true-false-section h4 {
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: #444;
}

.true-false-options {
  display: flex;
  gap: 20px;
}

.true-false-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Short Answer Styling */
.short-answer-section {
  margin-top: 20px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 20px;
}

/* Badge */
.badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background-color: #e8f5e9;
  color: #2E7D32;
}

/* Add Question Button */
.add-question-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 20px;
  background-color: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 16px;
  color: #666;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.add-question-button:hover {
  background-color: #e0e0e0;
  border-color: #999;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
.draft-button,
.publish-button {
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

.draft-button {
  background: linear-gradient(135deg, #2196F3, #1976d2);
  color: white;
  box-shadow: 0 4px 10px rgba(33, 150, 243, 0.3);
}

.draft-button::before {
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

.draft-button:hover {
  background: linear-gradient(135deg, #1976d2, #0d47a1);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(33, 150, 243, 0.4);
}

.publish-button {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}

.publish-button::before {
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

.publish-button:hover {
  background: linear-gradient(135deg, #388E3C, #2E7D32);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
}

.reset-button .material-icons-round,
.draft-button .material-icons-round,
.publish-button .material-icons-round {
  position: relative;
  z-index: 1;
  font-size: 22px;
}

.reset-button span:not(.material-icons-round),
.draft-button span:not(.material-icons-round),
.publish-button span:not(.material-icons-round) {
  position: relative;
  z-index: 1;
}

/* Transitions */
.question-transition-enter-active,
.question-transition-leave-active,
.option-transition-enter-active,
.option-transition-leave-active {
  transition: all 0.4s ease;
}

.question-transition-enter-from,
.option-transition-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.question-transition-leave-to,
.option-transition-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* Loading spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

.rotating {
  animation: spin 2s linear infinite;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
 .create-exam-container {
    padding: 0rem;
  }
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .type-buttons {
    flex-direction: column;
  }
  
  .type-button {
    width: 100%;
  }
  
  .form-actions {
    flex-direction: column-reverse;
    gap: 15px;
    padding: 15px;
  }
  
  .action-buttons {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .reset-button,
  .draft-button,
  .publish-button {
    width: 100%;
    justify-content: center;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .question-count {
    align-self: flex-start;
  }
  
  .true-false-options {
    flex-direction: column;
    gap: 10px;
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

  /* Question form adjustments */
  .question-item {
    margin: 0 0 15px 0;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  }

  .question-content {
    padding: 15px;
  }

  /* Make textarea bigger on mobile */
  .question-content textarea {
    min-height: 120px;
    font-size: 16px; /* Prevent zoom on iOS */
    padding: 12px;
  }

  /* Adjust question type buttons */
  .type-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .type-button {
    flex: 1;
    min-width: 150px;
    padding: 10px;
    font-size: 0.9rem;
  }

  /* Options adjustments */
  .options-section {
    margin-top: 15px;
    padding-top: 15px;
  }

  .option-item {
    padding: 8px;
    gap: 8px;
  }

  .option-item input[type="text"] {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  /* Image upload section */
  .image-upload-container {
    min-height: 120px;
  }

  .upload-label .material-icons-round {
    font-size: 2rem;
  }

  /* True/False section */
  .true-false-options {
    flex-direction: row;
    gap: 20px;
    justify-content: center;
  }

  .true-false-option {
    flex: 1;
    max-width: 150px;
  }

  /* Enumeration section */
  .short-answer-section input {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  /* Question actions */
  .question-header {
    padding: 12px;
    flex-direction: row;
    align-items: center;
  }

  .question-actions {
    gap: 6px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }

  /* Card body spacing */
  .card-body {
    padding: 10px;
  }

  /* Questions list spacing */
  .questions-list {
    gap: 10px;
    margin: 0;
    padding: 0;
  }

  /* Form elements size adjustments */
  input[type="text"],
  textarea,
  select {
    padding: 8px;
    font-size: 14px;
    height: 38px;
  }

  textarea {
    min-height: 80px;
    height: auto;
  }

  .form-group {
    margin-bottom: 8px;
  }

  label {
    font-size: 0.85rem;
    margin-bottom: 4px;
  }

  /* Button adjustments */
  button {
    height: 38px;
    min-height: 38px;
    padding: 0 12px;
  }

  .add-question-button,
  .import-question-button {
    padding: 10px;
    font-size: 0.9rem;
  }

  .generate-button {
    height: 38px;
    width: 38px;
    padding: 0;
  }

  /* Options adjustments */
  .option-item {
    min-height: 38px;
  }

  .option-item input[type="radio"] {
    width: 18px;
    height: 18px;
  }

  .remove-option-btn {
    width: 24px;
    height: 24px;
  }

  /* Action buttons */
  .action-buttons button {
    height: 42px;
    padding: 0 16px;
  }

  /* Card adjustments */
  .card-body {
    padding: 8px;
  }

  .form-row {
    gap: 8px;
    margin-bottom: 8px;
  }
  
  /* Toggle switch mobile adjustments */
  .toggle-switch-container {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .toggle-switch {
    align-self: flex-end;
  }
  
  .toggle-text {
    font-size: 0.9rem;
  }
  
  .toggle-label small {
    font-size: 0.8rem;
  }

  /* Question type buttons */
  .type-button {
    height: 38px;
    padding: 0 10px;
    font-size: 0.85rem;
  }

  .type-button .material-icons-round {
    font-size: 18px;
  }

  /* Question input with detect button */
.question-input-wrapper {
  position: relative;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.question-input-wrapper textarea {
  width: 100%;
  min-height: 120px;
  resize: vertical;
  margin-bottom: 8px;
}

.detect-options-btn {
  position: relative;
  align-self: flex-end;
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  margin-top: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
  z-index: 5;
  max-width: fit-content;
  height: auto;
  min-height: 42px;
}

.detect-options-btn:hover {
  background: linear-gradient(135deg, #388E3C, #2E7D32);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.detect-options-btn .material-icons {
    font-size: 18px;
  }

  /* Icons size */
  .material-icons,
  .material-icons-round {
    font-size: 20px;
  }
}

/* Add iOS-specific fixes */
@supports (-webkit-touch-callout: none) {
  input, 
  textarea, 
  select {
    font-size: 16px !important;
  }
}

/* Add this to your existing styles */
.uppercase-input {
  text-transform: uppercase;
}

.uppercase-input::placeholder {
  text-transform: none;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.error {
  border-color: #f44336;
}

.error-text {
  color: #f44336;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Add to your existing styles */
.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn .material-icons-round {
  font-size: 20px;
}

.add-question-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background-color: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 8px;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.add-question-button .material-icons-round {
  font-size: 24px;
}

.add-question-button:hover {
  background-color: #e0e0e0;
  border-color: #999;
}

.add-option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  background-color: white;
  color: #388E3C;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.95rem;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.1);
  height: auto;
  min-height: 42px;
}

.add-option-btn .material-icons-round {
  font-size: 20px;
}

.remove-option-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background-color: #ffebee;
  color: #c62828;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.remove-option-btn .material-icons-round {
  font-size: 18px;
}

.action-buttons button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-buttons .material-icons-round {
  font-size: 20px;
}

/* Make sure icons are vertically aligned */
.material-icons-round {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Add these new styles for image upload */
.image-upload-section {
  margin-bottom: 20px;
}

.image-upload-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 150px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background-color: #f9f9f9;
  transition: all 0.3s;
}

.image-upload-container:hover {
  border-color: #4CAF50;
  background-color: #f0f9f0;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 15px;
  color: #4CAF50;
  font-weight: 500;
  transition: all 0.3s;
}

.upload-label:hover {
  color: #2E7D32;
}

.upload-label .material-icons-round {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.remove-image-btn:hover {
  background-color: rgba(244, 67, 54, 0.8);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.import-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.wide-modal .modal-content {
  max-width: 900px;
}

.bank-questions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.bank-question-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  padding: 15px;
}

.bank-question-card .question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bank-question-card .question-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
  margin-bottom: 12px;
}

.bank-question-card .question-image {
  position: relative;
  width: 100%;
  margin: 10px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
}

.bank-question-card .question-image img {
  width: 100%;
  height: 150px;
  object-fit: contain;
  display: block;
  background: #f5f5f5;
}

.bank-question-card .question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.bank-question-card:hover {
  border-color: #2196F3;
  transform: translateX(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bank-question-card.selected {
  border-color: #4CAF50;
  background: #f1f8e9;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.difficulty-badge.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.difficulty-badge.medium {
  background: #fff3e0;
  color: #f57c00;
}

.difficulty-badge.hard {
  background: #fbe9e7;
  color: #d84315;
}

.selection-info {
  color: #666;
  font-size: 0.9rem;
}

.filters-section {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  margin-bottom: 15px;
}

.search-box input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-box .material-icons {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.filter-group select {
  flex: 1;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* Side Panel Styles */
.side-panel {
  position: fixed;
  top: 0;
  right: -500px;
  width: 500px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
  z-index: 1000;
}

.side-panel.is-open {
  right: 0;
}

.side-panel-header {
  padding: 20px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.side-panel-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
}

.side-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.side-panel-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #333;
  cursor: pointer;
}

.import-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.bank-questions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.bank-question-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  padding: 15px;
}

.bank-question-card .question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bank-question-card .question-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
  margin-bottom: 12px;
}

.bank-question-card .question-image {
  position: relative;
  width: 100%;
  margin: 10px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
}

.bank-question-card .question-image img {
  width: 100%;
  height: 150px;
  object-fit: contain;
  display: block;
  background: #f5f5f5;
}

.bank-question-card .question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.bank-question-card:hover {
  border-color: #2196F3;
  transform: translateX(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bank-question-card.selected {
  border-color: #4CAF50;
  background: #f1f8e9;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.difficulty-badge.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.difficulty-badge.medium {
  background: #fff3e0;
  color: #f57c00;
}

.difficulty-badge.hard {
  background: #fbe9e7;
  color: #d84315;
}

.selection-info {
  color: #666;
  font-size: 0.9rem;
}

.filters-section {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.import-btn:hover:not(:disabled) {
  background: #388E3C;
}

.import-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.selection-info {
  color: #666;
  font-size: 0.9rem;
}

/* Remove the modal styles */
.modal,
.modal-content,
.wide-modal,
.bank-questions-grid {
  display: none;
}

.questions-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
}

.import-question-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.import-question-button {
  background-color: #e3f2fd;
  border: 2px dashed #2196F3;
  color: #1976D2;
}

.import-question-button:hover {
  background-color: #bbdefb;
  border-color: #1976D2;
  transform: translateY(-2px);
}

.material-icons,
.material-icons-round {
  font-size: 24px;
}

/* Add styles for the input with button */
.input-with-button {
  display: flex;
  align-items: center;
}

.input-with-button input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.generate-button {
  height: 42px;
  padding: 0 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.generate-button:hover {
  background: #388E3C;
}

.generate-button .material-icons {
  font-size: 20px;
}

/* Update Side Panel Styles */
.side-panel {
  position: fixed;
  top: 0;
  right: -100%;
  width: 500px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
  z-index: 1000;
}

/* Add responsive adjustments */
@media (max-width: 768px) {
  .side-panel {
    width: 100%;
    right: -100%;
  }

  .side-panel-content {
    padding: 10px;
  }

  .bank-question-card {
    padding: 10px;
  }

  .bank-question-card:hover {
    transform: none;
  }

  .filters-section {
    padding: 10px;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-group select {
    width: 100%;
  }

  .side-panel-footer {
    padding: 10px;
  }

  .import-btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .selection-info {
    font-size: 0.8rem;
  }
}

.ai-generate-button {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  padding: 16px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  width: 100%;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
}

.ai-generate-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
  opacity: 0.5;
  z-index: 0;
}

.ai-generate-button:hover {
  background: linear-gradient(135deg, #388E3C, #2E7D32);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

.ai-improve-btn {
  background-color: #4CAF50;
  color: white;
}

.ai-improve-btn:hover {
  background-color: #388E3C;
}

.ai-options-btn {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
  height: auto;
  min-height: 42px;
}

.ai-options-btn:hover {
  background: linear-gradient(135deg, #388E3C, #2E7D32);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.ai-options-btn .material-icons-round {
  font-size: 20px;
}

.option-header-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

/* SweetAlert custom styling */
:global(.swal-form-group) {
  margin-bottom: 1rem;
  text-align: left;
}

:global(.swal-form-group label) {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #333;
}

:global(.swal2-select) {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Document upload button */
.document-upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #f0f4c3;
  border: 2px dashed #cddc39;
  color: #827717;
}

.document-upload-button:hover {
  background-color: #e6ee9c;
  border-color: #827717;
  transform: translateY(-2px);
}

/* Document panel styles */
.document-panel {
  width: 600px;
}

.upload-instructions {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.upload-instructions p {
  margin: 0 0 10px 0;
}

.upload-instructions p.smaller {
  font-size: 0.9rem;
  color: #666;
}

.document-upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: all 0.3s;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-upload-area:hover {
  border-color: #4CAF50;
  background-color: #f0f9f0;
}

.large-icon {
  font-size: 48px;
  color: #bbb;
  margin-bottom: 15px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-info {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 8px;
}

.file-icon {
  font-size: 36px;
  margin-right: 15px;
  color: #4CAF50;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: 500;
  margin-bottom: 5px;
}

.file-size {
  color: #666;
  font-size: 0.9rem;
}

.remove-file-btn {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
}

.processing-status {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 8px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #bbdefb;
  border-top-color: #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.document-result {
  margin-top: 20px;
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.result-header {
  margin-bottom: 15px;
}

.result-header h3 {
  margin: 0;
}

.result-questions {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.result-question-item {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.result-question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.question-number {
  font-weight: 500;
}

.question-type {
  font-size: 0.85rem;
  background-color: #f5f5f5;
  padding: 3px 8px;
  border-radius: 12px;
}

.question-text {
  margin-bottom: 15px;
}

.question-options p, .question-answer p {
  margin: 5px 0;
  padding: 8px;
  border-radius: 4px;
}

.correct-answer {
  background-color: #e8f5e9;
  font-weight: 500;
}

.side-panel-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #333;
  cursor: pointer;
}

.import-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Responsive styles for document upload */
@media (max-width: 768px) {
  .document-panel {
    width: 100%;
  }
  
  .document-upload-area {
    padding: 15px;
    min-height: 150px;
  }
  
  .large-icon {
    font-size: 36px;
  }
  
  .result-questions {
    max-height: 300px;
  }
}

/* AI Modal Styling - Updated to match theme */
:global(.ai-modal-custom-container) {
  padding: 0;
}

:global(.ai-modal-popup) {
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background: #ffffff;
  border: none;
  max-width: 500px;
  width: 95%;
  padding: 0;
  overflow: visible;
  margin: 20px auto;
  position: relative;
}

:global(.ai-modal-header) {
  padding: 20px 20px 12px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  position: relative;
  border-bottom: none;
}

:global(.ai-modal-header::before) {
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

:global(.ai-modal-title) {
  font-size: 1.7rem;
  color: #ffffff;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

:global(.ai-modal-title i) {
  color: #ffffff;
  font-size: 1.7rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

:global(.ai-modal-content) {
  padding: 25px;
  overflow: hidden;
}

:global(.ai-modal-intro) {
  margin-bottom: 25px;
  color: #444;
  background-color: #e8f5e9;
  padding: 18px;
  border-radius: 12px;
  border-left: 5px solid #4CAF50;
  box-shadow: 0 3px 10px rgba(76, 175, 80, 0.1);
  font-size: 1.05rem;
  line-height: 1.5;
}

:global(.ai-form-fields) {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 100%;
}

:global(.ai-form-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:global(.ai-form-group label) {
  font-weight: 600;
  color: #444;
  font-size: 1rem;
  margin-bottom: 5px;
}

:global(.ai-form-row) {
  display: flex;
  gap: 15px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

:global(.ai-form-group.half) {
  flex: 1;
}

:global(.ai-input) {
  padding: 12px 15px !important;
  border-radius: 10px !important;
  border: 2px solid #e0e0e0 !important;
  background-color: #ffffff !important;
  transition: all 0.3s ease !important;
  font-size: 1rem !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important;
  outline: none !important;
}

:global(.ai-input:focus) {
  border-color: #4CAF50 !important;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.15) !important;
  background-color: #fff !important;
}

:global(.ai-input::placeholder) {
  color: #aaa !important;
}

:global(.ai-select) {
  padding: 12px 15px !important;
  border-radius: 10px !important;
  border: 2px solid #e0e0e0 !important;
  background-color: #ffffff !important;
  transition: all 0.3s ease !important;
  font-size: 1rem !important;
  height: auto !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
  cursor: pointer !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234CAF50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 12px center !important;
  background-size: 16px !important;
  padding-right: 40px !important;
}

:global(.ai-select:focus) {
  border-color: #4CAF50 !important;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.15) !important;
  background-color: #fff !important;
}

:global(.ai-modal-actions) {
  padding: 15px 20px;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background-color: #fafafa;
  width: 100%;
  box-sizing: border-box;
}

:global(.ai-modal-confirm) {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

:global(.ai-modal-confirm:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  background: linear-gradient(135deg, #388E3C, #2E7D32);
}

:global(.ai-modal-cancel) {
  background-color: #f5f5f5;
  color: #444;
  border: 1px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  transition: all 0.2s;
}

:global(.ai-modal-cancel:hover) {
  background-color: #eeeeee;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

/* Loading Modal */
:global(.ai-loading-popup) {
  border-radius: 16px;
  width: 420px;
  padding: 35px;
  background: #ffffff;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

:global(.ai-loading-title) {
  color: #4CAF50;
  font-size: 1.5rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  font-weight: 700;
}

:global(.ai-loading-text) {
  color: #555;
  text-align: center;
  margin-bottom: 25px;
  font-size: 1.1rem;
  line-height: 1.5;
}

:global(.ai-loading-progress) {
  height: 6px;
  background: linear-gradient(to right, #4CAF50, #81c784);
  border-radius: 3px;
  width: 100%;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
}

:global(.ai-loading-progress::after) {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.8),
    rgba(255, 255, 255, 0.2)
  );
  animation: shimmer 1.5s infinite;
}

/* Success Modal */
:global(.ai-success-popup) {
  border-radius: 16px;
  width: 420px;
  padding: 35px;
  background: #ffffff;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

:global(.ai-success-title) {
  color: #4CAF50;
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 700;
  text-align: center;
}

:global(.ai-success-text) {
  color: #555;
  text-align: center;
  margin-bottom: 25px;
  font-size: 1.1rem;
  line-height: 1.5;
}

:global(.ai-success-confirm) {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  border: none;
  padding: 13px 30px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  margin: 0 auto;
  display: block;
}

:global(.ai-success-confirm:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
}

/* Error Modal */
:global(.ai-error-popup) {
  border-radius: 16px;
  width: 420px;
  padding: 35px;
  background: #ffffff;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

:global(.ai-error-title) {
  color: #f44336;
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-weight: 700;
  text-align: center;
}

:global(.ai-error-text) {
  color: #555;
  text-align: center;
  margin-bottom: 25px;
  font-size: 1.1rem;
  line-height: 1.5;
}

:global(.ai-error-confirm) {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
  border: none;
  padding: 13px 30px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
  margin: 0 auto;
  display: block;
}

:global(.ai-error-confirm:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(244, 67, 54, 0.4);
}

/* Mobile optimization for AI Modal */
@media (max-width: 768px) {
  :global(.ai-modal-popup) {
    width: 92%;
    margin: 10px auto;
    max-height: 90vh;
    overflow: visible;
  }
  
  :global(.ai-modal-container) {
    overflow: hidden;
    width: 100%;
  }
  
  :global(.ai-modal-header) {
    padding: 18px 15px 10px;
  }
  
  :global(.ai-modal-content) {
    padding: 15px;
  }
  
  :global(.ai-modal-intro) {
    padding: 12px;
    margin-bottom: 15px;
    font-size: 0.9rem;
  }
  
  :global(.ai-form-row) {
    flex-direction: column;
    gap: 12px;
  }
  
  :global(.ai-form-fields) {
    gap: 15px;
  }
  
  :global(.ai-modal-title) {
    font-size: 1.3rem;
  }
  
  :global(.ai-modal-title i) {
    font-size: 1.3rem;
  }
  
  :global(.ai-form-group) {
    gap: 5px;
  }
  
  :global(.ai-form-group label) {
    font-size: 0.9rem;
  }
  
  :global(.ai-input), 
  :global(.ai-select) {
    font-size: 16px !important; /* Prevents iOS zoom */
    padding: 10px 12px !important;
    border-radius: 8px !important;
  }
  
  :global(.ai-select) {
    padding-right: 35px !important;
  }
  
  :global(.ai-modal-actions) {
    padding: 15px;
    flex-direction: column-reverse;
    gap: 10px;
  }
  
  :global(.ai-modal-confirm),
  :global(.ai-modal-cancel) {
    width: 100%;
    justify-content: center;
    padding: 12px;
    font-size: 0.95rem;
    border-radius: 8px;
  }
  
  :global(.ai-loading-popup),
  :global(.ai-success-popup),
  :global(.ai-error-popup) {
    width: 90%;
    padding: 20px;
  }
  
  :global(.ai-loading-title),
  :global(.ai-success-title),
  :global(.ai-error-title) {
    font-size: 1.2rem;
  }
  
  :global(.ai-loading-text),
  :global(.ai-success-text),
  :global(.ai-error-text) {
    font-size: 0.9rem;
    margin-bottom: 15px;
  }
  
  :global(.ai-success-confirm),
  :global(.ai-error-confirm) {
    width: 100%;
    padding: 10px;
    font-size: 0.95rem;
    border-radius: 8px;
  }
}

/* Icons size */
.material-icons,
.material-icons-round {
  font-size: 20px;
}

/* Mobile styling for detect options button */
@media (max-width: 768px) {
  .detect-options-btn {
    font-size: 0.8rem;
    padding: 6px 10px;
    width: 100%;
    justify-content: center;
    max-width: 100%;
    margin-top: 5px;
  }
  
  .detect-options-btn .material-icons {
    font-size: 16px;
  }
  
  .question-input-wrapper {
    gap: 5px;
  }
  
  .question-input-wrapper textarea {
    min-height: 100px;
    margin-bottom: 0;
  }
}

/* AI component mobile improvements */
.ai-generate-button {
  padding: 15px 12px;
  gap: 8px;
  border-radius: 12px;
  margin-bottom: 10px;
}

.ai-generate-button span:not(.material-icons) {
  font-size: 1rem;
}

.ai-improve-btn,
.ai-options-btn {
  width: auto;
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.options-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.option-header-buttons {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.questions-actions {
  padding: 12px;
  gap: 8px;
}

:global(.ai-modal-container) {
  width: 100%;
  overflow: hidden;
}

:global(.ai-form-fields) {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 100%;
}

/* Exam Settings Styles */
.settings-section {
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #eee;
}

.settings-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.settings-section h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #444;
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-section h3 i {
  color: #159750;
}

/* Settings toggle buttons */
.settings-toggles {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.settings-toggle {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.1);
  color: white;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-toggle:hover {
  background: rgba(255,255,255,0.2);
}

.settings-toggle.active {
  background: rgba(255,255,255,0.25);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.4);
}

.settings-toggle i {
  font-size: 16px;
}

/* Card header with tabs */
.exam-settings-card .card-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* Responsive adjustments for settings sections */
@media (max-width: 768px) {
  .settings-section {
    margin-bottom: 15px;
    padding-bottom: 15px;
  }
  
  .settings-section h3 {
    font-size: 1.1rem;
    margin-bottom: 10px;
  }
  
  .settings-toggles {
    width: 100%;
    justify-content: space-between;
  }
  
  .settings-toggle {
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    font-size: 0.75rem;
    justify-content: center;
  }
  
  .settings-toggle i {
    font-size: 14px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
}

/* Add iOS-specific fixes */
@supports (-webkit-touch-callout: none) {
  input, 
  textarea, 
  select {
    font-size: 16px !important;
  }
}

/* Add this to your existing styles */
.uppercase-input {
  text-transform: uppercase;
}

.uppercase-input::placeholder {
  text-transform: none;
}

/* Document tabs styling */
.document-tabs {
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.tab-button {
  flex: 1;
  padding: 12px;
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.tab-button.active {
  background: #4CAF50;
  color: white;
}

.tab-button:hover:not(.active) {
  background: #e0e0e0;
}

.tab-button .material-icons {
  font-size: 20px;
}

/* Text input area styling */
.text-input-area {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.document-text-input {
  width: 100%;
  min-height: 200px;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  transition: all 0.3s;
}

.document-text-input:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.analyze-text-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-end;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.analyze-text-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #388E3C, #2E7D32);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.analyze-text-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
}

/* Extracted result styling enhancements */
.result-questions {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.result-question-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.result-question-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.result-question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.question-options p.correct-answer {
  font-weight: 600;
  color: #4CAF50;
}

/* Processing status spinner */
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4CAF50;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.processing-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: 20px;
}

/* Toggle Switch Styling */
.toggle-switch-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.toggle-label {
  flex: 1;
  cursor: pointer;
}

.toggle-text {
  display: block;
  font-weight: 600;
  color: #444;
  margin-bottom: 8px;
  font-size: 1rem;
}

.toggle-label small {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.4;
}

.toggle-switch {
  position: relative;
  width: 60px;
  height: 34px;
  flex-shrink: 0;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 34px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background: linear-gradient(135deg, #4CAF50, #388E3C);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(26px) translateY(-50%);
}

.toggle-input:focus + .toggle-slider {
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

/* Model selection styling */
.model-selection {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #e3f2fd;
  border-radius: 8px;
  border: 2px solid #90caf9;
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.1);
  position: relative;
}

.model-selection::before {
  content: 'AI MODEL';
  position: absolute;
  top: -10px;
  left: 15px;
  background-color: #2196f3;
  color: white;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.model-selection label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #0d47a1;
}

.model-selection select {
  width: 100%;
  padding: 12px;
  border: 1px solid #90caf9;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.model-selection select:hover {
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.model-selection select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
}

.model-selection small {
  display: block;
  margin-top: 8px;
  color: #666;
  font-size: 0.85rem;
}

/* Update document tabs to appear after model selection */
.document-tabs {
  margin-top: 5px;
}

/* Extra small mobile devices */
@media (max-width: 480px) {
  .settings-toggle {
    padding: 4px 6px;
    font-size: 0.7rem;
  }
  
  .settings-toggle i {
    font-size: 12px;
  }
  
  .card-header h2 {
    font-size: 1.3rem;
  }
  
  .settings-toggles {
    gap: 6px;
  }
}
</style>