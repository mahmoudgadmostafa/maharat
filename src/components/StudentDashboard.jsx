import React, { useState, useEffect, useCallback, memo, useMemo, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import { ResourceModal } from '@/components/common/ResourceModal';
import { trackEvent, EVENT_TYPES } from '@/lib/analyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';


// Lazy loading للمكونات الفرعية
const StudentHeader = lazy(() => import('@/components/student/StudentHeader'));
const StudentStatsCards = lazy(() => import('@/components/student/StudentStatsCards'));
const StudentLessonSelector = lazy(() => import('@/components/student/StudentLessonSelector'));
const StudentQuickAccess = lazy(() => import('@/components/student/StudentQuickAccess'));
const StudentLessonDetails = lazy(() => import('@/components/student/StudentLessonDetails'));
const StudentWelcomeMessage = lazy(() => import('@/components/student/StudentWelcomeMessage'));
const StudentMessaging = lazy(() => import('@/components/student/StudentMessaging').then(module => ({ default: module.StudentMessaging })));
const ExamAccess = lazy(() => import('@/components/ExamAccess'));

const StudentDashboard = memo(() => {
  const { logout, currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentProgress, setStudentProgress] = useState({ completedLessons: [] });
  const [platformSettings, setPlatformSettings] = useState({ 
    finalExamsList: [], 
    meetingRoomsList: [], 
    siteName: 'منصة مهارات التعليمية',
    studentAiToolsUrl: 'https://app.magicschool.ai/tools'
  });
  const [modalState, setModalState] = useState({ isOpen: false, url: "", title: "", resourceType: "" });
  const [showMessaging, setShowMessaging] = useState(false);

  const fetchLessonsAndUserData = useCallback(async () => {
    if (!currentUser) return { userData: null, lessonsData: [] };
    try {
      let fetchedUserData = null;
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        fetchedUserData = userDocSnap.data();
        setUserData(fetchedUserData);
      }

      const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
      const lessonsData = lessonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));
      setLessons(lessonsData);
      return { userData: fetchedUserData, lessonsData };
    } catch (error) {
      console.error('Error fetching lessons or user data:', error);
      toast({
        title: "خطأ في تحميل البيانات الأولية",
        description: "لم نتمكن من تحميل الدروس أو بيانات المستخدم.",
        variant: "destructive",
      });
      return { userData: null, lessonsData: [] };
    }
  }, [currentUser]);

  useEffect(() => {
    const handleToggleMessaging = () => {
      setShowMessaging(prev => !prev);
    };

    window.addEventListener('toggleStudentMessaging', handleToggleMessaging);
    return () => {
      window.removeEventListener('toggleStudentMessaging', handleToggleMessaging);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const setupListeners = (currentFetchedUserData) => {
      const progressDocRef = doc(db, 'studentProgress', currentUser.uid);
      const unsubscribeProgress = onSnapshot(progressDocRef, async (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          setStudentProgress(docSnap.data());
        } else {
          try {
            const userForProgress = currentFetchedUserData || (await getDoc(doc(db, 'users', currentUser.uid))).data();
            if (isMounted && userForProgress) {
              await setDoc(progressDocRef, { completedLessons: [], studentName: userForProgress.name || 'طالب' });
              setStudentProgress({ completedLessons: [], studentName: userForProgress.name || 'طالب' });
            }
          } catch (e) {
            console.error("Error setting initial student progress:", e);
          }
        }
      }, (error) => {
        if (!isMounted) return;
        console.error("Error fetching student progress:", error);
        toast({ title: "خطأ في تحديث التقدم", variant: "destructive" });
      });
      
      const settingsDocRef = doc(db, 'platformSettings', 'main');
      const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          const newSettings = docSnap.data();
          setPlatformSettings(prev => ({ 
            ...prev, 
            ...newSettings,
            finalExamsList: newSettings.finalExamsList || [], 
            meetingRoomsList: newSettings.meetingRoomsList || [], 
          }));
        }
      }, (error) => {
        if (!isMounted) return;
        console.error("Error fetching platform settings:", error);
        toast({ title: "خطأ في تحديث إعدادات المنصة", variant: "destructive" });
      });
      
      return [unsubscribeProgress, unsubscribeSettings];
    };
    
    fetchLessonsAndUserData().then(({ userData: fetchedUserData }) => {
      if (isMounted) {
        const unsubscribers = setupListeners(fetchedUserData);
        setLoading(false);
        
        if (unsubscribers) {
          return () => {
            unsubscribers.forEach(unsub => unsub && unsub());
          };
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser, fetchLessonsAndUserData]);

  const handleLessonClick = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    setSelectedLesson(lesson);
  };

  const markLessonAsComplete = async (lessonId) => {
    if (!currentUser || !selectedLesson || selectedLesson.id !== lessonId) return;
    if (studentProgress.completedLessons.includes(lessonId)) {
      toast({ title: "تم إكمال هذا الدرس بالفعل!", variant: "default" });
      return;
    }

    try {
      const progressRef = doc(db, 'studentProgress', currentUser.uid);
      await updateDoc(progressRef, {
        completedLessons: arrayUnion(lessonId)
      });
      toast({
        title: "رائع!",
        description: `تم تحديد الدرس "${selectedLesson.title}" كمكتمل.`,
      });
    } catch (error) {
      console.error("Error marking lesson as complete:", error);
      toast({
        title: "خطأ",
        description: "لم نتمكن من تحديث حالة الدرس.",
        variant: "destructive",
      });
    }
  };

  const openResourceModal = (url, title, resourceType) => {
    if (url) {
      // تسجيل حدث فتح المورد
      if (currentUser && selectedLesson) {
        let eventType;
        if (resourceType === 'video') {
          eventType = 'video_started';
        } else if (resourceType === 'pdf') {
          eventType = 'pdf_opened';
        } else if (resourceType === 'questions') {
          eventType = 'questions_accessed';
        } else {
          eventType = 'resource_accessed';
        }
        
        trackEvent(eventType, currentUser.uid, selectedLesson.id, {
          resourceTitle: title,
          resourceType: resourceType,
          resourceUrl: url
        });
      }
      
      setModalState({ isOpen: true, url, title, resourceType });
    } else {
      toast({ title: "رابط غير متوفر", description: "لم يتم إضافة رابط لهذا المورد بعد.", variant: "default" });
    }
  };

  const closeResourceModal = () => {
    // تسجيل حدث إغلاق المورد إذا كان فيديو
    if (modalState.resourceType === 'video' && currentUser && selectedLesson) {
      trackEvent('video_completed', currentUser.uid, selectedLesson.id, {
        resourceTitle: modalState.title,
        timeSpent: Date.now() - (window.resourceStartTime || Date.now()) // تقدير الوقت المقضي
      });
    }
    
    setModalState({ isOpen: false, url: '', title: '', resourceType: '' });
  };

  const totalLessons = lessons.length;
  const completedLessonsCount = studentProgress.completedLessons?.length || 0;
  const overallProgress = useMemo(() => {
    return totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  }, [totalLessons, completedLessonsCount]);
  
  const finalExams = useMemo(() => {
    return (platformSettings?.finalExamsList || []).filter(exam => exam.isVisible === true);
  }, [platformSettings?.finalExamsList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">جاري تحميل بياناتك التعليمية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 pattern-bg-alt">
      <Suspense fallback={<LoadingSpinner />}>
        <StudentHeader userData={userData} onLogout={logout} />
      </Suspense>

      <div className="container mx-auto px-2 sm:px-4 py-8">
        {showMessaging ? (
          <Suspense fallback={<LoadingSpinner />}>
            <StudentMessaging />
          </Suspense>
        ) : (
          <>
            <Suspense fallback={<LoadingSpinner />}>
              <StudentStatsCards 
                lessonsCount={totalLessons} 
                completedLessonsCount={completedLessonsCount} 
                overallProgress={overallProgress} 
              />
            </Suspense>

            <div className="grid lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-1 space-y-6"
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <StudentLessonSelector 
                    lessons={lessons} 
                    selectedLessonId={selectedLesson?.id} 
                    onLessonClick={handleLessonClick}
                    studentProgress={studentProgress}
                  />
                </Suspense>
                <Suspense fallback={<LoadingSpinner />}>
                  <StudentQuickAccess 
                    platformSettings={platformSettings} 
                    onOpenResourceModal={openResourceModal} 
                  />
                </Suspense>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="space-y-6">
                  {selectedLesson ? (
                    <Suspense fallback={<LoadingSpinner />}>
                      <StudentLessonDetails 
                        lesson={selectedLesson}
                        studentProgress={studentProgress}
                        onMarkLessonComplete={markLessonAsComplete}
                        platformSettings={platformSettings}
                      />
                    </Suspense>
                  ) : (
                    <Suspense fallback={<LoadingSpinner />}>
                      <StudentWelcomeMessage siteName={platformSettings.siteName} />
                    </Suspense>
                  )}
                  
                  {finalExams.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-red-700 flex items-center gap-2">
                        <Award className="w-6 h-6" />
                        الاختبارات
                      </h3>
                      <p className="text-gray-600 mb-4">قم بإجراء الاختبارات لتقييم فهمك للمادة.</p>
                      {finalExams.map((exam) => (
                        <Suspense key={exam.id} fallback={<LoadingSpinner />}>
                          <ExamAccess
                            examUrl={exam.url}
                            examName={exam.name}
                            examId={exam.id}
                          />
                        </Suspense>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
      <ResourceModal
        isOpen={modalState.isOpen}
        onClose={closeResourceModal}
        title={modalState.title}
        url={modalState.url}
        resourceType={modalState.resourceType}
      />
    </div>
  );
});

export default StudentDashboard;

