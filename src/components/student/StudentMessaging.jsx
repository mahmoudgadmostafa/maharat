import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Search, Users, Send, Loader2, Users2 } from 'lucide-react';
import { ChatModal } from '@/components/common/ChatModal';
import {
  getAvailableStudents,
  getUserConversations,
  getMessagesBetweenUsers,
  sendStudentMessage,
  sendGroupMessage,
  getGroupMessages
} from '@/lib/messageService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export const StudentMessaging = () => {
  const { currentUser } = useAuth();
  const [availableStudents, setAvailableStudents] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Group Chat State
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);
  const [groupMessages, setGroupMessages] = useState([]);

  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState({
    conversations: null,
    messages: null,
    groupMessages: null
  });

  // تنظيف الاشتراكات عند إلغاء التحميل
  useEffect(() => {
    return () => {
      // تنظيف جميع الاشتراكات عند إلغاء تحميل المكون
      Object.values(unsubscribeFunctions).forEach(unsub => {
        if (unsub && typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [unsubscribeFunctions]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const newUnsubscribeFunctions = { ...unsubscribeFunctions };

    const fetchStudents = async () => {
      try {
        const students = await getAvailableStudents(currentUser.uid, currentUser.group);
        if (isMounted) {
          setAvailableStudents(students || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        if (isMounted) {
          toast({
            title: "خطأ في جلب قائمة الطلاب",
            description: error.message || 'حدث خطأ غير متوقع',
            variant: "destructive"
          });
        }
      }
    };

    // جلب المحادثات مع معالجة الاشتراك
    const unsubscribeConversations = getUserConversations(
      currentUser.uid,
      (convs) => {
        if (isMounted) {
          setConversations(convs || []);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error in conversations subscription:', error);
        if (isMounted) {
          toast({
            title: "خطأ في جلب المحادثات",
            description: error.message || 'حدث خطأ في الاتصال',
            variant: "destructive"
          });
        }
      }
    );

    if (unsubscribeConversations && typeof unsubscribeConversations === 'function') {
      newUnsubscribeFunctions.conversations = unsubscribeConversations;
      setUnsubscribeFunctions(newUnsubscribeFunctions);
    }

    fetchStudents();

    return () => {
      isMounted = false;
      // تنظيف اشتراك المحادثات عند إلغاء التأثير
      if (newUnsubscribeFunctions.conversations) {
        newUnsubscribeFunctions.conversations();
      }
    };
  }, [currentUser?.uid]);

  const getInitials = useCallback((name) => {
    if (!name || typeof name !== 'string') return '?';

    const trimmedName = name.trim();
    if (trimmedName.length === 0) return '?';

    const names = trimmedName.split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '?';

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }, []);

  const getUserName = useCallback((user) => {
    if (!user) return 'غير معروف';

    const name = user.name || user.displayName || user.email || 'طالب';
    return typeof name === 'string' ? name : 'طالب';
  }, []);

  const getUserEmail = useCallback((user) => {
    if (!user || !user.email) return 'بريد إلكتروني غير متوفر';
    return user.email;
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return availableStudents;

    const term = searchTerm.toLowerCase().trim();
    return availableStudents.filter(student => {
      const name = (student.name || student.displayName || '').toLowerCase();
      const email = (student.email || '').toLowerCase();

      return name.includes(term) || email.includes(term);
    });
  }, [availableStudents, searchTerm]);

  const handleStartChat = useCallback((student) => {
    if (!currentUser?.uid || !student?.id) {
      toast({
        title: "خطأ",
        description: "لا يمكن بدء المحادثة. المستخدم غير متوفر.",
        variant: "destructive"
      });
      return;
    }

    setSelectedStudent(student);
    setIsChatOpen(true);
    setMessagesLoading(true);

    // تنظيف اشتراك الرسائل السابق إن وجد
    if (unsubscribeFunctions.messages) {
      unsubscribeFunctions.messages();
    }

    // جلب الرسائل بين المستخدمين
    const unsubscribeMessages = getMessagesBetweenUsers(
      currentUser.uid,
      student.id,
      (messages) => {
        setChatMessages(messages || []);
        setMessagesLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setMessagesLoading(false);
        toast({
          title: "خطأ في جلب الرسائل",
          description: error.message || 'حدث خطأ في الاتصال',
          variant: "destructive"
        });
      }
    );

    // حفظ دالة إلغاء الاشتراك
    if (unsubscribeMessages && typeof unsubscribeMessages === 'function') {
      setUnsubscribeFunctions(prev => ({
        ...prev,
        messages: unsubscribeMessages
      }));
    }

    return unsubscribeMessages;
  }, [currentUser?.uid, unsubscribeFunctions]);

  const handleOpenGroupChat = useCallback(() => {
    if (!currentUser?.group) {
      toast({
        title: "تنبيه",
        description: "أنت غير منضم لأي مجموعة حالياً",
        variant: "warning"
      });
      return;
    }

    setIsGroupChatOpen(true);
    setMessagesLoading(true);

    // Clean previous
    if (unsubscribeFunctions.groupMessages) {
      unsubscribeFunctions.groupMessages();
    }

    const unsubscribe = getGroupMessages(currentUser.group, (msgs) => {
      setGroupMessages(msgs || []);
      setMessagesLoading(false);
    });

    setUnsubscribeFunctions(prev => ({
      ...prev,
      groupMessages: unsubscribe
    }));

  }, [currentUser]);

  const handleSendMessage = useCallback(async (message) => {
    if (!selectedStudent?.id || !currentUser?.uid || !message?.trim()) {
      toast({
        title: "خطأ",
        description: "لا يمكن إرسال الرسالة. تحقق من البيانات المطلوبة.",
        variant: "destructive"
      });
      return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) return;

    try {
      const senderName = getUserName(currentUser);
      const receiverName = getUserName(selectedStudent);

      await sendStudentMessage(
        currentUser.uid,
        selectedStudent.id,
        trimmedMessage,
        senderName,
        receiverName
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive"
      });
    }
  }, [selectedStudent, currentUser, getUserName]);

  const handleSendGroupMessage = useCallback(async (message) => {
    if (!currentUser?.group || !message?.trim()) return;

    try {
      const senderName = getUserName(currentUser);
      await sendGroupMessage(
        currentUser.group,
        currentUser.uid,
        senderName,
        'student',
        message.trim()
      );
    } catch (error) {
      console.error('Error sending group message:', error);
      toast({
        title: "خطأ",
        description: "فشل إرسال الرسالة للمجموعة",
        variant: "destructive"
      });
    }
  }, [currentUser, getUserName]);

  const formatLastMessageTime = useCallback((timestamp) => {
    if (!timestamp) return '';

    let date;
    try {
      date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

      // التحقق من صحة التاريخ
      if (isNaN(date.getTime())) {
        return '';
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      return '';
    }

    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'الآن';
    } else if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    } else if (diffInDays < 7) {
      return `منذ ${diffInDays} يوم`;
    } else {
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }, []);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
    setSelectedStudent(null);
    setChatMessages([]);

    // تنظيف اشتراك الرسائل عند إغلاق المحادثة
    if (unsubscribeFunctions.messages) {
      unsubscribeFunctions.messages();
      setUnsubscribeFunctions(prev => ({ ...prev, messages: null }));
    }
  }, [unsubscribeFunctions]);

  const handleCloseGroupChat = useCallback(() => {
    setIsGroupChatOpen(false);
    setGroupMessages([]);

    if (unsubscribeFunctions.groupMessages) {
      unsubscribeFunctions.groupMessages();
      setUnsubscribeFunctions(prev => ({ ...prev, groupMessages: null }));
    }
  }, [unsubscribeFunctions]);

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">يرجى تسجيل الدخول للوصول إلى المراسلات</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500">جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold gradient-text">المراسلات</h2>
        <Badge variant="outline" className="flex items-center gap-2 self-start sm:self-auto">
          <Users className="w-4 h-4" />
          <span>{availableStudents.length} طالب من مجموعتك</span>
        </Badge>
      </div>

      {/* Group Chat Card */}
      {currentUser.group && (
        <Card className="glass-effect border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 overflow-hidden">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Users2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-blue-900">مجموعة الصف ({currentUser.group})</h3>
                <p className="text-sm text-blue-700">تواصل مع جميع طلاب مجموعتك ومعلمك في مكان واحد</p>
              </div>
            </div>
            <Button onClick={handleOpenGroupChat} className="bg-blue-600 hover:bg-blue-700 text-white">
              <MessageCircle className="w-4 h-4 ml-2" />
              فتح المحادثة الجماعية
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* قائمة المحادثات الحالية */}
        <Card className="glass-effect border-0 shadow-xl order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              المحادثات الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  لا توجد محادثات بعد. ابدأ محادثة جديدة!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[35vh] sm:max-h-[350px] lg:max-h-[400px] overflow-y-auto pr-2 scroll-touch">
                {conversations.map((conv) => {
                  if (!conv) return null;

                  const otherUserId = conv.senderId === currentUser.uid ? conv.receiverId : conv.senderId;
                  const otherUser = availableStudents.find(s => s?.id === otherUserId);

                  if (!otherUser) return null;

                  return (
                    <div
                      key={conv.id || `conv-${otherUserId}`}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors active:scale-[0.98]"
                      onClick={() => handleStartChat(otherUser)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStartChat(otherUser);
                        }
                      }}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(getUserName(otherUser))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium text-sm truncate">
                          {getUserName(otherUser)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conv.message || 'آخر رسالة...'}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {formatLastMessageTime(conv.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* قائمة الطلاب المتاحين */}
        <Card className="glass-effect border-0 shadow-xl order-1 lg:order-2">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="w-5 h-5 text-green-600" />
              الطلاب المتاحين
            </CardTitle>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
                aria-label="بحث عن طالب"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب متاحين'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[40vh] sm:max-h-[350px] lg:max-h-[400px] overflow-y-auto pr-2 scroll-touch">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors active:scale-[0.98]"
                    onClick={() => handleStartChat(student)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStartChat(student);
                      }
                    }}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {getInitials(getUserName(student))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium text-sm truncate">
                        {getUserName(student)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0 min-w-[40px] min-h-[40px]"
                      aria-label={`مراسلة ${getUserName(student)}`}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نافذة المحادثة الفردية */}
      {isChatOpen && selectedStudent && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          currentUser={currentUser}
          targetUser={selectedStudent}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={messagesLoading}
          targetUserName={getUserName(selectedStudent)}
        />
      )}

      {/* نافذة المحادثة الجماعية */}
      {isGroupChatOpen && (
        <ChatModal
          isOpen={isGroupChatOpen}
          onClose={handleCloseGroupChat}
          currentUser={currentUser}
          targetUser={null} // لا يوجد مستخدم مستهدف معين
          messages={groupMessages}
          onSendMessage={handleSendGroupMessage}
          isLoading={messagesLoading}
          isGroup={true}
          groupName={currentUser.group}
        />
      )}
    </motion.div>
  );
};
