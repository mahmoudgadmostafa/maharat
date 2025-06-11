import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckSquare, Edit, PlusCircle, Save, Trash2 } from 'lucide-react'; // Removed XCircle
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const TeacherFinalExamManager = ({ platformSettings, onSettingsUpdate }) => {
  const [finalExams, setFinalExams] = useState([]);
  const [editingExam, setEditingExam] = useState(null); 
  const [newExam, setNewExam] = useState({ name: '', url: '' });

  useEffect(() => {
    setFinalExams(platformSettings?.finalExamsList || []);
  }, [platformSettings?.finalExamsList]);

  const handleSaveExams = async (updatedExams) => {
    try {
      // Ensure IDs are strings for Firestore compatibility if they are numbers
      const examsToSave = updatedExams.map(exam => ({ ...exam, id: String(exam.id || Date.now() + Math.random()) }));
      await onSettingsUpdate({ ...platformSettings, finalExamsList: examsToSave });
      // setFinalExams will be updated by useEffect listening to platformSettings
      toast({
        title: "تم حفظ التغييرات على الاختبارات النهائية",
      });
    } catch (error) {
      console.error("Error saving final exams:", error);
      toast({
        title: "خطأ",
        description: "لم نتمكن من حفظ التغييرات على الاختبارات النهائية.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewExam = () => {
    if (!newExam.name.trim() || !newExam.url.trim()) {
      toast({ title: "بيانات غير مكتملة", description: "يرجى إدخال اسم ورابط للاختبار.", variant: "destructive" });
      return;
    }
    // Ensure new exam has a unique ID
    const examToAdd = { ...newExam, id: Date.now().toString() + Math.random().toString(36).substring(2, 15) };
    const updatedExams = [...finalExams, examToAdd];
    handleSaveExams(updatedExams);
    setNewExam({ name: '', url: '' });
  };

  const handleEditExam = (examToEdit) => {
    setEditingExam({ ...examToEdit }); // Store the whole exam object for editing
  };

  const handleSaveEditedExam = () => {
    if (!editingExam || !editingExam.name.trim() || !editingExam.url.trim()) {
      toast({ title: "بيانات غير مكتملة", description: "يرجى إدخال اسم ورابط للاختبار.", variant: "destructive" });
      return;
    }
    const updatedExams = finalExams.map(exam => 
      exam.id === editingExam.id ? { ...editingExam } : exam
    );
    handleSaveExams(updatedExams);
    setEditingExam(null);
  };

  const handleDeleteExam = (examIdToDelete) => {
    const updatedExams = finalExams.filter(exam => exam.id !== examIdToDelete);
    handleSaveExams(updatedExams);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-green-600" />
            إدارة الاختبارات النهائية
          </CardTitle>
          <CardDescription>
            أضف أو قم بتحديث روابط الاختبارات النهائية التي ستظهر للطلاب. يمكنك إضافة أكثر من اختبار.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {finalExams.length === 0 && !editingExam && (
            <p className="text-center text-gray-500">لا توجد اختبارات نهائية مضافة حاليًا.</p>
          )}
          {finalExams.map((exam) => (
            <motion.div 
              key={exam.id} 
              className="p-4 border rounded-lg bg-white/50 backdrop-blur-sm space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: finalExams.indexOf(exam) * 0.05 }}
            >
              {editingExam?.id === exam.id ? (
                <div className="space-y-2">
                  <Label htmlFor={`examName-${exam.id}`}>اسم الاختبار</Label>
                  <Input
                    id={`examName-${exam.id}`}
                    value={editingExam.name}
                    onChange={(e) => setEditingExam({ ...editingExam, name: e.target.value })}
                    placeholder="مثال: اختبار الفصل الأول"
                  />
                  <Label htmlFor={`examUrl-${exam.id}`}>رابط الاختبار</Label>
                  <Input
                    id={`examUrl-${exam.id}`}
                    type="url"
                    value={editingExam.url}
                    onChange={(e) => setEditingExam({ ...editingExam, url: e.target.value })}
                    placeholder="https://forms.google.com/..."
                  />
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveEditedExam} size="sm"><Save className="w-4 h-4 ml-1" /> حفظ التعديل</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingExam(null)}>إلغاء</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">{exam.name}</p>
                  <a href={exam.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{exam.url}</a>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditExam(exam)}>
                      <Edit className="w-3.5 h-3.5 ml-1" /> تعديل
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-3.5 h-3.5 ml-1" /> حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيتم حذف هذا الاختبار ({exam.name}) نهائياً. لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteExam(exam.id)} className="bg-red-600 hover:bg-red-700">
                            حذف الاختبار
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          <div className="pt-4 border-t mt-6">
            <h3 className="text-lg font-semibold mb-2">إضافة اختبار نهائي جديد</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="newExamName">اسم الاختبار الجديد</Label>
                <Input
                  id="newExamName"
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  placeholder="مثال: الاختبار الشامل للمادة"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newExamUrl">رابط الاختبار الجديد</Label>
                <Input
                  id="newExamUrl"
                  type="url"
                  value={newExam.url}
                  onChange={(e) => setNewExam({ ...newExam, url: e.target.value })}
                  placeholder="https://forms.google.com/..."
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddNewExam} className="bg-gradient-to-r from-green-500 to-emerald-600">
                <PlusCircle className="w-4 h-4 ml-2" /> إضافة اختبار
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};