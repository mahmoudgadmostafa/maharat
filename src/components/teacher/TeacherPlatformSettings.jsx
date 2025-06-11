
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, Brain, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const TeacherPlatformSettings = ({ platformSettings, onSettingsUpdate }) => {
  const [siteName, setSiteName] = useState(platformSettings?.siteName || 'منصة مهارات التعليمية');
  const [teacherAiToolsUrl, setTeacherAiToolsUrl] = useState(platformSettings?.teacherAiToolsUrl || 'https://app.magicschool.ai/tools');
  const [studentAiToolsUrl, setStudentAiToolsUrl] = useState(platformSettings?.studentAiToolsUrl || 'https://app.magicschool.ai/tools');


  const handleSaveSettings = async () => {
    try {
      await onSettingsUpdate({ 
        ...platformSettings, 
        siteName,
        teacherAiToolsUrl,
        studentAiToolsUrl 
      });
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات المنصة بنجاح.",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "لم نتمكن من حفظ الإعدادات.",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    setSiteName(platformSettings?.siteName || 'منصة مهارات التعليمية');
    setTeacherAiToolsUrl(platformSettings?.teacherAiToolsUrl || 'https://app.magicschool.ai/tools');
    setStudentAiToolsUrl(platformSettings?.studentAiToolsUrl || 'https://app.magicschool.ai/tools');
  }, [platformSettings]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-600" />
            إعدادات المنصة العامة
          </CardTitle>
          <CardDescription>
            إدارة الإعدادات العامة للمنصة، بما في ذلك روابط تطبيقات الذكاء الاصطناعي.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="siteName">اسم المنصة</Label>
            <Input 
              id="siteName" 
              value={siteName} 
              onChange={(e) => setSiteName(e.target.value)}
              className="mt-1" 
              placeholder="مثال: منصة مهارات التعليمية"
            />
          </div>

          <div>
            <Label htmlFor="teacherAiToolsUrl" className="flex items-center gap-1">
              <Brain className="w-4 h-4 text-purple-600" />
              رابط تطبيقات الذكاء الاصطناعي (للمعلم)
            </Label>
            <Input 
              id="teacherAiToolsUrl"
              type="url" 
              value={teacherAiToolsUrl} 
              onChange={(e) => setTeacherAiToolsUrl(e.target.value)}
              className="mt-1"
              placeholder="https://example.com/teacher-ai-tools" 
            />
            {teacherAiToolsUrl && (
                <a href={teacherAiToolsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    الرابط الحالي: {teacherAiToolsUrl}
                </a>
            )}
          </div>

          <div>
            <Label htmlFor="studentAiToolsUrl" className="flex items-center gap-1">
              <Brain className="w-4 h-4 text-indigo-600" />
              رابط تطبيقات الذكاء الاصطناعي (للطالب)
            </Label>
            <Input 
              id="studentAiToolsUrl"
              type="url" 
              value={studentAiToolsUrl} 
              onChange={(e) => setStudentAiToolsUrl(e.target.value)}
              className="mt-1"
              placeholder="https://example.com/student-ai-tools" 
            />
             {studentAiToolsUrl && (
                <a href={studentAiToolsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    الرابط الحالي: {studentAiToolsUrl}
                </a>
            )}
          </div>
          
          <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700">
            <Save className="w-4 h-4 ml-2" />
            حفظ جميع الإعدادات
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
