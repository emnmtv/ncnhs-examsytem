<template>
  <div class="preview-exam">
    <div class="preview-header">
      <div class="header-content">
        <h1>{{ exam?.examTitle }}</h1>
        <div class="exam-meta">
          <span class="test-code">
            <i class="fas fa-code"></i> Test Code: {{ exam?.testCode }}
          </span>
          <span class="class-code">
            <i class="fas fa-chalkboard"></i> Class: {{ exam?.classCode }}
          </span>
        </div>
      </div>
      <button @click="$router.back()" class="back-btn">
        <i class="fas fa-arrow-left"></i> Back
      </button>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading exam...</p>
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="loadExam" class="retry-btn">
        <i class="fas fa-redo"></i> Retry
      </button>
    </div>

    <div v-else class="exam-content">
      <div class="questions-list">
        <div v-for="(question, index) in exam?.questions" :key="index" class="question-card">
          <div class="question-header">
            <span class="question-number">Question {{ index + 1 }}</span>
            <span class="question-type">{{ formatQuestionType(question.questionType) }}</span>
          </div>
          
          <div class="question-text">
            {{ question.questionText }}
          </div>

          <div class="question-options" v-if="question.questionType === 'multiple_choice'">
            <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option">
              <input 
                type="radio" 
                :id="`q${index}-opt${optIndex}`" 
                :name="`question-${index}`" 
                :value="option"
                disabled
                :checked="option === question.correctAnswer"
              >
              <label :for="`q${index}-opt${optIndex}`">{{ option }}</label>
            </div>
          </div>

          <div class="question-options" v-else-if="question.questionType === 'true_false'">
            <div class="option">
              <input 
                type="radio" 
                :id="`q${index}-true`" 
                :name="`question-${index}`" 
                value="true"
                :checked="question.correctAnswer.toLowerCase() === 'true'"
                disabled
              >
              <label :for="`q${index}-true`">True</label>
            </div>
            <div class="option">
              <input 
                type="radio" 
                :id="`q${index}-false`" 
                :name="`question-${index}`" 
                value="false"
                :checked="question.correctAnswer.toLowerCase() === 'false'"
                disabled
              >
              <label :for="`q${index}-false`">False</label>
            </div>
          </div>

          <div class="answer-section">
            <div class="correct-answer">
              <span class="label">Correct Answer:</span>
              <span class="value">{{ formatAnswer(question) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchTeacherExams } from '../../services/authService';

export default {
  name: 'PreviewExam',
  
  setup() {
    const route = useRoute();
    const exam = ref(null);
    const loading = ref(true);
    const error = ref(null);

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
      } finally {
        loading.value = false;
      }
    };

    const formatQuestionType = (type) => {
      const types = {
        multiple_choice: 'Multiple Choice',
        true_false: 'True/False',
        enumeration: 'Short Answer'
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

    onMounted(loadExam);

    return {
      exam,
      loading,
      error,
      loadExam,
      formatQuestionType,
      parseOptions,
      formatAnswer
    };
  }
};
</script>

<style scoped>
.preview-exam {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.exam-meta {
  display: flex;
  gap: 20px;
  color: #666;
}

.exam-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.back-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background: #e0e0e0;
}

.question-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-number {
  font-weight: bold;
  color: #333;
}

.question-type {
  background: #e3f2fd;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.9em;
  color: #1976d2;
}

.question-text {
  font-size: 1.1em;
  margin-bottom: 20px;
  color: #333;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.answer-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.correct-answer {
  display: flex;
  gap: 10px;
  align-items: center;
}

.correct-answer .label {
  font-weight: bold;
  color: #4caf50;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.loading i, .error i {
  font-size: 2em;
  margin-bottom: 15px;
  color: #666;
}

.retry-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 15px auto 0;
}

.retry-btn:hover {
  background: #1976d2;
}
</style> 