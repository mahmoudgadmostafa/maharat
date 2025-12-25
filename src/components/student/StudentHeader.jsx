
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, getDocs, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
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
import { toast } from '@/components/ui/use-toast';


const LOGO_URL = "/favicon.png";

const StudentHeader = ({ userData, onLogout }) => {
  const { currentUser } = useAuth();
  const [allMessages, setAllMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [teacherData, setTeacherData] = useState(null);
  const [messagesIndexReady, setMessagesIndexReady] = useState(false);

  const setupMessagesListener = React.useCallback(() => {
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
        if (data.participants.includes(currentUser.uid)) {
          msgs.push({ id: docSnap.id, ...data });
          if (data.receiverId === currentUser.uid && (!data.readBy || !data.readBy[currentUser.uid])) {
            count++;
          }
        }
      });
      setAllMessages(msgs);
      setUnreadCount(count);
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
    if (!currentUser) return;

    const fetchTeacher = async () => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "teacher"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const teacher = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        setTeacherData(teacher);
      }
    };
    fetchTeacher();

    setMessagesIndexReady(true);

  }, [currentUser]);

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
    if (!chatModalOpen || !currentUser || !teacherData) {
      setChatMessages([]);
      return;
    }

    const relevantMessages = allMessages.filter(msg => msg.participants.includes(teacherData.id));
    setChatMessages(relevantMessages);

  }, [chatModalOpen, currentUser, teacherData, allMessages]);


  const handleOpenChatWithTeacher = async () => {
    if (!teacherData) {
      toast({ title: "المعلم غير متوفر", description: "لا يمكن بدء المحادثة حاليًا.", variant: "destructive" });
      return;
    }
    setChatTargetUser(teacherData);
    setChatModalOpen(true);
    allMessages.forEach(async (notif) => {
      if (notif.senderId === teacherData.id && (!notif.readBy || !notif.readBy[currentUser.uid])) {
        const msgRef = doc(db, 'messages', notif.id);
        await updateDoc(msgRef, {
          [`readBy.${currentUser.uid}`]: true
        });
      }
    });
  };

  const handleSendMessageToTeacher = async (messageContent) => {
    if (!currentUser || !teacherData || !messageContent.trim()) return;
    try {
      await addDoc(collection(db, 'messages'), {
        participants: [currentUser.uid, teacherData.id].sort(),
        senderId: currentUser.uid,
        receiverId: teacherData.id,
        message: messageContent,
        timestamp: serverTimestamp(),
        readBy: { [currentUser.uid]: true, [teacherData.id]: false }
      });
    } catch (error) {
      console.error("Error sending message to teacher:", error);
      toast({ title: "خطأ في إرسال الرسالة", variant: "destructive" });
    }
  };

  const handleDeleteMessagesInChat = (deletedMessageIds) => {
    setAllMessages(prev => prev.filter(msg => !deletedMessageIds.includes(msg.id)));
  };

  const displayedNotifications = [...allMessages]
    .filter(msg => msg.participants.includes(currentUser.uid))
    .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
    .slice(0, 5);

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Logo (Hidden on mobile to save space, or kept small) */}
              <motion.div
                className="hidden md:block"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <img src={LOGO_URL} alt="Logo" className="h-10 w-auto" />
              </motion.div>

              {/* Animated Avatar Component */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative group cursor-pointer"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative h-12 w-12 rounded-full border-2 border-white shadow-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600"
                >
                  <User className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full z-10"
                />
              </motion.div>

              <div className="text-right">
                <h1 className="text-lg sm:text-xl font-bold gradient-text-alt leading-tight">لوحة تحكم المتعلم</h1>
                {userData && (
                  <div className="flex flex-col text-xs text-gray-600 mt-0.5">
                    <span className="font-bold text-gray-800 text-sm sm:text-base">
                      {userData.name}
                    </span>
                    <span className="text-blue-500 font-medium opacity-80">
                      مجموعة: {userData.group}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-4 sm:py-2 h-auto"
                onClick={() => window.dispatchEvent(new CustomEvent('toggleStudentMessaging'))}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">المراسلات</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80">
                  <DropdownMenuLabel className="text-right">الإشعارات والرسائل</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!messagesIndexReady ? (
                    <DropdownMenuItem disabled className="text-center text-orange-600 py-3">
                      جاري إعداد نظام الرسائل...
                    </DropdownMenuItem>
                  ) : displayedNotifications.length === 0 ? (
                    <DropdownMenuItem disabled className="text-center text-gray-500 py-3">
                      لا توجد إشعارات جديدة
                    </DropdownMenuItem>
                  ) : (
                    displayedNotifications.map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        className={`flex items-start gap-2 text-right ${(!notif.readBy || !notif.readBy[currentUser.uid]) && notif.receiverId === currentUser.uid ? 'font-semibold' : ''}`}
                        onClick={handleOpenChatWithTeacher}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{notif.message}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {notif.senderId === teacherData?.id ? (teacherData.name || 'المعلم') : 'أنت'} - {notif.timestamp?.toDate().toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        {(!notif.readBy || !notif.readBy[currentUser.uid]) && notif.receiverId === currentUser.uid ?
                          <MessageSquare className="h-4 w-4 mt-1 text-blue-500 flex-shrink-0" /> :
                          <CheckCircle className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                        }
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleOpenChatWithTeacher} className="justify-center text-blue-600 hover:!text-blue-700">
                    عرض كل المحادثات
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={onLogout} variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-4 sm:py-2 h-auto text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">خروج</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      {chatModalOpen && teacherData && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          currentUser={currentUser}
          targetUser={teacherData}
          messages={chatMessages}
          onSendMessage={handleSendMessageToTeacher}
          onDeleteMessages={handleDeleteMessagesInChat}
        />
      )}
    </>
  );
};

export default StudentHeader;
