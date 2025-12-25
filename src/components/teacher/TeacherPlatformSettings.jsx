import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, Brain, ExternalLink, Plus, Trash2, Edit, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export const TeacherPlatformSettings = ({ platformSettings, onSettingsUpdate, students = [] }) => {
  const [siteName, setSiteName] = useState('');
  const [teacherAiToolsUrl, setTeacherAiToolsUrl] = useState('');
  const [studentAiToolsUrl, setStudentAiToolsUrl] = useState('');
  const [teacherAiToolsList, setTeacherAiToolsList] = useState([]);
  const [studentAiToolsList, setStudentAiToolsList] = useState([]);
  const [emailDomain, setEmailDomain] = useState('');
  const [studentStartingCodeNumber, setStudentStartingCodeNumber] = useState(1000);
  const [showRegisterButton, setShowRegisterButton] = useState(true);

  // متغيرات لإدارة النماذج
  const [newTeacherTool, setNewTeacherTool] = useState({ name: '', url: '', isVisible: true });
  const [newStudentTool, setNewStudentTool] = useState({ name: '', url: '', isVisible: true, visibleForGroups: [] });
  const [editingTeacherTool, setEditingTeacherTool] = useState(null);
  const [editingStudentTool, setEditingStudentTool] = useState(null);

  const availableGroups = useMemo(() => {
    if (!students) return [];
    const groups = new Set(students.map(s => s.group).filter(Boolean));
    return Array.from(groups).sort();
  }, [students]);

  useEffect(() => {
    setSiteName(platformSettings?.siteName || 'منصة مهارات التعليمية');
    setTeacherAiToolsUrl(platformSettings?.teacherAiToolsUrl || 'https://app.magicschool.ai/tools');
    setStudentAiToolsUrl(platformSettings?.studentAiToolsUrl || 'https://app.magicschool.ai/tools');
    // التأكد من أن كل أداة لها حقل isVisible (للتوافق مع البيانات القديمة)
    setTeacherAiToolsList((platformSettings?.teacherAiToolsList || []).map(tool => ({
      ...tool,
      isVisible: tool.isVisible !== undefined ? tool.isVisible : true
    })));
    setStudentAiToolsList((platformSettings?.studentAiToolsList || []).map(tool => ({
      ...tool,
      isVisible: tool.isVisible !== undefined ? tool.isVisible : true,
      visibleForGroups: tool.visibleForGroups || []
    })));
    setEmailDomain(platformSettings?.emailDomain || 'myplatform.com');
    setStudentStartingCodeNumber(platformSettings?.studentStartingCodeNumber || 1000);
    setShowRegisterButton(platformSettings?.showRegisterButton ?? true);
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
    setNewTeacherTool({ name: '', url: '', isVisible: true });
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
    await saveSingleSetting('studentAiToolsList', updatedList, 'قائمة تطبيقات الطالب');
    setNewStudentTool({ name: '', url: '', isVisible: true, visibleForGroups: [] });
  };

  const toggleGroupForNewTool = (group) => {
    setNewStudentTool(prev => {
      const currentGroups = prev.visibleForGroups || [];
      if (currentGroups.includes(group)) {
        return { ...prev, visibleForGroups: currentGroups.filter(g => g !== group) };
      } else {
        return { ...prev, visibleForGroups: [...currentGroups, group] };
      }
    });
  };

  const toggleGroupForEditingTool = (group) => {
    setStudentAiToolsList(prev =>
      prev.map(t => {
        if (t.id === editingStudentTool) {
          const currentGroups = t.visibleForGroups || [];
          const newGroups = currentGroups.includes(group)
            ? currentGroups.filter(g => g !== group)
            : [...currentGroups, group];
          return { ...t, visibleForGroups: newGroups };
        }
        return t;
      })
    );
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

  // وظيفة تبديل حالة الظهور/الإخفاء لتطبيقات الطالب
  const toggleStudentToolVisibility = async (id) => {
    const updatedList = studentAiToolsList.map(tool =>
      tool.id === id ? { ...tool, isVisible: !tool.isVisible } : tool
    );
    setStudentAiToolsList(updatedList);
    await saveSingleSetting('studentAiToolsList', updatedList, 'حالة إظهار تطبيق الطالب');
  };

  // وظيفة تبديل حالة الظهور/الإخفاء لتطبيقات المعلم
  const toggleTeacherToolVisibility = async (id) => {
    const updatedList = teacherAiToolsList.map(tool =>
      tool.id === id ? { ...tool, isVisible: !tool.isVisible } : tool
    );
    setTeacherAiToolsList(updatedList);
    await saveSingleSetting('teacherAiToolsList', updatedList, 'حالة إظهار تطبيق المعلم');
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

          {/* التحكم في زر إنشاء حساب */}
          <div>
            <Label htmlFor="showRegisterButton">إظهار زر إنشاء حساب في الصفحة الرئيسية</Label>
            <div className="flex items-center gap-2 mt-1">
              <Switch
                id="showRegisterButton"
                checked={showRegisterButton}
                onCheckedChange={(checked) => {
                  setShowRegisterButton(checked);
                  saveSingleSetting('showRegisterButton', checked, 'إظهار زر إنشاء حساب');
                }}
              />
              <span>{showRegisterButton ? 'مفعل' : 'معطل'}</span>
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
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{tool.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${tool.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {tool.isVisible ? 'ظاهر' : 'مخفي'}
                              </span>
                            </div>
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
                              onClick={() => toggleTeacherToolVisibility(tool.id)}
                              title={tool.isVisible ? 'إخفاء التطبيق' : 'إظهار التطبيق'}
                            >
                              {tool.isVisible ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        <span className="truncate">
                          {newStudentTool.visibleForGroups?.length > 0
                            ? `محدد (${newStudentTool.visibleForGroups.length})`
                            : 'كل المجموعات'}
                        </span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem
                        onClick={() => setNewStudentTool(prev => ({ ...prev, visibleForGroups: [] }))}
                        className="cursor-pointer"
                      >
                        <Check className={`ml-2 h-4 w-4 ${(!newStudentTool.visibleForGroups || newStudentTool.visibleForGroups.length === 0) ? "opacity-100" : "opacity-0"}`} />
                        كل المجموعات
                      </DropdownMenuItem>
                      {availableGroups.map((group) => (
                        <DropdownMenuCheckboxItem
                          key={group}
                          checked={newStudentTool.visibleForGroups?.includes(group)}
                          onCheckedChange={() => toggleGroupForNewTool(group)}
                        >
                          {group}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                          <div className="flex gap-2 items-center">
                            <Input
                              value={tool.name}
                              onChange={(e) => setStudentAiToolsList(prev =>
                                prev.map(t => t.id === tool.id ? { ...t, name: e.target.value } : t)
                              )}
                              placeholder="اسم التطبيق"
                              className="flex-1"
                            />

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-[180px] justify-between">
                                  <span className="truncate">
                                    {tool.visibleForGroups?.length > 0
                                      ? `محدد (${tool.visibleForGroups.length})`
                                      : 'كل المجموعات'}
                                  </span>
                                  <ChevronDown className="w-4 h-4 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56">
                                <DropdownMenuItem
                                  onClick={() => setStudentAiToolsList(prev => prev.map(t => t.id === tool.id ? { ...t, visibleForGroups: [] } : t))}
                                  className="cursor-pointer"
                                >
                                  <Check className={`ml-2 h-4 w-4 ${(!tool.visibleForGroups || tool.visibleForGroups.length === 0) ? "opacity-100" : "opacity-0"}`} />
                                  كل المجموعات
                                </DropdownMenuItem>
                                {availableGroups.map((group) => (
                                  <DropdownMenuCheckboxItem
                                    key={group}
                                    checked={tool.visibleForGroups?.includes(group)}
                                    onCheckedChange={() => toggleGroupForEditingTool(group)}
                                  >
                                    {group}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

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
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium truncate">{tool.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${tool.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {tool.isVisible ? 'ظاهر' : 'مخفي'}
                              </span>
                              {tool.visibleForGroups && tool.visibleForGroups.length > 0 ? (
                                tool.visibleForGroups.map(group => (
                                  <Badge key={group} variant="secondary" className="text-[10px] px-1 h-5">
                                    {group}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-[10px] px-1 h-5 text-gray-500 border-dashed">
                                  الكل
                                </Badge>
                              )}
                            </div>
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
                              onClick={() => toggleStudentToolVisibility(tool.id)}
                              title={tool.isVisible ? 'إخفاء التطبيق' : 'إظهار التطبيق'}
                            >
                              {tool.isVisible ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
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
        </CardContent>
      </Card>
    </motion.div>
  );
};