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
  <div className="flex flex-col items-center justify-center min-h-screen">
    <LoadingSpinner />
    <p className="mt-4 text-lg">جاري تحميل المنصة...</p>
  </div>
);

const AppRoutes = () => {
  const { currentUser, userRole, platformSettings, isLoading } = useAuth();

  // إذا كان في مرحلة تحميل المصادقة
  if (isLoading) {
    return <UnifiedLoading />;
  }

  // إذا لم يكن مستخدم مسجل
  if (!currentUser) {
    return (
      <Suspense fallback={<UnifiedLoading />}>
        <HomePage platformSettings={platformSettings} />
      </Suspense>
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

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // محاكاة تحميل البيانات الأساسية للمنصة
    const initializeApp = async () => {
      try {
        // يمكنك إضافة أي تهيئة إضافية هنا
        await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة تحميل
        setIsAppReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsAppReady(true); // استمر حتى في حالة الخطأ
      }
    };

    initializeApp();
  }, []);

  if (!isAppReady) {
    return <UnifiedLoading />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Suspense fallback={<UnifiedLoading />}>
              <AppRoutes />
            </Suspense>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
