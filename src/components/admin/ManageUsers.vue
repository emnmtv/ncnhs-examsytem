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
      <button @click="openBulkUploadModal" class="add-btn bulk-upload">
        <span class="material-icons">upload_file</span> Bulk Upload Students
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
          v-for="tab in ['students', 'teachers', 'admins', 'sections', 'archived']"
          :key="tab"
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="tab === 'archived' ? fetchArchivedUsers() : (activeTab = tab)"
        >
          <span class="material-icons tab-icon" v-if="tab === 'archived'">archive</span>
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

      <!-- Add archived user filters -->
      <div v-if="activeTab === 'archived'" class="filter-group">
        <select v-model="archivedFilters.role">
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
        <select v-model="archivedFilters.sortBy">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <div class="date-filter">
          <input 
            type="date" 
            v-model="archivedFilters.startDate" 
            placeholder="From Date"
            class="date-input"
          />
          <span class="date-separator">to</span>
          <input 
            type="date" 
            v-model="archivedFilters.endDate" 
            placeholder="To Date"
            class="date-input"
          />
        </div>
      </div>
    </div>

    <!-- Bulk Upload Modal -->
    <div v-if="showBulkModal" class="modal-overlay" @click="showBulkModal = false">
      <div class="modal-content bulk-modal" :class="{ 'bulk-modal-large': bulkPreviewRows.length }" @click.stop>
        <div class="modal-header">
          <h2>Bulk Upload Students</h2>
          <button class="close-btn" @click="showBulkModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="registration-form">
          <div class="form-actions" style="justify-content:flex-start; gap:0.5rem; margin-top:0;">
            <button type="button" class="bulk-btn" @click="downloadBulkTemplate">
              <span class="material-icons">download</span>
              Download Template
            </button>
            <label class="bulk-file-label">
              <span class="material-icons">attach_file</span>
              <input type="file" accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" @change="onBulkFileChange" />
            </label>
          </div>

          <!-- Drag & drop zone -->
          <div 
            class="bulk-dropzone" 
            :class="{ active: dropActive }"
            @dragover.prevent
            @dragenter.prevent="onDragEnter"
            @dragleave="onDragLeave"
            @drop.prevent="onDrop"
          >
            <span class="material-icons">file_upload</span>
            <div>
              <p style="margin: 0; font-weight: 600;">Drag & drop CSV/XLSX here</p>
              <small style="color:#666;">or use the picker above</small>
            </div>
          </div>

          <!-- Template generator -->
          <div class="bulk-template-gen" style="margin: 12px 0; padding: 12px; border: 1px solid #eee; border-radius: 8px; background: #fafafa;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap: wrap;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <strong>Generate Template</strong>
                <select v-model="templateExampleType" class="uppercase-input" style="min-width:180px; padding:6px 8px;">
                  <option value="blank">Blank rows</option>
                  <option value="sample">With sample names/emails</option>
                  <option value="headers">Headers only</option>
                </select>
                <input type="number" min="1" max="5000" v-model.number="templateCount" placeholder="Count" style="width:110px; padding:6px 8px; border:1px solid #e0e0e0; border-radius:6px;" />
                <select v-model.number="templateGrade" class="uppercase-input" style="min-width:120px; padding:6px 8px;">
                  <option disabled value="">Grade</option>
                  <option v-for="g in [7,8,9,10,11,12]" :key="g" :value="g">Grade {{ g }}</option>
                </select>
                <select v-model="templateSection" class="uppercase-input" :disabled="!templateGrade" style="min-width:140px; padding:6px 8px;">
                  <option disabled value="">Section</option>
                  <option v-for="s in availableSectionsForTemplate" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div style="display:flex; gap:8px;">
                <label style="display:flex; align-items:center; gap:4px; font-size:0.9rem; color:#333;">
                  <input type="checkbox" v-model="templateIncludeEmail" /> Email
                </label>
                <label style="display:flex; align-items:center; gap:4px; font-size:0.9rem; color:#333;">
                  <input type="checkbox" v-model="templateIncludeLRN" /> LRN
                </label>
                <label style="display:flex; align-items:center; gap:4px; font-size:0.9rem; color:#333;">
                  <input type="checkbox" v-model="templateIncludeAddress" /> Address
                </label>
              </div>
            </div>
            <div class="form-actions" style="justify-content:flex-end; margin:10px 0 0 0; padding-top:10px; border-top:1px solid #eee;">
              <button type="button" class="save-btn" @click="generateAndDownloadTemplate">
                <span class="material-icons">download</span>
                Generate CSV
              </button>
            </div>
          </div>

          <div v-if="bulkParseError" class="empty-state">
            <p>{{ bulkParseError }}</p>
          </div>

          <div v-else-if="bulkPreviewRows.length" class="users-table">
            <table>
              <thead>
                <tr>
                  <th v-for="h in bulkPreviewHeaders" :key="h">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in bulkPreviewRows.slice(0, 20)" :key="idx">
                  <td v-for="h in bulkPreviewHeaders" :key="h">{{ row[h] ?? '' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="pagination-info" style="margin-top:8px;">
              Showing {{ Math.min(20, bulkPreviewRows.length) }} of {{ bulkPreviewRows.length }} rows
            </div>
          </div>

          <div v-else class="empty-state">
            <span class="material-icons">upload_file</span>
            <p>Select a CSV/XLSX file to preview</p>
          </div>

          <div v-if="bulkResult" class="bulk-result">
            <p><strong>Created:</strong> {{ bulkResult.created }} | <strong>Failed:</strong> {{ bulkResult.failed }}</p>
            <div v-if="bulkResult.errors && bulkResult.errors.length">
              <h4>Errors</h4>
              <ul>
                <li v-for="(err, idx) in bulkResult.errors" :key="idx">Row {{ err.row }}: {{ err.error }}</li>
              </ul>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showBulkModal = false">
              Cancel
            </button>
            <button type="button" class="save-btn" :disabled="!bulkFile || !bulkPreviewRows.length || bulkUploading" @click="confirmBulkUpload">
              <span class="material-icons">cloud_upload</span>
              {{ bulkUploading ? 'Uploading...' : 'Confirm Upload' }}
            </button>
          </div>
        </div>
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
      
      <!-- Add pagination toggle -->
      <div class="pagination-toggle">
        <label class="toggle-switch">
          <input type="checkbox" :checked="pagination.enabled" @change="togglePagination">
          <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label">Pagination</span>
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

    <!-- Archived Users List -->
    <div v-if="activeTab === 'archived'" class="list-section archived-section">
     
      
      <div v-if="filteredArchivedUsers.length === 0" class="empty-state">
        <span class="material-icons">archive</span>
        <p>No archived users found</p>
      </div>
      
      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="users-grid">
        <div v-for="user in paginatedArchivedUsers" :key="user.id" class="user-card archived-user-card">
          <div class="archived-card-content">
            <div v-if="user.profilePicture" class="archived-avatar-container">
              <img 
                :src="getFullImageUrl(user.profilePicture)" 
                alt="Profile" 
                class="archived-avatar-img"
                @error="handleImageError($event, user)" 
              />
            </div>
            <div v-else class="archived-avatar">
              {{ user.firstName[0] }}{{ user.lastName[0] }}
            </div>
            <div class="archived-user-info">
              <div class="archived-user-header">
                <h3>{{ user.firstName }} {{ user.lastName }}</h3>
                <p class="archived-email">{{ user.email }}</p>
                <span class="archived-role-badge" :class="user.role">{{ user.role }}</span>
              </div>
              <div class="archived-details">
                <div class="archived-date-info">
                  <span class="material-icons archived-icon">history</span>
                  Archived: {{ formatDate(user.archivedAt) }}
                </div>
                <div v-if="user.archiveReason" class="archived-reason-info">
                  <span class="material-icons archived-icon">info</span>
                  <span class="reason-text">{{ user.archiveReason }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="archived-user-actions">
            <button class="archived-action-btn view" title="View Details" @click="viewArchivedUserDetails(user.id)">
              <span class="material-icons">visibility</span>
            </button>
            <button class="archived-action-btn restore" title="Restore User" @click="handleRestoreUser(user.id)" :disabled="restoreInProgress === user.id">
              <span v-if="restoreInProgress === user.id" class="spinner-border spinner-border-sm" role="status"></span>
              <span v-else class="material-icons">restore</span>
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
              <th>Role</th>
              <th>Archived Date</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedArchivedUsers" :key="user.id">
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
              <td><span class="archived-role-badge" :class="user.role">{{ user.role }}</span></td>
              <td>{{ formatDate(user.archivedAt) }}</td>
              <td>{{ user.archiveReason || 'N/A' }}</td>
              <td>
                <div class="user-actions">
                  <button class="action-btn view" @click="viewArchivedUserDetails(user.id)">
                    <span class="material-icons">visibility</span>
                  </button>
                  <button class="action-btn restore" @click="handleRestoreUser(user.id)" :disabled="restoreInProgress === user.id">
                    <span v-if="restoreInProgress === user.id" class="spinner-border spinner-border-sm" role="status"></span>
                    <span v-else class="material-icons">restore</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination controls for archived users -->
      <div v-if="pagination.enabled && (filteredArchivedUsers.length > pagination.itemsPerPage)" class="pagination-controls">
        <div class="pagination-info">
          <span>{{ displayArchivedRange }}</span>
        </div>
        
        <div class="pagination-buttons">
          <button 
            @click="changeArchivedPage(1)" 
            class="pagination-btn first" 
            :disabled="archivedPagination.currentPage === 1"
          >
            <span class="material-icons">first_page</span>
          </button>
          
          <button 
            @click="changeArchivedPage(archivedPagination.currentPage - 1)" 
            class="pagination-btn prev" 
            :disabled="archivedPagination.currentPage === 1"
          >
            <span class="material-icons">chevron_left</span>
          </button>
          
          <div class="pagination-pages">
            <button 
              v-for="page in archivedTotalPages" 
              :key="page" 
              @click="changeArchivedPage(page)" 
              class="page-btn" 
              :class="{ active: archivedPagination.currentPage === page }"
              v-show="Math.abs(page - archivedPagination.currentPage) < 3 || page === 1 || page === archivedTotalPages"
            >
              {{ page }}
            </button>
            <span v-if="archivedPagination.currentPage > 4 && archivedTotalPages > 6">...</span>
            <span v-if="archivedPagination.currentPage < archivedTotalPages - 3 && archivedTotalPages > 6">...</span>
          </div>
          
          <button 
            @click="changeArchivedPage(archivedPagination.currentPage + 1)" 
            class="pagination-btn next" 
            :disabled="archivedPagination.currentPage === archivedTotalPages"
          >
            <span class="material-icons">chevron_right</span>
          </button>
          
          <button 
            @click="changeArchivedPage(archivedTotalPages)" 
            class="pagination-btn last" 
            :disabled="archivedPagination.currentPage === archivedTotalPages"
          >
            <span class="material-icons">last_page</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Users List -->
    <div class="users-list" v-if="!loading && activeTab !== 'sections' && activeTab !== 'archived'">
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
            <button class="action-btn archive" @click="openArchiveConfirmModal(user)">
              <span class="material-icons">archive</span>
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
                  <button class="action-btn archive" @click="openArchiveConfirmModal(user)">
                    <span class="material-icons">archive</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination controls -->
      <div v-if="pagination.enabled && (filteredUsersBeforePagination.length > pagination.itemsPerPage)" class="pagination-controls">
        <div class="pagination-info">
          <span>{{ displayRange }}</span>
        </div>
        
        <div class="pagination-buttons">
          <button 
            @click="changePage(1)" 
            class="pagination-btn first" 
            :disabled="pagination.currentPage === 1"
          >
            <span class="material-icons">first_page</span>
          </button>
          
          <button 
            @click="changePage(pagination.currentPage - 1)" 
            class="pagination-btn prev" 
            :disabled="pagination.currentPage === 1"
          >
            <span class="material-icons">chevron_left</span>
          </button>
          
          <div class="pagination-pages">
            <button 
              v-for="page in totalPages" 
              :key="page" 
              @click="changePage(page)" 
              class="page-btn" 
              :class="{ active: pagination.currentPage === page }"
              v-show="Math.abs(page - pagination.currentPage) < 3 || page === 1 || page === totalPages"
            >
              {{ page }}
            </button>
            <span v-if="pagination.currentPage > 4 && totalPages > 6">...</span>
            <span v-if="pagination.currentPage < totalPages - 3 && totalPages > 6">...</span>
          </div>
          
          <button 
            @click="changePage(pagination.currentPage + 1)" 
            class="pagination-btn next" 
            :disabled="pagination.currentPage === totalPages"
          >
            <span class="material-icons">chevron_right</span>
          </button>
          
          <button 
            @click="changePage(totalPages)" 
            class="pagination-btn last" 
            :disabled="pagination.currentPage === totalPages"
          >
            <span class="material-icons">last_page</span>
          </button>
        </div>
        
        <div class="items-per-page">
          <label>Items per page:</label>
          <select :value="pagination.itemsPerPage" @change="changeItemsPerPage(parseInt($event.target.value))">
            <option v-for="n in [10, 20, 50, 100]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
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
          <div class="form-group">
            <label>Profile Picture</label>
            <div class="avatar-uploader">
              <div class="avatar-wrapper" @click="triggerRegisterFile">
                <img v-if="registerProfilePreview" :src="registerProfilePreview" alt="Avatar" />
                <div v-else class="avatar-placeholder">
                  <span class="material-icons">person</span>
                </div>
                <div class="avatar-overlay">
                  <span class="material-icons">photo_camera</span>
                  <span>Upload</span>
                </div>
              </div>
              <input ref="registerFileInput" type="file" accept="image/*" @change="onRegisterProfileSelected" style="display:none;" />
              <div v-if="registerProfilePreview" class="avatar-actions">
                <button type="button" class="avatar-btn" @click="clearRegisterProfile">
                  <span class="material-icons">delete</span> Remove
                </button>
              </div>
            </div>
          </div>
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
            <label>Email (auto-generated, editable)</label>
            <input 
              v-model="formData.email" 
              type="email" 
              required 
              @input="emailEdited = true"
            />
          </div>
          <div class="form-group">
            <label>Password (auto-generated, editable)</label>
            <input 
              v-model="formData.password" 
              type="text" 
              required 
              @input="passwordEdited = true"
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
                  class="uppercase-input"
                >
                  <option value="">None</option>
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
                class="uppercase-input"
                :disabled="!formData.gradeLevel"
              >
                <option v-if="!formData.gradeLevel" value="">None</option>
                <template v-else>
                  <option value="" disabled>Select Section</option>
                  <option v-for="section in availableSections" :key="section" :value="section">
                    {{ section }}
                  </option>
                  <option v-if="availableSections.length === 0" value="">None</option>
                </template>
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

        <div class="user-profile-header" v-if="selectedUser">
          <div v-if="selectedUser.profilePicture" class="user-profile-avatar-container" @click="openFullScreenImage(selectedUser.profilePicture)">
            <img 
              :src="getFullImageUrl(selectedUser.profilePicture)" 
              alt="Profile" 
              class="user-profile-avatar-img"
              @error="handleImageError($event, selectedUser)"
            />
            <div class="view-full-image-hint">
              <span class="material-icons">zoom_in</span>
              <span>View full image</span>
            </div>
          </div>
          <div v-else class="user-profile-avatar">
            {{ selectedUser.firstName ? selectedUser.firstName[0] : '' }}{{ selectedUser.lastName ? selectedUser.lastName[0] : '' }}
          </div>
          <h3>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</h3>
        </div>

        <div class="user-details">
          <div v-for="(value, key) in filteredUserDetails" :key="key" class="detail-item">
            <span class="label">{{ formatLabel(key) }}:</span>
            <span class="value">{{ formatValue(key, value) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Full Screen Image Modal -->
    <div v-if="showFullScreenImage" class="fullscreen-image-modal" @click="showFullScreenImage = false">
      <div class="fullscreen-image-container">
        <div class="fullscreen-controls">
          <button class="fullscreen-close-btn" @click.stop="showFullScreenImage = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        <img 
          :src="getFullImageUrl(fullScreenImageSrc)" 
          alt="Full Profile" 
          class="fullscreen-image"
          @click.stop
        />
        <div class="fullscreen-caption" @click.stop>
          {{ selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Profile Picture' }}
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
          <div class="form-group">
            <label>Profile Picture</label>
            <div class="avatar-uploader">
              <div class="avatar-wrapper" @click="triggerEditFile">
                <img v-if="editProfilePreview || editFormData.profilePicture" :src="editProfilePreview || getFullImageUrl(editFormData.profilePicture)" alt="Avatar" />
                <div v-else class="avatar-placeholder">
                  <span class="material-icons">person</span>
                </div>
                <div class="avatar-overlay">
                  <span class="material-icons">photo_camera</span>
                  <span>Change</span>
                </div>
              </div>
              <input ref="editFileInput" type="file" accept="image/*" @change="onEditProfileSelected" style="display:none;" />
              <div v-if="editProfilePreview || editFormData.profilePicture" class="avatar-actions">
                <button type="button" class="avatar-btn" @click="clearEditProfile">
                  <span class="material-icons">delete</span> Remove
                </button>
              </div>
            </div>
          </div>
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
              <input v-model="editFormData.lrn" type="text" maxlength="12" pattern="[0-9]*" class="uppercase-input" />
              <small>The Learner Reference Number is a unique 12-digit identifier</small>
            </div>

            <div class="form-group">
              <label>Grade Level</label>
              <select v-model.number="editFormData.gradeLevel" @change="editFormData.section = ''" class="uppercase-input">
                <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                  Grade {{ grade }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Section</label>
              <select v-model="editFormData.section" :disabled="!editFormData.gradeLevel" class="uppercase-input">
                <option value="">Select Section</option>
                <option v-for="section in availableSectionsForGrade" :key="section" :value="section">
                  {{ section }}
                </option>
              </select>
            </div>
          </div>

          <!-- Password field with toggle visibility -->
          <div class="form-group password-field">
            <label>New Password</label>
            <div class="password-input-container">
              <input 
                v-model="editFormData.password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Leave blank to keep current password"
                class="uppercase-input"
              />
              <button 
                type="button" 
                class="password-toggle-btn" 
                @click="showPassword = !showPassword"
              >
                <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
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

    <!-- Archived Users Modal -->
    <div v-if="showArchivedUsersModal" class="modal-overlay" @click="showArchivedUsersModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Archived Users</h2>
          <button class="close-btn" @click="showArchivedUsersModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="archived-users-list">
          <div v-if="archivedUsers.length === 0" class="empty-state">
            <span class="material-icons">group_off</span>
            <p>No archived users found</p>
          </div>

          <div v-else class="archived-users-grid">
            <div v-for="user in archivedUsers" :key="user.id" class="archived-user-card">
              <div class="archived-user-header">
                <h3>{{ user.firstName }} {{ user.lastName }}</h3>
              </div>
              <div class="archived-user-actions">
                <button @click="viewArchivedUserDetails(user.id)" class="action-btn view">
                  <span class="material-icons">visibility</span>
                </button>
                <button @click="handleRestoreUser(user.id)" class="action-btn restore" :disabled="restoreInProgress">
                  <span v-if="restoreInProgress" class="spinner-border spinner-border-sm" role="status"></span>
                  <span v-else class="material-icons">restore</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Archived User Details Modal -->
    <div v-if="showArchivedUserDetailsModal" class="modal-overlay" @click="showArchivedUserDetailsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Archived User Details</h2>
          <button class="close-btn" @click="showArchivedUserDetailsModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="user-profile-header" v-if="selectedUser">
          <div v-if="selectedUser.profilePicture" class="user-profile-avatar-container" @click="openFullScreenImage(selectedUser.profilePicture)">
            <img 
              :src="getFullImageUrl(selectedUser.profilePicture)" 
              alt="Profile" 
              class="user-profile-avatar-img"
              @error="handleImageError($event, selectedUser)"
            />
            <div class="view-full-image-hint">
              <span class="material-icons">zoom_in</span>
              <span>View full image</span>
            </div>
          </div>
          <div v-else class="user-profile-avatar">
            {{ selectedUser.firstName ? selectedUser.firstName[0] : '' }}{{ selectedUser.lastName ? selectedUser.lastName[0] : '' }}
          </div>
          <h3>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</h3>
          <span class="archived-badge">
            <span class="material-icons">archive</span>
            Archived User
          </span>
        </div>

        <div class="archived-user-details">
          <div v-for="(value, key) in archivedUserDetails" :key="key" class="detail-item">
            <span class="label">{{ formatLabel(key) }}:</span>
            <span class="value">{{ formatValue(key, value) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Archive Confirm Modal -->
    <div v-if="showArchiveConfirmModal" class="modal-overlay" @click="showArchiveConfirmModal = false">
      <div class="modal-content archive-confirm-modal" @click.stop>
        <div class="modal-header">
          <h2>Archive User</h2>
          <button class="close-btn" @click="showArchiveConfirmModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="handleArchiveUser" class="archive-form">
          <div class="form-group">
            <label>Reason for Archiving (Optional)</label>
            <textarea v-model="archiveReason" placeholder="Enter reason for archiving (optional)" class="uppercase-input" rows="3"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showArchiveConfirmModal = false">
              <span class="material-icons">close</span>
              Cancel
            </button>
            <button type="submit" class="save-btn" :disabled="archiveInProgress">
              <span v-if="archiveInProgress" class="spinner-border spinner-border-sm" role="status"></span>
              <span v-else class="material-icons">archive</span>
              Archive User
            </button>
          </div>
        </form>
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
  // deleteUser,
  getUserDetails,
  getFullImageUrl,
  archiveUser,
  restoreArchivedUser,
  getArchivedUsers,
  getArchivedUserById,
  bulkUploadUsers,
  uploadImage,
  deleteUserProfilePicture
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

// Add archived filters state
const archivedFilters = ref({
  role: '',
  sortBy: 'newest',
  startDate: '',
  endDate: ''
});

// Pagination state
const pagination = ref({
  currentPage: 1,
  itemsPerPage: 20,
  enabled: true
});

// Modal states
const showModal = ref(false);
const modalType = ref('');
const formData = ref({
  gradeLevel: '',
  section: ''
});

// Bulk upload modal state and preview
const showBulkModal = ref(false);
const bulkPreviewHeaders = ref([]);
const bulkPreviewRows = ref([]);
const bulkParseError = ref('');

const openBulkUploadModal = () => {
  showBulkModal.value = true;
  bulkFile.value = null;
  bulkPreviewHeaders.value = [];
  bulkPreviewRows.value = [];
  bulkParseError.value = '';
  bulkResult.value = null;
};

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

// Function to open full screen image modal
const openFullScreenImage = (imageSrc) => {
  if (!imageSrc) return;
  fullScreenImageSrc.value = imageSrc;
  showFullScreenImage.value = true;
};

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
const emailEdited = ref(false);
const passwordEdited = ref(false);
const updateCredentials = () => {
  if (formData.value.firstName && formData.value.lastName) {
    const { email, password } = generateCredentials(formData.value.firstName, formData.value.lastName);
    if (!emailEdited.value) formData.value.email = email;
    if (!passwordEdited.value) formData.value.password = password;
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
        // If a profile file is selected, upload as base64 for backend image endpoint
        if (registerProfileFile.value) {
          const base64 = await fileToBase64(registerProfileFile.value);
          const imgRes = await uploadImage(base64);
          if (imgRes?.imageUrl) registrationData.profilePicture = imgRes.imageUrl;
        }
        response = await registerStudent(registrationData);
        break;
      case 'teacher':
        if (registerProfileFile.value) {
          const base64 = await fileToBase64(registerProfileFile.value);
          const imgRes = await uploadImage(base64);
          if (imgRes?.imageUrl) registrationData.profilePicture = imgRes.imageUrl;
        }
        response = await registerTeacher(registrationData);
        break;
      case 'admin':
        if (registerProfileFile.value) {
          const base64 = await fileToBase64(registerProfileFile.value);
          const imgRes = await uploadImage(base64);
          if (imgRes?.imageUrl) registrationData.profilePicture = imgRes.imageUrl;
        }
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
      // reset profile state
      registerProfileFile.value = null;
      registerProfilePreview.value = '';
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Registration Failed',
      text: error.message
    });
  }
};

// helper to convert image file to base64 string
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// Add these computed properties for pagination
const totalPages = computed(() => {
  if (!pagination.value.enabled) return 1;
  
  const totalItems = filteredUsersBeforePagination.value.length;
  return Math.ceil(totalItems / pagination.value.itemsPerPage) || 1;
});

// Filter out the profile picture and password from user details display
const filteredUserDetails = computed(() => {
  if (!selectedUser.value) return {};
  
  const filtered = {};
  Object.entries(selectedUser.value).forEach(([key, value]) => {
    // Skip the profilePicture and password fields
    if (key !== 'profilePicture' && key !== 'password') {
      filtered[key] = value;
    }
  });
  return filtered;
});

// Full screen image state
const showFullScreenImage = ref(false);
const fullScreenImageSrc = ref('');

// Registration modal profile image state
const registerProfileFile = ref(null);
const registerProfilePreview = ref('');
const onRegisterProfileSelected = async (e) => {
  const file = e.target.files && e.target.files[0];
  registerProfileFile.value = file || null;
  registerProfilePreview.value = file ? URL.createObjectURL(file) : '';
};
const registerFileInput = ref(null);
const triggerRegisterFile = () => {
  registerFileInput.value && registerFileInput.value.click();
};
const clearRegisterProfile = () => {
  registerProfileFile.value = null;
  registerProfilePreview.value = '';
  if (registerFileInput.value) registerFileInput.value.value = '';
};

const paginatedUsers = computed(() => {
  if (!pagination.value.enabled) {
    return filteredUsersBeforePagination.value;
  }
  
  const startIndex = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage;
  const endIndex = startIndex + pagination.value.itemsPerPage;
  return filteredUsersBeforePagination.value.slice(startIndex, endIndex);
});

// Current range display (e.g., "1-10 of 100")
const displayRange = computed(() => {
  const total = filteredUsersBeforePagination.value.length;
  if (total === 0) return "0-0 of 0";
  
  const start = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage + 1;
  const end = Math.min(start + pagination.value.itemsPerPage - 1, total);
  return `${start}-${end} of ${total}`;
});

// Modify the filteredUsers computed property
const filteredUsersBeforePagination = computed(() => {
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

// Replace the existing filteredUsers computed property
const filteredUsers = computed(() => {
  return paginatedUsers.value;
});

// Function to handle pagination changes
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  pagination.value.currentPage = page;
};

const changeItemsPerPage = (items) => {
  pagination.value.itemsPerPage = items;
  pagination.value.currentPage = 1; // Reset to first page when changing items per page
};

const togglePagination = () => {
  pagination.value.enabled = !pagination.value.enabled;
  pagination.value.currentPage = 1; // Reset to first page when toggling pagination
};

// Watch for changes in active tab, search query, and filters to reset pagination
watch([activeTab, searchQuery, filters, archivedFilters], () => {
  pagination.value.currentPage = 1;
  archivedPagination.value.currentPage = 1;
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
  if (!newGrade) {
    availableSections.value = [];
    formData.value.section = '';
    return;
  }
  const response = await getAllGradeSections();
  availableSections.value = response.gradeSections
    .filter(gs => gs.grade === newGrade)
    .map(gs => gs.section);
  // do not auto-pick; keep empty until user selects
  if (!availableSections.value.includes(formData.value.section)) {
    formData.value.section = '';
  }
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
  createdAt: '',
  profilePicture: ''
});

// Edit modal profile image state
const editProfileFile = ref(null);
const editProfilePreview = ref('');
const onEditProfileSelected = async (e) => {
  const file = e.target.files && e.target.files[0];
  editProfileFile.value = file || null;
  editProfilePreview.value = file ? URL.createObjectURL(file) : '';
};
const editFileInput = ref(null);
const triggerEditFile = () => {
  editFileInput.value && editFileInput.value.click();
};
const clearEditProfile = async () => {
  try {
    // If there is an unsaved new file preview, just clear local selection
    if (editProfilePreview.value) {
      editProfileFile.value = null;
      editProfilePreview.value = '';
      if (editFileInput.value) editFileInput.value.value = '';
      return;
    }
    // If no new preview but an existing profilePicture, remove from server
    if (editFormData.value?.id && editFormData.value.profilePicture) {
      const res = await Swal.fire({
        title: 'Remove Profile Picture?',
        text: 'This will remove the current profile picture from the account.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, remove',
        cancelButtonText: 'Cancel'
      });
      if (!res.isConfirmed) return;
      await deleteUserProfilePicture(editFormData.value.id);
      editFormData.value.profilePicture = '';
      Swal.fire({ icon: 'success', title: 'Removed', timer: 1200, showConfirmButton: false });
    }
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Failed', text: err.message || 'Unable to remove profile picture' });
  }
};

// Password visibility state
const showPassword = ref(false);

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

    // If a new profile image selected, upload first and set profilePicture
    if (editProfileFile.value) {
      const base64 = await fileToBase64(editProfileFile.value);
      const imgRes = await uploadImage(base64);
      if (imgRes?.imageUrl) updateData.profilePicture = imgRes.imageUrl;
    }
    await updateUser(editFormData.value.id, updateData);
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'User updated successfully'
    });
    
    await loadAllUsers(); // Refresh the users list
    showEditModal.value = false;
    editProfileFile.value = null;
    editProfilePreview.value = '';
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
      domain: userDetails.domain || '',
      profilePicture: userDetails.profilePicture || ''
    };

    // Load grade sections if editing a student
    if (userDetails.role === 'student') {
      await loadGradeSections();
    }

    // reset any previous local selection
    editProfileFile.value = null;
    editProfilePreview.value = '';

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

// Function removed and replaced with archiveUser functionality

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
  // Add export for archived users
  else if (activeTab.value === 'archived') {
    const fields = exportOptions.value.fields;
    
    // Build headers array
    if (fields.name) headers.push('First Name', 'Last Name');
    if (fields.email) headers.push('Email');
    headers.push('Role', 'Archived Date', 'Reason');
    
    // Build rows
    dataToExport = filteredArchivedUsers.value.map(user => {
      const row = {};
      if (fields.name) {
        row['First Name'] = user.firstName;
        row['Last Name'] = user.lastName;
      }
      if (fields.email) row['Email'] = user.email;
      row['Role'] = user.role;
      row['Archived Date'] = formatDate(user.archivedAt);
      row['Reason'] = user.archiveReason || 'N/A';
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

// Add state for archived users
const archivedUsers = ref([]);
const showArchivedUsersModal = ref(false);
const archivedUserDetails = ref(null);
const showArchivedUserDetailsModal = ref(false);
const archiveReason = ref('');
const showArchiveConfirmModal = ref(false);
const userToArchive = ref(null);
const restoreInProgress = ref(null); // Store user ID being restored
const archiveInProgress = ref(false);

// Archived users pagination state
const archivedPagination = ref({
  currentPage: 1,
  itemsPerPage: 20
});

// Filtered archived users computed property
const filteredArchivedUsers = computed(() => {
  let users = [...archivedUsers.value];
  
  // Apply search filter using the main search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    users = users.filter(user => 
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.archiveReason && user.archiveReason.toLowerCase().includes(query)) ||
      (user.role && user.role.toLowerCase().includes(query))
    );
  }
  
  // Apply role filter
  if (archivedFilters.value.role) {
    users = users.filter(user => user.role === archivedFilters.value.role);
  }
  
  // Apply date filters
  if (archivedFilters.value.startDate) {
    const startDate = new Date(archivedFilters.value.startDate);
    startDate.setHours(0, 0, 0, 0); // Start of day
    users = users.filter(user => new Date(user.archivedAt) >= startDate);
  }
  
  if (archivedFilters.value.endDate) {
    const endDate = new Date(archivedFilters.value.endDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    users = users.filter(user => new Date(user.archivedAt) <= endDate);
  }
  
  // Sort by date
  users.sort((a, b) => {
    const dateA = new Date(a.archivedAt);
    const dateB = new Date(b.archivedAt);
    return archivedFilters.value.sortBy === 'oldest' 
      ? dateA - dateB  // Oldest first
      : dateB - dateA; // Newest first (default)
  });
  
  return users;
});

// Paginated archived users
const paginatedArchivedUsers = computed(() => {
  if (!pagination.value.enabled) {
    return filteredArchivedUsers.value;
  }
  
  const startIndex = (archivedPagination.value.currentPage - 1) * pagination.value.itemsPerPage;
  const endIndex = startIndex + pagination.value.itemsPerPage;
  return filteredArchivedUsers.value.slice(startIndex, endIndex);
});

// Archived users pagination
const archivedTotalPages = computed(() => {
  if (!pagination.value.enabled) return 1;
  
  const totalItems = filteredArchivedUsers.value.length;
  return Math.ceil(totalItems / pagination.value.itemsPerPage) || 1;
});

// Display range for archived users
const displayArchivedRange = computed(() => {
  const total = filteredArchivedUsers.value.length;
  if (total === 0) return "0-0 of 0";
  
  const start = (archivedPagination.value.currentPage - 1) * pagination.value.itemsPerPage + 1;
  const end = Math.min(start + pagination.value.itemsPerPage - 1, total);
  return `${start}-${end} of ${total}`;
});

// Function to change archived users page
const changeArchivedPage = (page) => {
  if (page < 1 || page > archivedTotalPages.value) return;
  archivedPagination.value.currentPage = page;
};

const fetchArchivedUsers = async () => {
  try {
    archivedUsers.value = await getArchivedUsers();
    activeTab.value = 'archived';
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to load archived users',
      text: error.message
    });
  }
};

const handleRestoreUser = async (archivedUserId) => {
  try {
    restoreInProgress.value = archivedUserId;
    const result = await Swal.fire({
      title: 'Restore User',
      text: 'Are you sure you want to restore this user? They will regain access to the system.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, restore user',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      // Show loading state
      Swal.fire({
        title: 'Restoring User...',
        text: 'Please wait while we restore the user data.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      await restoreArchivedUser(archivedUserId);
      
      // Refresh lists
      await fetchArchivedUsers();
      await loadAllUsers();
      
      Swal.fire({
        icon: 'success',
        title: 'User Restored',
        text: 'The user has been successfully restored and can now access the system.',
        confirmButtonColor: '#4CAF50'
      });
    }
  } catch (error) {
    console.error('Error restoring user:', error);
    Swal.fire({
      icon: 'error',
      title: 'Restoration Failed',
      text: error.message || 'An error occurred while restoring the user.',
      confirmButtonColor: '#d33'
    });
  } finally {
    restoreInProgress.value = null;
  }
};

const viewArchivedUserDetails = async (archivedUserId) => {
  try {
    const details = await getArchivedUserById(archivedUserId);
    // Filter out password field from user details
    const userData = { ...details.userData };
    delete userData.password;
    archivedUserDetails.value = userData;
    selectedUser.value = userData; // Set selectedUser for consistent display with the profile header
    showArchivedUserDetailsModal.value = true;
  } catch (error) {
    console.error('Error fetching archived user details:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `Failed to fetch archived user details: ${error.message}`
    });
  }
};

const openArchiveConfirmModal = (user) => {
  userToArchive.value = user;
  archiveReason.value = '';
  showArchiveConfirmModal.value = true;
};

const handleArchiveUser = async () => {
  if (!userToArchive.value) return;
  
  try {
    // Archive reason is now optional, so we don't need to validate it's presence

    archiveInProgress.value = true;
    await archiveUser(userToArchive.value.id, archiveReason.value);
    
    await loadAllUsers(); // Refresh user list
    showArchiveConfirmModal.value = false;
    userToArchive.value = null;
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'User archived successfully'
    });
  } catch (error) {
    console.error('Error archiving user:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `Failed to archive user: ${error.message}`
    });
  } finally {
    archiveInProgress.value = false;
  }
};

// Bulk upload reactive state
const bulkFile = ref(null);
const bulkUploading = ref(false);
const bulkResult = ref(null);

const dropActive = ref(false);

const parseSelectedFile = (file) => {
  bulkFile.value = file || null;
  bulkPreviewHeaders.value = [];
  bulkPreviewRows.value = [];
  bulkParseError.value = '';
  if (!file) return;
  try {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (!rows || rows.length === 0) {
          bulkParseError.value = 'No rows detected in the file.';
          return;
        }
        const headers = Object.keys(rows[0]);
        bulkPreviewHeaders.value = headers;
        bulkPreviewRows.value = rows;
      } catch (err) {
        console.error(err);
        bulkParseError.value = 'Failed to parse file. Please ensure it is a valid CSV/XLSX with headers.';
      }
    };
    reader.onerror = () => {
      bulkParseError.value = 'Failed to read the selected file.';
    };
    reader.readAsArrayBuffer(file);
  } catch (err) {
    bulkParseError.value = 'Unexpected error while preparing preview.';
  }
};

const onBulkFileChange = (e) => {
  const file = e.target.files && e.target.files[0];
  parseSelectedFile(file);
};

const onDragEnter = () => { dropActive.value = true; };
const onDragLeave = () => { dropActive.value = false; };
const onDrop = (e) => {
  try {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) parseSelectedFile(file);
  } finally {
    dropActive.value = false;
  }
};

const handleBulkUpload = async () => {
  try {
    if (!bulkFile.value) return;
    bulkUploading.value = true;
    const result = await bulkUploadUsers(bulkFile.value);
    bulkResult.value = result;
    bulkFile.value = null;
    await loadAllUsers();
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Bulk Upload Failed', text: err.message || 'Upload failed' });
  } finally {
    bulkUploading.value = false;
  }
};

const confirmBulkUpload = async () => {
  try {
    if (!bulkFile.value || !bulkPreviewRows.value.length) return;
    const result = await Swal.fire({
      title: 'Confirm Bulk Upload',
      text: `Upload ${bulkPreviewRows.value.length} student record(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, upload',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    await handleBulkUpload();
  } catch (err) {
    // handled inside handleBulkUpload
  }
};

const downloadBulkTemplate = () => {
  const headers = ['firstName','lastName','email','lrn','gradeLevel','section','address'];
  const csv = headers.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bulk_students_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Template generator state
const templateExampleType = ref('blank'); // blank | sample | headers
const templateCount = ref(30);
const templateGrade = ref('');
const templateSection = ref('');
const templateIncludeEmail = ref(true);
const templateIncludeLRN = ref(true);
const templateIncludeAddress = ref(false);

const availableSectionsForTemplate = computed(() => {
  if (!templateGrade.value) return [];
  return gradeSections.value
    .filter(gs => gs.grade === Number(templateGrade.value))
    .map(gs => gs.section);
});

const sampleFirstNames = ['JUAN','MARIA','JOSE','ANA','PEDRO','LUIS','CARLA','ROSA','NOAH','EMMA','OLIVIA','LIAM','AVA','SOPHIA'];
const sampleLastNames = ['DELA CRUZ','SANTOS','REYES','GARCIA','MENDOZA','RAMOS','BAUTISTA','VILLANUEVA','SMITH','JOHNSON','BROWN','WILSON'];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateAndDownloadTemplate = () => {
  try {
    const headers = ['firstName','lastName'];
    if (templateIncludeEmail.value) headers.push('email');
    if (templateIncludeLRN.value) headers.push('lrn');
    headers.push('gradeLevel','section');
    if (templateIncludeAddress.value) headers.push('address');

    let rows = [];
    if (templateExampleType.value === 'headers') {
      rows = [];
    } else {
      const count = Math.max(1, Math.min(5000, Number(templateCount.value) || 1));
      for (let i = 0; i < count; i++) {
        let firstName = '';
        let lastName = '';
        if (templateExampleType.value === 'sample') {
          firstName = pickRandom(sampleFirstNames);
          lastName = pickRandom(sampleLastNames);
        }
        const gradeLevel = templateGrade.value ? Number(templateGrade.value) : '';
        const section = templateSection.value || '';
        const row = { firstName, lastName };
        if (templateIncludeEmail.value) {
          if (firstName && lastName) {
            const local = `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, '').replace(/\.+/g, '.');
            row.email = `${local}@ncnhs.edu.ph`;
          } else {
            row.email = '';
          }
        }
        if (templateIncludeLRN.value) {
          row.lrn = '';
        }
        row.gradeLevel = gradeLevel;
        row.section = section;
        if (templateIncludeAddress.value) row.address = '';
        rows.push(row);
      }
    }

    const lines = [];
    lines.push(headers.join(','));
    for (const r of rows) {
      const vals = headers.map(h => {
        const v = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      });
      lines.push(vals.join(','));
    }
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const gradePart = templateGrade.value ? `G${templateGrade.value}_` : '';
    const sectionPart = templateSection.value ? `${templateSection.value}_` : '';
    a.download = `bulk_students_${gradePart}${sectionPart}${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Template generation error:', err);
    Swal.fire({ icon: 'error', title: 'Template Generation Failed', text: 'Could not generate CSV template.' });
  }
};
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
.add-btn.bulk-upload { background-color: #4CAF50; }

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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn.active {
  background: #2196F3;
  color: white;
}

.tab-btn:nth-child(5).active {
  background: #4CAF50;
}

.tab-icon {
  font-size: 18px;
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

.action-btn.archive {
  background: #fff3e0;
  color: #ff9800;
}

.action-btn.view {
  background: #e3f2fd;
  color: #2196F3;
}

.action-btn.restore {
  background: #e8f5e9;
  color: #4caf50;
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

.bulk-modal-large {
  max-width: 1100px;
  width: 95vw;
}

@media (min-width: 1280px) {
  .bulk-modal.bulk-modal-large {
    max-width: 1280px;
    width: 90vw;
  }
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

/* Add these pagination styles */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  margin-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
}

.pagination-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.pagination-btn:disabled {
  color: #bdbdbd;
  cursor: not-allowed;
}

.pagination-btn .material-icons {
  font-size: 20px;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  color: #333;
}

.page-btn.active {
  background: #2196F3;
  color: white;
}

.page-btn:hover:not(.active) {
  background: #e0e0e0;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-per-page label {
  color: #666;
  font-size: 0.85rem;
}

.items-per-page select {
  padding: 0.4rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  color: #333;
  font-size: 0.85rem;
  background: white;
  cursor: pointer;
}

.pagination-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-label {
  color: #333;
  font-size: 0.9rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
}

.toggle-switch input {
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
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #2196F3;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* Responsive styles for pagination */
@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-info {
    order: 1;
  }
  
  .pagination-buttons {
    order: 0;
    width: 100%;
    justify-content: center;
  }
  
  .items-per-page {
    order: 2;
  }

  .pagination-toggle {
    margin-bottom: 0.75rem;
  }
  
  .view-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
}

/* Add more specific media queries for slim devices */
@media (max-width: 480px) {
  /* Adjust user card layout for slim phones */
  .user-card {
    padding: 0.85rem 0.6rem;
    gap: 0.5rem;
  }
  
  /* Make avatar slightly larger */
  .user-avatar-container, .user-avatar {
    width: 40px;
    height: 40px;
    min-width: 40px;
  }
  
  /* Increase text sizes slightly */
  .user-info h3 {
    font-size: 0.92rem;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 10px);
  }
  
  .email {
    font-size: 0.75rem;
    line-height: 1.3;
  }
  
  /* Adjust details size and spacing */
  .details {
    margin-top: 0.4rem;
    gap: 0.4rem;
  }
  
  .detail-item {
    font-size: 0.75rem;
    margin-right: 0.6rem;
  }
  
  .detail-item .material-icons {
    font-size: 14px;
  }
  
  /* Make action buttons slightly larger */
  .user-actions {
    gap: 0.25rem;
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
  
  .action-btn .material-icons {
    font-size: 16px;
  }
  
  /* Adjust information width to prevent overlap with buttons */
  .user-info {
    width: calc(100% - 90px);
    padding-right: 5px;
  }
  
  /* Table view adjustments for slim devices */
  .users-table td, .users-table th {
    padding: 0.45rem 0.35rem;
    font-size: 0.78rem;
  }
  
  .table-avatar-container, .table-avatar {
    width: 30px;
    height: 30px;
    font-size: 0.7rem;
  }
}

/* For extremely slim devices */
@media (max-width: 360px) {
  .user-card {
    padding: 0.75rem 0.5rem;
  }
  
  .user-avatar-container, .user-avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }
  
  .user-info h3 {
    font-size: 0.85rem;
  }
  
  .email {
    font-size: 0.7rem;
  }
  
  .detail-item {
    font-size: 0.7rem;
  }
  
  .detail-item .material-icons {
    font-size: 13px;
  }
  
  .action-btn {
    width: 26px;
    height: 26px;
  }
  
  .user-info {
    width: calc(100% - 80px);
  }
  
  /* Fix header actions for very slim devices */
  .header-actions {
    gap: 0.35rem;
  }
  
  .add-btn {
    padding: 0.45rem;
    font-size: 0.75rem;
  }
}

/* Add User Profile Header styles for details modal */
.user-profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid #eee;
  text-align: center;
}

.user-profile-avatar-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 3px solid #f5f5f5;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-profile-avatar-container:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.view-full-image-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.view-full-image-hint .material-icons {
  font-size: 14px;
  margin-right: 3px;
}

.user-profile-avatar-container:hover .view-full-image-hint {
  opacity: 1;
}

.user-profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #1976d2;
  font-size: 2.5rem;
  margin-bottom: 1rem;
  border: 3px solid #f5f5f5;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.user-profile-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

/* Fullscreen image modal */
.fullscreen-image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
}

.fullscreen-image-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border: 5px solid white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  cursor: default;
}

.fullscreen-controls {
  position: absolute;
  top: -50px;
  right: 0;
  z-index: 2010;
}

.fullscreen-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fullscreen-close-btn:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.fullscreen-caption {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 20px;
  font-size: 1rem;
  cursor: default;
}

/* Responsive styling for profile header and fullscreen modal */
@media (max-width: 480px) {
  .user-profile-avatar-container,
  .user-profile-avatar {
    width: 80px;
    height: 80px;
    margin-bottom: 0.75rem;
  }
  
  .user-profile-avatar {
    font-size: 2rem;
  }
  
  .user-profile-header h3 {
    font-size: 1.1rem;
  }
  
  .fullscreen-image {
    max-height: 70vh;
    border: 3px solid white;
  }
  
  .fullscreen-caption {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
  
  .fullscreen-controls {
    top: -40px;
  }
  
  .fullscreen-close-btn {
    width: 36px;
    height: 36px;
  }
}

.archived-section h2 {
  color: #4CAF50;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

/* Using the main grid styles for archived users */

.archived-user-card {
  position: relative;
  border-left: 4px solid #4CAF50;
  padding: 1.2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 1rem;
  background-color: #fff;
  overflow: hidden;
}

.archived-user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.archived-card-content {
  display: flex;
  gap: 1rem;
}

.archived-avatar-container, 
.archived-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  font-size: 1.2rem;
  font-weight: 500;
  color: #333;
}

.archived-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.archived-user-info {
  flex: 1;
  min-width: 0;
}

.archived-user-header {
  margin-bottom: 0.5rem;
}

.archived-user-header h3 {
  margin: 0 0 0.2rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.archived-email {
  margin: 0 0 0.4rem 0;
  font-size: 0.85rem;
  color: #666;
}

.archived-role-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  border-radius: 4px;
  background-color: #E8F5E9;
  color: #388E3C;
}

.archived-role-badge.student {
  background-color: #E8F5E9;
  color: #388E3C;
}

.archived-role-badge.teacher {
  background-color: #E3F2FD;
  color: #1976D2;
}

.archived-role-badge.admin {
  background-color: #F3E5F5;
  color: #7B1FA2;
}

.archived-details {
  margin-top: 0.8rem;
  font-size: 0.8rem;
  color: #666;
}

.archived-date-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
}

.archived-reason-info {
  display: flex;
  align-items: flex-start;
  gap: 0.3rem;
  color: #d32f2f;
  font-style: italic;
}

.reason-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.archived-icon {
  font-size: 14px;
  color: #757575;
  flex-shrink: 0;
}

.archived-user-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

.archived-action-btn {
  width: 34px;
  height: 34px;
  border-radius: 4px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #f5f5f5;
  color: #424242;
}

.archived-action-btn:hover {
  background-color: #e0e0e0;
}

.archived-action-btn.view {
  color: #1976D2;
}

.archived-action-btn.restore {
  color: #4CAF50;
}

.archived-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Using main user card header styles */

.archived-role-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background: #E8F5E9;
  color: #4CAF50;
}

/* Using main user info styles */

.archived-date {
  color: #888;
  font-size: 0.8rem;
  margin: 0.25rem 0;
  display: flex;
  align-items: center;
}

/* Using main card action styles */

.action-btn.restore {
  background: #4CAF50;
  color: white;
}

.action-btn.restore:hover {
  background: #45a049;
}

.archived-user-details {
  padding: 1.5rem;
}

.archived-detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.archived-detail-item:last-child {
  border-bottom: none;
}

.archived-label {
  color: #666;
  font-weight: 500;
}

.archived-value {
  color: #333;
  font-weight: 400;
}

/* Archived Users Styles */
/* Removed redundant archived filters styles */

.archived-role-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background: #E8F5E9;
  color: #4CAF50;
}

.archived-role-badge.student {
  background: #E8F5E9;
  color: #4CAF50;
}

.archived-role-badge.teacher {
  background: #E3F2FD;
  color: #2196F3;
}

.archived-role-badge.admin {
  background: #F3E5F5;
  color: #9C27B0;
}

.archived-icon {
  font-size: 14px;
  margin-right: 4px;
  opacity: 0.7;
}

.archived-date, .archived-reason {
  display: flex;
  align-items: center;
  color: #888;
  font-size: 0.8rem;
  margin: 0.25rem 0;
}

.archived-reason {
  color: #d32f2f;
  font-style: italic;
}

/* Archive Confirm Modal Styles */
.archive-confirm-modal {
  max-width: 400px;
  width: 90vw;
}

.archive-form {
  padding: 1.5rem;
}

.archive-form .form-group {
  margin-bottom: 1.5rem;
}

.archive-form .form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.archive-form .form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.archive-form .form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.archive-form .form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E0E0E0;
}

.archive-form .save-btn,
.archive-form .cancel-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.archive-form .save-btn {
  background: #4CAF50;
  color: white;
  border: none;
}

.archive-form .save-btn:hover {
  background: #388E3C !important;
}

.archive-form .cancel-btn {
  background: #F5F5F5;
  color: #616161;
  border: 1px solid #E0E0E0;
}

.archive-form .cancel-btn:hover {
  background: #EEEEEE;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .archived-filters {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .archived-filter-group {
    width: 100%;
  }
  
  .archived-filter-group select {
    flex: 1;
  }
  
  .archive-form .form-group {
    margin-bottom: 1rem;
  }
  
  .archive-form .form-actions {
    flex-direction: column-reverse;
  }
  
  .archive-form .save-btn,
  .archive-form .cancel-btn {
    width: 100%;
    justify-content: center;
  }
  
  /* Add styling for archived filters */
  .date-filter {
    flex-wrap: wrap;
    width: 100%;
  }
  
  .date-input {
    flex: 1;
    min-width: 0;
    padding: 0.5rem;
    font-size: 0.85rem;
  }
}

/* Add styling for archived filters */
.date-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  min-width: 120px;
  transition: all 0.3s ease;
}

.date-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.date-separator {
  color: #666;
  font-size: 0.9rem;
}

/* Mobile responsive adjustments for archived user cards */
@media (max-width: 768px) {
  .archived-user-card {
    padding: 0.85rem;
    position: relative;
    margin-bottom: 0.5rem;
    border-left-width: 3px;
  }
  
  .archived-card-content {
    gap: 0.75rem;
  }
  
  .archived-avatar-container, 
  .archived-avatar {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 6px;
    font-size: 1rem;
  }
  
  .archived-user-info {
    padding-right: 40px; /* Space for action buttons */
  }
  
  .archived-user-header h3 {
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.1rem;
  }
  
  .archived-email {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 0 0.3rem 0;
  }
  
  .archived-role-badge {
    font-size: 0.65rem;
    padding: 0.1rem 0.35rem;
  }
  
  .archived-user-actions {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    gap: 0.25rem;
  }
  
  .archived-action-btn {
    width: 28px;
    height: 28px;
  }
  
  .archived-action-btn .material-icons {
    font-size: 15px;
  }
  
  .archived-details {
    margin-top: 0.5rem;
    font-size: 0.7rem;
  }
  
  .archived-date-info,
  .archived-reason-info {
    line-height: 1.3;
    margin-bottom: 0.2rem;
  }
  
  .archived-icon {
    font-size: 12px;
  }
}

/* Extremely slim devices */
/* Password field with toggle button styling */
.password-field .password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-field input {
  padding-right: 40px; /* Make room for the toggle button */
  width: 100%;
}

.password-toggle-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;
}

.password-toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #2196F3;
}

.password-toggle-btn .material-icons {
  font-size: 20px;
}

.archived-badge {
  display: inline-flex;
  align-items: center;
  background-color: #ff9800;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-top: 8px;
}

.archived-badge .material-icons {
  font-size: 16px;
  margin-right: 4px;
}

@media (max-width: 360px) {
  .archived-user-card {
    padding: 0.75rem 0.65rem;
    border-left-width: 3px;
  }

  .archived-card-content {
    gap: 0.6rem;
  }

  .archived-avatar-container,
  .archived-avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  
  .archived-user-info {
    padding-right: 35px;
  }
  
  .archived-user-header h3 {
    font-size: 0.85rem;
    margin-bottom: 0.1rem;
  }
  
  .archived-email {
    font-size: 0.7rem;
    margin-bottom: 0.2rem;
  }
  
  .archived-role-badge {
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
  }
  
  .archived-user-actions {
    top: 0.65rem;
    right: 0.65rem;
    gap: 0.2rem;
  }
  
  .archived-action-btn {
    width: 24px;
    height: 24px;
  }
  
  .archived-action-btn .material-icons {
    font-size: 13px;
  }
  
  .archived-details {
    margin-top: 0.4rem;
    font-size: 0.65rem;
  }
  
  .archived-date-info,
  .archived-reason-info {
    line-height: 1.2;
    margin-bottom: 0.15rem;
  }
  
  .archived-icon {
    font-size: 11px;
  }
}

.bulk-upload-panel { margin: 16px 0; padding: 12px; background: #f9fafb; border: 1px solid #eee; border-radius: 8px; }
.bulk-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.bulk-controls select { padding: 8px 10px; border: 1px solid #e0e0e0; border-radius: 6px; background: white; }
.bulk-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fff; cursor: pointer; }
.bulk-btn.primary { background: #2196F3; color: white; border-color: #2196F3; }
.bulk-file-label { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px dashed #bbb; border-radius: 6px; cursor: pointer; background: #fff; }
.bulk-file-label input { display: none; }
.bulk-result { margin-top: 10px; color: #333; }

/* Drag & drop styles */
.bulk-dropzone {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  border: 2px dashed #bdbdbd;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  color: #616161;
  transition: all 0.2s ease;
  margin-top: 10px;
}

.bulk-dropzone .material-icons {
  color: #9e9e9e;
}

.bulk-dropzone.active {
  border-color: #4CAF50;
  background: #f1f8e9;
  color: #2e7d32;
}

/* Avatar uploader */
.avatar-uploader {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.avatar-wrapper {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  background: #f5f7fa;
  border: 2px dashed #cfd8dc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.avatar-wrapper:hover {
  border-color: #90caf9;
}

.avatar-wrapper img,
.avatar-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #90a4ae;
}

.avatar-placeholder .material-icons {
  font-size: 40px;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 0.85rem;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-actions {
  display: flex;
  gap: 8px;
}

.avatar-btn {
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  border-radius: 6px;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.avatar-btn:hover {
  background: #f5f5f5;
}
</style>