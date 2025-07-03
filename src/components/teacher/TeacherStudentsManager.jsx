// TeacherStudentsManager.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Users, UserPlus, MessageSquare, Mail, Edit, Eye, Trash2, Send } from 'lucide-react';
import { auth as studentAuth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc, collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { ChatModal } from '@/components/common/ChatModal';

export const TeacherStudentsManager = ({ students, onStudentsUpdate }) => {
  const { currentUser } = useAuth();
  const [manageStudentOpen, setManageStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentData, setStudentData] = useState({ name: '', email: '', password: '', group: '' });
  const [selectedGroup, setSelectedGroup] = useState('الكل');

  // === الرسائل
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [currentTargetUser, setCurrentTargetUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allTeacherMessages, setAllTeacherMessages] = useState([]);
  const [messagesIndexReady, setMessagesIndexReady] = useState(false);

  // === رسائل جماعية
  const [massMessageModalOpen, setMassMessageModalOpen] = useState(false);
  const [massMessageContent, setMassMessageContent] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setMessagesIndexReady(true);
  }, [currentUser]);

  useEffect(() => {
    if (!messagesIndexReady) return;
    const q = query(collection(db, 'messages'), where('participants', 'array-contains', currentUser.uid), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
      setAllTeacherMessages(msgs);
    });
    return () => unsubscribe();
  }, [messagesIndexReady]);

  useEffect(() => {
    if (!chatModalOpen || !currentTargetUser) return;
    const filtered = allTeacherMessages.filter(msg => msg.participants.includes(currentTargetUser.id));
    setMessages(filtered);
  }, [chatModalOpen, currentTargetUser, allTeacherMessages]);

  const openChatWithStudent = (student) => {
    setCurrentTargetUser(student);
    setChatModalOpen(true);
  };

  const handleManageStudent = async (e) => {
    e.preventDefault();
    const { name, email, password, group } = studentData;
    if (!name || !email || (!editingStudent && !password)) {
      toast({ title: 'البيانات غير مكتملة', variant: 'destructive' });
      return;
    }

    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'users', editingStudent.id), { name, email, group });
        toast({ title: 'تم تحديث بيانات الطالب' });
      } else {
        const userCredential = await createUserWithEmailAndPassword(studentAuth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          email,
          group,
          role: 'student',
          createdAt: Timestamp.now(),
        });
        toast({ title: 'تم إضافة الطالب' });
        await studentAuth.signOut();
      }

      setStudentData({ name: '', email: '', password: '', group: '' });
      setEditingStudent(null);
      setManageStudentOpen(false);
      onStudentsUpdate();
    } catch (error) {
      toast({ title: 'خطأ في الحفظ', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentData({ name: student.name, email: student.email, password: '', group: student.group || '' });
    setManageStudentOpen(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('هل أنت متأكد من حذف الطالب؟')) {
      await deleteDoc(doc(db, 'users', studentId));
      toast({ title: 'تم الحذف' });
      onStudentsUpdate();
    }
  };

  const groups = ['الكل', ...new Set(students.map(s => s.group || 'بدون مجموعة'))];
  const filteredStudents = selectedGroup === 'الكل' ? students : students.filter(s => (s.group || 'بدون مجموعة') === selectedGroup);

  const handleSendMassMessage = async () => {
    const targetStudents = selectedGroup === 'الكل' ? students : students.filter(s => (s.group || 'بدون مجموعة') === selectedGroup);
    if (!massMessageContent.trim()) {
      toast({ title: 'يجب كتابة محتوى الرسالة', variant: 'destructive' });
      return;
    }
    for (const student of targetStudents) {
      await addDoc(collection(db, 'messages'), {
        participants: [currentUser.uid, student.id].sort(),
        senderId: currentUser.uid,
        receiverId: student.id,
        message: massMessageContent.trim(),
        timestamp: serverTimestamp(),
        readBy: { [currentUser.uid]: true, [student.id]: false }
      });
    }
    toast({ title: 'تم إرسال الرسالة' });
    setMassMessageContent('');
    setMassMessageModalOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> إدارة الطلاب
          </CardTitle>
          <div className="flex gap-2 items-center">
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="border px-3 py-1 rounded-md text-sm">
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <Button variant="outline" onClick={() => setMassMessageModalOpen(true)}><MessageSquare className="w-4 h-4 ml-2" /> رسالة للمجموعة</Button>
            <Dialog open={manageStudentOpen} onOpenChange={(v) => { setManageStudentOpen(v); if (!v) setEditingStudent(null); }}>
              <DialogTrigger asChild>
                <Button><UserPlus className="w-4 h-4 ml-2" /> {editingStudent ? 'تعديل طالب' : 'إضافة طالب'}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</DialogTitle></DialogHeader>
                <form onSubmit={handleManageStudent} className="space-y-4">
                  <div><Label>الاسم</Label><Input value={studentData.name} onChange={(e) => setStudentData({ ...studentData, name: e.target.value })} required /></div>
                  <div><Label>البريد</Label><Input type="email" value={studentData.email} onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} required /></div>
                  <div><Label>المجموعة</Label><Input value={studentData.group} onChange={(e) => setStudentData({ ...studentData, group: e.target.value })} placeholder="مثل: مجموعة 1" /></div>
                  <div><Label>كلمة المرور {editingStudent && '(اختياري)'}</Label><Input type="password" value={studentData.password} onChange={(e) => setStudentData({ ...studentData, password: e.target.value })} required={!editingStudent} /></div>
                  <DialogFooter><Button type="submit">{editingStudent ? 'حفظ التعديل' : 'إضافة الطالب'}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-center py-10 text-gray-500">لا يوجد طلاب في هذه المجموعة</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد</TableHead>
                  <TableHead>المجموعة</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.group || 'بدون مجموعة'}</TableCell>
                    <TableCell>{student.createdAt ? new Date(student.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : 'غير معروف'}</TableCell>
                    <TableCell className="text-center space-x-1 space-x-reverse">
                      <Button size="sm" onClick={() => openChatWithStudent(student)}><Mail className="w-4 h-4" /></Button>
                      <Button size="sm" onClick={() => handleEditStudent(student)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" onClick={() => handleDeleteStudent(student.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">المجموع الكلي: {filteredStudents.length} طالب</CardFooter>
      </Card>

      {/* Modal لإرسال رسالة للمجموعة */}
      <Dialog open={massMessageModalOpen} onOpenChange={setMassMessageModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال رسالة إلى {selectedGroup}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>محتوى الرسالة</Label>
            <Textarea value={massMessageContent} onChange={(e) => setMassMessageContent(e.target.value)} rows={4} />
            <DialogFooter>
              <Button onClick={handleSendMassMessage}><Send className="w-4 h-4 ml-2" /> إرسال</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {chatModalOpen && currentTargetUser && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => { setChatModalOpen(false); setCurrentTargetUser(null); }}
          currentUser={currentUser}
          targetUser={currentTargetUser}
          messages={messages}
          onSendMessage={(msg) => {
            addDoc(collection(db, 'messages'), {
              participants: [currentUser.uid, currentTargetUser.id].sort(),
              senderId: currentUser.uid,
              receiverId: currentTargetUser.id,
              message: msg,
              timestamp: serverTimestamp(),
              readBy: { [currentUser.uid]: true, [currentTargetUser.id]: false }
            });
          }}
            onDeleteMessages={(deletedIds) => {
              // حذف الرسائل من الحالة (إذا كنت تحتفظ بها محليًا)
              setMessages(prev => prev.filter(msg => !deletedIds.includes(msg.id)));
          }}
        />
      )}
    </motion.div>
  );
};