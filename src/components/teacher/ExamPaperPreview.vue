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

    <!-- Printable Content -->
    <div class="printable-area" ref="printArea">
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
import { fetchTeacherExams, getFullImageUrl } from '../../services/authService';
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

    const loadExam = async () => {
      try {
        loading.value = true;
        error.value = null;
        const exams = await fetchTeacherExams();
        exam.value = exams.find(e => e.id === parseInt(route.params.examId));
        
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
      if (month >= 0 && month <= 2) return "1st"; // Jan-Mar
      if (month >= 3 && month <= 5) return "2nd"; // Apr-Jun
      if (month >= 6 && month <= 8) return "3rd"; // Jul-Sep
      return "4th"; // Oct-Dec
    };

    const handlePrint = () => {
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
          } else {
            // If they chose to hide answers, temporarily hide them
            showAnswers.value = false;
            setTimeout(() => {
              window.print();
              // And restore their preference afterward
              showAnswers.value = true;
            }, 100);
          }
        });
      } else {
        window.print();
      }
    };

    const downloadPDF = async () => {
      const element = printArea.value;
      
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
        margin: [15, 15, 15, 15], // [top, right, bottom, left] margins in mm
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
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
      formatQuestionType,
      parseOptions,
      formatAnswer,
      getImageUrl,
      handlePrint,
      downloadPDF,
      getOptionLetter,
      getTotalQuestions,
      calculateExamTime,
      getCurrentQuarter
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
}

/* Print Controls */
.print-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  align-items: center;
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
  margin-bottom: 20px;
  break-after: avoid !important;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.logo-container {
  width: 80px;
  height: 80px;
  margin-right: 20px;
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
  font-size: 12px;
  margin-bottom: 2px;
}

.school-name {
  font-size: 18px;
  font-weight: bold;
  margin: 4px 0;
  letter-spacing: 1px;
}

.address {
  font-size: 12px;
  font-style: italic;
}

.line-break {
  height: 2px;
  background: #000;
  margin: 10px 0;
}

/* Exam Title Section */
.exam-title-section {
  text-align: center;
  margin-bottom: 20px;
  break-after: avoid !important;
}

.exam-title-section h1 {
  font-size: 22px;
  margin: 0;
  text-transform: uppercase;
  font-weight: bold;
}

.exam-subtitle {
  font-size: 16px;
  margin-top: 4px;
}

/* Student Info Section */
.student-info-section {
  margin-bottom: 30px;
  border: 1px solid #000;
  padding: 15px;
  break-after: avoid !important;
}

.student-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.info-group {
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: bold;
  min-width: 100px;
}

.info-value {
  flex: 1;
  border-bottom: 1px solid #000;
}

.exam-details {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
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
  margin-bottom: 30px;
  position: relative;
}

.question-item {
  margin-bottom: 25px;
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  position: relative;
}

.question-header {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 10px;
  break-after: avoid !important;
}

.question-number {
  font-weight: bold;
  min-width: 25px;
}

.question-text {
  flex: 1;
}

.question-type {
  font-style: italic;
  font-size: 0.9em;
  color: #555;
  font-weight: normal;
}

/* Question Image */
.question-image-container {
  text-align: center;
  margin: 15px 0;
}

.question-image {
  max-width: 80%;
  max-height: 250px;
  border: 1px solid #ddd;
}

/* Options */
.options-list {
  padding-left: 35px;
  margin-top: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 10px;
}

.circle {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 24px;
  height: 24px;
  border: 1px solid #000;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.option-text {
  flex: 1;
  padding-top: 3px;
}

/* Text Answer */
.text-answer {
  padding-left: 35px;
  margin-top: 10px;
}

.answer-lines {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.line {
  height: 1px;
  background: #000;
  width: 100%;
}

/* Correct Answer (Teacher version) */
.correct-answer {
  margin-top: 10px;
  padding: 10px;
  background-color: #e8f5e9;
  border-left: 4px solid #4CAF50;
}

.answer-label {
  font-weight: bold;
  margin-right: 10px;
}

/* Footer */
.exam-footer {
  margin-top: 40px;
  text-align: center;
}

.prepared-by {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.teacher-section, .approved-section {
  width: 45%;
}

.footer-label {
  font-weight: bold;
  margin-bottom: 25px;
}

.footer-line {
  margin-bottom: 5px;
}

.footer-name {
  font-weight: bold;
}

.footer-position {
  font-style: italic;
  font-size: 12px;
}

.watermark {
  font-size: 12px;
  color: #777;
  font-style: italic;
  margin-bottom: 5px;
}

.end-note {
  font-weight: bold;
  margin-top: 20px;
  font-size: 14px;
}

/* Print Styles */
@media print {
  @page {
    margin: 1.5cm;
    size: A4;
  }

  .no-print, .print-hide {
    display: none !important;
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

  /* Keep consistent font size */
  body {
    font-size: 11pt;
  }

  .question-text {
    font-size: 11pt;
  }

  .option-text {
    font-size: 11pt;
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
    margin-top: 40px;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .print-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .export-controls {
    width: 100%;
    flex-direction: column;
  }

  .back-btn, 
  .print-btn, 
  .download-btn {
    width: 100%;
    justify-content: center;
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