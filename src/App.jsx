import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy loading للمكونات الرئيسية
const HomePage = lazy(() => import('@/components/HomePage'));
const StudentDashboard = lazy(() => import('@/components/StudentDashboard'));
const TeacherDashboard = lazy(() => import('@/components/TeacherDashboard'));

// مكون تحميل موحد
const UnifiedLoading = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
    <LoadingSpinner size="large" />
    <p className="mt-4 text-lg text-gray-700">جاري تحميل المنصة...</p>
  </div>
);

const AppRoutes = () => {
  const { currentUser, userRole, platformSettings } = useAuth();

  // إذا لم يكن مستخدم مسجل
  if (!currentUser) {
    return (
      <HomePage platformSettings={platformSettings} />
    );
  }

  // توجيه حسب الدور
  const getDashboardComponent = () => {
    if (userRole === 'teacher') {
      return <TeacherDashboard />;
    } else if (userRole === 'student') {
      return <StudentDashboard />;
    } else {
      return <HomePage platformSettings={platformSettings} />;
    }
  };

  return (
    <Routes>
      <Route path="/" element={getDashboardComponent()} />
      <Route path="/teacher" element={
        userRole === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" replace />
      } />
      <Route path="/student" element={
        userRole === 'student' ? <StudentDashboard /> : <Navigate to="/" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppContent = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const { loading } = useAuth(); // استخدام حالة التحميل من AuthContext

  useEffect(() => {
    const initializeApp = async () => {
      // انتظر انتهاء تحميل المصادقة + أي تحميل إضافي
      if (!loading) {
        // محاكاة أي تحميل إضافي للمنصة (مثل الإعدادات، الثيمات، etc.)
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsAppReady(true);
      }
    };

    initializeApp();
  }, [loading]);

  // تحميل موحد من مكان واحد فقط
  if (loading || !isAppReady) {
    return <UnifiedLoading />;
  }

  return (
    <Router>
      <div className="App">
        <Suspense fallback={<UnifiedLoading />}>
          <AppRoutes />
        </Suspense>
        <Toaster />
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
