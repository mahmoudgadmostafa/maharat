import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, Edit, Trash2, CheckSquare } from 'lucide-react';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

export const TeacherLessonsManager = ({ lessons, students, onLessonsUpdate }) => {
  const availableGroups = ['الكل', ...new Set((students || []).filter(s => s.role === 'student').map(s => s.group).filter(Boolean))];
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState("all");
  const [lessonData, setLessonData] = useState({
    lessonNumber: '',
    title: '',
    videoUrls: [],
    pdfUrls: [],
    infographicUrls: [],
    activityUrls: [],
    quizUrls: [],
    targetGroups: ['الكل'],
    learningOutcomes: [],
    lessonSteps: []
  });

  const getUrlsList = (arr, str) => {
    if (arr && Array.isArray(arr) && arr.length > 0) return arr;
    if (str && typeof str === 'string' && str.trim() !== '') return [str];
    return [];
  };

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
          learningOutcomes: lessonData.learningOutcomes,
          lessonSteps: lessonData.lessonSteps,
          targetGroups: lessonData.targetGroups,
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
          learningOutcomes: lessonData.learningOutcomes,
          lessonSteps: lessonData.lessonSteps,
          targetGroups: lessonData.targetGroups,
          createdAt: new Date().toISOString()
        });
        toast({
          title: "تم إضافة الدرس",
          description: "تم إضافة الدرس بنجاح",
        });
      }

      setLessonData({
        lessonNumber: '',
        title: '',
        videoUrls: [],
        pdfUrls: [],
        infographicUrls: [],
        activityUrls: [],
        quizUrls: [],
        targetGroups: ['الكل'],
        learningOutcomes: [],
        lessonSteps: []
      });
      setAddLessonOpen(false);
      setEditingLesson(null);
      onLessonsUpdate();
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
      videoUrls: getUrlsList(lesson.videoUrls, lesson.videoUrl),
      pdfUrls: getUrlsList(lesson.pdfUrls, lesson.pdfUrl),
      infographicUrls: getUrlsList(lesson.infographicUrls, lesson.infographicUrl),
      activityUrls: getUrlsList(lesson.activityUrls, lesson.activityUrl),
      quizUrls: getUrlsList(lesson.quizUrls, lesson.quizUrl || lesson.questionsUrl),
      targetGroups: lesson.targetGroups === undefined ? ['الكل'] : lesson.targetGroups,
      learningOutcomes: lesson.learningOutcomes || [],
      lessonSteps: lesson.lessonSteps || []
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
        if (selectedLessonId === lessonId) {
          setSelectedLessonId("all");
        }
        onLessonsUpdate();
      } catch (error) {
        toast({
          title: "خطأ في حذف الدرس",
          description: `حدث خطأ أثناء حذف الدرس: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const formatFirebaseDate = (date) => {
    if (!date) return 'غير معروف';
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('ar-EG');
    return new Date(date).toLocaleDateString('ar-EG');
  };

  const filteredLessons = selectedLessonId === "all"
    ? lessons
    : lessons.filter(l => l.id === selectedLessonId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold gradient-text">إدارة الدروس</h2>
        <Dialog
          open={addLessonOpen}
          onOpenChange={(open) => {
            try {
              setAddLessonOpen(open);
              if (!open) {
                setLessonData({
                  lessonNumber: '',
                  title: '',
                  videoUrls: [],
                  pdfUrls: [],
                  infographicUrls: [],
                  activityUrls: [],
                  quizUrls: [],
                  targetGroups: ['الكل'],
                  learningOutcomes: [],
                  lessonSteps: []
                });
                setEditingLesson(null);
              }
            } catch (error) {
              console.error("Error handling dialog close:", error);
              toast({
                title: "حدث خطأ",
                description: "حدث خطأ أثناء معالجة العملية، يرجى المحاولة مرة أخرى",
                variant: "destructive",
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="w-4 h-4 ml-2" />
              {editingLesson ? 'تعديل الدرس الحالي' : 'إضافة درس جديد'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md overflow-y-auto max-h-[80vh]">
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
                  onChange={(e) => setLessonData({ ...lessonData, lessonNumber: e.target.value })}
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
                  onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="videoUrls">روابط فديوهات YouTube (لكل سطر رابط)</Label>
                <textarea
                  id="videoUrls"
                  value={lessonData.videoUrls.join("\n")}
                  onChange={(e) => setLessonData({ ...lessonData, videoUrls: e.target.value.split("\n") })}
                  className="mt-1 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <Label htmlFor="pdfUrls">روابط ملفات PDF (لكل سطر رابط)</Label>
                <textarea
                  id="pdfUrls"
                  value={lessonData.pdfUrls.join("\n")}
                  onChange={(e) => setLessonData({ ...lessonData, pdfUrls: e.target.value.split("\n") })}
                  className="mt-1 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="https://example.com/file.pdf"
                />
              </div>
              <div>
                <Label htmlFor="infographicUrls">روابط الإنفوجرافيك (لكل سطر رابط)</Label>
                <textarea
                  id="infographicUrls"
                  value={lessonData.infographicUrls.join("\n")}
                  onChange={(e) => setLessonData({ ...lessonData, infographicUrls: e.target.value.split("\n") })}
                  className="mt-1 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="https://example.com/infographic.png"
                />
              </div>
              <div>
                <Label htmlFor="activityUrls">روابط الأنشطة التعليمية (لكل سطر رابط)</Label>
                <textarea
                  id="activityUrls"
                  value={lessonData.activityUrls.join("\n")}
                  onChange={(e) => setLessonData({ ...lessonData, activityUrls: e.target.value.split("\n") })}
                  className="mt-1 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="https://example.com/activity..."
                />
              </div>
              <div>
                <Label htmlFor="quizUrls">روابط أسئلة الدرس (لكل سطر رابط)</Label>
                <textarea
                  id="quizUrls"
                  value={lessonData.quizUrls.join("\n")}
                  onChange={(e) => setLessonData({ ...lessonData, quizUrls: e.target.value.split("\n") })}
                  className="mt-1 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="https://forms.google.com/..."
                />
              </div>
              <div>
                <Label htmlFor="learningOutcomes">نواتج التعلم (لكل سطر ناتج تعلم)</Label>
                <textarea
                  id="learningOutcomes"
                  value={lessonData.learningOutcomes.join("\n")}
                  onChange={(e) => setLessonData({ ...lessonData, learningOutcomes: e.target.value.split("\n") })}
                  className="mt-1 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="اكتب نواتج التعلم هنا، كل ناتج في سطر جديد."
                />
              </div>
              <div>
                <Label htmlFor="lessonSteps">خطوات السير في الدرس (لكل سطر خطوة)</Label>
                <textarea
                  id="lessonSteps"
                  value={lessonData.lessonSteps.join("\n")}
                  onChange={(e) => setLessonData({ ...lessonData, lessonSteps: e.target.value.split("\n") })}
                  className="mt-1 flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="اكتب خطوات السير هنا، كل خطوة في سطر جديد."
                />
              </div>
              <div className="space-y-2 p-4 bg-gray-50 border rounded-lg">
                <Label className="text-blue-700 font-bold">المجموعات المسموح لها برؤية الدرس</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableGroups.map(group => (
                    <label key={group} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border cursor-pointer hover:bg-gray-100 transition-colors shadow-sm">
                      <input
                        type="checkbox"
                        checked={lessonData.targetGroups.includes(group)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            setLessonData({ ...lessonData, targetGroups: [...lessonData.targetGroups, group] });
                          } else {
                            setLessonData({ ...lessonData, targetGroups: lessonData.targetGroups.filter(g => g !== group) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium">{group}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">إذا لم يتم تحديد أي مجموعة، سيكون الدرس مخفياً عن الجميع. لجعله متاحاً للكل، اختر "الكل".</p>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                {editingLesson ? 'تحديث الدرس' : 'إضافة الدرس'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lessons.length > 0 && (
        <div className="mb-6">
          <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
            <SelectTrigger className="w-full md:w-[300px] bg-white border-purple-200">
              <SelectValue placeholder="اختر درساً لعرضه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الدروس</SelectItem>
              {lessons.map((lesson) => (
                <SelectItem key={lesson.id} value={lesson.id}>
                  الدرس {lesson.lessonNumber}: {lesson.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
          filteredLessons.map((lesson, index) => {
            const vUrls = getUrlsList(lesson.videoUrls, lesson.videoUrl);
            const pUrls = getUrlsList(lesson.pdfUrls, lesson.pdfUrl);
            const iUrls = getUrlsList(lesson.infographicUrls, lesson.infographicUrl);
            const aUrls = getUrlsList(lesson.activityUrls, lesson.activityUrl);
            const qUrls = getUrlsList(lesson.quizUrls, lesson.quizUrl || lesson.questionsUrl);

            return (
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
                          تاريخ الإنشاء: {formatFirebaseDate(lesson.createdAt)}
                          {lesson.updatedAt && (
                            <span className="block">
                              آخر تحديث: {formatFirebaseDate(lesson.updatedAt)}
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
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">فيديو: </span>
                        {vUrls.length > 0 ? (
                          <span className="text-blue-600 truncate block">{vUrls.length} مرفقات متوفرة</span>
                        ) : (
                          <span className="text-gray-500">غير متوفر</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">ملف PDF: </span>
                        {pUrls.length > 0 ? (
                          <span className="text-blue-600 truncate block">{pUrls.length} مرفقات متوفرة</span>
                        ) : (
                          <span className="text-gray-500">غير متوفر</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">إنفوجرافيك: </span>
                        {iUrls.length > 0 ? (
                          <span className="text-blue-600 truncate block">{iUrls.length} مرفقات متوفرة</span>
                        ) : (
                          <span className="text-gray-500">غير متوفر</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">اسئلة الدرس: </span>
                        {qUrls.length > 0 ? (
                          <span className="text-blue-600 truncate block">{qUrls.length} مرفقات متوفرة</span>
                        ) : (
                          <span className="text-gray-500">غير متوفر</span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">النشاط التعليمي: </span>
                        {aUrls.length > 0 ? (
                          <span className="text-blue-600 truncate block">{aUrls.length} مرفقات متوفرة</span>
                        ) : (
                          <span className="text-gray-500">غير متوفر</span>
                        )}
                      </div>
                      {lesson.learningOutcomes && lesson.learningOutcomes.length > 0 && (
                        <div className="md:col-span-4">
                          <span className="font-medium">نواتج التعلم: </span>
                          <ul className="list-disc list-inside text-gray-700">
                            {lesson.learningOutcomes.map((outcome, idx) => (
                              <li key={idx}>{outcome}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lesson.lessonSteps && lesson.lessonSteps.length > 0 && (
                        <div className="md:col-span-4">
                          <span className="font-medium">خطوات السير: </span>
                          <ol className="list-decimal list-inside text-gray-700">
                            {lesson.lessonSteps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};