<template>
  <div class="create-exam-container">
    <!-- Add back button for edit mode -->
    <div v-if="isEditing" class="back-button-container">
      <button 
        type="button" 
        class="back-button"
        @click="goBack"
        title="Go back to previous page"
      >
        <span class="material-icons">arrow_back</span>
        <span class="back-text">Back</span>
      </button>
    </div>

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
              <label for="subjectSelect">Subject</label>
              <select 
                v-model="selectedSubjectId" 
                id="subjectSelect" 
                class="form-select"
                :disabled="loadingSubjects"
              >
                <option value="">Select a subject (optional)</option>
                <option 
                  v-for="subject in teacherSubjects" 
                  :key="subject.subject.id" 
                  :value="subject.subject.id"
                >
                  {{ subject.subject.name }} ({{ subject.subject.code }})
                </option>
              </select>
              <small v-if="loadingSubjects">Loading subjects...</small>
              <small v-else>Select the subject this exam is for (optional)</small>
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
      
      <!-- Parts Section -->
      <div class="card exam-parts-card">
        <div class="card-header">
          <h2><i class="fas fa-layer-group"></i> Exam Parts</h2>
        </div>
        <div class="card-body">
          <div class="parts-section">
            <div class="parts-header">
              <p class="parts-description">Organize questions into sections. Optional but recommended for structured exams.</p>
              <button 
                type="button" 
                class="add-part-btn"
                @click="addPart"
              >
                <span class="material-icons-round">add_circle</span>
                Add Part
              </button>
            </div>
            
            <div v-if="parts.length === 0" class="no-parts">
              <div class="empty-state">
                <div class="empty-icon">
                  <i class="fas fa-layer-group"></i>
                </div>
                <p>No parts defined</p>
                <p class="empty-subtext">Optional - questions can exist without parts</p>
              </div>
            </div>
            
            <transition-group name="part-transition" tag="div" class="parts-list">
              <div 
                v-for="(part, index) in parts" 
                :key="index" 
                class="part-item"
              >
                <div class="part-header">
                  <span class="part-number">Part {{ index + 1 }}</span>
                  <div class="part-actions">
                    <button 
                      type="button" 
                      class="action-btn remove-btn" 
                      @click="removePart(index)"
                      title="Remove part"
                    >
                      <span class="material-icons-round">delete</span>
                    </button>
                  </div>
                </div>
                
                <div class="part-content">
                  <div class="form-group">
                    <label>Part Label</label>
                    <input 
                      v-model="part.label" 
                      type="text" 
                      placeholder="e.g., Part I: Multiple Choice"
                      required
                    />
                    <small>Descriptive label for this part (e.g., "Multiple Choice", "Problem Solving")</small>
                  </div>
                </div>
              </div>
            </transition-group>
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
                      {{ question.type === 'multipleChoice' ? 'AI: Generate Options' : 
                         question.type === 'true_false' ? 'AI: Detect Answer' : 
                         question.type === 'enumeration' ? 'AI: Detect Answer' :
                         question.type === 'essay' ? 'AI: Improve Question' : 'AI: Analyze Question' }}
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
                    
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.type === 'essay' }"
                      @click="setQuestionType(question, 'essay')"
                    >
                      <span class="material-icons-round">description</span>
                      Essay
                    </button>
                  </div>
                </div>
                
                <!-- Question Points and Part Assignment -->
                <div class="form-row">
                  <div class="form-group">
                    <label>Points</label>
                    <input 
                      v-model.number="question.points" 
                      type="number" 
                      min="1"
                      max="100"
                      placeholder="Enter points for this question"
                      required
                    />
                    <small>Number of points this question is worth (1-100)</small>
                  </div>
                  
                  <div class="form-group" v-if="parts.length > 0">
                    <label>Assign to Part</label>
                    <select 
                      v-model="question.partId" 
                      class="part-select"
                    >
                      <option value="">No Part (Standalone)</option>
                      <option 
                        v-for="(part, partIndex) in parts" 
                        :key="partIndex" 
                        :value="(part.id || (partIndex + 1)).toString()"
                      >
                        {{ part.label }}
                      </option>
                    </select>
                    <small>Optional: Assign this question to a specific part</small>
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
                
                <!-- Essay Section -->
                <div v-if="question.type === 'essay'" class="essay-section">
                  <div class="essay-info">
                    <div class="essay-notice">
                      <span class="material-icons-round">info</span>
                      <div>
                        <p><strong>Essay Question</strong></p>
                        <p>This question will require manual scoring by the teacher. Students will provide written responses that cannot be automatically graded.</p>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Word Limit Input -->
                  <div class="word-limit-section">
                    <label for="wordLimit" class="word-limit-label">
                      <span class="material-icons-round">text_fields</span>
                      Word Limit (Optional)
                    </label>
                    <div class="word-limit-input-container">
                      <input
                        v-model.number="question.wordLimit"
                        type="number"
                        id="wordLimit"
                        min="1"
                        max="10000"
                        placeholder="e.g., 500"
                        class="word-limit-input"
                      />
                      <span class="word-limit-unit">words</span>
                    </div>
                    <p class="word-limit-help">Set a maximum word count for student responses. Leave empty for no limit.</p>
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
              <p class="smaller">PDF format</p>
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
import { createExam, fetchTeacherExams, updateExam, uploadImage, getFullImageUrl, getQuestionBankItems, getTeacherAssignedSubjects } from '../../services/authService';
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
    const parts = ref([]);
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
    
    // Teacher subjects data
    const teacherSubjects = ref([]);
    const selectedSubjectId = ref('');
    const loadingSubjects = ref(false);

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
      
      // Load teacher subjects
      await loadTeacherSubjects();
      
      const examId = route.query.examId;
      if (examId) {
        isEditing.value = true;
        try {
          const exams = await fetchTeacherExams();
          const exam = exams.find(e => e.id === parseInt(examId));
          if (exam) {
            examData.value = {
              testCode: exam.testCode,
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
            
            // Set selected subject if classCode matches a subject code
            if (exam.classCode && teacherSubjects.value.length > 0) {
              const matchingSubject = teacherSubjects.value.find(s => s.subject.code === exam.classCode);
              if (matchingSubject) {
                selectedSubjectId.value = matchingSubject.subject.id.toString();
              }
            }
            questions.value = exam.questions.map(q => ({
              text: q.questionText,
              type: q.questionType,
              options: Array.isArray(q.options) ? q.options : [],
              correctAnswer: q.correctAnswer,
              imageUrl: q.imageUrl ? '/uploads/' + q.imageUrl.split('/').pop() : null, // Fix image URL format
              points: q.points || 1, // Include points, default to 1 if not present
              partId: q.partId ? q.partId.toString() : '', // Convert partId to string to match dropdown values
              wordLimit: q.wordLimit || null // Include wordLimit if present
            }));
            
            // Load parts if they exist
            if (exam.parts && Array.isArray(exam.parts)) {
              parts.value = exam.parts.map(p => ({
                id: p.id, // Preserve the database ID
                label: p.label,
                order: p.order
              }));
            }
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

    const goBack = () => {
      router.go(-1);
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
          imageUrl: null,
          points: extractedQuestion.points || 1,
          partId: ''
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

    watch(() => selectedSubjectId.value, () => {
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

    // Watch for changes in parts array to save progress
    watch(parts, () => {
      saveProgressToLocalStorage();
    }, { deep: true });

    // Save exam creation progress to local storage
    const saveProgressToLocalStorage = () => {
      if (isEditing.value) return; // Don't save if editing an existing exam
      
      // Only save if there's meaningful data entered
      const hasExamData = examData.value.testCode || examData.value.title || selectedSubjectId.value;
      const hasQuestions = questions.value.length > 0;
      
      if (!hasExamData && !hasQuestions) return; // Don't save empty forms
      
      const progress = {
        examData: examData.value,
        questions: questions.value,
        parts: parts.value,
        selectedSubjectId: selectedSubjectId.value
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
          parts.value = progress.parts || [];
          if (progress.selectedSubjectId) {
            selectedSubjectId.value = progress.selectedSubjectId;
          }
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
        if (!examData.value.testCode || !examData.value.title) {
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
                   q.type === 'enumeration' || q.type === 'essay' ? [] : 
                   q.options,
          correctAnswer: q.type === 'essay' ? '' : q.correctAnswer, // Essay questions don't need correct answers
          imageUrl: q.imageUrl, // Include imageUrl in formatted questions
          points: q.points || 1, // Include points
          partId: q.partId || null, // Include partId if assigned
          wordLimit: q.wordLimit || null // Include wordLimit for essay questions
        }));

        if (isEditing.value) {
          // Get classCode from selected subject if available
          let classCode = null;
          if (selectedSubjectId.value) {
            const selectedSubject = teacherSubjects.value.find(s => s.subject.id === parseInt(selectedSubjectId.value));
            if (selectedSubject) {
              classCode = selectedSubject.subject.code;
            }
          }
          
          await updateExam(route.query.examId, {
            testCode: examData.value.testCode,
            classCode: classCode,
            examTitle: examData.value.title,
            questions: formattedQuestions,
            isDraft: isDraft,
            status: isDraft ? 'draft' : 'pending',
            durationMinutes: examData.value.durationMinutes,
            startDateTime: examData.value.startDateTime ? new Date(examData.value.startDateTime) : undefined,
            endDateTime: examData.value.endDateTime ? new Date(examData.value.endDateTime) : undefined,
            maxAttempts: examData.value.maxAttempts,
            attemptSpacing: examData.value.attemptSpacing,
            studentExamHistory: examData.value.studentExamHistory,
            parts: parts.value.length > 0 ? parts.value : null
          });
        } else {
          // Get classCode from selected subject if available
          let classCode = null;
          if (selectedSubjectId.value) {
            const selectedSubject = teacherSubjects.value.find(s => s.subject.id === parseInt(selectedSubjectId.value));
            if (selectedSubject) {
              classCode = selectedSubject.subject.code;
            }
          }
          
          await createExam(
            examData.value.testCode,
            classCode,
            examData.value.title,
            formattedQuestions,
            localStorage.getItem('userId'),
            isDraft,
            examData.value.durationMinutes,
            examData.value.startDateTime ? new Date(examData.value.startDateTime) : undefined,
            examData.value.endDateTime ? new Date(examData.value.endDateTime) : undefined,
            examData.value.maxAttempts,
            examData.value.attemptSpacing,
            examData.value.studentExamHistory,
            parts.value.length > 0 ? parts.value : null
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
      if (!examData.value.testCode || !examData.value.title) {
        return false;
      }
      if (!questions.value.length) {
        return false;
      }
      return questions.value.every(validateQuestion);
    };

    const validateQuestion = (question) => {
      if (!question.text || !question.type) {
        return false;
      }
      
      // Essay questions don't need correct answers
      if (question.type !== 'essay' && !question.correctAnswer) {
        return false;
      }
      
      if (question.type === 'multipleChoice' && (!question.options || question.options.length < 2)) {
        return false;
      }
      
      // Check if points is valid
      if (!question.points || question.points < 1) {
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
      } else if (question.type === 'essay') {
        question.options = [];
        question.correctAnswer = ''; // Essay questions don't need correct answers
        question.wordLimit = question.wordLimit || null; // Initialize wordLimit if not set
      } else if (question.type === 'multipleChoice' && 
                 (!Array.isArray(question.options) || question.options.join(',') === 'true,false')) {
        // Only reset multiple choice options if coming from true/false or if options are invalid
        question.options = ['', '', '', ''];
        question.correctAnswer = '';
      }
    };

    const addPart = () => {
      parts.value.push({
        id: `new_${Date.now()}`, // Temporary ID for new parts
        label: '',
        order: parts.value.length + 1
      });
    };

    const removePart = (index) => {
      const partToRemove = parts.value[index];
      const partId = partToRemove.id || (index + 1); // Use actual ID or fallback to index + 1
      
      // Remove the part
      parts.value.splice(index, 1);
      
      // Update order for remaining parts
      parts.value.forEach((part, idx) => {
        part.order = idx + 1;
      });
      
      // Remove partId from questions that were assigned to this part
      questions.value.forEach(question => {
        if (question.partId == partId.toString()) { // Convert partId to string for comparison
          question.partId = '';
        }
      });
    };

    const addQuestion = () => {
      questions.value.push({
        text: '',
        type: 'multipleChoice',
        options: ['', ''],
        correctAnswer: '',
        imageUrl: null,
        points: 1,
        partId: '',
        wordLimit: null
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
      selectedSubjectId.value = '';
      questions.value = [];
      parts.value = [];
      
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

    // Load teacher's assigned subjects
    const loadTeacherSubjects = async () => {
      try {
        loadingSubjects.value = true;
        const subjects = await getTeacherAssignedSubjects();
        teacherSubjects.value = subjects || [];
      } catch (error) {
        console.error('Error loading teacher subjects:', error);
        teacherSubjects.value = [];
      } finally {
        loadingSubjects.value = false;
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
          imageUrl: q.imageUrl,
          points: q.points || 1
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
        enumeration: 'Enumeration',
        essay: 'Essay'
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
                  <option value="essay">Essay</option>
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
                  formValues.type === 'true_false' ? 'true_false' : 
                  formValues.type === 'essay' ? 'essay' : 'enumeration',
            options: Array.isArray(q.options) ? q.options.filter(opt => opt) : [],
            correctAnswer: q.correctAnswer || "",
            imageUrl: null,
            points: q.points || 1
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
        
        // Show cognitive level selection modal
        const { value: cognitiveLevel } = await Swal.fire({
          title: 'Question Settings (Cognitive Levels)',
          html: `
            <div class="cognitive-levels-container">
              <p class="cognitive-intro">Select the cognitive level for your question improvement:</p>
              <div class="cognitive-levels-grid">
                <div class="cognitive-level-card" data-level="knowledge" style="cursor: pointer;">
                  <div class="level-header">
                    <span class="level-icon">🧠</span>
                    <h4>Knowledge / Remembering</h4>
                  </div>
                  <div class="level-details" style="opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s ease;">
                    <p class="level-description">Lowest level. Recall facts, terms, basic concepts.</p>
                    <p class="level-example"><strong>Example:</strong> "What is the capital of the Philippines?"</p>
                  </div>
                </div>
                
                <div class="cognitive-level-card" data-level="comprehension" style="cursor: pointer;">
                  <div class="level-header">
                    <span class="level-icon">💭</span>
                    <h4>Comprehension / Understanding</h4>
                  </div>
                  <div class="level-details" style="opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s ease;">
                    <p class="level-description">Demonstrate understanding by explaining in own words.</p>
                    <p class="level-example"><strong>Example:</strong> "Summarize the story in three sentences."</p>
                  </div>
                </div>
                
                <div class="cognitive-level-card" data-level="application" style="cursor: pointer;">
                  <div class="level-header">
                    <span class="level-icon">🔧</span>
                    <h4>Application</h4>
                  </div>
                  <div class="level-details" style="opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s ease;">
                    <p class="level-description">Use knowledge in new situations, apply formulas or rules.</p>
                    <p class="level-example"><strong>Example:</strong> "Solve: 2x + 5 = 15."</p>
                  </div>
                </div>
                
                <div class="cognitive-level-card" data-level="analysis" style="cursor: pointer;">
                  <div class="level-header">
                    <span class="level-icon">🔍</span>
                    <h4>Analysis</h4>
                  </div>
                  <div class="level-details" style="opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s ease;">
                    <p class="level-description">Break information into parts, see relationships.</p>
                    <p class="level-example"><strong>Example:</strong> "Compare and contrast the characters in the story."</p>
                  </div>
                </div>
                
                <div class="cognitive-level-card" data-level="synthesis" style="cursor: pointer;">
                  <div class="level-header">
                    <span class="level-icon">🎨</span>
                    <h4>Synthesis / Creating</h4>
                  </div>
                  <div class="level-details" style="opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s ease;">
                    <p class="level-description">Combine elements into a new whole, creative thinking.</p>
                    <p class="level-example"><strong>Example:</strong> "Write an alternate ending to the story."</p>
                  </div>
                </div>
                
                <div class="cognitive-level-card" data-level="evaluation" style="cursor: pointer;">
                  <div class="level-header">
                    <span class="level-icon">⚖️</span>
                    <h4>Evaluation</h4>
                  </div>
                  <div class="level-details" style="opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s ease;">
                    <p class="level-description">Make judgments, critique, justify decisions.</p>
                    <p class="level-example"><strong>Example:</strong> "Do you agree with the character's decision? Why or why not?"</p>
                  </div>
                </div>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Improve Question',
          cancelButtonText: 'Cancel',
          customClass: {
            popup: 'cognitive-levels-popup',
            htmlContainer: 'cognitive-levels-html'
          },
          didOpen: () => {
            // Add click handlers for cognitive level cards
            const cards = document.querySelectorAll('.cognitive-level-card');
            cards.forEach(card => {
              card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Remove previous selection
                cards.forEach(c => {
                  c.classList.remove('selected');
                  c.style.borderColor = '#e9ecef';
                  c.style.backgroundColor = '#fff';
                  
                  // Hide details for deselected cards
                  const details = c.querySelector('.level-details');
                  if (details) {
                    details.style.opacity = '0';
                    details.style.maxHeight = '0';
                  }
                });
                
                // Add selection to clicked card
                card.classList.add('selected');
                card.style.borderColor = '#159750';
                card.style.backgroundColor = '#f8fff9';
                
                // Add visual feedback
                card.style.transform = 'translateY(-3px)';
                card.style.boxShadow = '0 6px 20px rgba(21, 151, 80, 0.2)';
                
                // Show details for selected card
                const details = card.querySelector('.level-details');
                if (details) {
                  details.style.opacity = '1';
                  details.style.maxHeight = '200px';
                }
                
                // Store the selected level
                card.dataset.selected = 'true';
                
                console.log('Selected cognitive level:', card.dataset.level);
              });
              
              // Add hover effects
              card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('selected')) {
                  card.style.borderColor = '#159750';
                  card.style.transform = 'translateY(-2px)';
                  card.style.boxShadow = '0 4px 15px rgba(21, 151, 80, 0.15)';
                  
                  // Show details on hover
                  const details = card.querySelector('.level-details');
                  if (details) {
                    details.style.opacity = '1';
                    details.style.maxHeight = '200px';
                  }
                }
              });
              
              card.addEventListener('mouseleave', () => {
                if (!card.classList.contains('selected')) {
                  card.style.borderColor = '#e9ecef';
                  card.style.transform = 'translateY(0)';
                  card.style.boxShadow = 'none';
                  
                  // Hide details on mouse leave (unless selected)
                  const details = card.querySelector('.level-details');
                  if (details) {
                    details.style.opacity = '0';
                    details.style.maxHeight = '0';
                  }
                }
              });
            });
          },
          preConfirm: () => {
            const selectedCard = document.querySelector('.cognitive-level-card.selected');
            if (!selectedCard) {
              Swal.showValidationMessage('Please select a cognitive level');
              return false;
            }
            return selectedCard.dataset.level;
          }
        });

        if (!cognitiveLevel) return;

        Swal.fire({
          title: 'Improving Question',
          text: `Please wait while the AI improves your question for ${cognitiveLevel} level...`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const improvedText = await aiService.improveQuestionWording(question.text, subject, cognitiveLevel);
        
        // Update the question
        questions.value[index].text = improvedText;

        Swal.fire({
          icon: 'success',
          title: 'Question Improved!',
          text: `The AI has improved your question for ${cognitiveLevel} cognitive level.`,
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
          } else if (result.questionType === 'essay' || question.type === 'essay') {
            // For essay questions, enhance the question text if AI provides improvement
            if (result.improvedQuestion && result.improvedQuestion !== question.text) {
              questions.value[index].text = result.improvedQuestion;
              
              Swal.fire({
                icon: 'success',
                title: 'Essay Question Enhanced!',
                html: `
                  <p>The AI has improved your essay question for better clarity and depth.</p>
                `,
                timer: 2500,
                showConfirmButton: false
              });
            } else {
              Swal.fire({
                icon: 'info',
                title: 'Essay Question Analyzed',
                html: `
                  <p>Your essay question looks good! No improvements needed.</p>
                `,
                timer: 2000,
              showConfirmButton: false
            });
            }
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
      teacherSubjects,
      selectedSubjectId,
      loadingSubjects,
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
      parts,
      addPart,
      removePart,
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
      updatePreferredModel,
      goBack
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

.form-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  transition: border-color 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 2px rgba(21, 151, 80, 0.2);
}

.form-select:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
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

/* Essay Section Styling */
.essay-section {
  margin-top: 20px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 20px;
}

.essay-info {
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
}

.essay-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.essay-notice .material-icons-round {
  color: #666;
  font-size: 20px;
  margin-top: 2px;
}

.essay-notice div p {
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.essay-notice div p:first-child {
  font-weight: 600;
  color: #444;
  font-size: 1rem;
}

.essay-notice div p:last-child {
  color: #666;
  font-size: 0.9rem;
}

/* Word Limit Section Styling */
.word-limit-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.word-limit-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 10px;
  font-size: 0.95rem;
}

.word-limit-label .material-icons-round {
  font-size: 18px;
  color: #6c757d;
}

.word-limit-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.word-limit-input {
  width: 120px;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.word-limit-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.word-limit-unit {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.word-limit-help {
  margin: 0;
  font-size: 0.85rem;
  color: #6c757d;
  line-height: 1.4;
}

/* Points Section Styling */
.points-section {
  margin-bottom: 20px;
}

.points-section label {
  color: #444;
  font-weight: 600;
  margin-bottom: 8px;
}

.points-section input {
  width: 120px;
  text-align: center;
  font-weight: 500;
}

.points-section small {
  color: #757575;
  font-size: 0.85rem;
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
    padding: 0 8px;
    font-size: 0.8rem;
    flex: 1;
    min-width: 0;
  }

  .type-button .material-icons-round {
    font-size: 16px;
  }
  
  /* Make question type buttons stack in 2x2 grid on very small screens */
  .type-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
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
  
  /* Points section mobile adjustments */
  .points-section input {
    width: 100px;
    font-size: 1rem;
  }
  
  /* Essay section mobile adjustments */
  .essay-section {
    margin-top: 15px;
    padding-top: 15px;
  }
  
  .essay-info {
    padding: 12px;
  }
  
  .essay-notice {
    gap: 10px;
  }
  
  .essay-notice .material-icons-round {
    font-size: 18px;
  }
  
  .essay-notice div p:first-child {
    font-size: 0.95rem;
  }
  
  .essay-notice div p:last-child {
    font-size: 0.85rem;
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
  color: #333;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
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
  
  .back-button {
    padding: 8px 12px;
    font-size: 0.85rem;
  }
  
  .back-button .material-icons {
    font-size: 18px;
  }
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .create-exam-container {
    padding: 16px;
  }
  
  .exam-form {
    max-width: 950px;
    gap: 20px;
  }
  
  .header-content h1 {
    font-size: 2.2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2.2rem;
  }
  
  .header-background {
    font-size: 6rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .card {
    border-radius: 14px;
  }
  
  .card-header {
    padding: 16px;
  }
  
  .card-header h2 {
    font-size: 1.3rem;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .form-row {
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  label {
    font-size: 0.95rem;
    margin-bottom: 6px;
  }
  
  input[type="text"],
  input[type="number"],
  input[type="datetime-local"],
  textarea,
  select {
    padding: 12px 14px;
    font-size: 0.95rem;
    border-radius: 10px;
  }
  
  small {
    font-size: 0.8rem;
  }
  
  .question-item {
    border-radius: 14px;
  }
  
  .question-header {
    padding: 12px 16px;
  }
  
  .question-content {
    padding: 16px;
  }
  
  .type-buttons {
    gap: 10px;
  }
  
  .type-button {
    padding: 10px 14px;
    font-size: 0.9rem;
    border-radius: 6px;
  }
  
  .options-section,
  .true-false-section,
  .short-answer-section,
  .essay-section {
    margin-top: 16px;
    padding-top: 16px;
  }
  
  .option-item {
    padding: 8px;
    gap: 8px;
  }
  
  .add-option-btn,
  .ai-options-btn {
    padding: 8px 14px;
    font-size: 0.9rem;
    min-height: 38px;
  }
  
  .add-question-button,
  .import-question-button,
  .ai-generate-button,
  .document-upload-button {
    padding: 14px;
    font-size: 0.95rem;
  }
  
  .form-actions {
    padding: 16px;
    border-radius: 14px;
  }
  
  .action-buttons {
    gap: 12px;
  }
  
  .reset-button,
  .draft-button,
  .publish-button {
    padding: 12px 24px;
    font-size: 1rem;
    border-radius: 10px;
  }
  
  .side-panel {
    width: 450px;
  }
  
  .side-panel-header {
    padding: 16px;
  }
  
  .side-panel-content {
    padding: 16px;
  }
  
  .filters-section {
    padding: 12px;
  }
  
  .bank-question-card {
    padding: 12px;
  }
  
  .settings-toggle {
    padding: 6px 14px;
    font-size: 0.85rem;
  }
  
  .toggle-switch {
    width: 55px;
    height: 30px;
  }
  
  .toggle-slider:before {
    height: 22px;
    width: 22px;
  }
  
  .toggle-input:checked + .toggle-slider:before {
    transform: translateX(25px) translateY(-50%);
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .create-exam-container {
    padding: 14px;
  }
  
  .exam-form {
    max-width: 850px;
    gap: 18px;
  }
  
  .header-content h1 {
    font-size: 2rem;
    margin-bottom: 0.8rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 5.5rem;
  }
  
  .subtitle {
    font-size: 0.95rem;
  }
  
  .divider {
    margin: 1.2rem 0;
  }
  
  .card {
    border-radius: 12px;
  }
  
  .card-header {
    padding: 14px;
  }
  
  .card-header h2 {
    font-size: 1.2rem;
    gap: 8px;
  }
  
  .card-body {
    padding: 14px;
  }
  
  .form-row {
    gap: 14px;
    margin-bottom: 14px;
  }
  
  .form-group {
    margin-bottom: 14px;
  }
  
  label {
    font-size: 0.9rem;
    margin-bottom: 5px;
  }
  
  input[type="text"],
  input[type="number"],
  input[type="datetime-local"],
  textarea,
  select {
    padding: 10px 12px;
    font-size: 0.9rem;
    border-radius: 8px;
  }
  
  textarea {
    min-height: 70px;
  }
  
  small {
    font-size: 0.75rem;
    margin-top: 4px;
  }
  
  .questions-list {
    gap: 16px;
  }
  
  .question-item {
    border-radius: 12px;
  }
  
  .question-header {
    padding: 10px 14px;
  }
  
  .question-content {
    padding: 14px;
  }
  
  .question-type-selector {
    margin: 16px 0;
  }
  
  .type-buttons {
    gap: 8px;
  }
  
  .type-button {
    padding: 8px 12px;
    font-size: 0.85rem;
    border-radius: 6px;
  }
  
  .type-button .material-icons-round {
    font-size: 18px;
  }
  
  .options-section,
  .true-false-section,
  .short-answer-section,
  .essay-section {
    margin-top: 14px;
    padding-top: 14px;
  }
  
  .options-header {
    margin-bottom: 14px;
  }
  
  .options-header h4 {
    font-size: 1rem;
  }
  
  .options-list {
    gap: 8px;
  }
  
  .option-item {
    padding: 6px 8px;
    gap: 6px;
  }
  
  .add-option-btn,
  .ai-options-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    min-height: 36px;
  }
  
  .detect-options-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
    min-height: 38px;
  }
  
  .image-upload-container {
    min-height: 130px;
  }
  
  .upload-label .material-icons-round {
    font-size: 2.2rem;
    margin-bottom: 8px;
  }
  
  .true-false-options {
    gap: 16px;
  }
  
  .essay-info {
    padding: 12px;
  }
  
  .essay-notice {
    gap: 10px;
  }
  
  .essay-notice .material-icons-round {
    font-size: 18px;
  }
  
  .essay-notice div p:first-child {
    font-size: 0.95rem;
  }
  
  .essay-notice div p:last-child {
    font-size: 0.85rem;
  }
  
  .questions-actions {
    padding: 16px;
    gap: 12px;
  }
  
  .add-question-button,
  .import-question-button,
  .ai-generate-button,
  .document-upload-button {
    padding: 12px;
    font-size: 0.9rem;
  }
  
  .material-icons,
  .material-icons-round {
    font-size: 18px;
  }
  
  .form-actions {
    padding: 14px;
    border-radius: 12px;
  }
  
  .action-buttons {
    gap: 10px;
  }
  
  .reset-button,
  .draft-button,
  .publish-button {
    padding: 10px 20px;
    font-size: 0.95rem;
    border-radius: 8px;
  }
  
  .side-panel {
    width: 400px;
  }
  
  .side-panel-header {
    padding: 14px;
  }
  
  .side-panel-header h2 {
    font-size: 1.1rem;
  }
  
  .side-panel-content {
    padding: 14px;
  }
  
  .filters-section {
    padding: 10px;
    margin-bottom: 16px;
  }
  
  .search-box input {
    padding: 8px 35px 8px 12px;
    font-size: 0.9rem;
  }
  
  .filter-group select {
    padding: 6px;
    font-size: 0.85rem;
  }
  
  .bank-question-card {
    padding: 10px;
  }
  
  .bank-question-card .question-text {
    font-size: 0.9rem;
  }
  
  .difficulty-badge {
    padding: 3px 6px;
    font-size: 0.75rem;
  }
  
  .settings-toggles {
    gap: 8px;
  }
  
  .settings-toggle {
    padding: 5px 12px;
    font-size: 0.8rem;
  }
  
  .settings-toggle i {
    font-size: 14px;
  }
  
  .toggle-switch {
    width: 50px;
    height: 28px;
  }
  
  .toggle-slider:before {
    height: 20px;
    width: 20px;
    left: 4px;
  }
  
  .toggle-input:checked + .toggle-slider:before {
    transform: translateX(22px) translateY(-50%);
  }
  
  .parts-header {
    margin-bottom: 12px;
  }
  
  .parts-description {
    font-size: 0.8rem;
  }
  
  .add-part-btn {
    padding: 6px 14px;
    font-size: 0.85rem;
  }
  
  .part-item {
    padding: 12px;
  }
  
  .part-content input {
    padding: 6px 8px;
    font-size: 0.85rem;
  }
  
  .generate-button {
    height: 38px;
    padding: 0 10px;
  }
  
  .input-with-button input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .create-exam-container {
    padding: 12px;
  }
  
  .exam-form {
    max-width: 720px;
    gap: 16px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
    margin-bottom: 0.6rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }
  
  .header-background {
    font-size: 5rem;
    right: 5%;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .divider {
    margin: 1rem 0;
  }
  
  .card {
    border-radius: 10px;
  }
  
  .card-header {
    padding: 12px;
  }
  
  .card-header h2 {
    font-size: 1.1rem;
    gap: 6px;
  }
  
  .card-body {
    padding: 12px;
  }
  
  .form-row {
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .form-group {
    margin-bottom: 12px;
  }
  
  label {
    font-size: 0.85rem;
    margin-bottom: 4px;
  }
  
  input[type="text"],
  input[type="number"],
  input[type="datetime-local"],
  textarea,
  select {
    padding: 8px 10px;
    font-size: 0.85rem;
    border-radius: 6px;
  }
  
  textarea {
    min-height: 60px;
  }
  
  small {
    font-size: 0.7rem;
    margin-top: 3px;
  }
  
  .questions-list {
    gap: 14px;
  }
  
  .question-item {
    border-radius: 10px;
  }
  
  .question-header {
    padding: 8px 12px;
  }
  
  .question-content {
    padding: 12px;
  }
  
  .question-type-selector {
    margin: 14px 0;
  }
  
  .type-buttons {
    gap: 6px;
  }
  
  .type-button {
    padding: 6px 10px;
    font-size: 0.8rem;
    border-radius: 5px;
  }
  
  .type-button .material-icons-round {
    font-size: 16px;
  }
  
  .options-section,
  .true-false-section,
  .short-answer-section,
  .essay-section {
    margin-top: 12px;
    padding-top: 12px;
  }
  
  .options-header {
    margin-bottom: 12px;
  }
  
  .options-header h4 {
    font-size: 0.95rem;
  }
  
  .options-list {
    gap: 6px;
  }
  
  .option-item {
    padding: 5px 6px;
    gap: 5px;
  }
  
  .add-option-btn,
  .ai-options-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
    min-height: 32px;
  }
  
  .detect-options-btn {
    padding: 6px 10px;
    font-size: 0.85rem;
    min-height: 34px;
  }
  
  .image-upload-container {
    min-height: 110px;
  }
  
  .upload-label .material-icons-round {
    font-size: 2rem;
    margin-bottom: 6px;
  }
  
  .true-false-options {
    gap: 12px;
  }
  
  .essay-info {
    padding: 10px;
  }
  
  .essay-notice {
    gap: 8px;
  }
  
  .essay-notice .material-icons-round {
    font-size: 16px;
  }
  
  .essay-notice div p:first-child {
    font-size: 0.9rem;
  }
  
  .essay-notice div p:last-child {
    font-size: 0.8rem;
  }
  
  .questions-actions {
    padding: 14px;
    gap: 10px;
  }
  
  .add-question-button,
  .import-question-button,
  .ai-generate-button,
  .document-upload-button {
    padding: 10px;
    font-size: 0.85rem;
  }
  
  .material-icons,
  .material-icons-round {
    font-size: 16px;
  }
  
  .form-actions {
    padding: 12px;
    border-radius: 10px;
  }
  
  .action-buttons {
    gap: 8px;
  }
  
  .reset-button,
  .draft-button,
  .publish-button {
    padding: 8px 16px;
    font-size: 0.9rem;
    border-radius: 6px;
  }
  
  .side-panel {
    width: 350px;
  }
  
  .side-panel-header {
    padding: 12px;
  }
  
  .side-panel-header h2 {
    font-size: 1rem;
    gap: 6px;
  }
  
  .side-panel-content {
    padding: 12px;
  }
  
  .filters-section {
    padding: 8px;
    margin-bottom: 14px;
  }
  
  .search-box input {
    padding: 6px 30px 6px 10px;
    font-size: 0.85rem;
  }
  
  .filter-group select {
    padding: 5px;
    font-size: 0.8rem;
  }
  
  .bank-question-card {
    padding: 8px;
  }
  
  .bank-question-card .question-text {
    font-size: 0.85rem;
    margin-bottom: 10px;
  }
  
  .difficulty-badge {
    padding: 2px 5px;
    font-size: 0.7rem;
  }
  
  .settings-toggles {
    gap: 6px;
  }
  
  .settings-toggle {
    padding: 4px 10px;
    font-size: 0.75rem;
  }
  
  .settings-toggle i {
    font-size: 12px;
  }
  
  .toggle-switch {
    width: 45px;
    height: 26px;
  }
  
  .toggle-slider:before {
    height: 18px;
    width: 18px;
    left: 4px;
  }
  
  .toggle-input:checked + .toggle-slider:before {
    transform: translateX(19px) translateY(-50%);
  }
  
  .parts-header {
    margin-bottom: 10px;
  }
  
  .parts-description {
    font-size: 0.75rem;
  }
  
  .add-part-btn {
    padding: 5px 12px;
    font-size: 0.8rem;
  }
  
  .add-part-btn .material-icons-round {
    font-size: 14px;
  }
  
  .part-item {
    padding: 10px;
  }
  
  .part-number {
    padding: 3px 8px;
    font-size: 0.75rem;
  }
  
  .part-content input {
    padding: 5px 6px;
    font-size: 0.8rem;
  }
  
  .part-content small {
    font-size: 0.7rem;
    margin-top: 4px;
  }
  
  .generate-button {
    height: 34px;
    padding: 0 8px;
  }
  
  .generate-button .material-icons {
    font-size: 18px;
  }
  
  .document-panel {
    width: 350px;
  }
  
  .document-upload-area {
    padding: 20px;
    min-height: 160px;
  }
  
  .large-icon {
    font-size: 40px;
  }
  
  .model-selection {
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .model-selection select {
    padding: 10px;
    font-size: 0.9rem;
  }
  
  .document-tabs {
    margin-bottom: 16px;
  }
  
  .tab-button {
    padding: 10px;
    font-size: 0.85rem;
  }
  
  .tab-button .material-icons {
    font-size: 18px;
  }
  
  .document-text-input {
    min-height: 160px;
    padding: 12px;
    font-size: 0.9rem;
  }
  
  .analyze-text-btn {
    padding: 10px 16px;
    font-size: 0.9rem;
  }
}

/* Back button styling */
.back-button-container {
  margin-bottom: 20px;
  z-index: 1000;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  color: #333;
  border: 1px solid #ddd;
  border-radius: 25px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.95rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background: linear-gradient(135deg, #e0e0e0, #d0d0d0);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-button .material-icons {
  font-size: 20px;
}

.back-text {
  font-weight: 500;
}

/* Parts Section Styling */
.exam-parts-card {
  margin-bottom: 20px;
}

.parts-section {
  padding: 15px 0;
}

.parts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.parts-description {
  color: #666;
  font-size: 0.85rem;
  margin: 0;
  flex: 1;
  line-height: 1.4;
}

.add-part-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
}

.add-part-btn:hover {
  background: linear-gradient(135deg, #45a049, #3d8b40);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(76, 175, 80, 0.4);
}

.add-part-btn .material-icons-round {
  font-size: 16px;
}

.no-parts {
  text-align: center;
  padding: 25px 15px;
}

.no-parts .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.no-parts .empty-icon {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.no-parts .empty-icon i {
  font-size: 18px;
}

.no-parts p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.no-parts .empty-subtext {
  font-size: 0.8rem;
  color: #999;
}

.parts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.part-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
}

.part-item:hover {
  border-color: #159750;
  box-shadow: 0 2px 8px rgba(21, 151, 80, 0.1);
}

.part-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.part-number {
  background: linear-gradient(135deg, #159750, #0bcc4e);
  color: white;
  padding: 4px 10px;
  border-radius: 15px;
  font-weight: 600;
  font-size: 0.8rem;
}

.part-actions {
  display: flex;
  gap: 6px;
}

.part-content .form-group {
  margin-bottom: 0;
}

.part-content input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.part-content input:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 2px rgba(21, 151, 80, 0.1);
}

.part-content small {
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 0.75rem;
}

/* Part Assignment Dropdown */
.part-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.part-select:hover {
  border-color: #159750;
}

.part-select:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
}

/* Part Transitions */
.part-transition-enter-active,
.part-transition-leave-active {
  transition: all 0.3s ease;
}

.part-transition-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.part-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive adjustments for parts */
@media (max-width: 768px) {
  .parts-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .add-part-btn {
    align-self: flex-start;
  }
  
  .part-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .part-actions {
    justify-content: flex-end;
  }
}

/* Cognitive Levels Modal Styles */
.cognitive-levels-popup {
  max-width: 900px !important;
  width: 90% !important;
}

.cognitive-levels-html {
  max-height: 70vh;
  overflow-y: auto;
}

.cognitive-levels-container {
  padding: 20px 0;
}

.cognitive-intro {
  text-align: center;
  margin-bottom: 25px;
  font-size: 1.1rem;
  color: #333;
  font-weight: 500;
}

.cognitive-levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.cognitive-level-card {
  background: #fff;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer !important;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.cognitive-level-card:hover {
  border-color: #159750;
  box-shadow: 0 4px 15px rgba(21, 151, 80, 0.15);
  transform: translateY(-2px);
}

.cognitive-level-card.selected {
  border-color: #159750;
  background: linear-gradient(135deg, #f8fff9, #e8f5e8);
  box-shadow: 0 6px 20px rgba(21, 151, 80, 0.2);
  transform: translateY(-3px);
}

.cognitive-level-card.selected::before {
  content: '✓';
  position: absolute;
  top: 15px;
  right: 15px;
  background: #159750;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  z-index: 10;
}

.cognitive-level-card:active {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(21, 151, 80, 0.2);
}

.level-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.level-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 10px;
}

.level-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
}

.level-details {
  opacity: 0 !important;
  max-height: 0 !important;
  overflow: hidden !important;
  transition: all 0.3s ease !important;
  margin: 0 !important;
  padding: 0 !important;
}

.cognitive-level-card:hover .level-details {
  opacity: 1 !important;
  max-height: 200px !important;
}

.level-description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 12px;
}

.level-example {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #159750;
  font-size: 0.9rem;
  color: #555;
  margin: 0;
}

.level-example strong {
  color: #159750;
}

/* Responsive adjustments for cognitive levels */
@media (max-width: 768px) {
  .cognitive-levels-popup {
    width: 95% !important;
    max-width: none !important;
  }
  
  .cognitive-levels-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .cognitive-level-card {
    padding: 15px;
  }
  
  .level-header {
    gap: 10px;
    margin-bottom: 12px;
  }
  
  .level-icon {
    font-size: 20px;
    width: 35px;
    height: 35px;
  }
  
  .level-header h4 {
    font-size: 1rem;
  }
  
  .level-description {
    font-size: 0.9rem;
  }
  
  .level-example {
    padding: 10px;
    font-size: 0.85rem;
  }
  
  /* For mobile, show details on touch instead of hover */
  .cognitive-level-card:active .level-details,
  .cognitive-level-card.selected .level-details {
    opacity: 1 !important;
    max-height: 200px !important;
  }
}
</style>