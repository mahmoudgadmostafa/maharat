
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import HomePage from '@/components/HomePage';
import StudentDashboard from '@/components/StudentDashboard';
import TeacherDashboard from '@/components/TeacherDashboard';

const AppRoutes = () => {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <HomePage />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          userRole === 'teacher' ? (
            <Navigate to="/teacher" replace />
          ) : userRole === 'student' ? (
            <Navigate to="/student" replace />
          ) : (
            <HomePage />
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
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
