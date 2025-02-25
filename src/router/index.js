import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../components/LoginPage.vue";
import Dashboard from "../components/student/Dashboard.vue"; // New Dashboard Page
import Profile from "../components/Profile.vue";
import Settings from "../components/Settings.vue";
import AdminDashboard from "../components/admin/AdminDashboard.vue";
import TeacherDashboard from "../components/teacher/TeacherDashboard.vue";
import TeacherProfile from "../components/teacher/TeacherProfile.vue";
import StudentProfile from "../components/student/StudentProfile.vue";
import CreateExam from "../components/teacher/CreateExam.vue";
import TakeExam from "../components/student/TakeExam.vue";


const routes = [
  { path: "/", component: LoginPage },
  { path: "/dashboard", component: Dashboard },
  { path: "/profile", component: Profile },
  { path: "/settings", component: Settings },
  { path: '/admin-dashboard', component: AdminDashboard },
  { path: '/teacher-dashboard', component: TeacherDashboard },
  { path: '/teacher-profile', component: TeacherProfile},
  { path: '/student-profile', component: StudentProfile},
  { path: '/create-exam', component: CreateExam},
  { path: '/take-exam', component: TakeExam},

];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
