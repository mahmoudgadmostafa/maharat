import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, Brain, ExternalLink, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const TeacherPlatformSettings = ({ platformSettings, onSettingsUpdate }) => {
  const [siteName, setSiteName] = useState('');
  const [teacherAiToolsUrl, setTeacherAiToolsUrl] = useState('');
  const [studentAiToolsUrl, setStudentAiToolsUrl] = useState('');
  const [teacherAiToolsList, setTeacherAiToolsList] = useState([]);
  const [studentAiToolsList, setStudentAiToolsList] = useState([]);
  const [emailDomain, setEmailDomain] = useState('');
  const [studentStartingCodeNumber, setStudentStartingCodeNumber] = useState(1000);

  // متغيرات لإدارة النماذج
  const [newTeacherTool, setNewTeacherTool] = useState({ name: '', url: '' });
  const [newStudentTool, setNewStudentTool] = useState({ name: '', url: '' });
  const [editingTeacherTool, setEditingTeacherTool] = useState(null);
  const [editingStudentTool, setEditingStudentTool] = useState(null);

  useEffect(() => {
    setSiteName(platformSettings?.siteName || 'منصة مهارات التعليمية');
    setTeacherAiToolsUrl(platformSettings?.teacherAiToolsUrl || 'https://app.magicschool.ai/tools');
    setStudentAiToolsUrl(platformSettings?.studentAiToolsUrl || 'https://app.magicschool.ai/tools');
    setTeacherAiToolsList(platformSettings?.teacherAiToolsList || []);
    setStudentAiToolsList(platformSettings?.studentAiToolsList || []);
    setEmailDomain(platformSettings?.emailDomain || 'myplatform.com');
    setStudentStartingCodeNumber(platformSettings?.studentStartingCodeNumber || 1000);
  }, [platformSettings]);

  const saveSingleSetting = async (key, value, label) => {
    try {
      await onSettingsUpdate({
        ...platformSettings,
        [key]: value,
      });
      toast({
        title: `تم حفظ ${label}`,
        description: `تم تحديث ${label} بنجاح.`,
      });
    } catch (error) {
      toast({
        title: `خطأ في حفظ ${label}`,
        description: `حدث خطأ أثناء حفظ ${label}.`,
        variant: "destructive",
      });
    }
  };

  // وظائف إدارة روابط المعلم
  const addTeacherTool = async () => {
    if (!newTeacherTool.name.trim() || !newTeacherTool.url.trim()) {
      toast({
        title: "خطأ في الإدخال",
        description: "يرجى إدخال اسم ورابط التطبيق.",
        variant: "destructive",
      });
      return;
    }

    const newId = Math.random().toString(36).substr(2, 9);
    const updatedList = [...teacherAiToolsList, { ...newTeacherTool, id: newId }];
    setTeacherAiToolsList(updatedList);
    await saveSingleSetting('teacherAiToolsList', updatedList, 'قائمة تطبيقات المعلم');
    setNewTeacherTool({ name: '', url: '' });
  };

  const updateTeacherTool = async (id, updatedTool) => {
    const updatedList = teacherAiToolsList.map(tool => 
      tool.id === id ? { ...updatedTool, id } : tool
    );
    setTeacherAiToolsList(updatedList);
    await saveSingleSetting('teacherAiToolsList', updatedList, 'قائمة تطبيقات المعلم');
    setEditingTeacherTool(null);
  };

  const deleteTeacherTool = async (id) => {
    const updatedList = teacherAiToolsList.filter(tool => tool.id !== id);
    setTeacherAiToolsList(updatedList);
    await saveSingleSetting('teacherAiToolsList', updatedList, 'قائمة تطبيقات المعلم');
  };

  // وظائف إدارة روابط الطالب
  const addStudentTool = async () => {
    if (!newStudentTool.name.trim() || !newStudentTool.url.trim()) {
      toast({
        title: "خطأ في الإدخال",
        description: "يرجى إدخال اسم ورابط التطبيق.",
        variant: "destructive",
      });
      return;
    }

    const newId = Math.random().toString(36).substr(2, 9);
    const updatedList = [...studentAiToolsList, { ...newStudentTool, id: newId }];
    setStudentAiToolsList(updatedList);
    await saveSingleSetting('studentAiToolsList', updatedList, 'قائمة تطبيقات الطالب');
    setNewStudentTool({ name: '', url: '' });
  };

  const updateStudentTool = async (id, updatedTool) => {
    const updatedList = studentAiToolsList.map(tool => 
      tool.id === id ? { ...updatedTool, id } : tool
    );
    setStudentAiToolsList(updatedList);
    await saveSingleSetting('studentAiToolsList', updatedList, 'قائمة تطبيقات الطالب');
    setEditingStudentTool(null);
  };

  const deleteStudentTool = async (id) => {
    const updatedList = studentAiToolsList.filter(tool => tool.id !== id);
    setStudentAiToolsList(updatedList);
    await saveSingleSetting('studentAiToolsList', updatedList, 'قائمة تطبيقات الطالب');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-2 sm:p-0">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            إعدادات المنصة العامة
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            إدارة الإعدادات العامة وروابط وأكواد التسجيل
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* الموقع */}
          <div>
            <Label htmlFor="siteName">اسم المنصة</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => saveSingleSetting('siteName', siteName, 'اسم المنصة')}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 ml-1" /> حفظ
              </Button>
            </div>
          </div>

          {/* امتداد البريد */}
          <div>
            <Label htmlFor="emailDomain">امتداد البريد الإلكتروني</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <Input
                id="emailDomain"
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => saveSingleSetting('emailDomain', emailDomain, 'امتداد البريد')}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 ml-1" /> حفظ
              </Button>
            </div>
          </div>

          {/* رقم الكود للطلاب */}
          <div>
            <Label htmlFor="studentStartingCodeNumber">رقم بدء توليد أكواد الطلاب</Label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <Input
                id="studentStartingCodeNumber"
                type="number"
                min={0}
                value={studentStartingCodeNumber}
                onChange={(e) => setStudentStartingCodeNumber(parseInt(e.target.value))}
                className="flex-1"
              />
              <Button 
                onClick={() => saveSingleSetting('studentStartingCodeNumber', studentStartingCodeNumber, 'رقم بدء الأكواد')}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 ml-1" /> حفظ
              </Button>
            </div>
          </div>

          {/* إدارة روابط أدوات الذكاء للمعلم */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Brain className="w-5 h-5 text-purple-600" />
                تطبيقات الذكاء الاصطناعي للمعلم
              </CardTitle>
              <CardDescription className="text-sm">
                إضافة وتعديل وحذف روابط تطبيقات الذكاء الاصطناعي المخصصة للمعلم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* نموذج إضافة تطبيق جديد للمعلم */}
              <div className="border rounded-lg p-4 bg-purple-50/50">
                <h4 className="font-semibold mb-3 text-purple-700">إضافة تطبيق جديد</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="اسم التطبيق"
                    value={newTeacherTool.name}
                    onChange={(e) => setNewTeacherTool(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="رابط التطبيق"
                    type="url"
                    value={newTeacherTool.url}
                    onChange={(e) => setNewTeacherTool(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <Button 
                    onClick={addTeacherTool} 
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 ml-1" /> إضافة
                  </Button>
                </div>
              </div>

              {/* قائمة التطبيقات الحالية للمعلم */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">التطبيقات الحالية</h4>
                {teacherAiToolsList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد تطبيقات مضافة بعد</p>
                ) : (
                  teacherAiToolsList.map((tool) => (
                    <div key={`teacher-tool-${tool.id}`} className="border rounded-lg bg-white overflow-hidden">
                      {editingTeacherTool === tool.id ? (
                        <div className="p-3 space-y-2">
                          <Input
                            value={tool.name}
                            onChange={(e) => setTeacherAiToolsList(prev => 
                              prev.map(t => t.id === tool.id ? { ...t, name: e.target.value } : t)
                            )}
                            placeholder="اسم التطبيق"
                          />
                          <Input
                            value={tool.url}
                            onChange={(e) => setTeacherAiToolsList(prev => 
                              prev.map(t => t.id === tool.id ? { ...t, url: e.target.value } : t)
                            )}
                            placeholder="رابط التطبيق"
                            type="url"
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => updateTeacherTool(tool.id, tool)}
                              className="flex-1"
                            >
                              <Save className="w-4 h-4 mr-1" /> حفظ
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingTeacherTool(null)}
                              className="flex-1"
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{tool.name}</p>
                            <a 
                              href={tool.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline truncate block"
                              title={tool.url}
                            >
                              {tool.url}
                            </a>
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingTeacherTool(tool.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => deleteTeacherTool(tool.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* إدارة روابط أدوات الذكاء للطالب */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Brain className="w-5 h-5 text-indigo-600" />
                تطبيقات الذكاء الاصطناعي للطالب
              </CardTitle>
              <CardDescription className="text-sm">
                إضافة وتعديل وحذف روابط تطبيقات الذكاء الاصطناعي المخصصة للطالب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* نموذج إضافة تطبيق جديد للطالب */}
              <div className="border rounded-lg p-4 bg-indigo-50/50">
                <h4 className="font-semibold mb-3 text-indigo-700">إضافة تطبيق جديد</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="اسم التطبيق"
                    value={newStudentTool.name}
                    onChange={(e) => setNewStudentTool(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="رابط التطبيق"
                    type="url"
                    value={newStudentTool.url}
                    onChange={(e) => setNewStudentTool(prev => ({ ...prev, url: e.target.value }))}
                  />
                  <Button 
                    onClick={addStudentTool} 
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 ml-1" /> إضافة
                  </Button>
                </div>
              </div>

              {/* قائمة التطبيقات الحالية للطالب */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700">التطبيقات الحالية</h4>
                {studentAiToolsList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد تطبيقات مضافة بعد</p>
                ) : (
                  studentAiToolsList.map((tool) => (
                    <div key={`student-tool-${tool.id}`} className="border rounded-lg bg-white overflow-hidden">
                      {editingStudentTool === tool.id ? (
                        <div className="p-3 space-y-2">
                          <Input
                            value={tool.name}
                            onChange={(e) => setStudentAiToolsList(prev => 
                              prev.map(t => t.id === tool.id ? { ...t, name: e.target.value } : t)
                            )}
                            placeholder="اسم التطبيق"
                          />
                          <Input
                            value={tool.url}
                            onChange={(e) => setStudentAiToolsList(prev => 
                              prev.map(t => t.id === tool.id ? { ...t, url: e.target.value } : t)
                            )}
                            placeholder="رابط التطبيق"
                            type="url"
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => updateStudentTool(tool.id, tool)}
                              className="flex-1"
                            >
                              <Save className="w-4 h-4 mr-1" /> حفظ
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingStudentTool(null)}
                              className="flex-1"
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{tool.name}</p>
                            <a 
                              href={tool.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline truncate block"
                              title={tool.url}
                            >
                              {tool.url}
                            </a>
                          </div>
                          <div className="flex gap-2 self-end sm:self-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingStudentTool(tool.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => deleteStudentTool(tool.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* الروابط القديمة للتوافق مع النسخة السابقة */}
          <Card className="border-0 shadow-lg bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-yellow-700">
                <Brain className="w-5 h-5" />
                الروابط الافتراضية (للتوافق مع النسخة السابقة)
              </CardTitle>
              <CardDescription className="text-sm">
                هذه الروابط ستُستخدم في حالة عدم وجود تطبيقات في القوائم أعلاه
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* رابط أدوات الذكاء للمعلم */}
              <div>
                <Label htmlFor="teacherAiToolsUrl" className="flex items-center gap-1">
                  <Brain className="w-4 h-4 text-purple-600" />
                  رابط أدوات الذكاء (معلم)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Input
                    id="teacherAiToolsUrl"
                    type="url"
                    value={teacherAiToolsUrl}
                    onChange={(e) => setTeacherAiToolsUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => saveSingleSetting('teacherAiToolsUrl', teacherAiToolsUrl, 'رابط المعلم')}
                    className="w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 ml-1" /> حفظ
                  </Button>
                </div>
                {teacherAiToolsUrl && (
                  <a 
                    href={teacherAiToolsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-500 hover:underline mt-1 inline-block truncate max-w-full"
                    title={teacherAiToolsUrl}
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    الرابط الحالي: {teacherAiToolsUrl}
                  </a>
                )}
              </div>

              {/* رابط أدوات الذكاء للطالب */}
              <div>
                <Label htmlFor="studentAiToolsUrl" className="flex items-center gap-1">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  رابط أدوات الذكاء (طالب)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Input
                    id="studentAiToolsUrl"
                    type="url"
                    value={studentAiToolsUrl}
                    onChange={(e) => setStudentAiToolsUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => saveSingleSetting('studentAiToolsUrl', studentAiToolsUrl, 'رابط الطالب')}
                    className="w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 ml-1" /> حفظ
                  </Button>
                </div>
                {studentAiToolsUrl && (
                  <a 
                    href={studentAiToolsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-500 hover:underline mt-1 inline-block truncate max-w-full"
                    title={studentAiToolsUrl}
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    الرابط الحالي: {studentAiToolsUrl}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </motion.div>
  );
};