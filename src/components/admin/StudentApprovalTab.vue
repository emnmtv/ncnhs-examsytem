<template>
  <div class="student-approval">
    <div class="page-header">
      <h1>Student Registration Management</h1>
      <div class="header-actions">
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
            <span class="stat-label">Rejected</span>
          </div>
          <div class="stat-item total">
            <span class="stat-number">{{ stats.total }}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
      </div>
    </div>

    <div class="filters-section">
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

      <div class="filter-group">
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
        
        <button @click="resetFilters" class="reset-filters-btn">
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
          <div class="table-container">
            <table class="registrations-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>LRN</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in filteredPendingRegistrations" :key="student.id" class="table-row pending">
                  <td class="student-cell">
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
                        <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
                        <div class="status-badge pending">Pending</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ student.email }}</td>
                  <td>{{ student.lrn || 'N/A' }}</td>
                  <td>{{ student.gradeLevel || 'N/A' }}</td>
                  <td>{{ student.section || 'N/A' }}</td>
                  <td>{{ formatDate(student.createdAt) }}</td>
                  <td class="actions-cell">
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
                      title="Reject"
                    >
                      <span class="material-icons">close</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
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
          <div class="table-container">
            <table class="registrations-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>LRN</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Approved</th>
                  <th>Approved By</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in filteredApprovedRegistrations" :key="student.id" class="table-row approved">
                  <td class="student-cell">
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
                        <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
                        <div class="status-badge approved">Approved</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ student.email }}</td>
                  <td>{{ student.lrn || 'N/A' }}</td>
                  <td>{{ student.gradeLevel || 'N/A' }}</td>
                  <td>{{ student.section || 'N/A' }}</td>
                  <td>{{ formatDate(student.approvedAt) }}</td>
                  <td>{{ student.approver ? `${student.approver.firstName} ${student.approver.lastName}` : 'N/A' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Rejected Tab -->
      <div v-else-if="activeTab === 'rejected'" class="registrations-list">
        <div v-if="filteredRejectedRegistrations.length === 0" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons">cancel_outline</span>
          </div>
          <h3>No Rejected Registrations</h3>
          <p v-if="searchQuery || selectedGrade || selectedSection || dateFilter">
            No rejected registrations match your current filters.
          </p>
          <p v-else>No student registrations have been rejected yet.</p>
        </div>
        <div v-else>
          <div class="list-header">
            <h3>Rejected Registrations ({{ filteredRejectedRegistrations.length }})</h3>
            <button @click="loadData" class="refresh-button">
              <span class="material-icons">refresh</span>
              Refresh
            </button>
          </div>
          <div class="table-container">
            <table class="registrations-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>LRN</th>
                  <th>Grade</th>
                  <th>Section</th>
                  <th>Rejected</th>
                  <th>Rejected By</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in filteredRejectedRegistrations" :key="student.id" class="table-row rejected">
                  <td class="student-cell">
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
                        <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
                        <div class="status-badge rejected">Rejected</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ student.email }}</td>
                  <td>{{ student.lrn || 'N/A' }}</td>
                  <td>{{ student.gradeLevel || 'N/A' }}</td>
                  <td>{{ student.section || 'N/A' }}</td>
                  <td>{{ formatDate(student.approvedAt) }}</td>
                  <td>{{ student.approver ? `${student.approver.firstName} ${student.approver.lastName}` : 'N/A' }}</td>
                  <td class="rejection-reason">{{ student.rejectionReason || 'N/A' }}</td>
                  <td class="actions-cell">
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
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModalFlag" class="modal-overlay" @click="closeRejectModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Reject Student Registration</h3>
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
                :alt="`${selectedStudent?.firstName} ${selectedStudent?.lastName}`"
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
            <label for="rejectionReason">Rejection Reason *</label>
            <textarea
              id="rejectionReason"
              v-model="rejectionReason"
              placeholder="Please provide a reason for rejection..."
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
            Reject Registration
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
        { key: 'rejected', label: 'Rejected', icon: 'cancel', count: 0 }
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
          title: isRejectedStudent ? 'Approve Rejected Registration?' : 'Approve Registration?',
          text: isRejectedStudent 
            ? 'Are you sure you want to approve this previously rejected student registration?'
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
              ? 'The previously rejected student registration has been approved successfully.'
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

      try {
        this.processingStudents.add(this.selectedStudent.id);
        await rejectStudentRegistration(this.selectedStudent.id, this.rejectionReason.trim());
        
        await Swal.fire({
          icon: 'success',
          title: 'Registration Rejected!',
          text: 'The student registration has been rejected successfully.',
          confirmButtonColor: '#dc3545',
          position: 'top-end',
          toast: true,
          timer: 3000,
          timerProgressBar: true
        });

        this.closeRejectModal();
        // Reload data to update the lists
        await this.loadData();
      } catch (error) {
        console.error('Error rejecting student:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Rejection Failed',
          text: error.message || 'Failed to reject student registration.',
          confirmButtonColor: '#dc3545',
          position: 'top-end',
          toast: true,
          timer: 5000,
          timerProgressBar: true
        });
      } finally {
        this.processingStudents.delete(this.selectedStudent.id);
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
    }
  }
};
</script>

<style scoped>
.student-approval {
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

.page-header h1 {
  color: #1a1a1a;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
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

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

.search-box:focus-within {
  border-color: #19a759;
  box-shadow: 0 0 0 2px rgba(25, 167, 89, 0.1);
}

.search-box .material-icons {
  color: #6c757d;
  margin-right: 0.5rem;
  font-size: 20px;
}

.uppercase-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #374151;
}

.uppercase-input::placeholder {
  color: #9ca3af;
}

.clear-search {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search:hover {
  background: #e5e7eb;
  color: #374151;
}

.filter-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: #374151;
  min-width: 120px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.filter-group select:focus {
  outline: none;
  border-color: #19a759;
  box-shadow: 0 0 0 2px rgba(25, 167, 89, 0.1);
}

.reset-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.reset-filters-btn:hover {
  background: #5a6268;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.registrations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.registrations-table th {
  background: #f8f9fa;
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e9ecef;
  white-space: nowrap;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.registrations-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  color: #374151;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row.pending {
  border-left: 3px solid #f59e0b;
}

.table-row.approved {
  border-left: 3px solid #10b981;
}

.table-row.rejected {
  border-left: 3px solid #ef4444;
}

.student-cell {
  min-width: 220px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid #f3f4f6;
}

.student-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #19a759;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.student-details {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
  font-size: 14px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  letter-spacing: 0.5px;
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

.actions-cell {
  white-space: nowrap;
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
}

.action-button.reject {
  background: #ef4444;
  color: white;
}

.action-button.reject:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
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
@media (max-width: 768px) {
  .student-approval {
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
  
  .filters-section {
    padding: 1rem;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .filter-group select {
    width: 100%;
    min-width: auto;
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
  
  .student-cell {
    min-width: 180px;
  }
  
  .student-avatar {
    width: 36px;
    height: 36px;
  }
  
  .action-button {
    min-width: 32px;
    height: 32px;
    padding: 6px 8px;
    margin: 0 2px;
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
