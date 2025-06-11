
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, getDocs, addDoc } from 'firebase/firestore';
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


const LOGO_URL = "https://storage.googleapis.com/hostinger-horizons-assets-prod/3760d6a6-ab96-447b-8deb-dbeb7cec4327/ddb9811d5f3df3eb28c2f555087dd5ba.jpg";

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
            <div className="flex items-center space-x-3 space-x-reverse">
              <img src={LOGO_URL} alt="شعار منصة مهارات التعليمية" className="h-10 w-auto" />
              <div>
                <h1 className="text-xl font-bold gradient-text-alt">لوحة الطالب</h1>
                {userData && (
                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                    <User className="w-3 h-3" />
                    <span>{userData.name} ({userData.email})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>الإشعارات والرسائل</DropdownMenuLabel>
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
                        className={`flex items-start gap-2 ${(!notif.readBy || !notif.readBy[currentUser.uid]) && notif.receiverId === currentUser.uid ? 'font-semibold' : ''}`}
                        onClick={handleOpenChatWithTeacher} 
                      >
                        {(!notif.readBy || !notif.readBy[currentUser.uid]) && notif.receiverId === currentUser.uid ? 
                          <MessageSquare className="h-4 w-4 mt-1 text-blue-500" /> :
                          <CheckCircle className="h-4 w-4 mt-1 text-green-500" />
                        }
                        <div className="flex-1">
                          <p className="text-sm truncate">{notif.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {notif.senderId === teacherData?.id ? (teacherData.name || 'المعلم') : 'أنت'} - {notif.timestamp?.toDate().toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleOpenChatWithTeacher} className="justify-center text-blue-600 hover:!text-blue-700">
                    عرض كل المحادثات مع المعلم
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={onLogout} variant="outline" size="sm" className="flex items-center gap-1.5">
                <LogOut className="w-3.5 h-3.5" />
                تسجيل الخروج
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
