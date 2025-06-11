import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, Edit, Trash2, CheckSquare } from 'lucide-react';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

export const TeacherLessonsManager = ({ lessons, onLessonsUpdate }) => {
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonData, setLessonData] = useState({
    lessonNumber: '',
    title: '',
    videoUrl: '',
    pdfUrl: '',
    quizUrl: ''
  });

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonData.title || !lessonData.lessonNumber) {
      toast({
        title: "بيانات غير مكتملة",
        description: "يرجى إدخال رقم الدرس وعنوانه.",
        variant: "destructive",
      });
      return;
    }
    try {
      if (editingLesson) {
        await updateDoc(doc(db, 'lessons', editingLesson.id), {
          ...lessonData,
          lessonNumber: parseInt(lessonData.lessonNumber),
          updatedAt: new Date().toISOString()
        });
        toast({
          title: "تم تحديث الدرس",
          description: "تم تحديث الدرس بنجاح",
        });
      } else {
        await addDoc(collection(db, 'lessons'), {
          ...lessonData,
          lessonNumber: parseInt(lessonData.lessonNumber),
          createdAt: new Date().toISOString()
        });
        toast({
          title: "تم إضافة الدرس",
          description: "تم إضافة الدرس بنجاح",
        });
      }
      
      setLessonData({ lessonNumber: '', title: '', videoUrl: '', pdfUrl: '', quizUrl: '' });
      setAddLessonOpen(false);
      setEditingLesson(null);
      onLessonsUpdate(); // Callback to refresh lessons in parent
    } catch (error) {
      toast({
        title: "خطأ في حفظ الدرس",
        description: `حدث خطأ أثناء حفظ الدرس: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonData({
      lessonNumber: lesson.lessonNumber.toString(),
      title: lesson.title,
      videoUrl: lesson.videoUrl || '',
      pdfUrl: lesson.pdfUrl || '',
      quizUrl: lesson.quizUrl || ''
    });
    setAddLessonOpen(true);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      try {
        await deleteDoc(doc(db, 'lessons', lessonId));
        toast({
          title: "تم حذف الدرس",
          description: "تم حذف الدرس بنجاح",
        });
        onLessonsUpdate(); // Callback to refresh lessons in parent
      } catch (error) {
        toast({
          title: "خطأ في حذف الدرس",
          description: `حدث خطأ أثناء حذف الدرس: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold gradient-text">إدارة الدروس</h2>
        <Dialog open={addLessonOpen} onOpenChange={(open) => {
          setAddLessonOpen(open);
          if (!open) {
            setEditingLesson(null);
            setLessonData({ lessonNumber: '', title: '', videoUrl: '', pdfUrl: '', quizUrl: ''});
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4 ml-2" />
              {editingLesson ? 'تعديل الدرس الحالي' : 'إضافة درس جديد'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl gradient-text">
                {editingLesson ? 'تعديل الدرس' : 'إضافة درس جديد'}
              </DialogTitle>
              <DialogDescription className="text-center">
                {editingLesson ? 'قم بتعديل بيانات الدرس' : 'أدخل بيانات الدرس الجديد'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLesson} className="space-y-4">
              <div>
                <Label htmlFor="lessonNumber">رقم الدرس</Label>
                <Input
                  id="lessonNumber"
                  type="number"
                  value={lessonData.lessonNumber}
                  onChange={(e) => setLessonData({...lessonData, lessonNumber: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="title">عنوان الدرس</Label>
                <Input
                  id="title"
                  type="text"
                  value={lessonData.title}
                  onChange={(e) => setLessonData({...lessonData, title: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="videoUrl">رابط فيديو YouTube</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={lessonData.videoUrl}
                  onChange={(e) => setLessonData({...lessonData, videoUrl: e.target.value})}
                  className="mt-1"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <Label htmlFor="pdfUrl">رابط ملف PDF</Label>
                <Input
                  id="pdfUrl"
                  type="url"
                  value={lessonData.pdfUrl}
                  onChange={(e) => setLessonData({...lessonData, pdfUrl: e.target.value})}
                  className="mt-1"
                  placeholder="https://example.com/file.pdf"
                />
              </div>
              <div>
                <Label htmlFor="quizUrl">رابط اختبار الدرس</Label>
                <Input
                  id="quizUrl"
                  type="url"
                  value={lessonData.quizUrl}
                  onChange={(e) => setLessonData({...lessonData, quizUrl: e.target.value})}
                  className="mt-1"
                  placeholder="https://forms.google.com/..."
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                {editingLesson ? 'تحديث الدرس' : 'إضافة الدرس'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {lessons.length === 0 ? (
            <Card className="glass-effect border-0 shadow-xl">
              <CardContent className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد دروس مضافة بعد</h3>
                <p className="text-gray-500">انقر على "إضافة درس جديد" لبدء إنشاء المحتوى.</p>
              </CardContent>
            </Card>
        ) : (
          lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-effect border-0 shadow-xl card-hover">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="outline">الدرس {lesson.lessonNumber}</Badge>
                        {lesson.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-xs">
                        تاريخ الإنشاء: {lesson.createdAt ? new Date(lesson.createdAt.seconds ? lesson.createdAt.seconds * 1000 : lesson.createdAt).toLocaleDateString('ar-EG') : 'غير معروف'}
                        {lesson.updatedAt && (
                          <span className="block">
                            آخر تحديث: {new Date(lesson.updatedAt.seconds ? lesson.updatedAt.seconds * 1000 : lesson.updatedAt).toLocaleDateString('ar-EG')}
                          </span>
                         )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditLesson(lesson)}
                        className="hover:bg-blue-500/10 hover:text-blue-600"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">فيديو: </span>
                      {lesson.videoUrl ? (
                        <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block" title={lesson.videoUrl}>متوفر</a>
                      ) : (
                        <span className="text-gray-500">غير متوفر</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">ملف PDF: </span>
                      {lesson.pdfUrl ? (
                         <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block" title={lesson.pdfUrl}>متوفر</a>
                      ) : (
                        <span className="text-gray-500">غير متوفر</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">اختبار الدرس: </span>
                      {lesson.quizUrl ? (
                        <a href={lesson.quizUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block" title={lesson.quizUrl}>متوفر</a>
                      ) : (
                        <span className="text-gray-500">غير متوفر</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
