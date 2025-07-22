import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, Users, Video, Settings, Brain, ExternalLink, Edit3, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, onSnapshot, query, where, orderBy, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ChatModal } from '@/components/common/ChatModal';

import { TeacherContentManager } from '@/components/teacher/TeacherContentManager';
import { TeacherStudentsManager } from '@/components/teacher/TeacherStudentsManager';
import { TeacherMeetingRoomManager } from '@/components/teacher/TeacherMeetingRoomManager';
import { TeacherPlatformSettings } from '@/components/teacher/TeacherPlatformSettings';
import { TeacherMessagesManager } from '@/components/teacher/TeacherMessagesManager';

const LOGO_URL = "/favicon.png";

const TeacherDashboard = () => {
  const { logout, currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentProgress, setStudentProgress] = useState({});
  const [platformSettings, setPlatformSettings] = useState({ 
    finalExamsList: [], 
    meetingRoomsList: [],
    siteName: 'منصة مهارات التعليمية',
    teacherAiToolsUrl: 'https://app.magicschool.ai/tools',
    studentAiToolsUrl: 'https://app.magicschool.ai/tools'
  });
  const [activeTab, setActiveTab] = useState('content');

  const [allMessages, setAllMessages] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [messagesIndexReady, setMessagesIndexReady] = useState(false);

  const fetchStaticData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userDocPromise = getDoc(doc(db, 'users', currentUser.uid));
      const lessonsSnapshotPromise = getDocs(collection(db, 'lessons'));
      const usersSnapshotPromise = getDocs(collection(db, 'users'));
      
      const [userDocResult, lessonsSnapshotResult, usersSnapshotResult] = await Promise.all([
        userDocPromise,
        lessonsSnapshotPromise,
        usersSnapshotPromise,
      ]);

      if (userDocResult.exists()) {
        setUserData(userDocResult.data());
      }

      const lessonsData = lessonsSnapshotResult.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));
      setLessons(lessonsData);

      const studentsData = usersSnapshotResult.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(user => user.role === 'student');
      setStudents(studentsData);

    } catch (error) {
      console.error('Error fetching static teacher dashboard data:', error);
      toast({ title: "خطأ في تحميل البيانات الأساسية", variant: "destructive" });
    }
  }, [currentUser]);

  const setupMessagesListener = useCallback(() => {
    if (!currentUser || !messagesIndexReady) return null;

    const qAllMessages = query(
      collection(db, 'messages'), 
      where('participants', 'array-contains', currentUser.uid), 
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(qAllMessages, (querySnapshot) => {
      const msgs = [];
      let count = 0;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({ id: docSnap.id, ...data });
        if (data.receiverId === currentUser.uid && (!data.readBy || !data.readBy[currentUser.uid])) {
          count++;
        }
      });
      setAllMessages(msgs); 
      setUnreadMessagesCount(count);
    }, (error) => {
      console.error("Error in messages snapshot listener:", error);
      if (error.code === 'failed-precondition') {
        setMessagesIndexReady(false);
        toast({
          title: "فهرس Firestore قيد الإنشاء",
          description: "يتم حاليًا إنشاء الفهرس المطلوب للرسائل. سيتم تفعيل الرسائل تلقائيًا عند اكتمال الفهرس.",
          variant: "default",
          duration: 8000,
        });
      }
    });

    return unsubscribe;
  }, [currentUser, messagesIndexReady]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);

    const initialFetch = async () => {
        await fetchStaticData();
        if (isMounted) {
            const progressCollectionRef = collection(db, 'studentProgress');
            const unsubscribeProgress = onSnapshot(progressCollectionRef, (snapshot) => {
                if (!isMounted) return;
                const progressData = {};
                snapshot.docs.forEach(d => { progressData[d.id] = d.data(); });
                setStudentProgress(progressData);
            }, (error) => { if (!isMounted) return; console.error("Error fetching student progress:", error); toast({ title: "خطأ في تحديث تقدم الطلاب", variant: "destructive" }); });

            const settingsDocRef = doc(db, 'platformSettings', 'main');
            const unsubscribeSettings = onSnapshot(settingsDocRef, async (docSnap) => {
                if (!isMounted) return;
                if (docSnap.exists()) {
                    const newSettings = docSnap.data();
                    setPlatformSettings(prev => ({ ...prev, ...newSettings, finalExamsList: newSettings.finalExamsList || [], meetingRoomsList: newSettings.meetingRoomsList || [] }));
                } else {
                    try {
                        await setDoc(settingsDocRef, { finalExamsList: [], meetingRoomsList: [], siteName: 'منصة مهارات التعليمية', teacherAiToolsUrl: 'https://app.magicschool.ai/tools', studentAiToolsUrl: 'https://app.magicschool.ai/tools' });
                        setPlatformSettings(prev => ({ ...prev, finalExamsList: [], meetingRoomsList: [] }));
                    } catch (e) { console.error("Error setting initial platform settings:", e); }
                }
            }, (error) => { if (!isMounted) return; console.error("Error fetching platform settings:", error); toast({ title: "خطأ في تحديث إعدادات المنصة", variant: "destructive" }); });
            
            setMessagesIndexReady(true);

            if(isMounted) { setLoading(false); }
            return () => { unsubscribeProgress(); unsubscribeSettings(); };
        }
    };
    initialFetch();
    return () => { isMounted = false; };
  }, [currentUser, fetchStaticData]);

  useEffect(() => {
    if (!messagesIndexReady) return;
    
    const unsubscribeMessages = setupMessagesListener();
    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [setupMessagesListener, messagesIndexReady]);

  useEffect(() => {
    const retryInterval = setInterval(() => {
      if (!messagesIndexReady && currentUser) {
        setMessagesIndexReady(true);
      }
    }, 30000);

    return () => clearInterval(retryInterval);
  }, [messagesIndexReady, currentUser]);

  useEffect(() => {
    if (!chatModalOpen || !currentUser || !chatTargetUser) {
      setChatMessages([]);
      return;
    }
    
    const relevantMessages = allMessages.filter(msg => msg.participants.includes(chatTargetUser.id));
    setChatMessages(relevantMessages);

  }, [chatModalOpen, currentUser, chatTargetUser, allMessages]);
  

  const handleSettingsUpdate = async (newSettings) => {
    try {
      const settingsRef = doc(db, 'platformSettings', 'main');
      const processedSettings = { ...newSettings, finalExamsList: newSettings.finalExamsList || [], meetingRoomsList: newSettings.meetingRoomsList || [] };
      await setDoc(settingsRef, processedSettings, { merge: true });
      toast({ title: "تم تحديث الإعدادات" });
    } catch (error) {
      console.error("Error updating platform settings:", error);
      toast({ title: "خطأ", description: "لم نتمكن من تحديث إعدادات المنصة.", variant: "destructive" });
    }
  };

  const openChatWithStudentFromNotification = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setChatTargetUser(student);
      setChatModalOpen(true);
      allMessages.filter(n => n.senderId === studentId && n.receiverId === currentUser.uid && (!n.readBy || !n.readBy[currentUser.uid]))
        .forEach(async (notif) => {
          const msgRef = doc(db, 'messages', notif.id);
          await updateDoc(msgRef, { [`readBy.${currentUser.uid}`]: true });
        });
    }
  };

  const handleSendMessageInChat = async (messageContent) => {
    if (!currentUser || !chatTargetUser || !messageContent.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        participants: [currentUser.uid, chatTargetUser.id].sort(),
        senderId: currentUser.uid,
        receiverId: chatTargetUser.id,
        message: messageContent,
        timestamp: serverTimestamp(),
        readBy: { [currentUser.uid]: true, [chatTargetUser.id]: false }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "خطأ في إرسال الرسالة", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div><p className="text-xl text-gray-600">جاري تحميل بيانات لوحة التحكم...</p></div>
      </div>
    );
  }

  const getStudentNameById = (studentId) => students.find(s => s.id === studentId)?.name || 'طالب غير معروف';
  
  const displayedNotifications = [...allMessages]
    .filter(n => n.receiverId === currentUser?.uid && (!n.readBy || !n.readBy[currentUser?.uid]))
    .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pattern-bg">
      {/* شريط التنقل العلوي */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <img src={LOGO_URL} alt="شعار منصة مهارات التعليمية" className="h-8 sm:h-10 w-auto" />
              </motion.div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold gradient-text">لوحة تحكم المعلم</h1>
                {userData && (
                  <div className="flex items-center gap-1 text-gray-600 text-xs">
                    <User className="w-3 h-3" />
                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">
                      {userData.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 sm:h-5 w-4 sm:w-5" />
                    {unreadMessagesCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                        {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 sm:w-80 max-h-[60vh] overflow-y-auto">
                  <DropdownMenuLabel>الرسائل الجديدة من الطلاب</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!messagesIndexReady ? (
                    <DropdownMenuItem disabled className="text-center text-orange-600 py-3">
                      جاري إعداد نظام الرسائل...
                    </DropdownMenuItem>
                  ) : displayedNotifications.length === 0 ? (
                     <DropdownMenuItem disabled className="text-center text-gray-500 py-3">لا توجد رسائل جديدة</DropdownMenuItem>
                  ) : (
                    displayedNotifications.map((notif) => (
                      <DropdownMenuItem 
                        key={notif.id} 
                        className="flex items-start gap-2 font-semibold"
                        onClick={() => openChatWithStudentFromNotification(notif.senderId)}
                      >
                        <MessageSquare className="h-4 w-4 mt-1 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm truncate">{notif.message}</p>
                          <p className="text-xs text-muted-foreground">
                            من: {getStudentNameById(notif.senderId)} - {notif.timestamp?.toDate().toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                onClick={logout} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <TabsList className="flex w-full bg-white/70 backdrop-blur-md p-1 rounded-lg shadow-lg mb-4 sm:mb-8 overflow-hidden">
  <TabsTrigger 
    value="content" 
    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs sm:text-sm min-w-0"
  >
    <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
    <span className="truncate">المحتوى</span>
  </TabsTrigger>
  <TabsTrigger 
    value="students" 
    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs sm:text-sm min-w-0"
  >
    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
    <span className="truncate">الطلاب</span>
  </TabsTrigger>
  <TabsTrigger 
    value="messages" 
    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs sm:text-sm min-w-0"
  >
    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
    <span className="truncate">الرسائل</span>
  </TabsTrigger>
  <TabsTrigger 
    value="meeting" 
    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs sm:text-sm min-w-0"
  >
    <Video className="w-3 h-3 sm:w-4 sm:h-4" />
    <span className="truncate">الاجتماعات</span>
  </TabsTrigger>
  <TabsTrigger 
    value="platformSettings" 
    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs sm:text-sm min-w-0"
  >
    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
    <span className="truncate">الإعدادات</span>
  </TabsTrigger>
</TabsList>
          </motion.div>
        
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="mb-4 sm:mb-8"
          >
            <Card className="glass-effect border-0 shadow-lg sm:shadow-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  تطبيقات الذكاء الاصطناعي
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  أدوات الذكاء الاصطناعي لإنشاء المحتوى التعليمي والاختبارات بكفاءة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {platformSettings?.teacherAiToolsList && platformSettings.teacherAiToolsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {platformSettings.teacherAiToolsList.map((tool, index) => (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
                        whileHover={{ scale: 1.03 }}
                        className="transition-transform duration-200"
                      >
                        <Button
                          variant="ghost"
                          className="w-full h-auto p-3 sm:p-5 flex items-center justify-between rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-purple-300/40 hover:border-purple-500 shadow-lg hover:shadow-xl group transition-all duration-300"
                          onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
                        >
                          <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 group-hover:text-purple-600 transition" />

                          <div className="text-right flex-1 px-3 sm:px-4">
                            <div className="font-bold text-sm sm:text-base text-orange-500 group-hover:text-orange-600 transition">
                              {tool.name}
                            </div>
                            <p className="text-xs sm:text-sm text-green-500 group-hover:text-green-600 transition">
                              فتح الغرفة
                            </p>
                          </div>

                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:text-purple-500 transition" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => window.open(platformSettings.teacherAiToolsUrl || 'https://app.magicschool.ai/tools', '_blank', 'noopener,noreferrer')} 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 sm:px-6 sm:py-3 text-white rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition duration-300 flex items-center space-x-2"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <span className="text-sm sm:text-base font-semibold">فتح تطبيقات الذكاء الاصطناعي</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <TabsContent value="content">
            <TeacherContentManager 
              lessons={lessons} 
              onLessonsUpdate={fetchStaticData} 
              platformSettings={platformSettings} 
              onSettingsUpdate={handleSettingsUpdate} 
            />
          </TabsContent>
          <TabsContent value="students">
            <TeacherStudentsManager 
              students={students} 
              onStudentsUpdate={fetchStaticData} 
              lessons={lessons} 
              studentProgress={studentProgress} 
            />
          </TabsContent>
          <TabsContent value="messages">
            <TeacherMessagesManager />
          </TabsContent>
          <TabsContent value="meeting">
            <TeacherMeetingRoomManager 
              platformSettings={platformSettings} 
              onSettingsUpdate={handleSettingsUpdate} 
            />
          </TabsContent>
          <TabsContent value="platformSettings">
            <TeacherPlatformSettings 
              platformSettings={platformSettings} 
              onSettingsUpdate={handleSettingsUpdate} 
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* نافذة المحادثة */}
      {chatModalOpen && chatTargetUser && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => { setChatModalOpen(false); setChatTargetUser(null); }}
          currentUser={currentUser} 
          targetUser={chatTargetUser} 
          messages={chatMessages}
          onSendMessage={handleSendMessageInChat}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;