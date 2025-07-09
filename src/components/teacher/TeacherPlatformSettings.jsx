import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, Brain, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const TeacherPlatformSettings = ({ platformSettings, onSettingsUpdate }) => {
  const [siteName, setSiteName] = useState('');
  const [teacherAiToolsUrl, setTeacherAiToolsUrl] = useState('');
  const [studentAiToolsUrl, setStudentAiToolsUrl] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [studentStartingCodeNumber, setStudentStartingCodeNumber] = useState(1000);

  useEffect(() => {
    setSiteName(platformSettings?.siteName || 'منصة مهارات التعليمية');
    setTeacherAiToolsUrl(platformSettings?.teacherAiToolsUrl || 'https://app.magicschool.ai/tools');
    setStudentAiToolsUrl(platformSettings?.studentAiToolsUrl || 'https://app.magicschool.ai/tools');
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-600" />
            إعدادات المنصة العامة
          </CardTitle>
          <CardDescription>
            إدارة الإعدادات العامة وروابط وأكواد التسجيل.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* الموقع */}
          <div>
            <Label htmlFor="siteName">اسم المنصة</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
              />
              <Button onClick={() => saveSingleSetting('siteName', siteName, 'اسم المنصة')}>
                <Save className="w-4 h-4 ml-1" /> حفظ
              </Button>
            </div>
          </div>

          {/* امتداد البريد */}
          <div>
            <Label htmlFor="emailDomain">امتداد البريد الإلكتروني</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="emailDomain"
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
              />
              <Button onClick={() => saveSingleSetting('emailDomain', emailDomain, 'امتداد البريد')}>
                <Save className="w-4 h-4 ml-1" /> حفظ
              </Button>
            </div>
          </div>

          {/* رقم الكود للطلاب */}
          <div>
            <Label htmlFor="studentStartingCodeNumber">رقم بدء توليد أكواد الطلاب</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="studentStartingCodeNumber"
                type="number"
                min={0}
                value={studentStartingCodeNumber}
                onChange={(e) => setStudentStartingCodeNumber(parseInt(e.target.value))}
              />
              <Button onClick={() => saveSingleSetting('studentStartingCodeNumber', studentStartingCodeNumber, 'رقم بدء الأكواد')}>
                <Save className="w-4 h-4 ml-1" /> حفظ
              </Button>
            </div>
          </div>

          {/* رابط أدوات الذكاء للمعلم */}
          <div>
            <Label htmlFor="teacherAiToolsUrl" className="flex items-center gap-1">
              <Brain className="w-4 h-4 text-purple-600" />
              رابط أدوات الذكاء (معلم)
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="teacherAiToolsUrl"
                type="url"
                value={teacherAiToolsUrl}
                onChange={(e) => setTeacherAiToolsUrl(e.target.value)}
              />
              <Button onClick={() => saveSingleSetting('teacherAiToolsUrl', teacherAiToolsUrl, 'رابط المعلم')}>
                <Save className="w-4 h-4 ml-1" /> حفظ
              </Button>
            </div>
            {teacherAiToolsUrl && (
              <a href={teacherAiToolsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
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
            <div className="flex gap-2 mt-1">
              <Input
                id="studentAiToolsUrl"
                type="url"
                value={studentAiToolsUrl}
                onChange={(e) => setStudentAiToolsUrl(e.target.value)}
              />
              <Button onClick={() => saveSingleSetting('studentAiToolsUrl', studentAiToolsUrl, 'رابط الطالب')}>
                <Save className="w-4 h-4 ml-1" /> حفظ
              </Button>
            </div>
            {studentAiToolsUrl && (
              <a href={studentAiToolsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                <ExternalLink className="w-3 h-3 inline mr-1" />
                الرابط الحالي: {studentAiToolsUrl}
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
