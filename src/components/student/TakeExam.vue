<template>
  <div class="take-exam">
    <h1>Take Exam</h1>
    <input v-model="testCode" placeholder="Enter Test Code" />
    <button @click="fetchExamQuestions">Fetch Exam Questions</button>
    <button @click="quitExam">Quit Exam</button>

    <div v-if="exam">
      <h2>{{ exam.examTitle }}</h2>
      <div v-for="(question, index) in exam.questions" :key="question.questionId">
        <p>{{ index + 1 }}. {{ question.questionText }}</p>
        <div v-if="question.options">
          <div v-for="(option, i) in question.options" :key="i">
            <input type="radio" :value="option" v-model="answers[question.questionId]" />
            {{ option }}
          </div>
        </div>
        <input v-else type="text" v-model="answers[question.questionId]" placeholder="Your answer" />
      </div>
      <button @click="submitAnswers">Submit Answers</button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <h3>Students Joined:</h3>
    <ul>
      <li v-for="student in students" :key="student.userId">{{ student.userName }}</li>
    </ul>
  </div>
</template>

<script>
import { fetchExamQuestions, submitExamAnswers } from '@/services/authService';
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      testCode: '',
      exam: null,
      answers: {},
      error: null,
      students: [], // Array to hold the list of students
      socket: null, // Socket instance
    };
  },
  mounted() {
    // Connect to the WebSocket server
    this.socket = io('http://localhost:3300'); // Ensure this matches your server URL
    console.log('Connected to WebSocket server');

    // Listen for studentJoined event
    this.socket.on('studentJoined', (students) => {
      console.log('Students joined:', students); // Log the students who joined
      this.students = students; // Update the students list
    });

    // Listen for studentLeft event
    this.socket.on('studentLeft', (students) => {
      console.log('Students left:', students); // Log the students who left
      this.students = students; // Update the students list
    });

    // Retrieve saved state from local storage
    const savedTestCode = localStorage.getItem("testCode");
    const savedExam = localStorage.getItem("exam");

    if (savedTestCode) {
      this.testCode = savedTestCode;
      // Rejoin the exam room with userId
      const userId = localStorage.getItem("userId"); // Assuming you store userId in local storage
      this.socket.emit('joinExam', { testCode: this.testCode, userId }); // Emit the join event with userId
    }

    if (savedExam) {
      this.exam = JSON.parse(savedExam);
    }
  },
  methods: {
    async fetchExamQuestions() {
      try {
        this.error = null;
        const response = await fetchExamQuestions(this.testCode);
        this.exam = response.exam;

        // Save the exam and test code to local storage
        localStorage.setItem("testCode", this.testCode);
        localStorage.setItem("exam", JSON.stringify(this.exam));

        // Join the exam room with userId
        const userId = localStorage.getItem("userId"); // Assuming you store userId in local storage
        this.socket.emit('joinExam', { testCode: this.testCode, userId }); // Emit the join event with userId
      } catch (err) {
        this.error = err.message;
      }
    },
    quitExam() {
      // Optionally notify the server
      if (this.socket) {
        this.socket.emit('quitExam', { testCode: this.testCode });
        console.log('User has quit the exam');
      }

      // Clear local storage or any relevant state
      localStorage.removeItem("testCode");
      localStorage.removeItem("exam");
      this.exam = null; // Clear the exam state
      this.students = []; // Clear the students list
    },
    async submitAnswers() {
      try {
        this.error = null;
        const answerData = {
          testCode: this.testCode,
          answers: Object.keys(this.answers).map(questionId => ({
            questionId: parseInt(questionId),
            userAnswer: this.answers[questionId],
          })),
        };
        await submitExamAnswers(answerData);
        alert('Answers submitted successfully!');
      } catch (err) {
        this.error = err.message;
      }
    },
  },
  beforeUnmount() {
    // Disconnect the socket when the component is destroyed
    if (this.socket) {
      this.socket.disconnect();
    }
  },
};
</script>

<style scoped>
.take-exam {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.error {
  color: red;
}
</style> 