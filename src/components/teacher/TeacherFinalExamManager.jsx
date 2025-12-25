import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckSquare, Edit, PlusCircle, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const TeacherFinalExamManager = ({ platformSettings, onSettingsUpdate }) => {
  const [finalExams, setFinalExams] = useState([]);
  const [editingExam, setEditingExam] = useState(null); 
  const [newExam, setNewExam] = useState({ name: '', url: '', isVisible: true });

  useEffect(() => {
    // تأكد من أن كل اختبار له خاصية isVisible
    const examsWithVisibility = (platformSettings?.finalExamsList || []).map(exam => ({
      ...exam,
      isVisible: exam.isVisible !== undefined ? exam.isVisible : true
    }));
    setFinalExams(examsWithVisibility);
  }, [platformSettings?.finalExamsList]);

  const handleSaveExams = async (updatedExams) => {
    try {
      // Ensure IDs are strings for Firestore compatibility if they are numbers
      const examsToSave = updatedExams.map(exam => ({ 
        ...exam, 
        id: String(exam.id || Date.now() + Math.random()),
        isVisible: exam.isVisible !== undefined ? exam.isVisible : true
      }));
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
    // Ensure new exam has a unique ID and visibility setting
    const examToAdd = { 
      ...newExam, 
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
      isVisible: newExam.isVisible !== undefined ? newExam.isVisible : true
    };
    const updatedExams = [...finalExams, examToAdd];
    handleSaveExams(updatedExams);
    setNewExam({ name: '', url: '', isVisible: true });
  };

  const handleEditExam = (examToEdit) => {
    setEditingExam({ 
      ...examToEdit,
      isVisible: examToEdit.isVisible !== undefined ? examToEdit.isVisible : true
    }); // Store the whole exam object for editing
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

  const handleToggleVisibility = (examId, isVisible) => {
    const updatedExams = finalExams.map(exam => 
      exam.id === examId ? { ...exam, isVisible } : exam
    );
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
             الاختبارات 
          </CardTitle>
          <CardDescription>
            أضف أو قم بتحديث روابط الاختبارات التي ستظهر للطلاب. يمكنك إضافة أكثر من اختبار والتحكم في ظهورها للطلاب.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {finalExams.length === 0 && !editingExam && (
            <p className="text-center text-gray-500">لا توجد اختبارات مضافة حاليًا.</p>
          )}
          {finalExams.map((exam) => (
            <motion.div 
              key={exam.id} 
              className={`p-4 border rounded-lg backdrop-blur-sm space-y-3 ${
                exam.isVisible ? 'bg-white/50 border-green-200' : 'bg-gray-100/50 border-gray-300'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: finalExams.indexOf(exam) * 0.05 }}
            >
              {editingExam?.id === exam.id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`examName-${exam.id}`}>اسم الاختبار</Label>
                    <Input
                      id={`examName-${exam.id}`}
                      value={editingExam.name}
                      onChange={(e) => setEditingExam({ ...editingExam, name: e.target.value })}
                      placeholder="مثال: اختبار الفصل الأول"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`examUrl-${exam.id}`}>رابط الاختبار</Label>
                    <Input
                      id={`examUrl-${exam.id}`}
                      type="url"
                      value={editingExam.url}
                      onChange={(e) => setEditingExam({ ...editingExam, url: e.target.value })}
                      placeholder="https://forms.google.com/..."
                    />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id={`examVisibility-${exam.id}`}
                      checked={editingExam.isVisible}
                      onCheckedChange={(checked) => setEditingExam({ ...editingExam, isVisible: checked })}
                    />
                    <Label htmlFor={`examVisibility-${exam.id}`} className="flex items-center gap-2">
                      {editingExam.isVisible ? (
                        <>
                          <Eye className="w-4 h-4 text-green-600" />
                          مرئي للطلاب
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-gray-600" />
                          مخفي عن الطلاب
                        </>
                      )}
                    </Label>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveEditedExam} size="sm">
                      <Save className="w-4 h-4 ml-1" /> حفظ التعديل
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingExam(null)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{exam.name}</p>
                      {exam.isVisible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                          <Eye className="w-3 h-3" />
                          مرئي
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full">
                          <EyeOff className="w-3 h-3" />
                          مخفي
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={exam.isVisible}
                        onCheckedChange={(checked) => handleToggleVisibility(exam.id, checked)}
                      />
                      <Label className="text-sm text-gray-600">
                        {exam.isVisible ? 'إظهار' : 'إخفاء'}
                      </Label>
                    </div>
                  </div>
                  <a 
                    href={exam.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 hover:underline break-all block mb-3"
                  >
                    {exam.url}
                  </a>
                  <div className="flex gap-2">
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
            <h3 className="text-lg font-semibold mb-4">إضافة اختبار جديد</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newExamName">اسم الاختبار الجديد</Label>
                <Input
                  id="newExamName"
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  placeholder="مثال: الاختبار الشامل للمادة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newExamUrl">رابط الاختبار الجديد</Label>
                <Input
                  id="newExamUrl"
                  type="url"
                  value={newExam.url}
                  onChange={(e) => setNewExam({ ...newExam, url: e.target.value })}
                  placeholder="https://forms.google.com/..."
                />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="newExamVisibility"
                  checked={newExam.isVisible}
                  onCheckedChange={(checked) => setNewExam({ ...newExam, isVisible: checked })}
                />
                <Label htmlFor="newExamVisibility" className="flex items-center gap-2">
                  {newExam.isVisible ? (
                    <>
                      <Eye className="w-4 h-4 text-green-600" />
                      مرئي للطلاب
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-gray-600" />
                      مخفي عن الطلاب
                    </>
                  )}
                </Label>
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

