<template>
  <div class="grade-section-student-list">
    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          <span class="material-icons">arrow_back</span>
          Back to Manage Users
        </button>
        <div class="header-info">
          <h1>Grade {{ grade }} - Section {{ section }}</h1>
          <p class="student-count">{{ students.length }} student{{ students.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="refreshStudents" class="refresh-btn" :disabled="loading">
          <span class="material-icons" :class="{ 'rotating': loading }">refresh</span>
          Refresh
        </button>
        <button @click="exportStudents" class="export-btn">
          <span class="material-icons">download</span>
          Export
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search students..."
          class="uppercase-input"
        />
      </div>
      
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading students...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredStudents.length === 0" class="empty-state">
      <span class="material-icons">group_off</span>
      <p v-if="searchQuery">No students found matching "{{ searchQuery }}"</p>
      <p v-else>No students found in this grade and section</p>
    </div>


    <!-- Students Table -->
    <div class="table-container">
      <table class="students-table">
        <thead>
          <tr>
            <th class="col-number">#</th>
            <th class="col-name">Name</th>
            <th class="col-lrn">LRN</th>
            <th class="col-email">Email</th>
            <th class="col-phone">Phone</th>
            <th class="col-address">Address</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, index) in filteredStudents" :key="student.id" class="student-row">
            <td class="col-number">{{ index + 1 }}</td>
            <td class="col-name">
              <div class="student-name">
                <span class="name">{{ student.firstName }} {{ student.lastName }}</span>
                <span class="email">{{ student.email }}</span>
              </div>
            </td>
            <td class="col-lrn">{{ student.lrn || 'N/A' }}</td>
            <td class="col-email">{{ student.email || 'N/A' }}</td>
            <td class="col-phone">{{ student.phoneNumber || 'N/A' }}</td>
            <td class="col-address">{{ student.address || 'N/A' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Table Footer -->
    <div class="table-footer">
      <p class="results-count">
        Showing {{ filteredStudents.length }} of {{ students.length }} students
      </p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchStudents, getFullImageUrl } from '@/services/authService'

export default {
  name: 'GradeSectionStudentList',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // Get grade and section from route params
    const grade = ref(route.params.grade)
    const section = ref(route.params.section)
    
    // Reactive data
    const students = ref([])
    const loading = ref(false)
    const searchQuery = ref('')
    
    // Computed properties
    const filteredStudents = computed(() => {
      if (!searchQuery.value) return students.value
      
      const query = searchQuery.value.toLowerCase()
      return students.value.filter(student => 
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.lrn.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      )
    })
    
    // Methods
    const loadStudents = async () => {
      try {
        loading.value = true
        const allStudents = await fetchStudents()
        console.log('All Students:', allStudents) // Debug log
        
        // Filter students by grade and section
        const filteredStudents = allStudents.filter(student => 
          student.gradeLevel == grade.value && student.section === section.value
        )
        
        console.log('Filtered Students:', filteredStudents) // Debug log
        students.value = filteredStudents
      } catch (error) {
        console.error('Error fetching students:', error)
        students.value = []
      } finally {
        loading.value = false
      }
    }
    
    const refreshStudents = () => {
      loadStudents()
    }
    
    const goBack = () => {
      router.push('/manage-users')
    }
    
    
    const exportStudents = async () => {
      try {
        if (filteredStudents.value.length === 0) {
          alert('No students to export.')
          return
        }
        
        // Import ExcelJS
        const ExcelJS = await import('exceljs')
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Students')
        
        const headers = ['First Name', 'Last Name', 'LRN', 'Email', 'Phone', 'Address']
        const columnCount = headers.length
        
        // Helper function to get column letter from number
        const getColumnLetter = (colNum) => {
          let result = ''
          while (colNum > 0) {
            colNum--
            result = String.fromCharCode(65 + (colNum % 26)) + result
            colNum = Math.floor(colNum / 26)
          }
          return result
        }
        
        // Add official DepEd header section
        const republicRow = worksheet.getRow(1)
        republicRow.height = 15
        const republicCell = republicRow.getCell(1)
        republicCell.value = 'Republic of the Philippines'
        republicCell.font = { size: 10, bold: true, name: 'Arial' }
        republicCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A1:${getColumnLetter(columnCount)}1`)
        
        const deptRow = worksheet.getRow(2)
        deptRow.height = 15
        const deptCell = deptRow.getCell(1)
        deptCell.value = 'Department of Education'
        deptCell.font = { size: 10, bold: true, name: 'Arial' }
        deptCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A2:${getColumnLetter(columnCount)}2`)
        
        const regionRow = worksheet.getRow(3)
        regionRow.height = 15
        const regionCell = regionRow.getCell(1)
        regionCell.value = 'Region III - Central Luzon'
        regionCell.font = { size: 10, bold: true, name: 'Arial' }
        regionCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A3:${getColumnLetter(columnCount)}3`)
        
        const divisionRow = worksheet.getRow(4)
        divisionRow.height = 15
        const divisionCell = divisionRow.getCell(1)
        divisionCell.value = 'Schools Division of Olongapo City'
        divisionCell.font = { size: 10, bold: true, name: 'Arial' }
        divisionCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A4:${getColumnLetter(columnCount)}4`)
        
        const schoolRow = worksheet.getRow(5)
        schoolRow.height = 20
        const schoolCell = schoolRow.getCell(1)
        schoolCell.value = 'NEW CABALAN NATIONAL HIGH SCHOOL'
        schoolCell.font = { size: 14, bold: true, name: 'Arial' }
        schoolCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A5:${getColumnLetter(columnCount)}5`)
        
        const addressRow = worksheet.getRow(6)
        addressRow.height = 15
        const addressCell = addressRow.getCell(1)
        addressCell.value = 'New Cabalan, Olongapo City'
        addressCell.font = { size: 10, italic: true, name: 'Arial' }
        addressCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A6:${getColumnLetter(columnCount)}6`)
        
        // Add line break
        const lineRow = worksheet.getRow(7)
        lineRow.height = 5
        const lineCell = lineRow.getCell(1)
        lineCell.value = '_________________________________________________'
        lineCell.font = { size: 8, name: 'Arial' }
        lineCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A7:${getColumnLetter(columnCount)}7`)
        
        // Add title
        const titleRow = worksheet.getRow(8)
        titleRow.height = 25
        const titleCell = titleRow.getCell(1)
        titleCell.value = `GRADE ${grade.value} - SECTION ${section.value} STUDENT LIST`
        titleCell.font = { size: 16, bold: true, name: 'Arial' }
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A8:${getColumnLetter(columnCount)}8`)
        
        // Add empty row
        const spacingRow = worksheet.getRow(9)
        spacingRow.height = 10
        
        // Set column widths
        worksheet.getColumn(1).width = 20 // First Name
        worksheet.getColumn(2).width = 20 // Last Name
        worksheet.getColumn(3).width = 15 // LRN
        worksheet.getColumn(4).width = 30 // Email
        worksheet.getColumn(5).width = 15 // Phone
        worksheet.getColumn(6).width = 40 // Address
        
        // Add header row with styling
        const headerRow = worksheet.getRow(10)
        headerRow.height = 25
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
        
        headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1)
          cell.value = header
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4CAF50' }
          }
          cell.border = {
            top: { style: 'thin', color: { argb: '4CAF50' } },
            left: { style: 'thin', color: { argb: '4CAF50' } },
            bottom: { style: 'thin', color: { argb: '4CAF50' } },
            right: { style: 'thin', color: { argb: '4CAF50' } }
          }
        })
        
        // Add data rows
        const dataStartRow = 11
        filteredStudents.value.forEach((student, rowIndex) => {
          const excelRow = worksheet.getRow(dataStartRow + rowIndex)
          excelRow.height = 20
          excelRow.alignment = { vertical: 'middle' }
          
          const rowData = [
            student.firstName || '',
            student.lastName || '',
            student.lrn || 'N/A',
            student.email || 'N/A',
            student.phoneNumber || 'N/A',
            student.address || 'N/A'
          ]
          
          rowData.forEach((value, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1)
            cell.value = value
            cell.border = {
              top: { style: 'thin', color: { argb: '4CAF50' } },
              left: { style: 'thin', color: { argb: '4CAF50' } },
              bottom: { style: 'thin', color: { argb: '4CAF50' } },
              right: { style: 'thin', color: { argb: '4CAF50' } }
            }
          })
        })
        
        // Add footer
        const footerRow = worksheet.getRow(dataStartRow + filteredStudents.value.length)
        footerRow.height = 20
        const footerCell = footerRow.getCell(1)
        footerCell.value = `Generated on: ${new Date().toLocaleDateString()} | NCNHS Exam System | Total: ${filteredStudents.value.length} student(s)`
        footerCell.font = { 
          size: 9, 
          color: { argb: '999999' },
          italic: true
        }
        footerCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.mergeCells(`A${dataStartRow + filteredStudents.value.length}:${getColumnLetter(columnCount)}${dataStartRow + filteredStudents.value.length}`)
        
        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `Grade_${grade.value}_Section_${section.value}_Students_${new Date().toISOString().slice(0, 10)}.xlsx`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error exporting students:', error)
        alert('Error exporting students. Please try again.')
      }
    }
    
    const handleImageError = (event) => {
      event.target.style.display = 'none'
      event.target.nextElementSibling?.classList.add('show')
    }
    
    // Lifecycle
    onMounted(() => {
      if (!grade.value || !section.value) {
        console.error('Missing grade or section parameters')
        router.push('/manage-users')
        return
      }
      loadStudents()
    })
    
    return {
      grade,
      section,
      students,
      loading,
      searchQuery,
      filteredStudents,
      loadStudents,
      refreshStudents,
      goBack,
      exportStudents,
      handleImageError,
      getFullImageUrl
    }
  }
}
</script>

<style scoped>
.grade-section-student-list {
  padding: 1.5rem;
  width: 100%;
  margin: 0;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  color: #495057;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.back-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.header-info h1 {
  margin: 0;
  color: #333;
  font-size: 1.75rem;
}

.student-count {
  margin: 0.25rem 0 0 0;
  color: #6c757d;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.refresh-btn, .export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover, .export-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box .material-icons {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 20px;
}

.uppercase-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.uppercase-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-toggle {
  display: flex;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.view-btn {
  padding: 0.5rem;
  border: none;
  background: white;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn.active {
  background: #007bff;
  color: white;
}

.view-btn:hover:not(.active) {
  background: #f8f9fa;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state .material-icons {
  font-size: 4rem;
  color: #dee2e6;
  margin-bottom: 1rem;
}

/* Table Styles */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  width: 100%;
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

.col-email,
.col-phone,
.col-address {
  font-size: 0.9rem;
  color: #495057;
}


/* Table Footer */
.table-footer {
  text-align: center;
  padding: 15px;
  color: #666;
  font-size: 0.9rem;
}

/* Mobile responsive design */
@media (max-width: 768px) {
  .grade-section-student-list {
    padding: 10px 5px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-info h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-container {
    max-width: none;
  }

  .table-container {
    overflow-x: auto;
    margin-bottom: 16px;
  }

  .students-table {
    min-width: 600px;
  }

  .students-table th,
  .students-table td {
    padding: 12px 8px;
    font-size: 0.85rem;
  }

  .col-name {
    min-width: 150px;
  }

  .student-name .name {
    font-size: 0.9rem;
  }

  .student-name .email {
    font-size: 0.75rem;
  }
}

/* Very small screens */
@media (max-width: 480px) {
  .grade-section-student-list {
    padding: 8px 4px;
  }

  .header-info h1 {
    font-size: 1.6rem;
  }

  .students-table {
    min-width: 500px;
  }

  .students-table th,
  .students-table td {
    padding: 10px 6px;
    font-size: 0.8rem;
  }

  .student-name .name {
    font-size: 0.85rem;
  }

  .student-name .email {
    font-size: 0.7rem;
  }
}
</style>
