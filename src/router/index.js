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
import TaskSubmissionDetails from "@/components/teacher/TaskSubmissionDetails.vue";
import GameCanvas from '@/components/game/GameCanvas.vue';
import StudentTasks from '@/components/student/StudentTasks.vue';
import TaskDetails from '@/components/student/TaskDetails.vue';
import QuestionBank from '@/components/teacher/QuestionBank.vue';
import AdminComponentController from "@/components/admin/AdminComponentController.vue";
import NotFound from "@/components/NotFound.vue";
import Forbidden from "@/components/Forbidden.vue";
import TeacherClassList from "@/components/teacher/TeacherClassList.vue";
import AttendanceScanner from "@/components/teacher/AttendanceScanner.vue";
import AttendanceRecords from "@/components/teacher/AttendanceRecords.vue";
import StudentRegistrationPage from "@/components/public/StudentRegistrationPage.vue";
import GradeSectionStudentList from "@/components/admin/Grade&SectionStudentList.vue";

const routes = [
  { 
    path: "/", 
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  { 
    path: "/register", 
    component: StudentRegistrationPage,
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
    path: '/top-performers',
    name: 'TopPerformers',
    component: () => import('@/components/teacher/TopPerformers.vue'),
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/students-needing-attention',
    name: 'StudentsNeedingAttention',
    component: () => import('@/components/teacher/StudentsNeedingAttention.vue'),
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/questions-needing-review',
    name: 'QuestionsNeedingReview',
    component: () => import('@/components/teacher/QuestionsNeedingReview.vue'),
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
    path: '/grade-section-students/:grade/:section',
    name: 'GradeSectionStudentList',
    component: GradeSectionStudentList,
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
    path: '/answer-survey/:code?', 
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
    path: '/subject/:subjectId/task/:taskId/submission-details',
    name: 'TaskSubmissionDetails',
    component: TaskSubmissionDetails,
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
    path: '/class-list',
    name: 'TeacherClassList',
    component: TeacherClassList,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/attendance-scanner/:sessionId',
    name: 'AttendanceScanner',
    component: AttendanceScanner,
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/attendance-records',
    name: 'AttendanceRecords',
    component: AttendanceRecords,
    meta: { requiresAuth: true, roles: ['teacher'] }
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
  {
    path: '/admin-component-controller',
    name: 'AdminComponentController',
    component: AdminComponentController,
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: Forbidden,
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { requiresAuth: false }
  },
  {
    path: '/exam/:examId/parts',
    name: 'ExamPartResults',
    component: () => import('@/components/teacher/ExamPartResults.vue'),
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path: '/admin/student-approval',
    name: 'StudentApproval',
    component: () => import('@/components/admin/StudentApprovalTab.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/student-classlist/:subjectId',
    name: 'StudentClasslist',
    component: () => import('@/components/student/StudentsClasslist.vue'),
    meta: { requiresAuth: true, roles: ['student'] }
  },
 
  {
    path: '/archived-exam-results',
    name: 'RestoreArchivedExamResults',
    component: () => import('@/components/teacher/archivedExamResults.vue'),
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  {
    path:'/student-dashboard',
    name: 'StudentDashboard',
    component: () => import('@/components/student/Dashboard.vue'),
    meta: { requiresAuth: true, roles: ['student'] }
  },
  {
    path: '/question-review/:questionId',
    name: 'QuestionReviewDetails',
    component: () => import('@/components/teacher/QuestionReviewDetails.vue'),
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
  
    {
    path: '/studentperformance/:studentId',
    name: 'StudentPerformance',
    component: () => import('@/components/teacher/StudentPerformance.vue'),
    meta: { requiresAuth: true, roles: ['teacher'] }
  },
 

  
];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check authentication, token expiry and roles
router.beforeEach((to, from, next) => {
  const jwtToken = localStorage.getItem('jwtToken');
  const userRole = localStorage.getItem('userRole');

  // Helper: check JWT expiry if it's a JWT (base64 parts)
  const isTokenExpired = (token) => {
    try {
      const parts = token?.split('.') || [];
      if (parts.length !== 3) return false; // not a JWT we issued; skip strict check
      const payload = JSON.parse(atob(parts[1]));
      if (!payload?.exp) return false;
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp <= nowInSeconds;
    } catch (e) {
      return false;
    }
  };

  // Auto-logout if token exists but is expired
  if (jwtToken && isTokenExpired(jwtToken)) {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userRole');
    // remove any other auth-related storage if used
    next('/');
    return;
  }
  
  // If route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !jwtToken) {
    next('/'); // Redirect to login page
    return;
  }
  
  // If route has role restrictions and user's role doesn't match
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    // Redirect to forbidden page instead of dashboard
    next('/forbidden');
    return;
  }
  
  // Check for admin-only routes
  if (to.meta.requiresAdmin && userRole !== 'admin') {
    next('/forbidden');
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
