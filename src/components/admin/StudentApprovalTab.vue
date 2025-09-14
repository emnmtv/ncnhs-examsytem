<template>
  <div class="student-approval">
    <div class="header-container">
      <div class="header-content">
        <h1>Student Registration Management<span class="material-icons">people</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Manage student registrations and approvals</p>
        </div>
      </div>
      <div class="header-background">STUDENTS</div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-section">
      <div class="stats-overview">
        <div class="stat-item">
          <span class="stat-number">{{ stats.pending }}</span>
          <span class="stat-label">Pending</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ stats.approved }}</span>
          <span class="stat-label">Approved</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ stats.rejected }}</span>
          <span class="stat-label">Denied</span>
        </div>
        <div class="stat-item total">
          <span class="stat-number">{{ stats.total }}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>
    </div>

    <!-- Controls Section -->
    <div class="controls-section">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, email, or LRN..."
          class="uppercase-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="filter-controls">
        <select v-model="selectedGrade">
          <option value="">All Grades</option>
          <option v-for="grade in availableGrades" :key="grade" :value="grade">
            Grade {{ grade }}
          </option>
        </select>
        
        <select v-model="selectedSection">
          <option value="">All Sections</option>
          <option v-for="section in availableSections" :key="section" :value="section">
            {{ section }}
          </option>
        </select>
        
        <select v-model="dateFilter">
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
        </select>
        
        <div class="view-toggle">
          <button 
            @click="currentView = 'table'" 
            class="view-btn" 
            :class="{ active: currentView === 'table' }"
          >
            <span class="material-icons">table_chart</span>
          </button>
          <button 
            @click="currentView = 'card'" 
            class="view-btn" 
            :class="{ active: currentView === 'card' }"
          >
            <span class="material-icons">grid_view</span>
          </button>
        </div>
        
        <button @click="resetFilters" class="refresh-btn">
          <span class="material-icons">refresh</span>
          Reset
        </button>
      </div>
    </div>

    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        <span class="material-icons tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
        <span class="tab-count" v-if="tab.count !== undefined">({{ tab.count }})</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading registrations...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">
          <span class="material-icons">error_outline</span>
        </div>
        <p>{{ error }}</p>
        <button @click="loadData" class="retry-button">Retry</button>
      </div>

      <!-- Pending Tab -->
      <div v-else-if="activeTab === 'pending'" class="registrations-list">
        <div v-if="filteredPendingRegistrations.length === 0" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons">assignment_turned_in</span>
          </div>
          <h3>No Pending Registrations</h3>
          <p v-if="searchQuery || selectedGrade || selectedSection || dateFilter">
            No registrations match your current filters.
          </p>
          <p v-else>All student registrations have been processed.</p>
        </div>
        <div v-else>
          <div class="list-header">
            <h3>Pending Approvals ({{ filteredPendingRegistrations.length }})</h3>
            <button @click="loadData" class="refresh-button">
              <span class="material-icons">refresh</span>
              Refresh
            </button>
          </div>
          
          <!-- Table View -->
          <div v-if="currentView === 'table'" class="table-container">
            <table class="registrations-table">
              <thead>
                <tr>
                  <th class="col-number">#</th>
                  <th class="col-name">Student</th>
                  <th class="col-lrn">LRN</th>
                  <th class="col-grade">Grade</th>
                  <th class="col-section">Section</th>
                  <th class="col-registered">Registered</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, index) in filteredPendingRegistrations" :key="student.id" class="student-row pending">
                  <td class="col-number">{{ index + 1 }}</td>
                  <td class="col-name">
                    <div class="student-name">
                      <span class="name">{{ student.firstName }} {{ student.lastName }}</span>
                      <span class="email">{{ student.email }}</span>
                      <span class="status-badge pending">Pending</span>
                    </div>
                  </td>
                  <td class="col-lrn">{{ student.lrn || 'N/A' }}</td>
                  <td class="col-grade">Grade {{ student.gradeLevel || 'N/A' }}</td>
                  <td class="col-section">{{ student.section || 'N/A' }}</td>
                  <td class="col-registered">{{ formatDate(student.createdAt) }}</td>
                  <td class="col-actions">
                    <button 
                      @click="approveStudent(student.id)"
                      class="action-button approve"
                      :disabled="processingStudents.has(student.id)"
                      title="Approve"
                    >
                      <span class="material-icons">check</span>
                    </button>
                    <button 
                      @click="showRejectModal(student)"
                      class="action-button reject"
                      :disabled="processingStudents.has(student.id)"
                      title="Deny"
                    >
                      <span class="material-icons">close</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Card View -->
          <div v-else class="cards-container">
            <div class="cards-grid">
              <div v-for="student in filteredPendingRegistrations" :key="student.id" class="student-card pending">
                <div class="card-header">
                  <div class="student-info">
                    <div class="student-avatar">
                      <img 
                        v-if="student.profilePicture" 
                        :src="getFullImageUrl(student.profilePicture)" 
                        :alt="`${student.firstName} ${student.lastName}`"
                      >
                      <div v-else class="avatar-placeholder">
                        {{ getInitials(student.firstName, student.lastName) }}
                      </div>
                    </div>
                    <div class="student-details">
                      <h4 class="student-name">{{ student.firstName }} {{ student.lastName }}</h4>
                      <p class="student-email">{{ student.email }}</p>
                      <span class="status-badge pending">Pending</span>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-info">
                    <div class="info-item">
                      <span class="material-icons">badge</span>
                      <span>{{ student.lrn || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">school</span>
                      <span>Grade {{ student.gradeLevel || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">group</span>
                      <span>{{ student.section || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">schedule</span>
                      <span>{{ formatDate(student.createdAt) }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-actions">
                  <button 
                    @click="approveStudent(student.id)"
                    class="action-button approve"
                    :disabled="processingStudents.has(student.id)"
                    title="Approve"
                  >
                    <span class="material-icons">check</span>
                    Approve
                  </button>
                  <button 
                    @click="showRejectModal(student)"
                    class="action-button reject"
                    :disabled="processingStudents.has(student.id)"
                    title="Deny"
                  >
                    <span class="material-icons">close</span>
                    Deny
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Approved Tab -->
      <div v-else-if="activeTab === 'approved'" class="registrations-list">
        <div v-if="filteredApprovedRegistrations.length === 0" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons">check_circle_outline</span>
          </div>
          <h3>No Approved Registrations</h3>
          <p v-if="searchQuery || selectedGrade || selectedSection || dateFilter">
            No approved registrations match your current filters.
          </p>
          <p v-else>No student registrations have been approved yet.</p>
        </div>
        <div v-else>
          <div class="list-header">
            <h3>Approved Registrations ({{ filteredApprovedRegistrations.length }})</h3>
            <button @click="loadData" class="refresh-button">
              <span class="material-icons">refresh</span>
              Refresh
            </button>
          </div>
          
          <!-- Table View -->
          <div v-if="currentView === 'table'" class="table-container">
            <table class="registrations-table">
              <thead>
                <tr>
                  <th class="col-number">#</th>
                  <th class="col-name">Student</th>
                  <th class="col-lrn">LRN</th>
                  <th class="col-grade">Grade</th>
                  <th class="col-section">Section</th>
                  <th class="col-approved">Approved</th>
                  <th class="col-approver">Approved By</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, index) in filteredApprovedRegistrations" :key="student.id" class="student-row approved">
                  <td class="col-number">{{ index + 1 }}</td>
                  <td class="col-name">
                    <div class="student-name">
                      <span class="name">{{ student.firstName }} {{ student.lastName }}</span>
                      <span class="email">{{ student.email }}</span>
                      <span class="status-badge approved">Approved</span>
                    </div>
                  </td>
                  <td class="col-lrn">{{ student.lrn || 'N/A' }}</td>
                  <td class="col-grade">Grade {{ student.gradeLevel || 'N/A' }}</td>
                  <td class="col-section">{{ student.section || 'N/A' }}</td>
                  <td class="col-approved">{{ formatDate(student.approvedAt) }}</td>
                  <td class="col-approver">{{ student.approver ? `${student.approver.firstName} ${student.approver.lastName}` : 'N/A' }}</td>
                  <td class="col-actions">
                    <button 
                      @click="showRejectModal(student)"
                      class="action-button reject"
                      :disabled="processingStudents.has(student.id)"
                      title="Deny"
                    >
                      <span class="material-icons">close</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Card View -->
          <div v-else class="cards-container">
            <div class="cards-grid">
              <div v-for="student in filteredApprovedRegistrations" :key="student.id" class="student-card approved">
                <div class="card-header">
                  <div class="student-info">
                    <div class="student-avatar">
                      <img 
                        v-if="student.profilePicture" 
                        :src="getFullImageUrl(student.profilePicture)" 
                        :alt="`${student.firstName} ${student.lastName}`"
                      >
                      <div v-else class="avatar-placeholder">
                        {{ getInitials(student.firstName, student.lastName) }}
                      </div>
                    </div>
                    <div class="student-details">
                      <h4 class="student-name">{{ student.firstName }} {{ student.lastName }}</h4>
                      <p class="student-email">{{ student.email }}</p>
                      <span class="status-badge approved">Approved</span>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-info">
                    <div class="info-item">
                      <span class="material-icons">badge</span>
                      <span>{{ student.lrn || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">school</span>
                      <span>Grade {{ student.gradeLevel || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">group</span>
                      <span>{{ student.section || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">check_circle</span>
                      <span>{{ formatDate(student.approvedAt) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">person</span>
                      <span>{{ student.approver ? `${student.approver.firstName} ${student.approver.lastName}` : 'N/A' }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-actions">
                  <button 
                    @click="showRejectModal(student)"
                    class="action-button reject"
                    :disabled="processingStudents.has(student.id)"
                    title="Deny"
                  >
                    <span class="material-icons">close</span>
                    Deny
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Denied Tab -->
      <div v-else-if="activeTab === 'rejected'" class="registrations-list">
        <div v-if="filteredRejectedRegistrations.length === 0" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons">cancel_outline</span>
          </div>
          <h3>No Denied Registrations</h3>
          <p v-if="searchQuery || selectedGrade || selectedSection || dateFilter">
            No denied registrations match your current filters.
          </p>
          <p v-else>No student registrations have been denied yet.</p>
        </div>
        <div v-else>
          <div class="list-header">
            <h3>Denied Registrations ({{ filteredRejectedRegistrations.length }})</h3>
            <button @click="loadData" class="refresh-button">
              <span class="material-icons">refresh</span>
              Refresh
            </button>
          </div>
          
          <!-- Table View -->
          <div v-if="currentView === 'table'" class="table-container">
            <table class="registrations-table">
              <thead>
                <tr>
                  <th class="col-number">#</th>
                  <th class="col-name">Student</th>
                  <th class="col-lrn">LRN</th>
                  <th class="col-grade">Grade</th>
                  <th class="col-section">Section</th>
                  <th class="col-denied">Denied</th>
                  <th class="col-denier">Denied By</th>
                  <th class="col-reason">Reason</th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, index) in filteredRejectedRegistrations" :key="student.id" class="student-row rejected">
                  <td class="col-number">{{ index + 1 }}</td>
                  <td class="col-name">
                    <div class="student-name">
                      <span class="name">{{ student.firstName }} {{ student.lastName }}</span>
                      <span class="email">{{ student.email }}</span>
                      <span class="status-badge rejected">Denied</span>
                    </div>
                  </td>
                  <td class="col-lrn">{{ student.lrn || 'N/A' }}</td>
                  <td class="col-grade">Grade {{ student.gradeLevel || 'N/A' }}</td>
                  <td class="col-section">{{ student.section || 'N/A' }}</td>
                  <td class="col-denied">{{ formatDate(student.approvedAt) }}</td>
                  <td class="col-denier">{{ student.approver ? `${student.approver.firstName} ${student.approver.lastName}` : 'N/A' }}</td>
                  <td class="col-reason">{{ student.rejectionReason || 'N/A' }}</td>
                  <td class="col-actions">
                    <button 
                      @click="approveStudent(student.id)"
                      class="action-button approve"
                      :disabled="processingStudents.has(student.id)"
                      title="Approve"
                    >
                      <span class="material-icons">check</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Card View -->
          <div v-else class="cards-container">
            <div class="cards-grid">
              <div v-for="student in filteredRejectedRegistrations" :key="student.id" class="student-card rejected">
                <div class="card-header">
                  <div class="student-info">
                    <div class="student-avatar">
                      <img 
                        v-if="student.profilePicture" 
                        :src="getFullImageUrl(student.profilePicture)" 
                        :alt="`${student.firstName} ${student.lastName}`"
                      >
                      <div v-else class="avatar-placeholder">
                        {{ getInitials(student.firstName, student.lastName) }}
                      </div>
                    </div>
                    <div class="student-details">
                      <h4 class="student-name">{{ student.firstName }} {{ student.lastName }}</h4>
                      <p class="student-email">{{ student.email }}</p>
                      <span class="status-badge rejected">Denied</span>
                    </div>
                  </div>
                </div>
                <div class="card-body">
                  <div class="card-info">
                    <div class="info-item">
                      <span class="material-icons">badge</span>
                      <span>{{ student.lrn || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">school</span>
                      <span>Grade {{ student.gradeLevel || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">group</span>
                      <span>{{ student.section || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">cancel</span>
                      <span>{{ formatDate(student.approvedAt) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">person</span>
                      <span>{{ student.approver ? `${student.approver.firstName} ${student.approver.lastName}` : 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="material-icons">info</span>
                      <span>{{ student.rejectionReason || 'N/A' }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-actions">
                  <button 
                    @click="approveStudent(student.id)"
                    class="action-button approve"
                    :disabled="processingStudents.has(student.id)"
                    title="Approve"
                  >
                    <span class="material-icons">check</span>
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModalFlag" class="modal-overlay" @click="closeRejectModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedStudent && selectedStudent.id && approvedRegistrations.some(s => s.id === selectedStudent.id) ? 'Deny Approved Student' : 'Deny Student Registration' }}</h3>
          <button @click="closeRejectModal" class="close-button">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="student-info-modal">
            <div class="student-avatar">
              <img 
                v-if="selectedStudent?.profilePicture" 
                :src="getFullImageUrl(selectedStudent.profilePicture)" 
                :alt="`${selectedStudent?.firstName || ''} ${selectedStudent?.lastName || ''}`"
              >
              <div v-else class="avatar-placeholder">
                {{ getInitials(selectedStudent?.firstName, selectedStudent?.lastName) }}
              </div>
            </div>
            <div class="student-details-modal">
              <h4>{{ selectedStudent?.firstName }} {{ selectedStudent?.lastName }}</h4>
              <p>{{ selectedStudent?.email }}</p>
            </div>
          </div>
          <div class="form-group">
            <label for="rejectionReason">Denial Reason *</label>
            <textarea
              id="rejectionReason"
              v-model="rejectionReason"
              placeholder="Please provide a reason for denial..."
              rows="4"
              required
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeRejectModal" class="cancel-button">Cancel</button>
          <button 
            @click="confirmReject"
            class="confirm-reject-button"
            :disabled="!rejectionReason.trim() || processing"
          >
            <span v-if="processing" class="loading-spinner-small"></span>
            Deny Registration
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  getPendingStudentRegistrations,
  getApprovedStudentRegistrations,
  getRejectedStudentRegistrations,
  getStudentRegistrationStats,
  approveStudentRegistration,
  rejectStudentRegistration,
  getFullImageUrl
} from '../../services/authService';
import Swal from 'sweetalert2';

export default {
  name: 'StudentApprovalTab',
  data() {
    return {
      activeTab: 'pending',
      loading: false,
      error: null,
      processing: false,
      processingStudents: new Set(),
      currentView: 'table', // Default to table view
      stats: {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      },
      pendingRegistrations: [],
      approvedRegistrations: [],
      rejectedRegistrations: [],
      showRejectModalFlag: false,
      selectedStudent: null,
      rejectionReason: '',
      // Search and filter data
      searchQuery: '',
      selectedGrade: '',
      selectedSection: '',
      dateFilter: '',
      availableGrades: [],
      availableSections: [],
      tabs: [
        { key: 'pending', label: 'Pending', icon: 'schedule', count: 0 },
        { key: 'approved', label: 'Approved', icon: 'check_circle', count: 0 },
        { key: 'rejected', label: 'Denied', icon: 'cancel', count: 0 }
      ]
    };
  },
  computed: {
    filteredPendingRegistrations() {
      return this.filterRegistrations(this.pendingRegistrations);
    },
    filteredApprovedRegistrations() {
      return this.filterRegistrations(this.approvedRegistrations);
    },
    filteredRejectedRegistrations() {
      return this.filterRegistrations(this.rejectedRegistrations);
    }
  },
  mounted() {
    this.loadData();
    // Set default view based on screen size
    this.setDefaultView();
    // Listen for window resize to update view
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      
      try {
        // Load all data in parallel
        const [statsResponse, pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
          getStudentRegistrationStats(),
          getPendingStudentRegistrations(),
          getApprovedStudentRegistrations(),
          getRejectedStudentRegistrations()
        ]);

        this.stats = statsResponse.data;
        this.pendingRegistrations = pendingResponse.data;
        this.approvedRegistrations = approvedResponse.data;
        this.rejectedRegistrations = rejectedResponse.data;

        // Extract unique grades and sections for filters
        this.extractFilterOptions();

        // Update tab counts
        this.tabs[0].count = this.stats.pending;
        this.tabs[1].count = this.stats.approved;
        this.tabs[2].count = this.stats.rejected;

      } catch (error) {
        console.error('Error loading data:', error);
        this.error = error.message || 'Failed to load registration data';
      } finally {
        this.loading = false;
      }
    },

    switchTab(tabKey) {
      this.activeTab = tabKey;
    },

    async approveStudent(studentId) {
      try {
        // Check if this is a rejected student being approved again
        const isRejectedStudent = this.rejectedRegistrations.some(student => student.id === studentId);
        
        const result = await Swal.fire({
          title: isRejectedStudent ? 'Approve Denied Registration?' : 'Approve Registration?',
          text: isRejectedStudent 
            ? 'Are you sure you want to approve this previously denied student registration?'
            : 'Are you sure you want to approve this student registration?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Approve',
          confirmButtonColor: '#19a759',
          cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
          this.processingStudents.add(studentId);
          await approveStudentRegistration(studentId);
          
          await Swal.fire({
            icon: 'success',
            title: 'Registration Approved!',
            text: isRejectedStudent 
              ? 'The previously denied student registration has been approved successfully.'
              : 'The student registration has been approved successfully.',
            confirmButtonColor: '#19a759',
            position: 'top-end',
            toast: true,
            timer: 3000,
            timerProgressBar: true
          });

          // Reload data to update the lists
          await this.loadData();
        }
      } catch (error) {
        console.error('Error approving student:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Approval Failed',
          text: error.message || 'Failed to approve student registration.',
          confirmButtonColor: '#dc3545',
          position: 'top-end',
          toast: true,
          timer: 5000,
          timerProgressBar: true
        });
      } finally {
        this.processingStudents.delete(studentId);
      }
    },

    showRejectModal(student) {
      this.selectedStudent = student;
      this.rejectionReason = '';
      this.showRejectModalFlag = true;
    },

    closeRejectModal() {
      this.showRejectModalFlag = false;
      this.selectedStudent = null;
      this.rejectionReason = '';
    },

    async confirmReject() {
      if (!this.rejectionReason.trim()) {
        return;
      }

      // Safety check for selectedStudent
      if (!this.selectedStudent || !this.selectedStudent.id) {
        console.error('No student selected for rejection');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No student selected. Please try again.',
          confirmButtonColor: '#4CAF50'
        });
        return;
      }

      // Store the student ID in a local variable to prevent null reference issues
      const studentId = this.selectedStudent.id;
      
      try {
        // Check if this is an approved student being rejected
        const isApprovedStudent = this.approvedRegistrations.some(student => student.id === studentId);
        
        const result = await Swal.fire({
          title: isApprovedStudent ? 'Deny Approved Student?' : 'Deny Registration?',
          text: isApprovedStudent 
            ? 'Are you sure you want to deny this previously approved student? This will move them to the denied list.'
            : 'Are you sure you want to deny this student registration?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Deny',
          confirmButtonColor: '#dc3545',
          cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
          this.processingStudents.add(studentId);
          await rejectStudentRegistration(studentId, this.rejectionReason.trim());
          
          // Close modal immediately without waiting for SweetAlert
          this.closeRejectModal();
          
          // Show success message after modal is closed
          await Swal.fire({
            icon: 'success',
            title: 'Student Denied!',
            text: isApprovedStudent 
              ? 'The previously approved student has been denied successfully.'
              : 'The student registration has been denied successfully.',
            confirmButtonColor: '#dc3545',
            position: 'top-end',
            toast: true,
            timer: 3000,
            timerProgressBar: true
          });

          // Reload data to update the lists
          await this.loadData();
        }
      } catch (error) {
        console.error('Error rejecting student:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Denial Failed',
          text: error.message || 'Failed to deny student registration.',
          confirmButtonColor: '#dc3545',
          position: 'top-end',
          toast: true,
          timer: 5000,
          timerProgressBar: true
        });
        // Close modal even if there's an error
        this.closeRejectModal();
      } finally {
        // Use the local variable instead of this.selectedStudent.id
        if (studentId) {
          this.processingStudents.delete(studentId);
        }
      }
    },

    getFullImageUrl(imageUrl) {
      return getFullImageUrl(imageUrl);
    },

    getInitials(firstName, lastName) {
      if (!firstName || !lastName) return '?';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Search and filter methods
    filterRegistrations(registrations) {
      let filtered = registrations;

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(student => 
          student.firstName.toLowerCase().includes(query) ||
          student.lastName.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          (student.lrn && student.lrn.toLowerCase().includes(query))
        );
      }

      // Grade filter
      if (this.selectedGrade) {
        filtered = filtered.filter(student => student.gradeLevel == this.selectedGrade);
      }

      // Section filter
      if (this.selectedSection) {
        filtered = filtered.filter(student => student.section === this.selectedSection);
      }

      // Date filter
      if (this.dateFilter) {
        const now = new Date();
        filtered = filtered.filter(student => {
          const studentDate = new Date(student.createdAt);
          switch (this.dateFilter) {
            case 'today':
              return studentDate.toDateString() === now.toDateString();
            case 'week': {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return studentDate >= weekAgo;
            }
            case 'month': {
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return studentDate >= monthAgo;
            }
            case 'quarter': {
              const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              return studentDate >= quarterAgo;
            }
            default:
              return true;
          }
        });
      }

      return filtered;
    },

    extractFilterOptions() {
      const allRegistrations = [
        ...this.pendingRegistrations,
        ...this.approvedRegistrations,
        ...this.rejectedRegistrations
      ];

      // Extract unique grades
      const grades = [...new Set(allRegistrations
        .map(student => student.gradeLevel)
        .filter(grade => grade !== null && grade !== undefined)
      )].sort((a, b) => a - b);
      this.availableGrades = grades;

      // Extract unique sections
      const sections = [...new Set(allRegistrations
        .map(student => student.section)
        .filter(section => section && section.trim() !== '')
      )].sort();
      this.availableSections = sections;
    },

    clearSearch() {
      this.searchQuery = '';
    },

    resetFilters() {
      this.searchQuery = '';
      this.selectedGrade = '';
      this.selectedSection = '';
      this.dateFilter = '';
    },

    setDefaultView() {
      // Set cards as default on mobile, table on desktop
      if (window.innerWidth <= 768) {
        this.currentView = 'card';
      } else {
        this.currentView = 'table';
      }
    },

    handleResize() {
      // Update view based on screen size changes
      this.setDefaultView();
    }
  }
};
</script>

<style scoped>
.student-approval {
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
  gap: 10px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
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

.stats-section {
  margin-bottom: 30px;
}

.stats-overview {
  display: flex;
  gap: 24px;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  min-width: 80px;
}

.stat-item.total {
  background: #e3f2fd;
  border-color: #bbdefb;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}

.stat-label {
  color: #6c757d;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  flex: 1;
  max-width: 400px;
}

.search-box:focus-within {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border-color: #4CAF50;
}

.search-box .material-icons {
  color: #666;
  margin-right: 8px;
  font-size: 20px;
}

.uppercase-input {
  flex: 1;
  border: none;
  padding: 12px;
  font-size: 16px;
  outline: none;
  background: transparent;
}

.uppercase-input::placeholder {
  color: #999;
}

.clear-search {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: all 0.2s;
}

.clear-search:hover {
  color: #F44336;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.filter-controls select {
  padding: 0 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  min-width: 150px;
  height: 40px;
}

.filter-controls select:focus {
  border-color: #4CAF50;
}

.view-toggle {
  display: flex;
  gap: 5px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
}

.view-btn {
  background: none;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-btn.active {
  background: #4CAF50;
  color: white;
}

.view-btn:hover:not(.active) {
  background: #e0e0e0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  height: 40px;
}

.refresh-btn:hover {
  background: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  color: #6c757d;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 3px solid transparent;
  position: relative;
  border-radius: 8px 8px 0 0;
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.tab-btn.active {
  color: #19a759;
  border-bottom-color: #19a759;
  background: #f8f9fa;
}

.tab-icon {
  font-size: 18px;
}

.tab-count {
  background: #e9ecef;
  color: #6c757d;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.tab-btn.active .tab-count {
  background: #19a759;
  color: white;
}

.tab-content {
  padding: 0;
}

.loading-container, .error-container {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #19a759;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  color: #dc3545;
}

.error-icon {
  margin-bottom: 16px;
}

.error-icon .material-icons {
  font-size: 48px;
  color: #dc3545;
}

.retry-button {
  background: #19a759;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.retry-button:hover {
  background: #158a4a;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;
}

.list-header h3 {
  color: #1a1a1a;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.refresh-button {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.refresh-button:hover {
  background: #5a6268;
}

/* Table Styles */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.registrations-table {
  width: 100%;
  border-collapse: collapse;
}

.registrations-table th {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.registrations-table th:first-child {
  border-top-left-radius: 12px;
}

.registrations-table th:last-child {
  border-top-right-radius: 12px;
}

.registrations-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.student-row:hover {
  background: #f8f9fa;
}

.student-row:last-child td {
  border-bottom: none;
}

.student-row.pending {
  border-left: 3px solid #f59e0b;
}

.student-row.approved {
  border-left: 3px solid #10b981;
}

.student-row.rejected {
  border-left: 3px solid #ef4444;
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

.col-grade,
.col-section {
  text-align: center;
  font-weight: 500;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  margin-top: 4px;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.col-actions {
  white-space: nowrap;
}

.col-reason {
  color: #ef4444;
  font-style: italic;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

/* Card Styles */
.cards-container {
  margin-bottom: 20px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.student-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid;
}

.student-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.student-card.pending {
  border-left-color: #f59e0b;
}

.student-card.approved {
  border-left-color: #10b981;
}

.student-card.rejected {
  border-left-color: #ef4444;
}

.card-header {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.student-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.student-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.student-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}

.student-details {
  flex: 1;
}

.student-details .student-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px 0;
}

.student-email {
  color: #666;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.card-body {
  padding: 20px;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #555;
}

.info-item .material-icons {
  color: #666;
  font-size: 18px;
}

.card-actions {
  padding: 20px;
  background: #f8f9fa;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.card-actions .action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  min-width: auto;
  height: auto;
}

.action-button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  min-width: 36px;
  height: 36px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.approve {
  background: #10b981;
  color: white;
}

.action-button.approve:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.action-button.reject {
  background: #ef4444;
  color: white;
}

.action-button.reject:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
}

.rejection-reason {
  color: #ef4444;
  font-style: italic;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  margin-bottom: 24px;
}

.empty-icon .material-icons {
  font-size: 64px;
  color: #d1d5db;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  padding: 24px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.student-info-modal {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  transition: border-color 0.2s ease;
}

.form-group textarea:focus {
  outline: none;
  border-color: #19a759;
  box-shadow: 0 0 0 3px rgba(25, 167, 89, 0.1);
}

.modal-footer {
  padding: 0 24px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-button {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.cancel-button:hover {
  background: #4b5563;
}

.confirm-reject-button {
  background: #ef4444;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.confirm-reject-button:hover:not(:disabled) {
  background: #dc2626;
}

.confirm-reject-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Responsive Design */
/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .student-approval {
    padding: 1.6rem;
  }
  
  .page-header {
    margin-bottom: 1.6rem;
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .header-actions {
    gap: 0.8rem;
  }
  
  .stats-overview {
    gap: 1.2rem;
  }
  
  .stat-item {
    padding: 1.2rem 1.4rem;
    min-width: 70px;
  }
  
  .stat-number {
    font-size: 1.6rem;
  }
  
  .stat-label {
    font-size: 0.7rem;
  }
  
  .filters-section {
    padding: 1.2rem;
    gap: 0.8rem;
    margin-bottom: 1.6rem;
  }
  
  .search-box {
    padding: 0.6rem 0.8rem;
  }
  
  .search-box .material-icons {
    font-size: 1.1rem;
  }
  
  .uppercase-input {
    font-size: 0.85rem;
  }
  
  .filter-group {
    gap: 0.8rem;
  }
  
  .filter-group select {
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
    min-width: 100px;
  }
  
  .reset-filters-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
  
  .tabs {
    gap: 0.4rem;
    margin-bottom: 1.6rem;
  }
  
  .tab-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.85rem;
  }
  
  .tab-icon {
    font-size: 1rem;
  }
  
  .tab-count {
    font-size: 0.65rem;
    padding: 1px 4px;
  }
  
  .list-header {
    margin-bottom: 1.2rem;
  }
  
  .list-header h3 {
    font-size: 1.1rem;
  }
  
  .refresh-button {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
  
  .registrations-table {
    font-size: 0.85rem;
  }
  
  .registrations-table th {
    padding: 1rem 1.2rem;
    font-size: 0.75rem;
  }
  
  .registrations-table td {
    padding: 1rem 1.2rem;
  }
  
  .student-name .name {
    font-size: 0.85rem;
  }
  
  .student-name .email {
    font-size: 0.75rem;
  }
  
  .status-badge {
    font-size: 0.6rem;
    padding: 2px 6px;
  }
  
  .action-button {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
    min-width: 32px;
    height: 32px;
  }
  
  .col-reason {
    font-size: 0.75rem;
    max-width: 150px;
  }
  
  .modal-content {
    max-width: 450px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1.2rem;
  }
  
  .modal-header h3 {
    font-size: 1.1rem;
  }
  
  .form-group label {
    font-size: 0.85rem;
  }
  
  .form-group textarea {
    font-size: 0.85rem;
    padding: 0.8rem 1rem;
  }
  
  .cancel-button,
  .confirm-reject-button {
    padding: 0.8rem 1.2rem;
    font-size: 0.85rem;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .student-approval {
    padding: 1.4rem;
  }
  
  .page-header {
    margin-bottom: 1.4rem;
  }
  
  .page-header h1 {
    font-size: 1.6rem;
  }
  
  .header-actions {
    gap: 0.7rem;
  }
  
  .stats-overview {
    gap: 1rem;
  }
  
  .stat-item {
    padding: 1rem 1.2rem;
    min-width: 65px;
  }
  
  .stat-number {
    font-size: 1.4rem;
  }
  
  .stat-label {
    font-size: 0.65rem;
  }
  
  .filters-section {
    padding: 1rem;
    gap: 0.7rem;
    margin-bottom: 1.4rem;
  }
  
  .search-box {
    padding: 0.5rem 0.7rem;
  }
  
  .search-box .material-icons {
    font-size: 1rem;
  }
  
  .uppercase-input {
    font-size: 0.8rem;
  }
  
  .filter-group {
    gap: 0.7rem;
  }
  
  .filter-group select {
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    min-width: 90px;
  }
  
  .reset-filters-btn {
    padding: 0.35rem 0.7rem;
    font-size: 0.8rem;
  }
  
  .tabs {
    gap: 0.35rem;
    margin-bottom: 1.4rem;
  }
  
  .tab-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
  
  .tab-icon {
    font-size: 0.9rem;
  }
  
  .tab-count {
    font-size: 0.6rem;
    padding: 1px 3px;
  }
  
  .list-header {
    margin-bottom: 1rem;
  }
  
  .list-header h3 {
    font-size: 1rem;
  }
  
  .refresh-button {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .registrations-table {
    font-size: 0.8rem;
  }
  
  .registrations-table th {
    padding: 0.8rem 1rem;
    font-size: 0.7rem;
  }
  
  .registrations-table td {
    padding: 0.8rem 1rem;
  }
  
  .student-name .name {
    font-size: 0.8rem;
  }
  
  .student-name .email {
    font-size: 0.7rem;
  }
  
  .status-badge {
    font-size: 0.55rem;
    padding: 2px 5px;
  }
  
  .action-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
    min-width: 28px;
    height: 28px;
  }
  
  .col-reason {
    font-size: 0.7rem;
    max-width: 130px;
  }
  
  .modal-content {
    max-width: 400px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-header h3 {
    font-size: 1rem;
  }
  
  .form-group label {
    font-size: 0.8rem;
  }
  
  .form-group textarea {
    font-size: 0.8rem;
    padding: 0.7rem 0.8rem;
  }
  
  .cancel-button,
  .confirm-reject-button {
    padding: 0.7rem 1rem;
    font-size: 0.8rem;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .student-approval {
    padding: 1.2rem;
  }
  
  .page-header {
    margin-bottom: 1.2rem;
  }
  
  .page-header h1 {
    font-size: 1.4rem;
  }
  
  .header-actions {
    gap: 0.6rem;
  }
  
  .stats-overview {
    gap: 0.8rem;
  }
  
  .stat-item {
    padding: 0.8rem 1rem;
    min-width: 60px;
  }
  
  .stat-number {
    font-size: 1.2rem;
  }
  
  .stat-label {
    font-size: 0.6rem;
  }
  
  .filters-section {
    padding: 0.8rem;
    gap: 0.6rem;
    margin-bottom: 1.2rem;
  }
  
  .search-box {
    padding: 0.4rem 0.6rem;
  }
  
  .search-box .material-icons {
    font-size: 0.9rem;
  }
  
  .uppercase-input {
    font-size: 0.75rem;
  }
  
  .filter-group {
    gap: 0.6rem;
  }
  
  .filter-group select {
    padding: 0.3rem 0.4rem;
    font-size: 0.75rem;
    min-width: 80px;
  }
  
  .reset-filters-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }
  
  .tabs {
    gap: 0.3rem;
    margin-bottom: 1.2rem;
  }
  
  .tab-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
  
  .tab-icon {
    font-size: 0.8rem;
  }
  
  .tab-count {
    font-size: 0.55rem;
    padding: 1px 2px;
  }
  
  .list-header {
    margin-bottom: 0.8rem;
  }
  
  .list-header h3 {
    font-size: 0.9rem;
  }
  
  .refresh-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
  }
  
  .registrations-table {
    font-size: 0.75rem;
  }
  
  .registrations-table th {
    padding: 0.6rem 0.8rem;
    font-size: 0.65rem;
  }
  
  .registrations-table td {
    padding: 0.6rem 0.8rem;
  }
  
  .student-name .name {
    font-size: 0.75rem;
  }
  
  .student-name .email {
    font-size: 0.65rem;
  }
  
  .status-badge {
    font-size: 0.5rem;
    padding: 1px 4px;
  }
  
  .action-button {
    padding: 0.3rem 0.5rem;
    font-size: 0.7rem;
    min-width: 24px;
    height: 24px;
  }
  
  .col-reason {
    font-size: 0.65rem;
    max-width: 110px;
  }
  
  .modal-content {
    max-width: 350px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 0.8rem;
  }
  
  .modal-header h3 {
    font-size: 0.9rem;
  }
  
  .form-group label {
    font-size: 0.75rem;
  }
  
  .form-group textarea {
    font-size: 0.75rem;
    padding: 0.6rem 0.7rem;
  }
  
  .cancel-button,
  .confirm-reject-button {
    padding: 0.6rem 0.8rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .student-approval {
    padding: 10px 5px;
  }
  
  .header-content h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    position: absolute;
    top: 60%;
    right: 1rem;
    transform: translateY(-50%);
    font-size: 3rem;
    font-weight: 900;
    color: rgba(0, 0, 0, 0.03);
    z-index: 0;
    user-select: none;
    pointer-events: none;
    overflow: hidden;
    white-space: nowrap;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .divider {
    margin: 0.8rem 0;
  }
  
  .stats-overview {
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stat-item {
    min-width: 70px;
    padding: 12px 16px;
  }
  
  .stat-number {
    font-size: 18px;
  }
  
  .controls-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-controls {
    width: 100%;
    gap: 0.8rem;
    flex-wrap: wrap;
  }
  
  .filter-controls select {
    flex: 1;
    font-size: 0.8rem;
    padding: 0 0.8rem;
    min-width: 120px;
  }
  
  .search-box {
    max-width: none;
  }
  
  .search-box input {
    font-size: 0.8rem;
    padding: 0.4rem;
  }
  
  .tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    gap: 0.25rem;
  }
  
  .tab-btn {
    flex-shrink: 0;
    padding: 0.5rem 1rem;
    font-size: 13px;
  }
  
  .table-container {
    overflow-x: auto;
    border-radius: 8px;
  }
  
  .registrations-table {
    min-width: 700px;
  }
  
  .registrations-table th,
  .registrations-table td {
    padding: 12px 16px;
    font-size: 13px;
  }
  
  .col-name {
    min-width: 180px;
  }
  
  .student-name .name {
    font-size: 0.9rem;
  }
  
  .student-name .email {
    font-size: 0.75rem;
  }
  
  .action-button {
    min-width: 32px;
    height: 32px;
    padding: 6px 8px;
    margin: 0 2px;
  }
  
  /* Card view responsive */
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .student-card {
    margin-bottom: 0;
  }
  
  .card-header {
    padding: 15px;
  }
  
  .student-info {
    gap: 12px;
  }
  
  .student-avatar {
    width: 40px;
    height: 40px;
  }
  
  .student-details .student-name {
    font-size: 16px;
  }
  
  .student-email {
    font-size: 13px;
  }
  
  .card-body {
    padding: 15px;
  }
  
  .card-info {
    gap: 10px;
  }
  
  .info-item {
    font-size: 13px;
  }
  
  .info-item .material-icons {
    font-size: 16px;
  }
  
  .card-actions {
    padding: 15px;
    flex-direction: column;
    gap: 8px;
  }
  
  .card-actions .action-button {
    width: 100%;
    padding: 10px 16px;
    font-size: 13px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .cancel-button,
  .confirm-reject-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .student-approval {
    padding: 0.5rem;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .stats-overview {
    gap: 12px;
  }
  
  .stat-item {
    min-width: 60px;
    padding: 10px 12px;
  }
  
  .stat-number {
    font-size: 16px;
  }
  
  .stat-label {
    font-size: 10px;
  }
  
  .filters-section {
    padding: 0.75rem;
  }
  
  .tab-btn {
    padding: 0.4rem 0.75rem;
    font-size: 12px;
  }
}
</style>
