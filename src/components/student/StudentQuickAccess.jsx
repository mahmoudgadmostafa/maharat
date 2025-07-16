import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ExternalLink, Video as MeetingIcon } from 'lucide-react'; // Removed Award

const StudentQuickAccess = ({ platformSettings, onOpenResourceModal }) => {
  const defaultStudentAiToolsUrl = 'https://app.magicschool.ai/tools';
  const studentAiToolsUrl = platformSettings?.studentAiToolsUrl || defaultStudentAiToolsUrl;
  const meetingRooms = platformSettings?.meetingRoomsList || [];

  return (
    <div className="space-y-6">
      {meetingRooms.length > 0 && (
        <Card className="glass-effect-alt border-0 shadow-xl bg-gradient-to-r from-green-500/10 to-teal-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <MeetingIcon className="w-6 h-6" />
              غرف الاجتماعات الافتراضية
            </CardTitle>
            <CardDescription>انضم إلى الاجتماعات المباشرة مع المعلم.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetingRooms.map((room) => (
               <Button 
                key={room.id}
                variant="outline"
                className="w-full justify-start p-3 sm:p-4 h-auto glass-button-alt border-green-300 hover:border-green-500"
                onClick={() => onOpenResourceModal(room.url, room.name, 'meeting')}
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 text-green-600" />
                <div className="text-right">
                  <span className="font-semibold text-sm sm:text-base">{room.name}</span>
                  <p className="text-xs text-muted-foreground">الانضمام إلى الاجتماع</p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="glass-effect-alt border-0 shadow-xl bg-gradient-to-r from-purple-600/10 to-blue-600/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Brain className="w-6 h-6" />
            تطبيقات الذكاء الاصطناعي
          </CardTitle>
          <CardDescription>استكشف أدوات الذكاء الاصطناعي المساعدة.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => window.open(studentAiToolsUrl, '_blank', 'noopener,noreferrer')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 sm:px-6 sm:py-3">
            <ExternalLink className="w-4 h-4 ml-2" />
            <span className="text-sm sm:text-base">فتح تطبيقات الذكاء الاصطناعي</span>
          </Button>
        </CardContent>
      </Card>

      {/* Final Exam section removed from here, will be shown in StudentLessonDetails or WelcomeMessage */}
    </div>
  );
};

export default StudentQuickAccess;