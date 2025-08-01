// TeacherStudentsManager.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Users, UserPlus, MessageSquare, Mail, Edit, Trash2, Send, Download, ChevronDown, Menu, Upload, FileSpreadsheet } from 'lucide-react';
import { auth as studentAuth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  doc, setDoc, updateDoc, deleteDoc, collection, addDoc,
  query, where, orderBy, onSnapshot, Timestamp, serverTimestamp,
  getDocs, getDoc, limit
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { ChatModal } from '@/components/common/ChatModal';
import { Progress } from '@/components/ui/progress';
import * as XLSX from 'xlsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const TeacherStudentsManager = ({ students, onStudentsUpdate }) => {
  const { currentUser } = useAuth();

  const [manageStudentOpen, setManageStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentData, setStudentData] = useState({ name: "", email: "", password: "", group: "", code: "", phone: "" });
  const [isGeneratingCredentials, setIsGeneratingCredentials] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('الكل');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log("manageStudentOpen:", manageStudentOpen, "editingStudent:", editingStudent);
    if (manageStudentOpen && !editingStudent) {
      const generateNewStudentCredentials = async () => {
        setIsGeneratingCredentials(true);
        try {
          const settingsRef = doc(db, "platformSettings", "main");
          const settingsSnap = await getDoc(settingsRef);
          
          if (!settingsSnap.exists()) {
            throw new Error("Platform settings not found. Please ensure 'platformSettings/main' document exists in Firestore.");
          }

          const settingsData = settingsSnap.data();
          const startingCode = settingsData?.studentStartingCodeNumber || 1000;
          const emailDomain = settingsData?.emailDomain || "@maharat.eg";

          const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('code', 'desc'), limit(1));
          const snapshot = await getDocs(q);
          
          let newCode = startingCode;
          if (!snapshot.empty) {
            const lastStudentCode = parseInt(snapshot.docs[0]?.data()?.code);
            if (!isNaN(lastStudentCode) && lastStudentCode >= startingCode) {
              newCode = lastStudentCode + 1;
            } else {
              newCode = startingCode;
            }
          }
          
          const generatedEmail = `${newCode}${emailDomain}`;

          setStudentData(prev => ({
            ...prev,
            code: newCode.toString(),
            email: generatedEmail
          }));
        } catch (error) {
          console.error('خطأ في توليد بيانات الطالب:', error);
          toast({ title: "خطأ في توليد البيانات", description: error.message || "يرجى التأكد من توفر إعدادات المنصة ووجود اتصال بالإنترنت.", variant: "destructive" });
        } finally {
          setIsGeneratingCredentials(false);
        }
      };
      generateNewStudentCredentials();
    } else if (!manageStudentOpen && !editingStudent) {
      setStudentData({ name: "", email: "", password: "", group: "", code: "", phone: "" });
    }
  }, [manageStudentOpen, editingStudent]);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [currentTargetUser, setCurrentTargetUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [allTeacherMessages, setAllTeacherMessages] = useState([]);
  const [messagesIndexReady, setMessagesIndexReady] = useState(false);
  const [massMessageModalOpen, setMassMessageModalOpen] = useState(false);
  const [massMessageContent, setMassMessageContent] = useState('');
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  const [processedStudents, setProcessedStudents] = useState([]);

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

  useEffect(() => {
    const fetchStudentProgress = async () => {
      try {
        const lessonsSnapshot = await getDocs(collection(db, 'lessons'));
        const totalLessons = lessonsSnapshot.size;

        const updatedStudents = await Promise.all(
          students.map(async (student) => {
            const progressDocRef = doc(db, 'studentProgress', student.id);
            const progressSnap = await getDoc(progressDocRef);

            let completedLessonsCount = 0;
            if (progressSnap.exists()) {
              const data = progressSnap.data();
              if (Array.isArray(data.completedLessons)) {
                completedLessonsCount = data.completedLessons.length;
              }
            }

            return {
              ...student,
              completedLessonsCount,
              totalLessons,
            };
          })
        );

        setProcessedStudents(updatedStudents);
      } catch (err) {
        console.error('خطأ أثناء تحميل بيانات التقدم:', err);
      }
    };

    if (students.length > 0) {
      fetchStudentProgress();
    }
  }, [students]);

  const handleManageStudent = async (e) => {
    e.preventDefault();
    const { name, email, password, group, code, phone } = studentData;

    if (!name || (!editingStudent && !email) || (!editingStudent && !password) || (!editingStudent && !code)) {
      toast({ title: 'البيانات غير مكتملة', variant: 'destructive' });
      return;
    }

    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'users', editingStudent.id), { name, group, phone });
        toast({ title: 'تم تحديث بيانات الطالب' });
      } else {
        const userCredential = await createUserWithEmailAndPassword(studentAuth, email, password);
        const user = userCredential.user;
        await studentAuth.signOut();

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          email,
          group,
          code,
          phone,
          password,
          role: 'student',
          createdAt: Timestamp.now(),
        });
        toast({ title: 'تم إضافة الطالب' });
      }

      setStudentData({ name: "", password: "", group: "", phone: "" });
      setEditingStudent(null);
      onStudentsUpdate();
    } catch (error) {
      console.error("Error during student creation or teacher re-authentication:", error);
      toast({ title: 'خطأ في الحفظ', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentData({ name: student.name, email: student.email, password: '', group: student.group || '', code: student.code || '', phone: student.phone || '' });
    setManageStudentOpen(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('هل أنت متأكد من حذف الطالب؟')) {
      await deleteDoc(doc(db, 'users', studentId));
      toast({ title: 'تم الحذف' });
      onStudentsUpdate();
    }
  };

  const handleSendMassMessage = async () => {
    const targetStudents = selectedGroup === 'الكل'
      ? students
      : students.filter(s => (s.group || 'بدون مجموعة') === selectedGroup);

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

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast({ title: 'يرجى اختيار ملف', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      const data = await uploadFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
      }

      // التحقق من الأعمدة المطلوبة
      const requiredColumns = ['الاسم'];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        throw new Error(`الأعمدة المطلوبة مفقودة: ${missingColumns.join(', ')}`);
      }

      // الحصول على إعدادات المنصة
      const settingsRef = doc(db, "platformSettings", "main");
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        throw new Error("إعدادات المنصة غير موجودة");
      }

      const settingsData = settingsSnap.data();
      const startingCode = settingsData?.studentStartingCodeNumber || 1000;
      const emailDomain = settingsData?.emailDomain || "@maharat.eg";

      // الحصول على آخر كود مستخدم
      const q = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('code', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      
      let currentCode = startingCode;
      if (!snapshot.empty) {
        const lastStudentCode = parseInt(snapshot.docs[0]?.data()?.code);
        if (!isNaN(lastStudentCode) && lastStudentCode >= startingCode) {
          currentCode = lastStudentCode + 1;
        }
      }

      const results = {
        success: [],
        errors: [],
        total: jsonData.length
      };

      // معالجة كل طالب
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        setUploadProgress(Math.round(((i + 1) / jsonData.length) * 100));

        try {
          const studentName = row['الاسم']?.toString().trim();
          if (!studentName) {
            results.errors.push(`الصف ${i + 2}: اسم الطالب مطلوب`);
            continue;
          }

          // توليد البيانات تلقائياً
          const studentCode = currentCode.toString();
          const studentEmail = `${currentCode}${emailDomain}`;
          const studentPassword = row['كلمة المرور']?.toString().trim() || studentCode; // استخدام الكود ككلمة مرور افتراضية
          const studentGroup = row['المجموعة']?.toString().trim() || '';
          const studentPhone = row['رقم الهاتف']?.toString().trim() || '';

          // إنشاء حساب Firebase
          const userCredential = await createUserWithEmailAndPassword(studentAuth, studentEmail, studentPassword);
          const user = userCredential.user;
          await studentAuth.signOut();

          // حفظ بيانات الطالب في Firestore
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: studentName,
            email: studentEmail,
            group: studentGroup,
            code: studentCode,
            phone: studentPhone,
            password: studentPassword,
            role: 'student',
            createdAt: Timestamp.now(),
          });

          results.success.push({
            name: studentName,
            email: studentEmail,
            code: studentCode,
            group: studentGroup
          });

          currentCode++;
        } catch (error) {
          console.error(`خطأ في إضافة الطالب ${row['الاسم']}:`, error);
          results.errors.push(`الصف ${i + 2} (${row['الاسم']}): ${error.message}`);
        }
      }

      setUploadResults(results);
      
      if (results.success.length > 0) {
        toast({ 
          title: `تم إضافة ${results.success.length} طالب بنجاح`,
          description: results.errors.length > 0 ? `فشل في إضافة ${results.errors.length} طالب` : undefined
        });
        onStudentsUpdate();
      } else {
        toast({ 
          title: 'فشل في إضافة الطلاب', 
          description: 'لم يتم إضافة أي طالب بنجاح',
          variant: 'destructive' 
        });
      }

    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      toast({ 
        title: 'خطأ في رفع الملف', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'الاسم': 'أحمد محمد',
        'كلمة المرور': '1001', // اختياري - سيتم استخدام الكود كافتراضي
        'المجموعة': 'مجموعة 1', // اختياري
        'رقم الهاتف': '01234567890' // اختياري
      },
      {
        'الاسم': 'فاطمة علي',
        'كلمة المرور': '',
        'المجموعة': 'مجموعة 2',
        'رقم الهاتف': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج الطلاب');

    XLSX.writeFile(workbook, 'نموذج_إضافة_الطلاب.xlsx');
    
    toast({ 
      title: 'تم تحميل النموذج', 
      description: 'يمكنك ملء البيانات وإعادة رفع الملف' 
    });
  };

  const exportToExcel = () => {
    try {
      const dataToExport = filteredStudents.map((student, index) => ({
        'الرقم': index + 1,
        'الاسم': student.name || '',
        'البريد الإلكتروني': student.email || '',
        'الكود': student.code || '',
        'كلمة المرور': student.password || '',
        'رقم الهاتف': student.phone || '',
        'المجموعة': student.group || 'بدون مجموعة',
        'تاريخ التسجيل': student.createdAt 
          ? new Date(student.createdAt.seconds * 1000).toLocaleDateString('ar-EG')
          : 'غير معروف',
        'الدروس المكتملة': typeof student.completedLessonsCount === 'number' 
          ? `${student.completedLessonsCount} / ${student.totalLessons || 0}`
          : 'لا بيانات',
        'نسبة التقدم': typeof student.completedLessonsCount === 'number' && student.totalLessons > 0
          ? `${Math.round((student.completedLessonsCount / student.totalLessons) * 100)}%`
          : '0%'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const columnWidths = [
        { wch: 8 }, { wch: 20 }, { wch: 25 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'بيانات الطلاب');

      const now = new Date();
      const dateStr = now.toLocaleDateString('ar-EG').replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('ar-EG', { hour12: false }).replace(/:/g, '-');
      const groupName = selectedGroup === 'الكل' ? 'جميع_الطلاب' : selectedGroup.replace(/\s+/g, '_');
      const fileName = `بيانات_الطلاب_${groupName}_${dateStr}_${timeStr}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      
      toast({ 
        title: 'تم تصدير البيانات بنجاح', 
        description: `تم تحميل ملف ${fileName}` 
      });
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      toast({ 
        title: 'خطأ في التصدير', 
        description: 'حدث خطأ أثناء تصدير البيانات إلى ملف إكسل',
        variant: 'destructive' 
      });
    }
  };

  const groups = ['الكل', ...new Set(processedStudents.map(s => s.group || 'بدون مجموعة'))];

  const filteredStudents = selectedGroup === 'الكل'
    ? processedStudents
    : processedStudents.filter(s => (s.group || 'بدون مجموعة') === selectedGroup);

  const openChatWithStudent = (student) => {
    setCurrentTargetUser(student);
    setChatModalOpen(true);
  };

  // دالة لتحديد الأعمدة التي تظهر على الأجهزة الصغيرة
  const shouldShowColumn = (columnName) => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth > 768 || ['الاسم', 'المجموعة', 'التقدّم', 'خيارات'].includes(columnName);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 p-2 md:p-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> 
            <span className="text-lg md:text-xl">إدارة الطلاب</span>
          </CardTitle>
          
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-2 items-stretch md:items-center">
            {/* Mobile menu button */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Menu className="w-4 h-4 ml-2" /> القائمة
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setMassMessageModalOpen(true)}>
                    <MessageSquare className="w-4 h-4 ml-2" /> رسالة للمجموعة
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel}>
                    <Download className="w-4 h-4 ml-2" /> تصدير إكسل
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkUploadModalOpen(true)}>
                    <Upload className="w-4 h-4 ml-2" /> رفع ملف إكسيل
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadTemplate}>
                    <FileSpreadsheet className="w-4 h-4 ml-2" /> تحميل النموذج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <select 
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(e.target.value)} 
              className="border px-3 py-2 rounded-md text-sm w-full md:w-auto"
            >
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <div className="hidden md:flex gap-2">
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
              >
                <FileSpreadsheet className="w-4 h-4 ml-2" /> 
                تحميل النموذج
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setBulkUploadModalOpen(true)}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
              >
                <Upload className="w-4 h-4 ml-2" /> 
                رفع ملف إكسيل
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToExcel}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                <Download className="w-4 h-4 ml-2" /> 
                تصدير إكسل
              </Button>
              <Button variant="outline" onClick={() => setMassMessageModalOpen(true)}>
                <MessageSquare className="w-4 h-4 ml-2" /> رسالة للمجموعة
              </Button>
            </div>

            <Dialog open={manageStudentOpen} onOpenChange={(v) => { setManageStudentOpen(v); if (!v) setEditingStudent(null); }}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <UserPlus className="w-4 h-4 ml-2" /> 
                  {editingStudent ? 'تعديل طالب' : 'إضافة طالب'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleManageStudent} className="space-y-4">
                  <div>
                    <Label>الاسم</Label>
                    <Input value={studentData.name} onChange={(e) => setStudentData({ ...studentData, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>الكود</Label>
                    <Input value={studentData.code} onChange={(e) => setStudentData({ ...studentData, code: e.target.value })} readOnly />
                  </div>
                  <div>
                    <Label>البريد</Label>
                    <Input type="email" value={studentData.email} onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} required readOnly />
                  </div>
                  <div>
                    <Label>المجموعة</Label>
                    <Input value={studentData.group} onChange={(e) => setStudentData({ ...studentData, group: e.target.value })} placeholder="مثل: مجموعة 1" />
                  </div>
                  <div>
                    <Label>رقم الهاتف (اختياري)</Label>
                    <Input type="tel" value={studentData.phone} onChange={(e) => setStudentData({ ...studentData, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>كلمة المرور {editingStudent && '(اختياري)'}</Label>
                    <Input type="password" value={studentData.password} onChange={(e) => setStudentData({ ...studentData, password: e.target.value })} required={!editingStudent} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full md:w-auto">
                      {editingStudent ? 'حفظ التعديل' : 'إضافة الطالب'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-center py-10 text-gray-500">لا يوجد طلاب في هذه المجموعة</p>
          ) : (
            <div className="overflow-x-auto">
  <Table className="min-w-full border-collapse border border-gray-300" dir="rtl">
    <TableHeader>
      <TableRow className="bg-gray-100 text-gray-700 text-sm border-b border-gray-300">
        {shouldShowColumn('الاسم') && <TableHead className="font-semibold text-center border-l border-gray-300">الاسم</TableHead>}
        {shouldShowColumn('البريد الإلكتروني') && <TableHead className="font-semibold text-center border-l border-gray-300">البريد الإلكتروني</TableHead>}
        {shouldShowColumn('الكود') && <TableHead className="font-semibold text-center border-l border-gray-300">الكود</TableHead>}
        {shouldShowColumn('الرقم السري') && <TableHead className="font-semibold text-center border-l border-gray-300">الرقم السري</TableHead>}
        {shouldShowColumn('رقم الهاتف') && <TableHead className="font-semibold text-center border-l border-gray-300">رقم الهاتف</TableHead>}
        {shouldShowColumn('المجموعة') && <TableHead className="font-semibold text-center border-l border-gray-300">المجموعة</TableHead>}
        {shouldShowColumn('تاريخ التسجيل') && <TableHead className="font-semibold text-center border-l border-gray-300">تاريخ التسجيل</TableHead>}
        {shouldShowColumn('التقدّم') && <TableHead className="font-semibold text-center border-l border-gray-300">التقدّم</TableHead>}
        <TableHead className="font-semibold text-center">خيارات</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredStudents.map(student => (
        <TableRow key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
          {shouldShowColumn('الاسم') && <TableCell className="border-l border-gray-200 text-right">{student.name}</TableCell>}
          {shouldShowColumn('البريد الإلكتروني') && <TableCell className="border-l border-gray-200 text-right">{student.email}</TableCell>}
          {shouldShowColumn('الكود') && <TableCell className="border-l border-gray-200 text-right">{student.code}</TableCell>}
          {shouldShowColumn('الرقم السري') && <TableCell className="border-l border-gray-200 text-right">{student.password}</TableCell>}
          {shouldShowColumn('رقم الهاتف') && <TableCell className="border-l border-gray-200 text-right">{student.phone}</TableCell>}
          {shouldShowColumn('المجموعة') && <TableCell className="border-l border-gray-200 text-right">{student.group || 'بدون مجموعة'}</TableCell>}
          {shouldShowColumn('تاريخ التسجيل') && (
            <TableCell className="border-l border-gray-200 text-right">
              {student.createdAt ? new Date(student.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : 'غير معروف'}
            </TableCell>
          )}
          {shouldShowColumn('التقدّم') && (
            <TableCell className="border-l border-gray-200">
              {typeof student.completedLessonsCount === 'number' && student.totalLessons > 0 ? (
                <div className="flex flex-col gap-1 text-right">
                  {student.completedLessonsCount} / {student.totalLessons} دروس مكتملة
                  <br />
                  <Progress value={Math.round((student.completedLessonsCount / student.totalLessons) * 100)} />
                  <div className="text-xs text-muted-foreground">
                    {Math.round((student.completedLessonsCount / student.totalLessons) * 100)}%
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground text-right">لا بيانات</span>
              )}
            </TableCell>
          )}
          <TableCell className="text-center space-x-1 space-x-reverse">
            <Button size="sm" onClick={() => openChatWithStudent(student)}><Mail className="w-4 h-4" /></Button>
            <Button size="sm" onClick={() => handleEditStudent(student)}><Edit className="w-4 h-4" /></Button>
            <Button size="sm" onClick={() => handleDeleteStudent(student.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">المجموع الكلي: {filteredStudents.length} طالب</CardFooter>
      </Card>

      <Dialog open={massMessageModalOpen} onOpenChange={setMassMessageModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال رسالة إلى {selectedGroup}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>محتوى الرسالة</Label>
            <Textarea 
              value={massMessageContent} 
              onChange={(e) => setMassMessageContent(e.target.value)} 
              rows={4}
              className="min-h-[150px]"
            />
            <DialogFooter>
              <Button onClick={handleSendMassMessage} className="w-full md:w-auto">
                <Send className="w-4 h-4 ml-2" /> إرسال
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkUploadModalOpen} onOpenChange={setBulkUploadModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>رفع ملف إكسيل لإضافة مجموعة طلاب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p className="font-semibold mb-2">تعليمات:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>يجب أن يحتوي الملف على عمود "الاسم" كحد أدنى</li>
                <li>سيتم توليد الكود والبريد الإلكتروني تلقائياً</li>
                <li>الأعمدة الاختيارية: كلمة المرور، المجموعة، رقم الهاتف</li>
                <li>إذا لم تحدد كلمة مرور، سيتم استخدام الكود كافتراضي</li>
              </ul>
            </div>

            <div>
              <Label>اختر ملف إكسيل (.xlsx)</Label>
              <Input 
                type="file" 
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="mt-2"
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>جاري الرفع...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {uploadResults && (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">نتائج الرفع:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-green-700 font-bold">{uploadResults.success.length}</div>
                      <div className="text-xs text-green-600">نجح</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-red-700 font-bold">{uploadResults.errors.length}</div>
                      <div className="text-xs text-red-600">فشل</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-blue-700 font-bold">{uploadResults.total}</div>
                      <div className="text-xs text-blue-600">المجموع</div>
                    </div>
                  </div>
                </div>

                {uploadResults.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto bg-red-50 p-2 rounded text-xs">
                    <div className="font-semibold text-red-700 mb-1">الأخطاء:</div>
                    {uploadResults.errors.map((error, index) => (
                      <div key={index} className="text-red-600">{error}</div>
                    ))}
                  </div>
                )}

                {uploadResults.success.length > 0 && (
                  <div className="max-h-32 overflow-y-auto bg-green-50 p-2 rounded text-xs">
                    <div className="font-semibold text-green-700 mb-1">تم إضافة:</div>
                    {uploadResults.success.map((student, index) => (
                      <div key={index} className="text-green-600">
                        {student.name} - {student.email} - {student.code}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="flex-1"
              >
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                تحميل النموذج
              </Button>
              <Button 
                onClick={handleBulkUpload}
                disabled={!uploadFile || isUploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 ml-2" />
                {isUploading ? 'جاري الرفع...' : 'رفع الملف'}
              </Button>
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
            setMessages(prev => prev.filter(msg => !deletedIds.includes(msg.id)));
          }}
          className="max-w-[95vw] w-[95vw] md:max-w-md md:w-full"
        />
      )}
    </motion.div>
  );
};