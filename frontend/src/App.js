import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import CourseRegistrationPage from './pages/CourseRegistrationPage';
import AttendancePage from './pages/AttendancePage';
import ResultsPage from './pages/ResultsPage';
import TimetablePage from './pages/TimetablePage';
import NoticesPage from './pages/NoticesPage';
import ProfilePage from './pages/ProfilePage';

// Admin Pages
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminNotices from './pages/admin/AdminNotices';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyResults from './pages/faculty/FacultyResults';

// Demo Components
import CaptchaDemo from './components/CaptchaDemo';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                } 
              />
              
              {/* Demo Route - Public for testing */}
              <Route 
                path="/captcha-demo" 
                element={<CaptchaDemo />} 
              />

              {/* Protected Routes - Common */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/courses" 
                element={
                  <ProtectedRoute>
                    <CoursesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/course-registration" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <CourseRegistrationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/attendance" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <AttendancePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/results" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <ResultsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/timetable" 
                element={
                  <ProtectedRoute>
                    <TimetablePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notices" 
                element={
                  <ProtectedRoute>
                    <NoticesPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/courses" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminCourses />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/notices" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminNotices />
                  </ProtectedRoute>
                } 
              />

              {/* Faculty Routes */}
              <Route 
                path="/faculty" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/attendance" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']}>
                    <FacultyAttendance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/faculty/results" 
                element={
                  <ProtectedRoute allowedRoles={['faculty']}>
                    <FacultyResults />
                  </ProtectedRoute>
                } 
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;