<template>
  <div class="manage-users">
    <div class="page-header">
      <h1>Manage Users</h1>
      <div class="header-actions">
        <button @click="openModal('student')" class="add-btn student">
          <span class="material-icons">school</span> Add Student
        </button>
        <button @click="openModal('teacher')" class="add-btn teacher">
          <span class="material-icons">person_add</span> Add Teacher
        </button>
        <button @click="openModal('admin')" class="add-btn admin">
          <span class="material-icons">admin_panel_settings</span> Add Admin
        </button>
        <button @click="openGradeSectionModal()" class="add-btn grade-section">
          <span class="material-icons">class</span> Add Grade Section
        </button>
      </div>
    </div>

    <!-- AI Batch Creation Dropdown -->
    <div class="ai-batch-dropdown">
      <button @click="toggleAIDropdown" class="ai-batch-main-btn" :class="{ 'active': showAIDropdown }">
        <span class="material-icons">psychology</span> 
        <span>AI Batch Creation</span>
        <span class="material-icons dropdown-icon" :class="{ 'rotated': showAIDropdown }">expand_more</span>
      </button>
      <div class="ai-dropdown-content" v-if="showAIDropdown">
        <button @click="openBatchModal('student')" class="ai-dropdown-item student">
          <span class="material-icons">group_add</span> Batch Add Students
        </button>
        <button @click="openBatchModal('teacher')" class="ai-dropdown-item teacher">
          <span class="material-icons">groups</span> Batch Add Teachers
        </button>
        <button @click="openBatchModal('section')" class="ai-dropdown-item section">
          <span class="material-icons">dashboard_customize</span> Batch Add Sections
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
          class="uppercase-input"
        />
      </div>

      <div class="tabs">
        <button 
          v-for="tab in ['students', 'teachers', 'admins', 'sections']"
          :key="tab"
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <!-- Dynamic Filters -->
      <div v-if="activeTab === 'students'" class="filter-group">
        <select v-model="filters.gradeLevel">
          <option value="">All Grades</option>
          <option v-for="grade in filterOptions.grades" :key="grade" :value="grade">
            Grade {{ grade }}
          </option>
        </select>
        <select v-model="filters.section">
          <option value="">All Sections</option>
          <option v-for="section in filterOptions.sections" :key="section" :value="section">
            {{ section }}
          </option>
        </select>
      </div>

      <div v-if="activeTab === 'teachers'" class="filter-group">
        <select v-model="filters.department">
          <option value="">All Departments</option>
          <option v-for="dept in filterOptions.departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
        <select v-model="filters.domain">
          <option value="">All Domains</option>
          <option v-for="domain in filterOptions.domains" :key="domain" :value="domain">
            {{ domain }}
          </option>
        </select>
      </div>
    </div>

    <!-- View toggle and export buttons -->
    <div class="view-controls">
      <div class="view-toggle-group">
      <button 
        class="view-toggle-btn" 
        :class="{ active: viewMode === 'grid' }"
        @click="viewMode = 'grid'"
      >
        <span class="material-icons">grid_view</span>
        Grid View
      </button>
      <button 
        class="view-toggle-btn" 
        :class="{ active: viewMode === 'table' }"
        @click="viewMode = 'table'"
      >
        <span class="material-icons">table_rows</span>
        Table View
      </button>
      </div>
      
      <div class="export-controls">
        <button @click="toggleExportOptions" class="export-main-btn">
          <span class="material-icons">download</span>
          Export
          <span class="material-icons dropdown-icon" :class="{ 'rotated': showExportOptions }">expand_more</span>
        </button>
        
        <div v-if="showExportOptions" class="export-dropdown">
          <div class="export-options-header">
            <h3>Export Options</h3>
          </div>
          
          <div class="export-data-selection">
            <h4>Select data to export:</h4>
            <div class="export-checkboxes">
              <label v-if="activeTab === 'students'">
                <input type="checkbox" v-model="exportOptions.fields.name" checked>
                Name
              </label>
              <label v-if="activeTab === 'students'">
                <input type="checkbox" v-model="exportOptions.fields.email">
                Email
              </label>
              <label v-if="activeTab === 'students'">
                <input type="checkbox" v-model="exportOptions.fields.lrn">
                LRN
              </label>
              <label v-if="activeTab === 'students'">
                <input type="checkbox" v-model="exportOptions.fields.grade">
                Grade
              </label>
              <label v-if="activeTab === 'students'">
                <input type="checkbox" v-model="exportOptions.fields.section">
                Section
              </label>
              
              <label v-if="activeTab === 'teachers'">
                <input type="checkbox" v-model="exportOptions.fields.name" checked>
                Name
              </label>
              <label v-if="activeTab === 'teachers'">
                <input type="checkbox" v-model="exportOptions.fields.email">
                Email
              </label>
              <label v-if="activeTab === 'teachers'">
                <input type="checkbox" v-model="exportOptions.fields.department">
                Department
              </label>
              <label v-if="activeTab === 'teachers'">
                <input type="checkbox" v-model="exportOptions.fields.domain">
                Domain
              </label>
              
              <label v-if="activeTab === 'admins'">
                <input type="checkbox" v-model="exportOptions.fields.name" checked>
                Name
              </label>
              <label v-if="activeTab === 'admins'">
                <input type="checkbox" v-model="exportOptions.fields.email">
                Email
              </label>
              
              <label v-if="activeTab === 'sections'">
                <input type="checkbox" v-model="exportOptions.fields.grade" checked>
                Grade
              </label>
              <label v-if="activeTab === 'sections'">
                <input type="checkbox" v-model="exportOptions.fields.section" checked>
                Section
              </label>
            </div>
          </div>
          
          <div class="export-actions">
            <button @click="exportToExcel" class="export-btn excel">
              <span class="material-icons">description</span>
              Excel
            </button>
            <button @click="exportToPDF" class="export-btn pdf">
              <span class="material-icons">picture_as_pdf</span>
              PDF
            </button>
            <button @click="printData" class="export-btn print">
              <span class="material-icons">print</span>
              Print
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Grade Section List -->
    <div v-if="activeTab === 'sections'" class="list-section">
      <h2>Grade Sections</h2>
      <div v-if="gradeSectionsLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading grade sections...</p>
      </div>

      <div v-else-if="gradeSections.length === 0" class="empty-state">
        <span class="material-icons">class</span>
        <p>No grade sections found</p>
      </div>

      <div v-else class="grade-sections-grid">
        <div v-for="gs in gradeSections" :key="gs.id" class="grade-section-card">
          <div class="grade-section-header">
            <h3>Grade {{ gs.grade }} - Section {{ gs.section }}</h3>
          </div>
          <div class="grade-section-actions">
            <button @click="openGradeSectionModal(gs)" class="action-btn edit">
              <span class="material-icons">edit</span>
            </button>
            <button @click="deleteGrade(gs.id)" class="action-btn delete">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Users List -->
    <div class="users-list" v-if="!loading && activeTab !== 'sections'">
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <span class="material-icons">group_off</span>
        <p>No users found</p>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="users-grid">
        <div v-for="user in filteredUsers" :key="user.id" class="user-card">
          <div v-if="user.profilePicture" class="user-avatar-container">
            <img 
              :src="getFullImageUrl(user.profilePicture)" 
              alt="Profile" 
              class="user-avatar-img"
              @error="handleImageError($event, user)" 
            />
          </div>
          <div v-else class="user-avatar">
            {{ user.firstName[0] }}{{ user.lastName[0] }}
          </div>
          <div class="user-info">
            <h3>{{ user.firstName }} {{ user.lastName }}</h3>
            <p class="email">{{ user.email }}</p>
            <div class="details">
              <template v-if="activeTab === 'students'">
                <span class="detail-item">
                  <span class="material-icons">school</span>
                  Grade {{ user.gradeLevel || 'N/A' }}
                </span>
                <span class="detail-item">
                  <span class="material-icons">groups</span>
                  {{ user.section || 'N/A' }}
                </span>
              </template>
              <template v-if="activeTab === 'teachers'">
                <span class="detail-item">
                  <span class="material-icons">business</span>
                  {{ user.department || 'N/A' }}
                </span>
                <span class="detail-item">
                  <span class="material-icons">book</span>
                  {{ user.domain || 'N/A' }}
                </span>
              </template>
            </div>
          </div>
          <div class="user-actions">
            <button class="action-btn view" @click="viewUserDetails(user)">
              <span class="material-icons">visibility</span>
            </button>
            <button class="action-btn edit" @click="openEditModal(user)">
              <span class="material-icons">edit</span>
            </button>
            <button class="action-btn delete" @click="handleDeleteUser(user.id)">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>Profile</th>
              <th>Name</th>
              <th>Email</th>
              <th v-if="activeTab === 'students'">LRN</th>
              <th v-if="activeTab === 'students'">Grade</th>
              <th v-if="activeTab === 'students'">Section</th>
              <th v-if="activeTab === 'teachers'">Department</th>
              <th v-if="activeTab === 'teachers'">Domain</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div v-if="user.profilePicture" class="table-avatar-container">
                  <img 
                    :src="getFullImageUrl(user.profilePicture)" 
                    alt="Profile" 
                    class="table-avatar-img"
                    @error="handleImageError($event, user)"
                  />
                </div>
                <div v-else class="table-avatar">
                  {{ user.firstName[0] }}{{ user.lastName[0] }}
                </div>
              </td>
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td v-if="activeTab === 'students'">{{ user.lrn || 'N/A' }}</td>
              <td v-if="activeTab === 'students'">{{ user.gradeLevel || 'N/A' }}</td>
              <td v-if="activeTab === 'students'">{{ user.section || 'N/A' }}</td>
              <td v-if="activeTab === 'teachers'">{{ user.department || 'N/A' }}</td>
              <td v-if="activeTab === 'teachers'">{{ user.domain || 'N/A' }}</td>
              <td>
                <div class="user-actions">
                  <button class="action-btn view" @click="viewUserDetails(user)">
                    <span class="material-icons">visibility</span>
                  </button>
                  <button class="action-btn edit" @click="openEditModal(user)">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="action-btn delete" @click="handleDeleteUser(user.id)">
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div> -->

    <!-- Registration Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add {{ modalType.charAt(0).toUpperCase() + modalType.slice(1) }}</h2>
          <button class="close-btn" @click="showModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="registration-form">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input v-model="formData.firstName" type="text" required class="uppercase-input" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input 
                v-model="formData.lastName" 
                type="text" 
                required 
                @input="updateCredentials"
                class="uppercase-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Email (auto-generated)</label>
            <input 
              v-model="formData.email" 
              type="email" 
              required 
              readonly 
              class="generated-input"
            />
          </div>
          <div class="form-group">
            <label>Password (auto-generated)</label>
            <input 
              v-model="formData.password" 
              type="text" 
              required 
              readonly 
              class="generated-input"
            />
          </div>

          <div class="form-group">
            <label>Address</label>
            <input v-model="formData.address" type="text" class="uppercase-input" />
          </div>

          <!-- Student-specific fields -->
          <template v-if="modalType === 'student'">
            <div class="form-row">
              <div class="form-group">
                <label>LRN (12-digit)</label>
                <input v-model="formData.lrn" type="text" maxlength="12" pattern="[0-9]*" class="uppercase-input" />
                <small>The Learner Reference Number is a unique 12-digit identifier</small>
              </div>
              <div class="form-group">
                <label>Grade</label>
                <select 
                  v-model="formData.gradeLevel" 
                  required
                  class="uppercase-input"
                >
                  <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                    Grade {{ grade }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Section</label>
              <select 
                v-model="formData.section" 
                required
                class="uppercase-input"
              >
                <option value="">Select Section</option>
                <option v-for="section in availableSections" :key="section" :value="section">
                  {{ section }}
                </option>
              </select>
            </div>
          </template>

          <!-- Teacher-specific fields -->
          <template v-if="modalType === 'teacher'">
            <div class="form-row">
              <div class="form-group">
                <label>Department</label>
                <input v-model="formData.department" type="text" class="uppercase-input" />
              </div>
              <div class="form-group">
                <label>Domain</label>
                <input v-model="formData.domain" type="text" class="uppercase-input" />
              </div>
            </div>
          </template>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showModal = false">
              Cancel
            </button>
            <button type="submit" class="submit-btn">
              Create {{ modalType.charAt(0).toUpperCase() + modalType.slice(1) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Grade Section Modal -->
    <div v-if="showGradeSectionModal" class="modal-overlay" @click="showGradeSectionModal = false">
      <div class="modal-content grade-section-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <span class="material-icons" style="color: #4CAF50">class</span>
            <h2>{{ currentGradeSection.id ? 'Edit' : 'Add' }} Grade Section</h2>
          </div>
          <button class="close-btn" @click="showGradeSectionModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="saveGradeSection" class="grade-section-form">
          <div class="form-row">
            <div class="form-group grade-select">
              <label>
                <span class="material-icons" style="color: #4CAF50">school</span>
                Grade Level
              </label>
              <select 
                v-model.number="currentGradeSection.grade" 
                required
                class="uppercase-input"
              >
                <option value="" disabled>Select Grade Level</option>
                <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                  Grade {{ grade }}
                </option>
              </select>
            </div>

            <div class="form-group section-input">
              <label>
                <span class="material-icons" style="color: #4CAF50">groups</span>
                Section Name
              </label>
              <input 
                v-model="currentGradeSection.section" 
                type="text" 
                required
                class="uppercase-input"
                placeholder="Enter section name"
              />
            </div>
          </div>

          <div class="form-info">
            <div class="info-icon">
              <span class="material-icons" style="color: #4CAF50">info</span>
            </div>
            <p style="color: #2E7D32">This section will be available for student registration once created.</p>
          </div>

          <div class="form-actions">
            <button type="button" @click="showGradeSectionModal = false" class="cancel-btn">
              <span class="material-icons">close</span>
              Cancel
            </button>
            <button type="submit" class="save-btn" style="background: #4CAF50">
              <span class="material-icons">{{ currentGradeSection.id ? 'update' : 'save' }}</span>
              {{ currentGradeSection.id ? 'Update' : 'Save' }} Section
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserDetailsModal" class="modal-overlay" @click="showUserDetailsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>User Details</h2>
          <button class="close-btn" @click="showUserDetailsModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="user-details">
          <div v-for="(value, key) in selectedUser" :key="key" class="detail-item">
            <span class="label">{{ formatLabel(key) }}:</span>
            <span class="value">{{ formatValue(key, value) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit {{ editFormData.role?.charAt(0).toUpperCase() + editFormData.role?.slice(1) }}</h2>
          <button class="close-btn" @click="showEditModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="handleUpdateUser" class="registration-form">
          <!-- Common fields -->
          <div class="form-group">
            <label>First Name</label>
            <input v-model="editFormData.firstName" type="text" required class="uppercase-input" />
          </div>

          <div class="form-group">
            <label>Last Name</label>
            <input v-model="editFormData.lastName" type="text" required class="uppercase-input" />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="editFormData.email" type="email" required class="uppercase-input" />
          </div>

          <div class="form-group">
            <label>Address</label>
            <input v-model="editFormData.address" type="text" class="uppercase-input" />
          </div>

          <!-- Student-specific fields -->
          <div v-if="editFormData.role === 'student'">
            <div class="form-group">
              <label>LRN (12-digit)</label>
              <input v-model="editFormData.lrn" type="text" maxlength="12" pattern="[0-9]*" required class="uppercase-input" />
              <small>The Learner Reference Number is a unique 12-digit identifier</small>
            </div>

            <div class="form-group">
              <label>Grade Level</label>
              <select v-model.number="editFormData.gradeLevel" required @change="editFormData.section = ''" class="uppercase-input">
                <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                  Grade {{ grade }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Section</label>
              <select v-model="editFormData.section" required :disabled="!editFormData.gradeLevel" class="uppercase-input">
                <option value="">Select Section</option>
                <option v-for="section in availableSectionsForGrade" :key="section" :value="section">
                  {{ section }}
                </option>
              </select>
            </div>
          </div>

          <!-- Password field -->
          <div class="form-group">
            <label>New Password</label>
            <input 
              v-model="editFormData.password" 
              type="password" 
              placeholder="Leave blank to keep current password"
              class="uppercase-input"
            />
            <small class="form-hint">Minimum 8 characters</small>
          </div>

          <!-- Created At info -->
          <div class="form-group">
            <label>Created At</label>
            <input 
              :value="formatDate(editFormData.createdAt)" 
              type="text" 
              readonly 
              class="generated-input"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showEditModal = false">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- AI Batch User Creation Modal -->
    <div v-if="showBatchModal" class="modal-overlay" @click="showBatchModal = false">
      <div class="modal-content batch-modal" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <span class="material-icons" :style="{ color: batchModalType === 'student' ? '#4CAF50' : batchModalType === 'teacher' ? '#2196F3' : '#9C27B0' }">psychology</span>
            <h2>AI Batch {{ batchModalType === 'section' ? 'Grade Section' : batchModalType.charAt(0).toUpperCase() + batchModalType.slice(1) }} Creation</h2>
  </div>
          <button class="close-btn" @click="showBatchModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="batch-modal-content">
          <div class="batch-instructions">
            <div class="instructions-icon">
              <span class="material-icons">info</span>
            </div>
            <div class="instructions-text">
              <p v-if="batchModalType === 'student'">
                Paste a list of students with their details. Our AI will automatically extract names, grade levels, and sections.
                <br><br>Examples:
                <br>• Juan Dela Cruz, Grade 7, Section A
                <br>• Maria Santos - 8th Grade (Einstein)
                <br>• List with columns: Name | Grade | Section
              </p>
              <p v-else-if="batchModalType === 'teacher'">
                Paste a list of teachers with their details. Our AI will automatically extract names, departments, and domains.
                <br><br>Examples:
                <br>• Juan Dela Cruz, Science Department, Physics
                <br>• Maria Santos - Mathematics, Algebra
                <br>• List with columns: Name | Department | Subject
              </p>
              <p v-else>
                Paste a list of grade sections. Our AI will automatically extract grade levels and section names.
                <br><br>Examples:
                <br>• Grade 7 - Einstein
                <br>• 8-Newton
                <br>• Grade 9 (Curie)
              </p>
            </div>
          </div>

          <div class="batch-form">
            <textarea 
              v-model="batchInputText" 
              placeholder="Paste your list here..."
              rows="10"
              class="batch-textarea"
            ></textarea>

            <div v-if="batchModalType !== 'section'" class="batch-defaults">
              <h3>Default Values (Applied when information is missing)</h3>
              <div class="defaults-form">
                <div v-if="batchModalType === 'student'" class="defaults-row">
                  <div class="defaults-group">
                    <label>Default Grade Level</label>
                    <select v-model.number="batchDefaults.gradeLevel">
                      <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                        Grade {{ grade }}
                      </option>
                    </select>
                  </div>
                  <div class="defaults-group">
                    <label>Default Section</label>
                    <select v-model="batchDefaults.section">
                      <option value="">Select Section</option>
                      <option v-for="section in availableSections" :key="section" :value="section">
                        {{ section }}
                      </option>
                    </select>
                  </div>
                </div>
                <div v-else-if="batchModalType === 'teacher'" class="defaults-row">
                  <div class="defaults-group">
                    <label>Default Department</label>
                    <input 
                      v-model="batchDefaults.department" 
                      type="text" 
                      placeholder="e.g., SCIENCE"
                      class="uppercase-input"
                    />
                  </div>
                  <div class="defaults-group">
                    <label>Default Domain</label>
                    <input 
                      v-model="batchDefaults.domain" 
                      type="text" 
                      placeholder="e.g., PHYSICS"
                      class="uppercase-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="batchProcessing" class="batch-processing">
            <div class="spinner"></div>
            <p>Processing your data with AI... Please wait.</p>
          </div>

          <div v-if="batchResults.length > 0" class="batch-results">
            <h3>AI Processing Results ({{ batchResults.length }} {{ batchModalType === 'section' ? 'sections' : batchModalType + 's' }})</h3>
            
            <div class="batch-table-container">
              <table class="batch-table">
                <thead>
                  <tr v-if="batchModalType === 'student'">
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Grade</th>
                    <th>Section</th>
                    <th>LRN</th>
                  </tr>
                  <tr v-else-if="batchModalType === 'teacher'">
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Department</th>
                    <th>Domain</th>
                  </tr>
                  <tr v-else>
                    <th>Grade</th>
                    <th>Section</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in batchResults" :key="index" 
                      :class="{ 'has-error': item.hasError }">
                    <template v-if="batchModalType === 'student'">
                      <td>{{ item.firstName }}</td>
                      <td>{{ item.lastName }}</td>
                      <td>{{ item.gradeLevel }}</td>
                      <td>{{ item.section }}</td>
                      <td>{{ item.lrn || 'N/A' }}</td>
                    </template>
                    <template v-else-if="batchModalType === 'teacher'">
                      <td>{{ item.firstName }}</td>
                      <td>{{ item.lastName }}</td>
                      <td>{{ item.department }}</td>
                      <td>{{ item.domain }}</td>
                    </template>
                    <template v-else>
                      <td>{{ item.grade }}</td>
                      <td>{{ item.section }}</td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="batch-modal-footer">
          <div class="batch-actions">
            <button type="button" class="cancel-btn" @click="showBatchModal = false">
              <span class="material-icons">close</span>
              Cancel
            </button>
            <button 
              v-if="!batchResults.length" 
              type="button" 
              class="analyze-btn" 
              @click="processInputWithAI"
              :disabled="!batchInputText.trim() || batchProcessing"
            >
              <span class="material-icons">psychology</span>
              Analyze with AI
            </button>
            <button 
              v-else
              type="button" 
              class="create-btn" 
              @click="createBatchItems"
              :disabled="batchProcessing || batchCreating"
            >
              <span class="material-icons">add_circle</span>
              Create {{ batchResults.length }} {{ batchModalType === 'section' ? 'Sections' : batchModalType.charAt(0).toUpperCase() + batchModalType.slice(1) + 's' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { 
  registerStudent, 
  registerTeacher, 
  registerAdmin,
  fetchStudents,
  fetchTeachers,
  fetchAdmins,
  createGradeSection,
  getAllGradeSections,
  updateGradeSection,
  deleteGradeSection,
  updateUser,
  deleteUser,
  getUserDetails,
  getFullImageUrl
} from '@/services/authService';
import aiService from '@/services/aiService';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
// Import jsPDF and its autotable plugin properly
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Data for user lists
const students = ref([]);
const teachers = ref([]);
const admins = ref([]);
const loading = ref(true);

// Active tab tracking
const activeTab = ref('students');

// Search and filter states
const searchQuery = ref('');
const filters = ref({
  gradeLevel: '',
  section: '',
  department: '',
  domain: ''
});

// Modal states
const showModal = ref(false);
const modalType = ref('');
const formData = ref({
  gradeLevel: 7,
  section: ''
});

// Add grade section state
const gradeSections = ref([]);
const gradeSectionsLoading = ref(false);
const showGradeSectionModal = ref(false);
const currentGradeSection = ref({
  id: null,
  grade: 7,
  section: ''
});

// Add these computed properties for dynamic filter options
const filterOptions = computed(() => ({
  grades: [...new Set(students.value
    .map(student => student.gradeLevel)
    .filter(Boolean)
    .sort((a, b) => a - b))],
    
  sections: [...new Set(students.value
    .map(student => student.section)
    .filter(Boolean)
    .sort())],
    
  departments: [...new Set(teachers.value
    .map(teacher => teacher.department)
    .filter(Boolean)
    .sort())],
    
  domains: [...new Set(teachers.value
    .map(teacher => teacher.domain)
    .filter(Boolean)
    .sort())]
}));

const availableSections = ref([]);

// Add view mode state
const viewMode = ref('grid'); // 'grid' or 'table'

// Add this computed property to filter sections based on grade level
const availableSectionsForGrade = computed(() => {
  if (!editFormData.value.gradeLevel) return [];
  return gradeSections.value
    .filter(gs => gs.grade === editFormData.value.gradeLevel)
    .map(gs => gs.section);
});

// Add Batch Creation state
const showBatchModal = ref(false);
const batchModalType = ref('');
const batchInputText = ref('');
const batchDefaults = ref({
  gradeLevel: 7,
  section: '',
  department: 'GENERAL',
  domain: 'GENERAL'
});
const batchProcessing = ref(false);
const batchResults = ref([]);
const batchCreating = ref(false);

// Fix the onMounted handler to work with existing code
// Update this function
const closeAIDropdownOnClickOutside = (event) => {
  if (showAIDropdown.value && !event.target.closest('.ai-batch-dropdown')) {
    showAIDropdown.value = false;
  }
};

// Make sure to close the dropdown when opening the batch modal
const openBatchModal = (type) => {
  batchModalType.value = type;
  batchInputText.value = '';
  batchResults.value = [];
  batchProcessing.value = false;
  showAIDropdown.value = false; // Close the dropdown
  
  if (type === 'student') {
    batchDefaults.value = {
      gradeLevel: 7,
      section: availableSections.value[0] || ''
    };
  } else if (type === 'teacher') {
    batchDefaults.value = {
      department: 'GENERAL',
      domain: 'GENERAL'
    };
  }
  
  showBatchModal.value = true;
};

// Replace the entire onMounted function
// Initial data loading
onMounted(async () => {
  // Add the click event listener for the dropdown
  document.addEventListener('click', closeAIDropdownOnClickOutside);
  
  // Original onMounted code
  await loadAllUsers();
  await loadGradeSections();
  await loadSections();
  availableSections.value = gradeSections.value
    .filter(gs => gs.grade === formData.value.gradeLevel)
    .map(gs => gs.section);
});

const loadAllUsers = async () => {
  try {
    loading.value = true;
    const [fetchedStudents, fetchedTeachers, fetchedAdmins] = await Promise.all([
      fetchStudents(),
      fetchTeachers(),
      fetchAdmins()
    ]);
    
    students.value = fetchedStudents;
    teachers.value = fetchedTeachers;
    admins.value = fetchedAdmins;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to Load Users',
      text: err.message
    });
  } finally {
    loading.value = false;
  }
};

const generateCredentials = (firstName, lastName) => {
  if (!firstName || !lastName) return { email: '', password: '' };
  
  const sanitizedFirstName = firstName.toLowerCase().trim().replace(/\s+/g, '');
  const sanitizedLastName = lastName.toLowerCase().trim().replace(/\s+/g, '');
  return {
    email: `${sanitizedFirstName}${sanitizedLastName}@ncnhs.edu.ph`,
    password: `${sanitizedLastName}2025`
  };
};

// Update the updateCredentials function to use both first and last name
const updateCredentials = () => {
  if (formData.value.firstName && formData.value.lastName) {
    const { email, password } = generateCredentials(formData.value.firstName, formData.value.lastName);
    formData.value.email = email;
    formData.value.password = password;
  }
};

const openModal = (type) => {
  modalType.value = type;
  formData.value = getInitialFormData(type);
  showModal.value = true;
};

const getInitialFormData = (type) => {
  const baseData = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    address: ''
  };

  switch (type) {
    case 'student':
      return {
        ...baseData,
        lrn: null,
        gradeLevel: 7,
        section: ''
      };
    case 'teacher':
      return {
        ...baseData,
        domain: '',
        department: ''
      };
    default:
      return baseData;
  }
};

const handleSubmit = async () => {
  try {
    let registrationData = {
      firstName: formData.value.firstName.toUpperCase(),
      lastName: formData.value.lastName.toUpperCase(),
      email: formData.value.email,
      password: formData.value.password,
      address: formData.value.address ? formData.value.address.toUpperCase() : '',
      role: modalType.value
    };

    // Add student-specific fields
    if (modalType.value === 'student') {
      registrationData = {
        ...registrationData,
        lrn: formData.value.lrn,
        gradeLevel: formData.value.gradeLevel,
        section: formData.value.section.toUpperCase()
      };
    }

    // Add teacher-specific fields
    if (modalType.value === 'teacher') {
      registrationData = {
        ...registrationData,
        department: formData.value.department ? formData.value.department.toUpperCase() : '',
        domain: formData.value.domain ? formData.value.domain.toUpperCase() : ''
      };
    }

    // Call the appropriate registration function
    let response;
    switch (modalType.value) {
      case 'student':
        response = await registerStudent(registrationData);
        break;
      case 'teacher':
        response = await registerTeacher(registrationData);
        break;
      case 'admin':
        response = await registerAdmin(registrationData);
        break;
      default:
        throw new Error('Invalid user type');
    }

    // Handle successful registration
    if (response) {
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: `${modalType.value} account created successfully`
      });
      await loadAllUsers();
      showModal.value = false;
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Registration Failed',
      text: error.message
    });
  }
};

const filteredUsers = computed(() => {
  let users = [];
  
  switch (activeTab.value) {
    case 'students':
      users = students.value;
      break;
    case 'teachers':
      users = teachers.value;
      break;
    case 'admins':
      users = admins.value;
      break;
  }

  return users.filter(user => {
    const searchMatch = !searchQuery.value || 
      user.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());

    let filterMatch = true;
    
    if (activeTab.value === 'students') {
      if (filters.value.gradeLevel && user.gradeLevel !== filters.value.gradeLevel) {
        filterMatch = false;
      }
      if (filters.value.section && user.section !== filters.value.section) {
        filterMatch = false;
      }
    }
    
    if (activeTab.value === 'teachers') {
      if (filters.value.department && user.department !== filters.value.department) {
        filterMatch = false;
      }
      if (filters.value.domain && user.domain !== filters.value.domain) {
        filterMatch = false;
      }
    }

    return searchMatch && filterMatch;
  });
});

// Load grade sections
const loadGradeSections = async () => {
  gradeSectionsLoading.value = true;
  try {
    const response = await getAllGradeSections();
    gradeSections.value = response.gradeSections;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to load grade sections',
      text: error.message
    });
  } finally {
    gradeSectionsLoading.value = false;
  }
};

// Open grade section modal
const openGradeSectionModal = (gradeSection = null) => {
  currentGradeSection.value = gradeSection ? { ...gradeSection } : {
    id: null,
    grade: 7,
    section: ''
  };
  showGradeSectionModal.value = true;
};

// Save grade section
const saveGradeSection = async () => {
  try {
    const grade = parseInt(currentGradeSection.value.grade);
    if (grade < 7 || grade > 12) {
      throw new Error('Grade must be between 7 and 12');
    }
    
    // Convert section to uppercase before saving
    const uppercaseSection = currentGradeSection.value.section.toUpperCase();
    
    if (currentGradeSection.value.id) {
      // Update existing grade section
      await updateGradeSection(
        currentGradeSection.value.id,
        grade,
        uppercaseSection
      );
      Swal.fire({
        icon: 'success',
        title: 'Grade section updated!',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      // Create new grade section
      await createGradeSection(
        grade,
        uppercaseSection
      );
      Swal.fire({
        icon: 'success',
        title: 'Grade section created!',
        showConfirmButton: false,
        timer: 1500
      });
    }
    await loadGradeSections();
    showGradeSectionModal.value = false;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Grade',
      text: error.message
    });
  }
};

// Delete grade section
const deleteGrade = async (id) => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await deleteGradeSection(id);
      await loadGradeSections();
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Grade section has been deleted.',
        showConfirmButton: false,
        timer: 1500
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Watch grade level changes to update sections
watch(() => formData.value.gradeLevel, async (newGrade) => {
  const response = await getAllGradeSections();
  availableSections.value = response.gradeSections
    .filter(gs => gs.grade === newGrade)
    .map(gs => gs.section);
  formData.value.section = availableSections.value[0] || '';
});

// Add user details modal
const showUserDetailsModal = ref(false);
const selectedUser = ref(null);

// Add view user details function
const viewUserDetails = (user) => {
  selectedUser.value = user;
  showUserDetailsModal.value = true;
};

// Add utility functions
const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

const formatValue = (key, value) => {
  if (!value && value !== 0) return 'N/A';
  
  // Format dates
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
    return new Date(value).toLocaleString();
  }
  
  // Format boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Format arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  
  // Format objects
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  
  return value;
};

// Update the edit form data
const editFormData = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  address: '',
  lrn: null,
  gradeLevel: null,
  section: '',
  department: '',
  domain: '',
  role: '',
  createdAt: ''
});

// Update user function
const handleUpdateUser = async () => {
  try {
    const updateData = { 
      ...editFormData.value,
      firstName: editFormData.value.firstName.toUpperCase(),
      lastName: editFormData.value.lastName.toUpperCase(),
      address: editFormData.value.address ? editFormData.value.address.toUpperCase() : '',
    };

    // Handle role-specific fields
    if (updateData.role === 'student') {
      updateData.section = updateData.section ? updateData.section.toUpperCase() : '';
    }
    
    if (updateData.role === 'teacher') {
      updateData.department = updateData.department ? updateData.department.toUpperCase() : '';
      updateData.domain = updateData.domain ? updateData.domain.toUpperCase() : '';
    }

    if (!updateData.password) {
      delete updateData.password;
    }

    await updateUser(editFormData.value.id, updateData);
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'User updated successfully'
    });
    
    await loadAllUsers(); // Refresh the users list
    showEditModal.value = false;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Show edit modal
const showEditModal = ref(false);

// Update openEditModal to use the service
const openEditModal = async (user) => {
  try {
    const userDetails = await getUserDetails(user.id);
    editFormData.value = {
      id: userDetails.id,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      email: userDetails.email,
      address: userDetails.address || '',
      role: userDetails.role,
      password: '',
      createdAt: userDetails.createdAt,
      lrn: userDetails.lrn || null,
      gradeLevel: userDetails.gradeLevel || null,
      section: userDetails.section || '',
      department: userDetails.department || '',
      domain: userDetails.domain || ''
    };

    // Load grade sections if editing a student
    if (userDetails.role === 'student') {
      await loadGradeSections();
    }

    showEditModal.value = true;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Add date formatting function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const handleDeleteUser = async (userId) => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await deleteUser(userId);
      await loadAllUsers(); // Refresh the users list
      Swal.fire(
        'Deleted!',
        'User has been deleted.',
        'success'
      );
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Add this function to load sections
const loadSections = async () => {
  try {
    const response = await getAllGradeSections();
    // Extract unique section names from grade sections
    availableSections.value = [...new Set(response.gradeSections.map(gs => gs.section))];
  } catch (error) {
    console.error('Error loading sections:', error);
  }
};

// Add handler for image loading errors
const handleImageError = (event, user) => {
  // Hide the broken image
  event.target.style.display = 'none';
  
  // Show the parent container as an avatar with initials
  const container = event.target.parentElement;
  container.classList.add(event.target.classList.contains('user-avatar-img') ? 'user-avatar' : 'table-avatar');
  container.textContent = `${user.firstName[0]}${user.lastName[0]}`;
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.backgroundColor = '#f5f5f5';
  container.style.color = '#666';
  container.style.fontWeight = 'bold';
};

// Functions for Batch Creation
const processInputWithAI = async () => {
  if (!batchInputText.value.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'No Input',
      text: 'Please enter some text to process.'
    });
    return;
  }
  
  batchProcessing.value = true;
  
  try {
    if (batchModalType.value === 'section') {
      // Process grade sections
      const sections = await aiService.parseAndGenerateGradeSections(batchInputText.value);
      batchResults.value = sections;
    } else {
      // Process users (students or teachers)
      const users = await aiService.parseAndGenerateUsers(
        batchInputText.value, 
        batchModalType.value, 
        batchDefaults.value
      );
      
      // Assign unique LRNs to students right after AI processing
      if (batchModalType.value === 'student') {
        usedLRNs.clear(); // Reset tracking
        users.forEach(student => {
          // If LRN is missing or null, generate a unique one immediately
          if (!student.lrn) {
            student.lrn = generateRandomLRN();
          } else {
            // Ensure LRN is always stored as a string
            student.lrn = student.lrn.toString();
          }
        });
      }
      
      batchResults.value = users;
    }
  } catch (error) {
    console.error('Error processing with AI:', error);
    Swal.fire({
      icon: 'error',
      title: 'Processing Failed',
      text: error.message || 'Failed to process input with AI'
    });
  } finally {
    batchProcessing.value = false;
  }
};

// Add a function to generate a random LRN number with used LRN tracking
const usedLRNs = new Set(); // Track used LRNs to avoid duplicates

const generateRandomLRN = (attempt = 0, gradeLevel = 10) => {
  // Create a timestamp-based LRN with exactly 12 digits and additional randomness
  // Format for uniqueness and 12-digit compliance
  
  // Map grade level to a single digit prefix
  const gradePrefix = gradeLevel === 10 ? 0 : 
                      gradeLevel === 11 ? 1 : 
                      gradeLevel === 12 ? 2 : gradeLevel;
  
  // Get current date and time components
  const now = new Date();
  // Add delay based on attempt number to ensure time difference
  now.setMilliseconds(now.getMilliseconds() + (attempt * 111));
  
  // Use timestamp components
  const timestamp = now.getTime().toString();
  
  // Add randomness - create a 3-digit random number
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // Create a uniqueness string with:
  // - Grade prefix (1 digit)
  // - Last 7 digits of timestamp
  // - 3 random digits
  // - Attempt digit (0-9)
  const timestampPart = timestamp.slice(-7);
  const attemptDigit = (attempt % 10).toString();
  
  // Combine all components into a 12-digit string
  let lrn = `${gradePrefix}${timestampPart}${randomDigits.substring(0, 3)}${attemptDigit}`;
  
  // Ensure it's exactly 12 digits
  if (lrn.length > 12) {
    lrn = lrn.substring(0, 12);
  } else if (lrn.length < 12) {
    // Pad with random digits if needed
    while (lrn.length < 12) {
      lrn += Math.floor(Math.random() * 10).toString();
    }
  }
  
  return lrn;
};

// Update the createBatchItems function to avoid regenerating LRNs
const createBatchItems = async () => {
  if (!batchResults.value.length) return;
  
  batchCreating.value = true;
  
  try {
    // Start with confirmation
    const result = await Swal.fire({
      title: 'Confirm Batch Creation',
      text: `Are you sure you want to create ${batchResults.value.length} ${batchModalType.value === 'section' ? 'grade sections' : batchModalType.value + 's'}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create them',
      cancelButtonText: 'No, cancel'
    });
    
    if (!result.isConfirmed) {
      batchCreating.value = false;
      return;
    }
    
    // Show loading indicator
    Swal.fire({
      title: 'Creating...',
      text: 'Please wait while we create the items',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    let successCount = 0;
    let errorCount = 0;
    let failedItems = [];
    
    if (batchModalType.value === 'section') {
      // Create grade sections
      for (const section of batchResults.value) {
        try {
          await createGradeSection(section.grade, section.section);
          successCount++;
        } catch (error) {
          console.error('Error creating section:', error);
          errorCount++;
          failedItems.push(section);
        }
      }
    } else if (batchModalType.value === 'student') {
      // Create students - with enhanced retry mechanism and delays
      for (const student of batchResults.value) {
        let isCreated = false;
        let attempts = 0;
        const maxAttempts = 10; // Increased maximum attempts for unique LRN generation
        
        // Try multiple times with different LRNs if needed
        while (!isCreated && attempts < maxAttempts) {
          try {
            // Generate email and password
            const { email, password } = generateCredentials(student.firstName, student.lastName);
            
            // Generate unique LRN with additional randomness
            const lrn = generateRandomLRN(attempts, student.gradeLevel);
            
            // Add a longer delay between retries with exponential backoff
            if (attempts > 0) {
              // Exponential backoff: 200ms, 400ms, 800ms, etc.
              const delayTime = 200 * Math.pow(2, attempts - 1);
              await new Promise(resolve => setTimeout(resolve, delayTime));
            }
            
            const studentData = {
              firstName: student.firstName,
              lastName: student.lastName,
              email: email,
              password: password,
              address: student.address || '',
              role: 'student',
              lrn: lrn,
              gradeLevel: student.gradeLevel,
              section: student.section
            };
            
            await registerStudent(studentData);
            isCreated = true;
            student.lrn = lrn; // Update the LRN in the original data
            successCount++;
            
            // Add a small delay after success to prevent timestamp collisions
            await new Promise(resolve => setTimeout(resolve, 50));
            
          } catch (error) {
            console.error(`Attempt ${attempts + 1} failed for ${student.firstName} ${student.lastName}:`, error);
            
            // Always increment attempts - any error qualifies for a retry with a new timestamp
            attempts++;
            console.log(`Retrying with a different LRN, attempt ${attempts}`);
          }
        }
        
        // If we've exhausted all attempts, count as an error
        if (!isCreated && attempts >= maxAttempts) {
          console.error(`Failed to create student after ${maxAttempts} attempts:`, student);
          errorCount++;
          failedItems.push({...student, error: `Failed after ${maxAttempts} attempts to generate a unique LRN`});
        }
      }
    } else if (batchModalType.value === 'teacher') {
      // Create teachers
      for (const teacher of batchResults.value) {
        try {
          // Generate email and password
          const { email, password } = generateCredentials(teacher.firstName, teacher.lastName);
          
          const teacherData = {
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: email,
            password: password,
            address: teacher.address || '',
            role: 'teacher',
            department: teacher.department,
            domain: teacher.domain
          };
          
          await registerTeacher(teacherData);
          successCount++;
        } catch (error) {
          console.error('Error creating teacher:', error);
          errorCount++;
          failedItems.push(teacher);
        }
      }
    }
    
    // Close loading indicator
    Swal.close();
    
    // Show simple completion message
    Swal.fire({
      icon: successCount > 0 ? 'success' : 'error',
      title: 'Batch Creation Complete',
      text: `Successfully created: ${successCount} ${errorCount > 0 ? `, Failed: ${errorCount}` : ''}`,
      timer: errorCount > 0 ? undefined : 2000,
      showConfirmButton: errorCount > 0
    });
    
    // Refresh data
    await loadAllUsers();
    await loadGradeSections();
    showBatchModal.value = false;
    
  } catch (error) {
    console.error('Batch creation error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Batch Creation Failed',
      text: error.message || 'An unexpected error occurred'
    });
  } finally {
    batchCreating.value = false;
  }
};

// Add dropdown state variable and toggle function
const showAIDropdown = ref(false);

// Function to toggle dropdown
const toggleAIDropdown = () => {
  showAIDropdown.value = !showAIDropdown.value;
};

// Export functionality
const showExportOptions = ref(false);
const exportOptions = ref({
  fields: {
    name: true,
    email: false,
    lrn: false,
    grade: false,
    section: false,
    department: false,
    domain: false
  }
});

const toggleExportOptions = () => {
  showExportOptions.value = !showExportOptions.value;
  // Close AI dropdown if open
  if (showAIDropdown.value) {
    showAIDropdown.value = false;
  }
};

const closeExportOptionsOnClickOutside = (event) => {
  if (showExportOptions.value && !event.target.closest('.export-controls')) {
    showExportOptions.value = false;
  }
};

// Prepare data for export based on selected options
const getExportData = () => {
  let dataToExport = [];
  let headers = [];
  
  // Determine which data to include based on active tab and selected fields
  if (activeTab.value === 'students') {
    const fields = exportOptions.value.fields;
    
    // Build headers array
    if (fields.name) headers.push('First Name', 'Last Name');
    if (fields.email) headers.push('Email');
    if (fields.lrn) headers.push('LRN');
    if (fields.grade) headers.push('Grade Level');
    if (fields.section) headers.push('Section');
    
    // Build rows
    dataToExport = filteredUsers.value.map(student => {
      const row = {};
      if (fields.name) {
        row['First Name'] = student.firstName;
        row['Last Name'] = student.lastName;
      }
      if (fields.email) row['Email'] = student.email;
      if (fields.lrn) row['LRN'] = student.lrn || 'N/A';
      if (fields.grade) row['Grade Level'] = student.gradeLevel || 'N/A';
      if (fields.section) row['Section'] = student.section || 'N/A';
      return row;
    });
  } 
  else if (activeTab.value === 'teachers') {
    const fields = exportOptions.value.fields;
    
    // Build headers array
    if (fields.name) headers.push('First Name', 'Last Name');
    if (fields.email) headers.push('Email');
    if (fields.department) headers.push('Department');
    if (fields.domain) headers.push('Domain');
    
    // Build rows
    dataToExport = filteredUsers.value.map(teacher => {
      const row = {};
      if (fields.name) {
        row['First Name'] = teacher.firstName;
        row['Last Name'] = teacher.lastName;
      }
      if (fields.email) row['Email'] = teacher.email;
      if (fields.department) row['Department'] = teacher.department || 'N/A';
      if (fields.domain) row['Domain'] = teacher.domain || 'N/A';
      return row;
    });
  } 
  else if (activeTab.value === 'admins') {
    const fields = exportOptions.value.fields;
    
    // Build headers array
    if (fields.name) headers.push('First Name', 'Last Name');
    if (fields.email) headers.push('Email');
    
    // Build rows
    dataToExport = filteredUsers.value.map(admin => {
      const row = {};
      if (fields.name) {
        row['First Name'] = admin.firstName;
        row['Last Name'] = admin.lastName;
      }
      if (fields.email) row['Email'] = admin.email;
      return row;
    });
  } 
  else if (activeTab.value === 'sections') {
    const fields = exportOptions.value.fields;
    
    // Build headers array
    if (fields.grade) headers.push('Grade');
    if (fields.section) headers.push('Section');
    
    // Build rows
    dataToExport = gradeSections.value.map(gs => {
      const row = {};
      if (fields.grade) row['Grade'] = gs.grade;
      if (fields.section) row['Section'] = gs.section;
      return row;
    });
  }
  
  return { headers, data: dataToExport };
};

// Export to Excel
const exportToExcel = () => {
  try {
    const { headers, data } = getExportData();
    
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There is no data to export.'
      });
      return;
    }
    
    // Create worksheet with custom headers
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.value.toUpperCase());
    
    // Generate Excel file
    const fileName = `NCNHS_${activeTab.value}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    // Hide export options after export
    showExportOptions.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Export Complete',
      text: `Data exported to Excel successfully as ${fileName}`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Export to Excel error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Export Failed',
      text: 'Failed to export data to Excel. Please try again.'
    });
  }
};

// Export to PDF
const exportToPDF = () => {
  try {
    const { headers, data } = getExportData();
    
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There is no data to export.'
      });
      return;
    }
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    const title = `NCNHS ${activeTab.value.toUpperCase()} DATA`;
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add date
    const currentDate = new Date().toLocaleDateString();
    doc.setFontSize(10);
    doc.text(`Generated: ${currentDate}`, 14, 22);
    
    // Extract values for autoTable
    const tableData = data.map(item => Object.values(item));
    
    // Create table with autoTable
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
    
    // Generate PDF filename
    const fileName = `NCNHS_${activeTab.value}_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    // Save PDF
    doc.save(fileName);
    
    // Hide export options after export
    showExportOptions.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Export Complete',
      text: `Data exported to PDF successfully as ${fileName}`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Export to PDF error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Export Failed',
      text: 'Failed to export data to PDF. Please try again.'
    });
  }
};

// Print data
const printData = () => {
  try {
    const { headers, data } = getExportData();
    
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There is no data to print.'
      });
      return;
    }
    
    // Create a print-friendly display using SweetAlert
    Swal.fire({
      title: `NCNHS ${activeTab.value.toUpperCase()} DATA`,
      html: `
        <div class="print-preview">
          <div class="print-date">Generated: ${new Date().toLocaleDateString()}</div>
          <div class="table-container">
            <table class="print-table">
              <thead>
                <tr>
                  ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => `
                  <tr>
                    ${Object.values(row).map(cell => `<td>${cell}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `,
      width: '80%',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: 'Print',
      customClass: {
        popup: 'print-popup',
        content: 'print-content'
      },
      didOpen: () => {
        // Add print-specific styles
        const style = document.createElement('style');
        style.textContent = `
          .print-preview {
            font-family: Arial, sans-serif;
            padding: 10px;
          }
          .print-date {
            color: #555;
            font-size: 12px;
            margin-bottom: 20px;
          }
          .table-container {
            max-height: 60vh;
            overflow-y: auto;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .print-table th {
            background-color: #2980b9;
            color: white;
            font-weight: bold;
            position: sticky;
            top: 0;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }
          .print-table tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .print-popup {
            max-width: 1000px !important;
          }
          .print-content {
            padding: 0;
          }
                     /* Remove problematic print styles */
        `;
        document.head.appendChild(style);
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Create a separate print-only div outside of SweetAlert
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        
        document.body.appendChild(printFrame);
        
        printFrame.contentDocument.write(`
          <html>
            <head>
              <title>NCNHS ${activeTab.value.toUpperCase()} DATA</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2980b9; font-size: 20px; }
                .print-date { color: #555; font-size: 12px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background-color: #2980b9; color: white; font-weight: bold; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                tr:nth-child(even) { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h1>NCNHS ${activeTab.value.toUpperCase()} DATA</h1>
              <div class="print-date">Generated: ${new Date().toLocaleDateString()}</div>
              <table>
                <thead>
                  <tr>
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${data.map(row => `
                    <tr>
                      ${Object.values(row).map(cell => `<td>${cell}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
        
        printFrame.contentDocument.close();
        
        // Wait for content to load
        setTimeout(() => {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
          // Remove the frame after printing
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 500);
        }, 300);
      }
    });
    
    // Hide export options after print dialog is shown
    showExportOptions.value = false;
  } catch (error) {
    console.error('Print error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Print Failed',
      text: 'Failed to prepare data for printing. Please try again.'
    });
  }
};

// Update event listeners for both dropdowns
document.addEventListener('click', closeExportOptionsOnClickOutside);

// Make sure to remove all event listeners when component is unmounted
onBeforeUnmount(() => {
  document.removeEventListener('click', closeAIDropdownOnClickOutside);
  document.removeEventListener('click', closeExportOptionsOnClickOutside);
});
</script>

<style scoped>
.manage-users {
  padding: 2rem;
  max-width: auto;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  color: white;
}

.add-btn.student { background-color: #4CAF50; }
.add-btn.teacher { background-color: #2196F3; }
.add-btn.admin { background-color: #9C27B0; }
.add-btn.grade-section { background-color: #9C27B0; }

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-box .material-icons {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #f5f5f5;
  color: #666;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #2196F3;
  color: white;
}

.filter-group {
  display: flex;
  gap: 1rem;
}

.filter-group select {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  min-width: 150px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  transition: all 0.3s ease;
}

.filter-group select:hover {
  border-color: #2196F3;
}

.filter-group select:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33,150,243,0.1);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  position: relative; /* Add position relative for better control */
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.user-avatar-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0; /* Prevent avatar from shrinking */
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
  flex-shrink: 0; /* Prevent avatar from shrinking */
}

.user-info {
  flex: 1;
  min-width: 0; /* Allow text truncation */
  overflow: hidden; /* Ensure content doesn't overflow */
}

.user-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #666;
  white-space: nowrap;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0; /* Prevent action buttons from shrinking */
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.view {
  background: #e3f2fd;
  color: #2196F3;
}

.action-btn.edit {
  background: #e3f2fd;
  color: #2196F3;
}

.action-btn.delete {
  background: #ffebee;
  color: #f44336;
}

.action-btn:hover {
  transform: scale(1.1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.registration-form {
  padding: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  flex: 1;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-group select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.save-btn:hover {
  background: #43A047;
}

.save-btn:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}

/* Form error states */
.form-group.error input,
.form-group.error select {
  border-color: #F44336;
}

.form-group.error input:focus,
.form-group.error select:focus {
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}

.error-message {
  color: #F44336;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Form animations */
.form-transition-enter-active,
.form-transition-leave-active {
  transition: all 0.3s ease;
}

.form-transition-enter-from,
.form-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive form styles */
@media (max-width: 768px) {
  .form-group {
    margin-bottom: 1rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state .material-icons {
  font-size: 48px;
  margin-bottom: 1rem;
  color: #ccc;
}

/* Responsive Design */
@media (max-width: 768px) {
  .manage-users {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  /* Updated mobile card styles */
  .user-card {
    padding: 1rem;
    flex-wrap: wrap; /* Allow wrapping on mobile */
    gap: 0.75rem;
    width: 100%;
    overflow: visible; /* Ensure content is visible */
  }
  
  .user-avatar-container, 
  .user-avatar {
    width: 40px;
    height: 40px;
  }
  
  .user-info {
    width: calc(100% - 130px); /* Account for avatar and action buttons */
  }
  
  .user-info h3 {
    font-size: 0.95rem;
  }
  
  .email {
    font-size: 0.8rem;
  }
  
  .details {
    width: 100%;
    margin-top: 0.5rem;
    margin-left: 40px; /* Align with avatar */
    padding-right: 40px; /* Make space for action buttons */
  }
  
  .detail-item {
    font-size: 0.75rem;
    margin-right: 0.75rem;
  }
  
  .user-actions {
    position: absolute;
    top: 1rem;
    right: 1rem;
    gap: 0.35rem;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
  
  .action-btn .material-icons {
    font-size: 16px;
  }
}

/* Update icon-related styles */
.material-icons {
  font-size: 20px;
  line-height: 1;
}

.detail-item .material-icons {
  font-size: 16px;
  margin-right: 4px;
}

.action-btn .material-icons {
  font-size: 18px;
}

/* Add these styles */
.generated-input {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.generated-input:focus {
  outline: none;
  border-color: #e0e0e0;
}

/* Grade Section Management Styles */
.grade-sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.grade-section-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.grade-section-card:hover {
  transform: translateY(-2px);
}

.grade-section-header {
  margin-bottom: 1rem;
}

.grade-section-header h3 {
  font-size: 1.1rem;
  color: #333;
}

.grade-section-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.add-btn.grade-section {
  background: #9C27B0;
}

.add-btn.grade-section:hover {
  background: #7B1FA2;
}

/* Add tab styling for sections */
.tab-btn[data-tab="sections"] {
  background: #9C27B0;
}

.tab-btn[data-tab="sections"]:hover {
  background: #7B1FA2;
}

/* Add view button styling */
.action-btn.view {
  color: #2196F3;
}

.action-btn.view:hover {
  background: rgba(33, 150, 243, 0.1);
}

/* Add user details modal styling */
.user-details {
  padding: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 400;
}

/* Add view controls styling */
.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
}

.view-toggle-group {
  display: flex;
  gap: 0.5rem;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-toggle-btn:hover {
  background: #f5f5f5;
}

.view-toggle-btn.active {
  background: #2196F3;
  color: white;
  border-color: #2196F3;
}

/* Export controls */
.export-controls {
  position: relative;
}

.export-main-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #4CAF50;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-main-btn:hover {
  background: #43A047;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.export-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  z-index: 100;
  animation: fadeIn 0.2s ease;
  overflow: hidden;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.export-options-header {
  padding: 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.export-options-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.export-data-selection {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.export-data-selection h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: #555;
}

.export-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.export-checkboxes label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #333;
  cursor: pointer;
}

.export-checkboxes input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.export-actions {
  display: flex;
  padding: 1rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.export-btn {
  flex: 1;
  min-width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn .material-icons {
  font-size: 18px;
}

.export-btn.excel {
  background: #1D6F42;
}

.export-btn.excel:hover {
  background: #0E5A2F;
}

.export-btn.pdf {
  background: #E74C3C;
}

.export-btn.pdf:hover {
  background: #C0392B;
}

.export-btn.print {
  background: #7F8C8D;
}

.export-btn.print:hover {
  background: #5a6a6b;
}

/* Add table styling */
.users-table {
  width: 100%;
  overflow-x: auto;
  margin-top: 1rem;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background: #f5f5f5;
  font-weight: 500;
}

.users-table tr:hover {
  background: #fafafa;
}

/* Responsive table */
@media (max-width: 768px) {
  .manage-users {
    padding: 0rem;
  }
  
  /* Header section fixes */
  .page-header {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  /* Action buttons fixes */
  .header-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .add-btn {
    padding: 0.5rem;
    font-size: 0.75rem;
    min-width: auto;
    width: 100%;
    height: 40px;
  }

  .add-btn .material-icons {
    font-size: 14px;
  }

  /* Filter section fixes */
  .filters-section {
    padding: 0.75rem;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .search-box {
    width: 100%;
    min-width: 100%;
  }

  .search-box input {
    padding: 0.5rem 0.75rem 0.5rem 2rem;
    font-size: 0.9rem;
  }

  /* Tabs fixes */
  .tabs {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  .tab-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  /* Filter group fixes */
  .filter-group {
    width: 100%;
    flex-wrap: wrap;
  }

  .filter-group select {
    width: 100%;
    padding: 0.5rem;
    font-size: 0.85rem;
  }

  /* Users grid fixes */
  .users-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .user-card {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .user-info h3 {
    font-size: 0.9rem;
  }

  .email {
    font-size: 0.8rem;
  }

  .details {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .detail-item {
    font-size: 0.75rem;
  }

  /* Action buttons in cards */
  .user-actions {
    gap: 0.25rem;
  }

  .action-btn {
    width: 28px;
    height: 28px;
  }

  .action-btn .material-icons {
    font-size: 16px;
  }

  /* Table view fixes */
  .users-table {
    margin-top: 0.5rem;
  }

  .users-table td, 
  .users-table th {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  /* View controls fixes */
  .view-controls {
    margin: 0.5rem 0;
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
  
  .view-toggle-group {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .view-toggle-btn {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    flex: 1;
  }
  
  .export-main-btn {
    width: 100%;
    justify-content: center;
  }
  
  .export-dropdown {
    width: 100%;
    right: auto;
    left: 0;
  }
  
  .export-checkboxes {
    grid-template-columns: 1fr;
  }

  /* Modal fixes */
  .modal-content {
    width: 95%;
    margin: 1rem;
    max-height: 85vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .registration-form {
    padding: 1rem;
  }

  /* Form fixes */
  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }

  .form-group input,
  .form-group select {
    padding: 0.5rem;
    font-size: 0.9rem;
  }

  /* Fix overlapping issues */
  .form-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-actions {
    padding-top: 1rem;
    margin-top: 1rem;
    gap: 0.5rem;
  }

  /* Avatar fixes */
  .user-avatar-container,
  .user-avatar {
    width: 35px;
    height: 35px;
  }

  .table-avatar-container,
  .table-avatar {
    width: 30px;
    height: 30px;
    font-size: 0.7rem;
  }
}

/* Add this to your existing styles */
.uppercase-input {
  text-transform: uppercase;
}

.uppercase-input::placeholder {
  text-transform: none; /* Keep placeholders in normal case */
}

.table-avatar-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.table-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
  font-size: 0.85rem;
}

/* Responsive adjustments for profile pictures */
@media (max-width: 768px) {
  .user-avatar-container, .user-avatar {
    width: 40px;
    height: 40px;
  }
  
  .table-avatar-container, .table-avatar {
    width: 30px;
    height: 30px;
  }
}

/* Grade Section Modal Specific Styles */
.grade-section-modal {
  max-width: 500px;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-title .material-icons {
  font-size: 24px;
  color: #2196F3;
}

.grade-section-form {
  padding: 1.5rem;
}

.grade-section-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.grade-section-form .form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #424242;
}

.grade-section-form .form-group label .material-icons {
  font-size: 18px;
  color: #4CAF50;
}

.form-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #E8F5E9;
  border: 1px solid #A5D6A7;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-icon {
  color: #4CAF50;
}

.form-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #2E7D32;
}

.grade-section-form .form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E0E0E0;
}

.grade-section-form .save-btn,
.grade-section-form .cancel-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.grade-section-form .save-btn {
  background: #4CAF50;
  color: white;
  border: none;
}

.grade-section-form .save-btn:hover {
  background: #43A047 !important;
}

.grade-section-form .cancel-btn {
  background: #F5F5F5;
  color: #616161;
  border: 1px solid #E0E0E0;
}

.grade-section-form .cancel-btn:hover {
  background: #EEEEEE;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grade-section-form .form-row {
    grid-template-columns: 1fr;
  }
  
  .grade-section-modal {
    width: 95%;
    margin: 1rem;
  }
  
  .grade-section-form .form-actions {
    flex-direction: column-reverse;
  }
  
  .grade-section-form .save-btn,
  .grade-section-form .cancel-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Form actions buttons */
.submit-btn {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #1E88E5 0%, #1565C0 100%);
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .submit-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}

/* AI Batch Creation Styles */
.ai-batch-dropdown {
  position: relative;
  margin-bottom: 2rem;
}

.ai-batch-main-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  border-radius: 10px;
  border: none;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #673AB7 0%, #512DA8 100%);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.ai-batch-main-btn.active {
  background: linear-gradient(135deg, #5E35B1 0%, #4527A0 100%);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.ai-batch-main-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.dropdown-icon {
  margin-left: auto;
  transition: transform 0.3s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.ai-dropdown-content {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
  animation: fadeInDown 0.3s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.ai-dropdown-item:hover {
  background-color: #f5f5f5;
}

.ai-dropdown-item.student {
  border-left-color: #4CAF50;
}

.ai-dropdown-item.teacher {
  border-left-color: #2196F3;
}

.ai-dropdown-item.section {
  border-left-color: #9C27B0;
}

.ai-dropdown-item .material-icons {
  font-size: 1.25rem;
}

.ai-dropdown-item.student .material-icons {
  color: #4CAF50;
}

.ai-dropdown-item.teacher .material-icons {
  color: #2196F3;
}

.ai-dropdown-item.section .material-icons {
  color: #9C27B0;
}

/* Responsive styles */
@media (max-width: 768px) {
  .ai-batch-main-btn {
    padding: 0.75rem 1rem;
  }
  
  .ai-dropdown-item {
    padding: 0.75rem 1rem;
  }
}

/* Batch Modal Styles */
.batch-modal {
  max-width: 800px;
  width: 90vw;
  max-height: 85vh;
}

.batch-modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(85vh - 180px);
}

.batch-instructions {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background-color: #e8f5e9;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #4CAF50;
}

.instructions-icon {
  color: #4CAF50;
  font-size: 1.5rem;
}

.instructions-text p {
  margin: 0;
  color: #2E7D32;
  line-height: 1.5;
}

.batch-textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 150px;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.batch-textarea:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  outline: none;
}

.batch-defaults {
  background-color: #f5f5f5;
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.batch-defaults h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #424242;
}

.defaults-row {
  display: flex;
  gap: 1rem;
}

.defaults-group {
  flex: 1;
  margin-bottom: 0.5rem;
}

.defaults-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #616161;
}

.defaults-group input,
.defaults-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.defaults-group input:focus,
.defaults-group select:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  outline: none;
}

.batch-processing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 1rem 0;
}

.batch-processing .spinner {
  margin-bottom: 1rem;
  width: 40px;
  height: 40px;
}

.batch-results {
  margin-top: 1.5rem;
}

.batch-results h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #424242;
}

.batch-table-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
}

.batch-table th,
.batch-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.batch-table th {
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.batch-table tr:hover {
  background-color: #f9f9f9;
}

.batch-table tr.has-error {
  background-color: #ffebee;
}

.batch-modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.batch-actions {
  display: flex;
  gap: 1rem;
}

.analyze-btn,
.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.analyze-btn {
  background: linear-gradient(135deg, #673AB7 0%, #512DA8 100%);
  color: white;
}

.create-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
  color: white;
}

.analyze-btn:hover,
.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.analyze-btn:disabled,
.create-btn:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive design for batch creation */
@media (max-width: 768px) {
  .ai-batch-dropdown {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .ai-batch-main-btn {
    width: 100%;
    padding: 0.75rem 1rem;
  }
  
  .batch-modal {
    width: 95vw;
    margin: 0.5rem;
  }
  
  .batch-modal-content {
    padding: 1rem;
  }
  
  .defaults-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .batch-instructions {
    padding: 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .batch-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .cancel-btn,
  .analyze-btn,
  .create-btn {
    width: 100%;
    justify-content: center;
  }
  
  .batch-table th,
  .batch-table td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .batch-table-container {
    max-height: 250px;
  }
}

/* Responsive design for batch creation */
@media (max-width: 768px) {
  .ai-batch-dropdown {
    position: relative;
    margin-bottom: 1.5rem;
  }
  
  .ai-batch-main-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .ai-dropdown-item {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
  
  .ai-dropdown-content {
    width: 100%;
    position: absolute;
    z-index: 20;
  }
}
</style>