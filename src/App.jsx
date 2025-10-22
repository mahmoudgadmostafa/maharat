
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import ChatBotWidget from "@/components/ChatBotWidget";


// Lazy loading للمكونات الرئيسية
const HomePage = lazy(() => import('@/components/HomePage'));
const StudentDashboard = lazy(() => import('@/components/StudentDashboard'));
const TeacherDashboard = lazy(() => import('@/components/TeacherDashboard'));

const AppRoutes = () => {
  const { currentUser, userRole, platformSettings } = useAuth();

  if (!currentUser) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <HomePage platformSettings={platformSettings} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route 
          path="/" 
          element={
            userRole === 'teacher' ? (
              <Navigate to="/teacher" replace />
            ) : userRole === 'student' ? (
              <Navigate to="/student" replace />
            ) : (
              <HomePage platformSettings={platformSettings} />
            )
          } 
        />
        <Route 
          path="/teacher" 
          element={
            userRole === 'teacher' ? (
              <TeacherDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/student" 
          element={
            userRole === 'student' ? (
              <StudentDashboard />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
            <Toaster />
             {currentUser && <ChatBotWidget />} {/* 👈 الشات يظهر فقط بعد تسجيل الدخول */}
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
