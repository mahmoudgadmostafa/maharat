import React, { useState, useEffect, useCallback, memo, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // إضافة AnimatePresence
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import { ResourceModal } from '@/components/common/ResourceModal';
import { trackEvent, EVENT_TYPES } from '@/lib/analyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'; // إضافة أيقونات للقائمة
import LoadingSpinner from '@/components/LoadingSpinner';
import { useMotivation } from '@/contexts/MotivationContext';
import { ACHIEVEMENT_EMOJIS } from '@/lib/motivationMessages';
import { useMediaQuery } from '@/hooks/useMediaQuery'; // افترض وجود هذا الهوك

// Lazy loading للمكونات الفرعية
const StudentHeader = lazy(() => import('@/components/student/StudentHeader'));
const StudentStatsCards = lazy(() => import('@/components/student/StudentStatsCards'));
const StudentLessonSelector = lazy(() => import('@/components/student/StudentLessonSelector'));
const StudentQuickAccess = lazy(() => import('@/components/student/StudentQuickAccess'));
const StudentLessonDetails = lazy(() => import('@/components/student/StudentLessonDetails'));
const StudentWelcomeMessage = lazy(() => import('@/components/student/StudentWelcomeMessage'));
const StudentMessaging = lazy(() => import('@/components/student/StudentMessaging').then(module => ({ default: module.StudentMessaging })));
const ExamAccess = lazy(() => import('@/components/ExamAccess'));
const StudentAchievements = lazy(() => import('./student/StudentAchievements'));

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
    studentAiToolsUrl: 'https://app.magicschool.ai/tools',
    studentAiToolsList: []
  });
  const [modalState, setModalState] = useState({ isOpen: false, url: "", title: "", resourceType: "" });
  const [showMessaging, setShowMessaging] = useState(false);
  const { showMotivation } = useMotivation();
  
  // حالة جديدة للقائمة الجانبية على الأجهزة المحمولة
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // استخدام هوك للكشف عن حجم الشاشة
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');

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

  // إغلاق القائمة الجانبية عند تغيير حجم الشاشة
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  // عند اختيار درس على الجوال، نغلق القائمة الجانبية تلقائياً
  const handleLessonClick = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    setSelectedLesson(lesson);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

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
            studentAiToolsList: newSettings.studentAiToolsList || [],
            teacherAiToolsList: newSettings.teacherAiToolsList || []
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
        if (!fetchedUserData) {
          setLoading(false);
          return;
        }
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

      const lessonIndex = lessons.findIndex(l => l.id === lessonId);
      const achievement = ACHIEVEMENT_EMOJIS[lessonIndex % ACHIEVEMENT_EMOJIS.length];
      showMotivation({
        emoji: achievement.emoji,
        text: `لقد حصلت على وسام: ${achievement.name}! 🎉`
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
    if (modalState.resourceType === 'video' && currentUser && selectedLesson) {
      trackEvent('video_completed', currentUser.uid, selectedLesson.id, {
        resourceTitle: modalState.title,
        timeSpent: Date.now() - (window.resourceStartTime || Date.now())
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

  const filteredStudentAiTools = useMemo(() => {
    return (platformSettings?.studentAiToolsList || []).filter(tool => {
      if (tool.isVisible !== true) return false;
      const visibleGroups = tool.visibleForGroups || [];
      if (visibleGroups.length === 0) return true;
      if (!userData || !userData.group) return false;
      return visibleGroups.includes(userData.group);
    });
  }, [platformSettings?.studentAiToolsList, userData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 md:h-32 md:w-32 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-base md:text-xl text-gray-600">جاري تحميل بياناتك التعليمية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 pattern-bg-alt">
      <Suspense fallback={<LoadingSpinner />}>
        <StudentHeader userData={userData} onLogout={logout} />
      </Suspense>

      {/* زر فتح/إغلاق القائمة الجانبية للجوال */}
      {isMobile && (
        <div className="fixed bottom-6 left-4 z-30 md:hidden">
          <Button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full p-3 h-auto bg-sky-600 hover:bg-sky-700 shadow-lg"
            aria-label={isMobileMenuOpen ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-white" />
            ) : (
              <Menu className="h-5 w-5 text-white" />
            )}
          </Button>
        </div>
      )}

      <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
        {showMessaging ? (
          <Suspense fallback={<LoadingSpinner />}>
            <StudentMessaging />
          </Suspense>
        ) : (
          <>
            {/* الإحصائيات والإنجازات - تظهر في جميع الأجهزة */}
            <div className="mb-6 md:mb-8">
              <Suspense fallback={<LoadingSpinner />}>
                <StudentStatsCards
                  lessonsCount={totalLessons}
                  completedLessonsCount={completedLessonsCount}
                  overallProgress={overallProgress}
                />
              </Suspense>
              
              <div className="mt-4 md:mt-6">
                <Suspense fallback={<LoadingSpinner />}>
                  <StudentAchievements
                    lessons={lessons}
                    completedLessonIds={studentProgress.completedLessons}
                  />
                </Suspense>
              </div>
            </div>

            <div className="relative">
              {/* القائمة الجانبية للجوال (تظهر كطبقة فوقية) */}
              <AnimatePresence>
                {isMobile && isMobileMenuOpen && (
                  <>
                    {/* طبقة التعتيم الخلفية */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black z-20 md:hidden"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                    
                    {/* القائمة الجانبية نفسها */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '-100%' }}
                      transition={{ type: 'spring', damping: 25 }}
                      className="fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-30 overflow-y-auto md:hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-sky-800">القائمة الجانبية</h3>
                          <Button
                            onClick={() => setIsMobileMenuOpen(false)}
                            variant="ghost"
                            size="sm"
                            className="p-1"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        <div className="space-y-6">
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
                              platformSettings={{
                                ...platformSettings,
                                studentAiToolsList: filteredStudentAiTools
                              }}
                              onOpenResourceModal={openResourceModal}
                            />
                          </Suspense>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* التخطيط الرئيسي */}
              <div className={`grid grid-cols-1 ${isTablet ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 md:gap-6 lg:gap-8 items-start`}>
                {/* القائمة الجانبية (تظهر في وضع الجانب على الديسكتوب والتابلت) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`${isMobile ? 'hidden' : 'block'} md:col-span-1 ${isTablet ? 'md:col-span-1' : ''} space-y-4 md:space-y-6`}
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
                      platformSettings={{
                        ...platformSettings,
                        studentAiToolsList: filteredStudentAiTools
                      }}
                      onOpenResourceModal={openResourceModal}
                    />
                  </Suspense>
                </motion.div>

                {/* المحتوى الرئيسي */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`md:col-span-2 ${isTablet ? 'md:col-span-3' : 'md:col-span-2'}`}
                >
                  <div className="space-y-4 md:space-y-6">
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
                        <StudentWelcomeMessage 
                          siteName={platformSettings.siteName} 
                          isMobile={isMobile}
                        />
                      </Suspense>
                    )}

                    {finalExams.length > 0 && (
                      <div className="space-y-3 md:space-y-4 p-4 md:p-6 bg-white/80 rounded-xl shadow-sm">
                        <h3 className="text-lg md:text-xl font-semibold text-red-700 flex items-center gap-2">
                          <Award className="w-5 h-5 md:w-6 md:h-6" />
                          الاختبارات النهائية
                        </h3>
                        <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                          قم بإجراء الاختبارات لتقييم فهمك للمادة.
                        </p>
                        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 md:gap-4`}>
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
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
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
