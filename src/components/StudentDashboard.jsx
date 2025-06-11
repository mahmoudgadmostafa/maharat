import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import { ResourceModal } from '@/components/common/ResourceModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink } from 'lucide-react';


import StudentHeader from '@/components/student/StudentHeader';
import StudentStatsCards from '@/components/student/StudentStatsCards';
import StudentLessonSelector from '@/components/student/StudentLessonSelector';
import StudentQuickAccess from '@/components/student/StudentQuickAccess';
import StudentLessonDetails from '@/components/student/StudentLessonDetails';
import StudentWelcomeMessage from '@/components/student/StudentWelcomeMessage';

const StudentDashboard = () => {
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
  const [modalState, setModalState] = useState({ isOpen: false, url: '', title: '', resourceType: '' });

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
      setModalState({ isOpen: true, url, title, resourceType });
    } else {
      toast({ title: "رابط غير متوفر", description: "لم يتم إضافة رابط لهذا المورد بعد.", variant: "default" });
    }
  };

  const closeResourceModal = () => {
    setModalState({ isOpen: false, url: '', title: '', resourceType: '' });
  };

  const totalLessons = lessons.length;
  const completedLessonsCount = studentProgress.completedLessons?.length || 0;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  const finalExams = platformSettings?.finalExamsList || [];


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
      <StudentHeader userData={userData} onLogout={logout} />

      <div className="container mx-auto px-2 sm:px-4 py-8">
        <StudentStatsCards 
          lessonsCount={totalLessons} 
          completedLessonsCount={completedLessonsCount} 
          overallProgress={overallProgress} 
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            <StudentLessonSelector 
              lessons={lessons} 
              selectedLessonId={selectedLesson?.id} 
              onLessonClick={handleLessonClick}
              studentProgress={studentProgress}
            />
            <StudentQuickAccess 
              platformSettings={platformSettings} 
              onOpenResourceModal={openResourceModal} 
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            {selectedLesson ? (
              <StudentLessonDetails 
                lesson={selectedLesson}
                studentProgress={studentProgress}
                onMarkLessonComplete={markLessonAsComplete}
                onOpenResourceModal={openResourceModal}
                platformSettings={platformSettings}
              />
            ) : (
              <>
                <StudentWelcomeMessage siteName={platformSettings.siteName} />
                {finalExams.length > 0 && (
                  <Card className="mt-6 glass-effect-alt border-0 shadow-xl bg-gradient-to-r from-red-500/10 to-orange-500/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <Award className="w-6 h-6" />
                        الاختبارات النهائية
                      </CardTitle>
                      <CardDescription>قم بإجراء الاختبارات النهائية لتقييم فهمك للمادة.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {finalExams.map((exam) => (
                        <Button
                          key={exam.id}
                          variant="outline"
                          className="w-full justify-start p-4 h-auto glass-button-alt border-red-300 hover:border-red-500"
                          onClick={() => openResourceModal(exam.url, exam.name, 'finalExam')}
                        >
                          <ExternalLink className="w-5 h-5 ml-3 text-red-600" />
                          <div>
                            <span className="font-semibold">{exam.name}</span>
                            <p className="text-xs text-muted-foreground">بدء الاختبار النهائي</p>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </motion.div>
        </div>
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
};

export default StudentDashboard;