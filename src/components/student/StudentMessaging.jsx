import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Search, Users, Send } from 'lucide-react';
import { ChatModal } from '@/components/common/ChatModal';
import { 
  getAvailableStudents, 
  getUserConversations, 
  getMessagesBetweenUsers,
  sendStudentMessage 
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

  useEffect(() => {
    if (!currentUser) return;

    // جلب الطلاب المتاحين
    const fetchStudents = async () => {
      try {
        const students = await getAvailableStudents(currentUser.uid);
        setAvailableStudents(students);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "خطأ في جلب قائمة الطلاب",
          description: error.message,
          variant: "destructive"
        });
      }
    };

    // جلب المحادثات
    const unsubscribeConversations = getUserConversations(currentUser.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });

    fetchStudents();

    return () => {
      if (unsubscribeConversations) unsubscribeConversations();
    };
  }, [currentUser]);

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length === 1
      ? names[0].substring(0, 2).toUpperCase()
      : names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const filteredStudents = availableStudents.filter(student =>
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartChat = (student) => {
    setSelectedStudent(student);
    setIsChatOpen(true);

    // جلب الرسائل بين المستخدمين
    const unsubscribe = getMessagesBetweenUsers(
      currentUser.uid,
      student.id,
      (messages) => {
        setChatMessages(messages);
      }
    );

    return unsubscribe;
  };

  const handleSendMessage = async (message) => {
    if (!selectedStudent || !message.trim()) return;

    try {
      await sendStudentMessage(
        currentUser.uid,
        selectedStudent.id,
        message,
        currentUser.displayName || currentUser.email,
        selectedStudent.displayName || selectedStudent.email
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "خطأ في إرسال الرسالة",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'منذ قليل';
    } else if (diffInHours < 24) {
      return `منذ ${Math.floor(diffInHours)} ساعة`;
    } else {
      return date.toLocaleDateString('ar-EG');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold gradient-text">المراسلات</h2>
        <Badge variant="outline" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          {availableStudents.length} طالب متاح
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* قائمة المحادثات الحالية */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              المحادثات الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                لا توجد محادثات بعد. ابدأ محادثة جديدة!
              </p>
            ) : (
              <div className="space-y-3">
                {conversations.map((conv) => {
                  const otherUser = availableStudents.find(s => 
                    s.id === (conv.senderId === currentUser.uid ? conv.receiverId : conv.senderId)
                  );
                  
                  if (!otherUser) return null;

                  return (
                    <div
                      key={conv.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleStartChat(otherUser)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(otherUser.displayName || otherUser.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {otherUser.displayName || otherUser.email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conv.message}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
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
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              الطلاب المتاحين
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب متاحين'}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleStartChat(student)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(student.displayName || student.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {student.displayName || 'طالب'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {student.email}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نافذة المحادثة */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setSelectedStudent(null);
          setChatMessages([]);
        }}
        currentUser={currentUser}
        targetUser={selectedStudent}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />
    </motion.div>
  );
};

