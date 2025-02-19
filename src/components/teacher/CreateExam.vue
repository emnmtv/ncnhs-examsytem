<template>
  <div class="create-exam">
    <h1>Create Exam</h1>
    <form @submit.prevent="submitExam">
      <div class="form-group">
        <label for="testCode">Test Code:</label>
        <input v-model="examData.testCode" type="text" id="testCode" required />
      </div>
      <div class="form-group">
        <label for="classCode">Class Code:</label>
        <input v-model="examData.classCode" type="text" id="classCode" required />
      </div>
      <div class="form-group">
        <label for="examTitle">Exam Title:</label>
        <input v-model="examData.title" type="text" id="examTitle" required />
      </div>

      <div class="questions-container">
        <h2>Questions</h2>
        <div v-for="(question, index) in questions" :key="index" class="question-card">
          <div class="form-group">
            <label>Question {{ index + 1 }}:</label>
            <input v-model="question.text" type="text" placeholder="Enter question" required />
          </div>
          <div class="form-group">
            <label>Type:</label>
            <select v-model="question.type" @change="resetOptions(question)">
              <option value="multipleChoice">Multiple Choice</option>
              <option value="trueFalse">True/False</option>
              <option value="enumeration">Enumeration</option>
            </select>
          </div>
          <div v-if="question.type === 'multipleChoice'" class="options-container">
            <h3>Options</h3>
            <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option-group">
              <input type="radio" :value="option.text" v-model="question.correctAnswer" />
              <input v-model="option.text" type="text" placeholder="Option" required />
              <button type="button" @click="removeOption(question, optIndex)">Remove</button>
              <button type="button" @click="setCorrectAnswer(question, option.text)">Set Correct Answer</button>
            </div>
            <button type="button" @click="addOption(question)">Add Option</button>
          </div>
          <div v-if="question.type === 'enumeration'" class="enumeration-container">
            <h3>Correct Answer:</h3>
            <input v-model="question.correctAnswer" type="text" placeholder="Enter correct answer" required />
          </div>
          <button type="button" @click="removeQuestion(index)">Remove Question</button>
        </div>
        <button type="button" @click="addQuestion">Add Question</button>
      </div>

      <div class="form-actions">
        <button type="submit" class="publish-button">Publish</button>
        <button type="button" @click="exportExam" class="export-button">Export</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createExam } from '../../services/authService';

const examData = ref({
  testCode: '',
  classCode: '',
  title: ''
});

const questions = ref([]);

const addQuestion = () => {
  questions.value.push({
    text: '',
    type: 'multipleChoice',
    options: [{ text: '' }],
    correctAnswer: ''
  });
};

const removeQuestion = (index) => {
  questions.value.splice(index, 1);
};

const addOption = (question) => {
  question.options.push({ text: '' });
};

const removeOption = (question, index) => {
  question.options.splice(index, 1);
};

const setCorrectAnswer = (question, answer) => {
  question.correctAnswer = answer; // Set the correct answer
};

const resetOptions = (question) => {
  if (question.type !== 'multipleChoice') {
    question.options = []; // Clear options if not multiple choice
  }
};

const submitExam = async () => {
  try {
    const examPayload = {
      ...examData.value,
      questions: questions.value.map(q => ({
        questionText: q.text,
        questionType: q.type,
        options: q.questionType === 'enumeration' ? [] : (q.options.map(o => o.text) || []),
        correctAnswer: q.correctAnswer
      }))
    };
    await createExam(examPayload);
    alert('Exam created successfully!');
    // Reset form
    examData.value = { testCode: '', classCode: '', title: '' };
    questions.value = [];
  } catch (error) {
    console.error('Error creating exam:', error);
    alert('Failed to create exam.');
  }
};

const exportExam = () => {
  // Implement export functionality here
  alert('Export functionality not implemented yet.');
};
</script>

<style scoped>
.create-exam {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="text"],
input[type="email"],
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.questions-container {
  margin-top: 20px;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  background-color: #fff;
}

.question-card {
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f7f7f7;
}

.option-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.option-group input[type="text"] {
  margin-left: 10px;
  flex: 1;
}

.enumeration-container {
  margin-top: 10px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.publish-button,
.export-button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.publish-button:hover,
.export-button:hover {
  background-color: #45a049;
}
</style>