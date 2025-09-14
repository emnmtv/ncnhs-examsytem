<template>
  <div class="exam-paper-preview">
    <!-- Print Controls (hidden when printing) -->
    <div class="print-controls no-print">
      <button @click="$router.back()" class="back-btn">
        <span class="material-icons-round">arrow_back</span>
        Back
      </button>
      <div class="export-controls">
        <button @click="downloadPDF" class="download-btn">
          <span class="material-icons-round">picture_as_pdf</span>
          Download PDF
        </button>
        <button @click="handlePrint" class="print-btn">
          <span class="material-icons-round">print</span>
          Print Exam
        </button>
      </div>
    </div>

    <!-- Zoom Controls (hidden when printing) -->
    <div class="zoom-controls no-print">
      <div class="zoom-info">
        <span class="zoom-label">Zoom:</span>
        <span class="zoom-percentage">{{ Math.round(zoomLevel * 100) }}%</span>
      </div>
      <div class="zoom-buttons">
        <button @click="zoomOut" class="zoom-btn" :disabled="zoomLevel <= 0.5">
          <span class="material-icons-round">remove</span>
        </button>
        <button @click="resetZoom" class="zoom-btn reset">
          <span class="material-icons-round">refresh</span>
        </button>
        <button @click="zoomIn" class="zoom-btn" :disabled="zoomLevel >= 2">
          <span class="material-icons-round">add</span>
        </button>
      </div>
    </div>

    <!-- Printable Content -->
    <div class="printable-area" ref="printArea" :class="{ 'zoom-small': zoomLevel < 1, 'zoom-large': zoomLevel > 1 }" :style="{ '--zoom-factor': zoomLevel }">
      <!-- Official School Header -->
      <div class="school-header">
        <div class="header-content">
          <div class="logo-container">
            <img src="@/assets/logo.png" alt="School Logo" class="school-logo">
          </div>
          <div class="school-info">
            <div class="republic">Republic of the Philippines</div>
            <div class="department">Department of Education</div>
            <div class="region">Region III - Central Luzon</div>
            <div class="division">Schools Division of Olongapo City</div>
            <h2 class="school-name">NEW CABALAN NATIONAL HIGH SCHOOL</h2>
            <div class="address">New Cabalan, Olongapo City</div>
          </div>
        </div>
        <div class="line-break"></div>
      </div>

      <!-- Exam Title and Info -->
      <div class="exam-title-section">
        <h1>{{ exam?.examTitle || 'EXAMINATION' }}</h1>
        <div class="exam-subtitle">{{ getCurrentQuarter() }} Quarter Examination</div>
      </div>
      
      <!-- Student Info Section -->
      <div class="student-info-section">
        <div class="student-info-grid">
          <div class="info-group">
            <div class="info-label">Name:</div>
            <div class="info-value">_____________________________________</div>
          </div>
          <div class="info-group">
            <div class="info-label">Grade &amp; Section:</div>
            <div class="info-value">_____________________</div>
          </div>
          <div class="info-group">
            <div class="info-label">Date:</div>
            <div class="info-value">_____________________</div>
          </div>
          <div class="info-group">
            <div class="info-label">Score:</div>
            <div class="info-value">_____/______</div>
          </div>
        </div>
        
        <div class="exam-details">
          <div class="detail-item">
            <span class="detail-label">Subject:</span>
            <span class="detail-value">{{ exam?.classCode || 'N/A' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Test Code:</span>
            <span class="detail-value">{{ exam?.testCode || 'N/A' }}</span>
          </div>
        </div>
      </div>

  

      <!-- Questions -->
      <div class="questions-section">
        <div 
          v-for="(question, index) in exam?.questions" 
          :key="index" 
          class="question-item"
        >
          <div class="question-header">
            <span class="question-number">{{ index + 1 }}.</span>
            <span class="question-text">{{ question.questionText }}</span>
            <span class="question-type">({{ formatQuestionType(question.questionType) }})</span>
          </div>

          <!-- Question Image -->
          <div v-if="question.imageUrl" class="question-image-container">
            <img :src="getImageUrl(question.imageUrl)" alt="Question image" class="question-image">
          </div>

          <!-- Multiple Choice -->
          <div 
            v-if="question.questionType === 'multiple_choice' || question.questionType === 'multipleChoice'"
            class="options-list"
          >
            <div 
              v-for="(option, optIndex) in parseOptions(question.options)"
              :key="optIndex"
              class="option-item"
            >
              <div class="circle">{{ getOptionLetter(optIndex) }}</div>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>

          <!-- True/False -->
          <div 
            v-else-if="question.questionType === 'true_false'"
            class="options-list"
          >
            <div class="option-item">
              <div class="circle">A</div>
              <span class="option-text">True</span>
            </div>
            <div class="option-item">
              <div class="circle">B</div>
              <span class="option-text">False</span>
            </div>
          </div>

          <!-- Short Answer or Enumeration -->
          <div 
            v-else
            class="text-answer"
          >
            <div class="answer-lines">
              <div class="line" v-for="n in 3" :key="n"></div>
            </div>
          </div>

          <!-- For teacher version only, show correct answer -->
          <div v-if="showAnswers" class="correct-answer print-hide">
            <span class="answer-label">Correct Answer:</span>
            <span class="answer-value">{{ formatAnswer(question) }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="exam-footer">
        <div class="prepared-by" v-if="showAnswers">
          <div class="teacher-section">
            <div class="footer-label">Prepared by:</div>
            <div class="footer-line">____________________________</div>
            <div class="footer-name">Teacher's Name</div>
            <div class="footer-position">Subject Teacher</div>
          </div>
          <div class="approved-section">
            <div class="footer-label">Approved by:</div>
            <div class="footer-line">____________________________</div>
            <div class="footer-name">Principal's Name</div>
            <div class="footer-position">School Principal</div>
          </div>
        </div>
        <div class="watermark">{{ showAnswers ? 'TEACHER COPY - WITH ANSWER KEY' : 'STUDENT COPY' }}</div>
        <div class="end-note">*** END OF EXAMINATION ***</div>
      </div>
    </div>

    <!-- Answer Toggle Button (only visible in preview) -->
    <div class="toggle-answers no-print">
      <label class="switch">
        <input type="checkbox" v-model="showAnswers">
        <span class="slider"></span>
      </label>
      <span class="toggle-label">Show Answer Key</span>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchTeacherExams, fetchArchivedTeacherExams, getFullImageUrl } from '../../services/authService';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';

export default {
  name: 'ExamPaperPreview',
  
  setup() {
    const route = useRoute();
    const exam = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const printArea = ref(null);
    const showAnswers = ref(false);
    const zoomLevel = ref(1);

    const loadExam = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        // First try to find the exam in active exams
        const activeExams = await fetchTeacherExams();
        exam.value = activeExams.find(e => e.id === parseInt(route.params.examId));
        
        // If not found in active exams, check archived exams
        if (!exam.value) {
          const archivedExams = await fetchArchivedTeacherExams();
          exam.value = archivedExams.find(e => e.id === parseInt(route.params.examId));
        }
        
        if (!exam.value) {
          throw new Error('Exam not found');
        }
      } catch (err) {
        error.value = err.message;
        console.error('Error loading exam:', err);
        Swal.fire({
          title: 'Error',
          text: error.value || 'Failed to load exam',
          icon: 'error'
        });
      } finally {
        loading.value = false;
      }
    };

    const formatQuestionType = (type) => {
      const types = {
        'multiple_choice': 'Multiple Choice',
        'multipleChoice': 'Multiple Choice',
        'true_false': 'True/False',
        'enumeration': 'Short Answer'
      };
      return types[type] || type;
    };

    const parseOptions = (options) => {
      if (!options) return [];
      if (typeof options === 'string') {
        try {
          return JSON.parse(options);
        } catch (e) {
          console.error('Error parsing options:', e);
          return [];
        }
      }
      return options;
    };

    const formatAnswer = (question) => {
      if (question.questionType === 'true_false') {
        return question.correctAnswer.charAt(0).toUpperCase() + question.correctAnswer.slice(1);
      }
      return question.correctAnswer;
    };
    
    const getImageUrl = (imageUrl) => {
      return getFullImageUrl(imageUrl);
    };
    
    // Get option letter (A, B, C, D)
    const getOptionLetter = (index) => {
      return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
    };
    
    // Get total number of questions
    const getTotalQuestions = () => {
      return exam.value?.questions?.length || 0;
    };
    
    // Calculate estimated exam time (30 seconds per question, minimum 15 minutes)
    const calculateExamTime = () => {
      if (!exam.value?.questions) return 30;
      const estimatedMinutes = Math.ceil(exam.value.questions.length * 0.5);
      return Math.max(15, estimatedMinutes);
    };
    
    // Get current quarter based on date
    const getCurrentQuarter = () => {
      const month = new Date().getMonth();
      if (month >= 0 && month <= 5) return "1st"; // Jan-Mar
      if (month >= 6 && month <= 8) return "2nd"; // Apr-Jun
      if (month >= 9 && month <= 11) return "3rd"; // Jul-Sep
      return "4th"; // Oct-Dec
    };

    // Zoom functionality
    const zoomIn = () => {
      if (zoomLevel.value < 2) {
        zoomLevel.value = Math.min(2, zoomLevel.value + 0.1);
      }
    };

    const zoomOut = () => {
      if (zoomLevel.value > 0.5) {
        zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.1);
      }
    };

    const resetZoom = () => {
      zoomLevel.value = 1;
    };

    const handlePrint = () => {
      // Apply zoom level to print
      document.documentElement.style.setProperty('--print-zoom-factor', zoomLevel.value);
      
      // First check if answers are being shown
      if (showAnswers.value) {
        // Ask if they want to print with answers
        Swal.fire({
          title: 'Print Answer Key?',
          text: 'You are about to print the exam with answer key. Continue?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, print with answers',
          cancelButtonText: 'No, print student copy'
        }).then((result) => {
          if (result.isConfirmed) {
            window.print();
            // Reset zoom level after printing
            setTimeout(() => {
              document.documentElement.style.removeProperty('--print-zoom-factor');
            }, 1000);
          } else {
            // If they chose to hide answers, temporarily hide them
            showAnswers.value = false;
            setTimeout(() => {
              window.print();
              // And restore their preference afterward
              showAnswers.value = true;
              // Reset zoom level after printing
              setTimeout(() => {
                document.documentElement.style.removeProperty('--print-zoom-factor');
              }, 1000);
            }, 100);
          }
        });
      } else {
        window.print();
        // Reset zoom level after printing
        setTimeout(() => {
          document.documentElement.style.removeProperty('--print-zoom-factor');
        }, 1000);
      }
    };

    const downloadPDF = async () => {
      const element = printArea.value;
      
      // Apply zoom level for PDF generation
      document.documentElement.style.setProperty('--print-zoom-factor', zoomLevel.value);
      
      // Show confirmation if answers are being shown
      let includeAnswers = showAnswers.value;
      if (showAnswers.value) {
        const result = await Swal.fire({
          title: 'Include Answers?',
          text: 'Do you want to include the answer key in the PDF?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, include answers',
          cancelButtonText: 'No, hide answers'
        });
        
        includeAnswers = result.isConfirmed;
      }
      
      // Temporarily hide answers if needed
      const originalAnswersState = showAnswers.value;
      if (!includeAnswers) {
        showAnswers.value = false;
        // Wait for DOM update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const filename = `${exam.value?.examTitle || 'Exam'}_${includeAnswers ? 'with_answers' : 'student_copy'}.pdf`;
      
      const opt = {
        margin: [10, 10, 10, 10], // [top, right, bottom, left] margins in mm - reduced margins
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2 * zoomLevel.value, // Scale based on current zoom level
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 1024
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: '.question-item'  // This is the key setting to prevent questions from being split
        }
      };
      
      try {
        await html2pdf().from(element).set(opt).save();
        
        // Show success message
        Swal.fire({
          title: 'Success',
          text: 'PDF downloaded successfully!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to generate PDF. Please try again.',
          icon: 'error'
        });
      } finally {
        // Restore original answers state
        if (originalAnswersState !== showAnswers.value) {
          showAnswers.value = originalAnswersState;
        }
        // Reset zoom level for PDF generation
        document.documentElement.style.removeProperty('--print-zoom-factor');
      }
    };

    onMounted(() => {
      loadExam();
      
      // Load Material Icons if not already loaded
      if (!document.getElementById('material-icons')) {
        const link = document.createElement('link');
        link.id = 'material-icons';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    });

    return {
      exam,
      loading,
      error,
      printArea,
      showAnswers,
      zoomLevel,
      formatQuestionType,
      parseOptions,
      formatAnswer,
      getImageUrl,
      handlePrint,
      downloadPDF,
      getOptionLetter,
      getTotalQuestions,
      calculateExamTime,
      getCurrentQuarter,
      zoomIn,
      zoomOut,
      resetZoom
    };
  }
};
</script>

<style scoped>
.exam-paper-preview {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
 
}

.printable-area {
  background: white;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* Dynamic text scaling based on zoom level - QUESTIONS ONLY */
.printable-area .question-text {
  font-size: calc(12px * var(--zoom-factor, 1)) !important;
}

.printable-area .question-number {
  font-size: calc(12px * var(--zoom-factor, 1)) !important;
}

.printable-area .question-type {
  font-size: calc(10px * var(--zoom-factor, 1)) !important;
}

.printable-area .option-text {
  font-size: calc(11px * var(--zoom-factor, 1)) !important;
}

.printable-area .circle {
  width: calc(18px * var(--zoom-factor, 1)) !important;
  height: calc(18px * var(--zoom-factor, 1)) !important;
  font-size: calc(10px * var(--zoom-factor, 1)) !important;
}

.printable-area .answer-lines .line {
  height: calc(1px * var(--zoom-factor, 1)) !important;
  margin-bottom: calc(12px * var(--zoom-factor, 1)) !important;
}

.printable-area .option-item {
  margin-bottom: calc(6px * var(--zoom-factor, 1)) !important;
}

.printable-area .question-item {
  margin-bottom: calc(10px * var(--zoom-factor, 1)) !important;
}

.printable-area .question-header {
  margin-bottom: calc(8px * var(--zoom-factor, 1)) !important;
}

.printable-area .options-list {
  margin-top: calc(6px * var(--zoom-factor, 1)) !important;
  padding-left: calc(25px * var(--zoom-factor, 1)) !important;
}

.printable-area .text-answer {
  padding-left: calc(25px * var(--zoom-factor, 1)) !important;
  margin-top: calc(6px * var(--zoom-factor, 1)) !important;
}

/* Question image scaling - maintain aspect ratio */
.printable-area .question-image {
  max-width: calc(80% * var(--zoom-factor, 1)) !important;
  max-height: calc(200px * var(--zoom-factor, 1)) !important;
  width: auto !important;
  height: auto !important;
}

/* Print Controls */
.print-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  align-items: center;
}

/* Zoom Controls */
.zoom-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.zoom-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.zoom-label {
  font-size: 14px;
}

.zoom-percentage {
  font-size: 14px;
  font-weight: bold;
  color: #007bff;
  min-width: 40px;
  text-align: center;
}

.zoom-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.zoom-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #495057;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 18px;
}

.zoom-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.zoom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-btn.reset {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.zoom-btn.reset:hover:not(:disabled) {
  background: #5a6268;
  border-color: #545b62;
}

.export-controls {
  display: flex;
  gap: 1rem;
}

.back-btn, .print-btn, .download-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.back-btn {
  background: #f5f5f5;
  color: #333;
}

.back-btn:hover {
  background: #e0e0e0;
}

.print-btn {
  background: #4CAF50;
  color: white;
}

.print-btn:hover {
  background: #3d8b40;
}

.download-btn {
  background: #2196F3;
  color: white;
}

.download-btn:hover {
  background: #1976D2;
}

/* Toggle Switch */
.toggle-answers {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
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

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.toggle-label {
  font-weight: 500;
}

/* School Header */
.school-header {
  margin-bottom: 8px;
  break-after: avoid !important;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.logo-container {
  width: 50px;
  height: 50px;
  margin-right: 10px;
}

.school-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.school-info {
  text-align: center;
}

.republic, .department, .region, .division {
  font-size: 8px;
  margin-bottom: 0px;
  line-height: 1.1;
}

.school-name {
  font-size: 14px;
  font-weight: bold;
  margin: 2px 0;
  letter-spacing: 0.3px;
}

.address {
  font-size: 8px;
  font-style: italic;
}

.line-break {
  height: 1px;
  background: #000;
  margin: 4px 0;
}

/* Exam Title Section */
.exam-title-section {
  text-align: center;
  margin-bottom: 8px;
  break-after: avoid !important;
}

.exam-title-section h1 {
  font-size: 16px;
  margin: 0;
  text-transform: uppercase;
  font-weight: bold;
}

.exam-subtitle {
  font-size: 12px;
  margin-top: 2px;
}

/* Student Info Section */
.student-info-section {
  margin-bottom: 8px;
  border: 1px solid #000;
  padding: 6px;
  break-after: avoid !important;
}

.student-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 4px;
}

.info-group {
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: bold;
  min-width: 60px;
  font-size: 10px;
}

.info-value {
  flex: 1;
  border-bottom: 1px solid #000;
  height: 16px;
}

.exam-details {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-label {
  font-weight: bold;
}

/* Instructions Section */
.instructions-section {
  margin-bottom: 30px;
  border: 1px solid #000;
  padding: 15px;
}

.instructions-header {
  font-weight: bold;
  font-size: 16px;
  text-align: center;
  margin-bottom: 10px;
  text-decoration: underline;
}

.instructions-list {
  margin-left: 20px;
  padding-left: 0;
}

.instructions-list li {
  margin-bottom: 5px;
}

/* Questions Section */
.questions-section {
  margin-bottom: 20px;
  margin-top: 5px;
  position: relative;
  column-count: 2;
  column-gap: 15px;
  column-fill: balance;
}

.question-item {
  margin-bottom: 10px;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  position: relative;
  display: inline-block;
  width: 100%;
}

.question-header {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-bottom: 8px;
  break-after: avoid !important;
}

.question-number {
  font-weight: bold;
  min-width: 20px;
  font-size: 12px;
}

.question-text {
  flex: 1;
  font-size: 12px;
  line-height: 1.3;
}

.question-type {
  font-style: italic;
  font-size: 10px;
  color: #555;
  font-weight: normal;
}

/* Question Image */
.question-image-container {
  text-align: center;
  margin: 8px 0;
}

.question-image {
  max-width: 80%;
  max-height: 200px;
  border: 1px solid #ddd;
}

/* Options */
.options-list {
  padding-left: 25px;
  margin-top: 6px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
}

.circle {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 18px;
  height: 18px;
  border: 1px solid #000;
  border-radius: 50%;
  font-size: 10px;
  font-weight: bold;
}

.option-text {
  flex: 1;
  padding-top: 2px;
  font-size: 11px;
  line-height: 1.2;
}

/* Text Answer */
.text-answer {
  padding-left: 25px;
  margin-top: 6px;
}

.answer-lines {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.line {
  height: 1px;
  background: #000;
  width: 100%;
}

/* Correct Answer (Teacher version) */
.correct-answer {
  margin-top: 6px;
  padding: 6px;
  background-color: #e8f5e9;
  border-left: 3px solid #4CAF50;
  font-size: 10px;
}

.answer-label {
  font-weight: bold;
  margin-right: 8px;
}

/* Footer */
.exam-footer {
  margin-top: 25px;
  text-align: center;
}

.prepared-by {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.teacher-section, .approved-section {
  width: 45%;
}

.footer-label {
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 11px;
}

.footer-line {
  margin-bottom: 3px;
}

.footer-name {
  font-weight: bold;
  font-size: 11px;
}

.footer-position {
  font-style: italic;
  font-size: 10px;
}

.watermark {
  font-size: 10px;
  color: #777;
  font-style: italic;
  margin-bottom: 3px;
}

.end-note {
  font-weight: bold;
  margin-top: 15px;
  font-size: 12px;
}

/* Print Styles */
@media print {
  @page {
    margin: 1cm;
    size: A4;
  }

  .no-print, .print-hide {
    display: none !important;
  }

  /* Apply zoom level to print */
  .printable-area {
    --zoom-factor: var(--print-zoom-factor, 1) !important;
  }

  .exam-paper-preview {
    padding: 0;
    margin: 0;
    max-width: none;
    background: white;
  }

  .printable-area {
    padding: 0;
    box-shadow: none;
  }

  .question-item {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  /* Ensure good contrast for printing */
  * {
    color: black !important;
    border-color: black !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .circle {
    border: 1px solid #000 !important;
  }

  .line {
    background: #000 !important;
    height: 1px !important;
  }

  /* Smaller font sizes for print */
  body {
    font-size: 8pt;
  }

  .school-name {
    font-size: 12pt !important;
  }

  .exam-title-section h1 {
    font-size: 14pt !important;
  }

  .exam-subtitle {
    font-size: 10pt !important;
  }

  .question-text {
    font-size: 8pt !important;
    line-height: 1.1 !important;
  }

  .option-text {
    font-size: 7pt !important;
    line-height: 1.0 !important;
  }

  .question-number {
    font-size: 8pt !important;
  }

  .question-type {
    font-size: 6pt !important;
  }

  .info-label {
    font-size: 8pt !important;
  }

  .exam-details {
    font-size: 8pt !important;
  }

  .page-break {
    display: block;
    page-break-before: always;
  }
  
  /* Add header page break control */
  .school-header, .exam-title-section, .student-info-section {
    break-after: avoid !important;
  }
  
  /* Ensure footer stays at bottom */
  .exam-footer {
    margin-top: 20px;
  }

  /* Optimize spacing for print */
  .school-header {
    margin-bottom: 5px !important;
  }

  .exam-title-section {
    margin-bottom: 5px !important;
  }

  .student-info-section {
    margin-bottom: 5px !important;
    padding: 4px !important;
  }

  .question-item {
    margin-bottom: 6px !important;
  }

  .questions-section {
    column-gap: 12px !important;
    margin-top: 2px !important;
  }

  .header-content {
    margin-bottom: 2px !important;
  }

  .line-break {
    margin: 2px 0 !important;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .exam-paper-preview {
    padding: 0px;
    margin: 0;
  }
  .logo-container {
    width: 60px;
    height: 60px;
    margin-right: 0;
  }
  .school-info {
    width: 100%;
  }
  .school-name {
    font-size: 16px;
  }
  .info-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  .print-controls {
    margin-bottom: 1rem;
    width: 100%;
    display: flex;
    gap: 8px;
  }

  .zoom-controls {
    flex-direction: column;
    gap: 0.5rem;
    padding: 8px;
  }

  .zoom-info {
    font-size: 12px;
  }

  .zoom-buttons {
    gap: 0.25rem;
  }

  .zoom-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .export-controls {
    display: flex;
    gap: 8px;
    width: auto;
    flex-direction: row;
  }

  .back-btn, 
  .print-btn, 
  .download-btn {
    width: 50.33%;
    padding: 10px 8px;
    font-size: 0.9rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
    white-space: nowrap;
  }

  .back-btn span, 
  .print-btn span, 
  .download-btn span {
    font-size: 1.1rem;
  }

  .prepared-by {
    flex-direction: column;
    gap: 30px;
    align-items: center;
  }

  .teacher-section, .approved-section {
    width: 100%;
  }

  .student-info-grid {
    grid-template-columns: 1fr;
  }

  .exam-details {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 