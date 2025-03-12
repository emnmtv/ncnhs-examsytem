import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../components/LoginPage.vue";
import Dashboard from "../components/student/Dashboard.vue"; // New Dashboard Page
import Settings from "../components/Settings.vue";
import AdminDashboard from "../components/admin/AdminDashboard.vue";
import TeacherDashboard from "../components/teacher/TeacherDashboard.vue";
import TeacherProfile from "../components/teacher/TeacherProfile.vue";
import StudentProfile from "../components/student/StudentProfile.vue";
import CreateExam from "../components/teacher/CreateExam.vue";
import TakeExam from "../components/student/TakeExam.vue";
import UsersList from "../components/admin/UsersList.vue";
import StudentScores from "../components/admin/StudentScores.vue";
import ManageExam from "../components/teacher/ManageExam.vue";
import ManageUsers from "../components/admin/ManageUsers.vue";
import ManageExams from "../components/teacher/ManageExams.vue";
import PreviewExam from "../components/teacher/PreviewExam.vue";
import ExamResults from "../components/teacher/ExamResults.vue";
import CreateSurvey from "../components/survey/CreateSurvey.vue";
import AnswerSurvey from "../components/survey/AnswerSurvey.vue";
import SurveyList from '@/components/survey/SurveyList.vue'
import SurveyResults from '@/components/survey/SurveyResults.vue'
import SurveyPreview from '@/components/survey/SurveyPreview.vue'

const routes = [
  { path: "/", component: LoginPage },
  { path: "/dashboard", component: Dashboard },  
  { path: "/settings", component: Settings },
  { path: '/admin-dashboard', component: AdminDashboard },
  { path: '/teacher-dashboard', component: TeacherDashboard },
  { path: '/teacher-profile', component: TeacherProfile},
  { path: '/student-profile', component: StudentProfile},
  { path: '/create-exam', component: CreateExam},
  { path: '/take-exam', component: TakeExam},
  { path: '/users-list', component: UsersList},
  { path: '/scores', component: StudentScores},
  { path: '/manage-exam', component: ManageExam},
  {path:'/manage-users', component: ManageUsers},
  { path: '/manage-exams', component: ManageExams },
  { path: '/preview-exam/:examId', component: PreviewExam },
  { path: '/exam-results/:examId', component: ExamResults },
  { path: '/create-survey', component: CreateSurvey },
  { path: '/answer-survey', component: AnswerSurvey },
  {
    path: '/my-surveys',
    name: 'MySurveys',
    component: SurveyList,
    meta: { requiresAuth: true }
  },
  {
    path: '/survey/:code/results',
    name: 'SurveyResults',
    component: SurveyResults,
    meta: { requiresAuth: true }
  },
  {
    path: '/survey/:code/preview',
    name: 'SurveyPreview',
    component: SurveyPreview,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
