<template>
  <div class="survey-preview-container">
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
          Print Survey
        </button>
      </div>
    </div>

    <!-- Printable Content -->
    <div class="printable-area" ref="printArea">
      <!-- Header -->
      <div class="survey-header">
        <h1>{{ survey?.title }}</h1>
        <p v-if="survey?.description" class="description">{{ survey?.description }}</p>
        
        <!-- Survey Info -->
        <div class="survey-info">
          <div class="info-row">
            <span class="label">Date:</span>
            <span class="value">_____________________</span>
          </div>
          <div class="info-row">
            <span class="label">Name:</span>
            <span class="value">_____________________</span>
          </div>
        </div>
      </div>

      <!-- Questions -->
      <div class="questions-section">
        <div 
          v-for="(question, index) in survey?.questions" 
          :key="question.id" 
          class="question-item"
        >
          <div class="question-header">
            <span class="question-number">{{ index + 1 }}.</span>
            <span class="question-text">{{ question.questionText }}</span>
            <span v-if="question.required" class="required-marker">*</span>
          </div>

          <!-- Multiple Choice -->
          <div 
            v-if="question.questionType === 'multiple_choice'"
            class="options-list"
          >
            <div 
              v-for="(option, optIndex) in getOptions(question.options)"
              :key="optIndex"
              class="option-item"
            >
              <div class="circle"></div>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>

          <!-- Checkbox -->
          <div 
            v-else-if="question.questionType === 'checkbox'"
            class="options-list"
          >
            <div 
              v-for="(option, optIndex) in getOptions(question.options)"
              :key="optIndex"
              class="option-item"
            >
              <div class="checkbox"></div>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>

          <!-- Text Answer -->
          <div 
            v-else-if="question.questionType === 'text'"
            class="text-answer"
          >
            <div class="answer-lines">
              <div class="line" v-for="n in 3" :key="n"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="survey-footer">
        <p>Thank you for your response!</p>
        <div class="survey-code">Survey Code: {{ survey?.code }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchSurvey } from '@/services/authService';
import html2pdf from 'html2pdf.js';
import Swal from 'sweetalert2';

export default {
  name: 'SurveyPreview',

  setup() {
    const route = useRoute();
    const survey = ref(null);
    const printArea = ref(null);

    const loadSurvey = async () => {
      try {
        const response = await fetchSurvey(route.params.code);
        survey.value = response.survey;
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to load survey',
          icon: 'error'
        });
      }
    };

    const getOptions = (options) => {
      if (!options) return [];
      if (Array.isArray(options)) return options;
      try {
        return JSON.parse(options);
      } catch (error) {
        console.error('Error parsing options:', error);
        return [];
      }
    };

    const handlePrint = () => {
      window.print();
    };

    const downloadPDF = async () => {
      const element = printArea.value;
      const opt = {
        margin: 20,
        filename: `${survey.value?.title || 'survey'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      try {
        await html2pdf().set(opt).from(element).save();
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to generate PDF. Please try again.',
          icon: 'error'
        });
      }
    };

    onMounted(loadSurvey);

    return {
      survey,
      getOptions,
      handlePrint,
      downloadPDF,
      printArea
    };
  }
};
</script>

<style scoped>
/* General Styles */
.survey-preview-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: white;
}

/* Print Controls */
.print-controls {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  align-items: center;
}

.export-controls {
  display: flex;
  gap: 1rem;
}

.back-btn, .print-btn, .download-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.back-btn {
  background: #f5f5f5;
}

.print-btn {
  background: #4CAF50;
  color: white;
}

.download-btn {
  background: #2196F3;
  color: white;
}

.download-btn:hover {
  background: #1976D2;
}

/* Survey Header */
.survey-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #333;
}

.survey-header h1 {
  font-size: 24px;
  margin-bottom: 0.5rem;
}

.description {
  color: #666;
  margin-bottom: 1.5rem;
}

.survey-info {
  width: 100%;
  max-width: 400px;
  margin: 1.5rem auto;
}

.info-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.label {
  min-width: 80px;
  font-weight: 500;
}

.value {
  flex: 1;
  border-bottom: 1px solid #999;
}

/* Questions Section */
.questions-section {
  margin-bottom: 2rem;
}

.question-item {
  margin-bottom: 2rem;
}

.question-header {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.question-number {
  font-weight: 500;
}

.required-marker {
  color: #f44336;
}

/* Options */
.options-list {
  padding-left: 2rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.circle {
  width: 20px;
  height: 20px;
  border: 2px solid #666;
  border-radius: 50%;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #666;
}

/* Text Answer */
.text-answer {
  padding-left: 2rem;
}

.answer-lines {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.line {
  height: 1px;
  background: #999;
  width: 100%;
}

/* Footer */
.survey-footer {
  margin-top: 3rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

.survey-code {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

/* Print Styles */
@media print {
  /* Reset page margins */
  @page {
    margin: 2cm;
  }

  .no-print {
    display: none !important;
  }

  .survey-preview-container {
    padding: 0;
    margin: 0;
    max-width: none;
  }

  .survey-header {
    margin-bottom: 1.5rem;
    border-bottom-color: #000 !important;
  }

  .question-item {
    page-break-inside: avoid;
    margin-bottom: 1.5rem;
  }

  /* Ensure good contrast for printing */
  * {
    color: black !important;
    border-color: #333 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .circle, .checkbox {
    border: 2px solid #000 !important;
  }

  .line {
    background: #000 !important;
  }

  /* Improve text readability */
  .question-text {
    font-size: 14pt !important;
  }

  .option-text {
    font-size: 12pt !important;
  }

  /* Ensure footer stays at bottom */
  .survey-footer {
    margin-top: 2rem;
    border-top-color: #000 !important;
  }
}

@media (max-width: 768px) {
  .print-controls {
    flex-direction: column;
    gap: 1rem;
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
}
</style> 