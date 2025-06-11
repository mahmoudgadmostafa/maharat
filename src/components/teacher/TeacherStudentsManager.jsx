
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, UserPlus, Eye, Mail, Users, MessageSquare, Send } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth as studentAuth, db } from '@/lib/firebase'; 
import { doc, setDoc, deleteDoc, updateDoc, collection, addDoc, query, where, onSnapshot, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';
import { TeacherStudentsProgress } from '@/components/teacher/TeacherStudentsProgress';
import { ChatModal } from '@/components/common/ChatModal';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";


export const TeacherStudentsManager = ({ students, onStudentsUpdate, lessons, studentProgress }) => {
  const { currentUser } = useAuth();
  const [manageStudentOpen, setManageStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentData, setStudentData] = useState({ name: '', email: '', password: '' });
  const [viewingProgressStudent, setViewingProgressStudent] = useState(null);
  
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [currentTargetUser, setCurrentTargetUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allTeacherMessages, setAllTeacherMessages] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [massMessageModalOpen, setMassMessageModalOpen] = useState(false);
  const [massMessageContent, setMassMessageContent] = useState('');
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
        querySnapshot.forEach((doc) => {
            msgs.push({ id: doc.id, ...doc.data()});
        });
        setAllTeacherMessages(msgs);
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
    if (!chatModalOpen || !currentUser || !currentTargetUser) {
      setMessages([]);
      return;
    }
    
    const relevantMessages = allTeacherMessages.filter(msg => msg.participants.includes(currentTargetUser.id));
    setMessages(relevantMessages);

  }, [chatModalOpen, currentUser, currentTargetUser, allTeacherMessages]);

  const handleSendMessage = async (messageContent) => {
    if (!currentUser || !currentTargetUser || !messageContent.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        participants: [currentUser.uid, currentTargetUser.id].sort(), 
        senderId: currentUser.uid,
        receiverId: currentTargetUser.id,
        message: messageContent,
        timestamp: serverTimestamp(),
        readBy: { [currentUser.uid]: true, [currentTargetUser.id]: false }
      });
      toast({ title: "تم إرسال الرسالة" });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "خطأ في إرسال الرسالة", variant: "destructive" });
    }
  };

  const handleDeleteMessagesInChat = (deletedMessageIds) => {
    setAllTeacherMessages(prev => prev.filter(msg => !deletedMessageIds.includes(msg.id)));
  };

  const openChatWithStudent = (student) => {
    setCurrentTargetUser(student);
    setChatModalOpen(true);
  };

  const handleManageStudent = async (e) => {
    e.preventDefault();
    if (!studentData.name || !studentData.email || (!editingStudent && !studentData.password)) {
      toast({ title: "بيانات غير مكتملة", description: "يرجى ملء جميع الحقول المطلوبة.", variant: "destructive" });
      return;
    }

    try {
      if (editingStudent) {
        const studentRef = doc(db, 'users', editingStudent.id);
        await updateDoc(studentRef, { name: studentData.name, email: studentData.email });
        toast({ title: "تم تحديث بيانات الطالب" });
      } else {
        const userCredential = await createUserWithEmailAndPassword(studentAuth, studentData.email, studentData.password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: studentData.name,
          email: studentData.email,
          role: 'student',
          createdAt: Timestamp.now(),
        });
        toast({ title: "تم إضافة الطالب بنجاح" });
      }
      setStudentData({ name: '', email: '', password: '' });
      setManageStudentOpen(false);
      setEditingStudent(null);
      onStudentsUpdate();
    } catch (error) {
      console.error("Error managing student:", error);
      toast({ title: "خطأ في إدارة الطالب", description: error.message.includes('email-already-in-use') ? "البريد الإلكتروني مستخدم بالفعل." : `حدث خطأ: ${error.message}`, variant: "destructive" });
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentData({ name: student.name, email: student.email, password: '' });
    setManageStudentOpen(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف حسابه وبياناته بشكل دائم.')) {
      try {
        await deleteDoc(doc(db, 'users', studentId));
        await deleteDoc(doc(db, 'studentProgress', studentId)).catch(() => {});
        toast({ title: "تم حذف الطالب" });
        onStudentsUpdate();
      } catch (error) {
        console.error("Error deleting student:", error);
        toast({ title: "خطأ في حذف الطالب", variant: "destructive" });
      }
    }
  };

  const handleSelectStudent = (studentId, checked) => {
    setSelectedStudents(prev => 
      checked ? [...prev, studentId] : prev.filter(id => id !== studentId)
    );
  };

  const handleSelectAllStudents = (checked) => {
    setSelectedStudents(checked ? students.map(s => s.id) : []);
  };
  
  const openMassMessageModal = () => {
    if (selectedStudents.length === 0) {
      toast({ title: "لم يتم تحديد طلاب", description: "يرجى تحديد طالب واحد على الأقل لإرسال رسالة جماعية.", variant: "default" });
      return;
    }
    setMassMessageModalOpen(true);
  };

  const handleSendMassMessage = async () => {
    if (!massMessageContent.trim() || selectedStudents.length === 0 || !currentUser) {
      toast({ title: "بيانات غير كافية", description: "يرجى كتابة رسالة واختيار الطلاب.", variant: "destructive" });
      return;
    }
    try {
      const batchPromises = selectedStudents.map(studentId => 
        addDoc(collection(db, 'messages'), {
          participants: [currentUser.uid, studentId].sort(),
          senderId: currentUser.uid,
          receiverId: studentId,
          message: massMessageContent,
          timestamp: serverTimestamp(),
          readBy: { [currentUser.uid]: true, [studentId]: false },
          isMassMessage: true
        })
      );
      await Promise.all(batchPromises);
      toast({ title: `تم إرسال الرسالة إلى ${selectedStudents.length} طالب/طلاب` });
      setMassMessageContent('');
      setMassMessageModalOpen(false);
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error sending mass message:", error);
      toast({ title: "خطأ في إرسال الرسالة الجماعية", variant: "destructive" });
    }
  };


  if (viewingProgressStudent) {
    return <TeacherStudentsProgress student={viewingProgressStudent} lessons={lessons} progress={studentProgress[viewingProgressStudent.id] || { completedLessons: [] }} onBack={() => setViewingProgressStudent(null)} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" /> إدارة الطلاب
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={openMassMessageModal} variant="outline" disabled={selectedStudents.length === 0 || !messagesIndexReady}>
                <MessageSquare className="w-4 h-4 ml-2" /> إرسال لمجموعة ({selectedStudents.length})
              </Button>
              <Dialog open={manageStudentOpen} onOpenChange={(open) => { setManageStudentOpen(open); if (!open) { setEditingStudent(null); setStudentData({ name: '', email: '', password: '' }); } }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700">
                    <UserPlus className="w-4 h-4 ml-2" /> {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle className="text-center text-2xl gradient-text">{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</DialogTitle></DialogHeader>
                  <form onSubmit={handleManageStudent} className="space-y-4 pt-4">
                    <div><Label htmlFor="studentName">اسم الطالب</Label><Input id="studentName" type="text" value={studentData.name} onChange={(e) => setStudentData({ ...studentData, name: e.target.value })} required className="mt-1" /></div>
                    <div><Label htmlFor="studentEmail">البريد الإلكتروني</Label><Input id="studentEmail" type="email" value={studentData.email} onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} required className="mt-1" /></div>
                    <div><Label htmlFor="studentPassword">كلمة المرور {editingStudent && "(اتركها فارغة لعدم التغيير)"}</Label><Input id="studentPassword" type="password" value={studentData.password} onChange={(e) => setStudentData({ ...studentData, password: e.target.value })} required={!editingStudent} className="mt-1" placeholder={editingStudent ? "جديدة إذا أردت التغيير" : "كلمة مرور قوية"} /></div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-sky-600">{editingStudent ? 'تحديث البيانات' : 'إضافة الطالب'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <CardDescription>إضافة، تعديل، أو حذف حسابات الطلاب، متابعة تقدمهم، وإرسال رسائل.</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-10"><Users className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-600">لا يوجد طلاب مضافون بعد</h3><p className="text-gray-500">انقر على "إضافة طالب جديد" لبدء تسجيل الطلاب.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedStudents.length === students.length && students.length > 0}
                      onCheckedChange={(checked) => handleSelectAllStudents(checked)}
                      aria-label="تحديد الكل"
                    />
                  </TableHead>
                  <TableHead>اسم الطالب</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked)}
                        aria-label={`تحديد ${student.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.createdAt ? new Date(student.createdAt.seconds ? student.createdAt.seconds * 1000 : student.createdAt).toLocaleDateString('ar-EG') : 'غير معروف'}</TableCell>
                    <TableCell className="text-center space-x-1 space-x-reverse">
                      <Button variant="outline" size="sm" className="hover:bg-purple-500/10 hover:text-purple-600" onClick={() => openChatWithStudent(student)} disabled={!messagesIndexReady}><Mail className="w-3.5 h-3.5" /></Button>
                      <Button variant="outline" size="sm" className="hover:bg-green-500/10 hover:text-green-600" onClick={() => setViewingProgressStudent(student)}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="outline" size="sm" className="hover:bg-blue-500/10 hover:text-blue-600" onClick={() => handleEditStudent(student)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-500/10 hover:text-red-700" onClick={() => handleDeleteStudent(student.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {students.length > 0 && (<CardFooter className="text-sm text-muted-foreground">إجمالي الطلاب المسجلين: {students.length}</CardFooter>)}
      </Card>

      {chatModalOpen && currentTargetUser && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => { setChatModalOpen(false); setCurrentTargetUser(null); }}
          currentUser={currentUser}
          targetUser={currentTargetUser}
          messages={messages}
          onSendMessage={handleSendMessage}
          onDeleteMessages={handleDeleteMessagesInChat}
        />
      )}

      <Dialog open={massMessageModalOpen} onOpenChange={setMassMessageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال رسالة جماعية</DialogTitle>
            <DialogDescription>
              سيتم إرسال هذه الرسالة إلى {selectedStudents.length} طالب/طلاب محددين.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="اكتب رسالتك هنا..."
              value={massMessageContent}
              onChange={(e) => setMassMessageContent(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMassMessageModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSendMassMessage} className="bg-gradient-to-r from-blue-500 to-sky-600">
              <Send className="w-4 h-4 ml-2" /> إرسال الرسالة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};
