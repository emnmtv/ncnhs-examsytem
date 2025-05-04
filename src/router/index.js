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
import StudentExams from '@/components/student/StudentExams.vue'
import ActiveUsersMonitor from '@/components/admin/ActiveUsersMonitor.vue'
import ExamHistory from '@/components/student/ExamHistory.vue'
import ExamHistoryDetail from '@/components/student/ExamHistoryDetail.vue'
import AdminProfile from '@/components/admin/AdminProfile.vue'
import ManageSubjects from '@/components/admin/ManageSubjects.vue'
import TeacherSubjects from '@/components/teacher/TeacherSubjects.vue'
import StudentSubjects from '@/components/student/StudentSubjects.vue'
import CreateTask from '@/components/teacher/CreateTask.vue'
import SubjectTasks from '@/components/teacher/SubjectTasks.vue'
import TaskSubmission from "@/components/teacher/TaskSubmission.vue";
import GameCanvas from '@/components/game/GameCanvas.vue';
import StudentTasks from '@/components/student/StudentTasks.vue';
import TaskDetails from '@/components/student/TaskDetails.vue';
import QuestionBank from '@/components/teacher/QuestionBank.vue';
import AdminComponentController from "@/components/admin/AdminComponentController.vue";
const routes = [
  { 
    path: "/", 
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  { 
    path: "/dashboard", 
    component: Dashboard,
    meta: { requiresAuth: true, roles: ['student'] }
  },  
  { 
    path: "/settings", 
    component: Settings,
    meta: { requiresAuth: true }
  },
  { 
    path: '/admin-dashboard', 
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  { 
    path: '/teacher-dashboard', 
    component: TeacherDashboard,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  { 
    path: '/teacher-profile', 
    component: TeacherProfile,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  { 
    path: '/student-profile', 
    component: StudentProfile,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  { 
    path: '/create-exam', 
    component: CreateExam,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  { 
    path: '/take-exam', 
    component: TakeExam,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  { 
    path: '/users-list', 
    component: UsersList,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  { 
    path: '/scores', 
    component: StudentScores,
    meta: { requiresAuth: true, roles: ['admin', 'teacher'] }
  },
  { 
    path: '/manage-exam', 
    component: ManageExam,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/manage-users', 
    component: ManageUsers,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  { 
    path: '/manage-exams', 
    component: ManageExams,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  { 
    path: '/preview-exam/:examId', 
    component: PreviewExam,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  { 
    path: '/exam-results/:examId', 
    component: ExamResults,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  { 
    path: '/create-survey', 
    component: CreateSurvey,
    meta: { requiresAuth: true, roles: ['teacher', 'admin'] }
  },
  { 
    path: '/answer-survey', 
    component: AnswerSurvey,
    meta: { requiresAuth: false } // Anyone can answer a survey with the code
  },
  {
    path: '/my-surveys',
    name: 'MySurveys',
    component: SurveyList,
    meta: { requiresAuth: true, roles: ['teacher', 'admin'] }
  },
  {
    path: '/survey/:code/results',
    name: 'SurveyResults',
    component: SurveyResults,
    meta: { requiresAuth: true, roles: ['teacher', 'admin'] }
  },
  {
    path: '/survey/:code/preview',
    name: 'SurveyPreview',
    component: SurveyPreview,
    meta: { requiresAuth: true, roles: ['teacher', 'admin'] }
  },
  {
    path: '/student-exams',
    name: 'StudentExams',
    component: StudentExams,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  {
    path: '/active-users',
    name: 'ActiveUsersMonitor',
    component: ActiveUsersMonitor,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/exam-history',
    name: 'ExamHistory',
    component: ExamHistory,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  {
    path: '/exam-history/:id',
    name: 'ExamHistoryDetail',
    component: ExamHistoryDetail,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  {
    path: '/exam-paper/:examId',
    name: 'ExamPaperPreview',
    component: () => import('@/components/teacher/ExamPaperPreview.vue'),
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/admin-profile',
    name: 'AdminProfile',
    component: AdminProfile,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/admin-exam-monitor',
    name: 'AdminExamMonitor',
    component: () => import('../components/admin/AdminExamMonitor.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['admin']
    }
  },
  {
    path: '/exam-mps/:examId',
    name: 'ExamMPS',
    component: () => import('@/components/teacher/ExamMPSView.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['teacher', 'admin']
    }
  },
  {
    path: '/manage-subjects',
    name: 'ManageSubjects',
    component: ManageSubjects,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/teacher-subjects',
    name: 'TeacherSubjects',
    component: TeacherSubjects,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/student-subjects',
    name: 'StudentSubjects',
    component: StudentSubjects,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  {
    path: '/create-task/:subjectId?',
    name: 'CreateTask',
    component: CreateTask,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/subject/:subjectId/tasks',
    name: 'SubjectTasks',
    component: SubjectTasks,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/subject/:subjectId/task/:taskId/submissions',
    name: 'TaskSubmission',
    component: TaskSubmission,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/game',
    name: 'Game',
    component: GameCanvas,
    meta: { requiresAuth: true } // Optional: require authentication to play
  },
  {
    path: '/student/tasks',
    name: 'StudentTasks',
    component: StudentTasks,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  {
    path: '/student/tasks/:taskId',
    name: 'TaskDetails',
    component: TaskDetails,
    meta: { requiresAuth: true, roles: ['student'] }
  },
  {
    path: '/exam/:examId/student/:studentId/answers',
    name: 'StudentAnswerDetails',
    component: () => import('@/components/teacher/StudentAnswerDetails.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/question-bank',
    name: 'QuestionBank',
    component: QuestionBank,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {path: '/admin-component-controller',
    name: 'AdminComponentController',
    component: AdminComponentController,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  
];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check authentication and roles
router.beforeEach((to, from, next) => {
  const jwtToken = localStorage.getItem('jwtToken');
  const userRole = localStorage.getItem('userRole');
  
  // If route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !jwtToken) {
    next('/'); // Redirect to login page
    return;
  }
  
  // If route has role restrictions and user's role doesn't match
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      next('/admin-dashboard');
    } else if (userRole === 'teacher') {
      next('/teacher-dashboard');
    } else if (userRole === 'student') {
      next('/dashboard');
    } else {
      next('/'); // Fallback to login if role is unknown
    }
    return;
  }
  
  // If trying to access login page while already logged in
  if (to.path === '/' && jwtToken) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') {
      next('/admin-dashboard');
    } else if (userRole === 'teacher') {
      next('/teacher-dashboard');
    } else if (userRole === 'student') {
      next('/dashboard');
    } else {
      next('/'); // Stay on login if role is unknown
    }
    return;
  }
  
  next(); // Continue to the route
});

export default router;
