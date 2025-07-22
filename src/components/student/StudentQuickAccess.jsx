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
      <CardContent className="space-y-4">
  {platformSettings?.studentAiToolsList && platformSettings.studentAiToolsList.length > 0 ? (
    platformSettings.studentAiToolsList.map((tool) => (
      <div
        key={tool.id}
        className="w-full flex items-center justify-between p-4 sm:p-5 h-auto bg-white/10 backdrop-blur-md border border-purple-200/30 rounded-2xl shadow-md hover:shadow-lg transition-colors duration-150"
        onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
        role="button"
      >
        {/* أيقونة الذكاء */}
        <div className="ml-3 text-purple-600">
          <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        {/* النص */}
        <div className="flex-1 text-right">
          <div className="text-orange-500 font-bold text-sm sm:text-base leading-snug truncate">
            {tool.name}
          </div>
          <p className="text-xs text-green-600">فتح الغرفة</p>
        </div>

        {/* أيقونة الرابط */}
        <div className="ml-3 text-purple-400 hover:text-purple-600 transition-colors duration-150">
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>
    ))
  ) : (
    <div className="flex justify-center">
      <Button
        onClick={() => window.open(studentAiToolsUrl, '_blank', 'noopener,noreferrer')}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-5 py-3 text-white rounded-xl shadow-md flex items-center gap-2 text-sm sm:text-base font-medium"
      >
        <ExternalLink className="w-4 h-4 text-white" />
        فتح تطبيقات الذكاء الاصطناعي
      </Button>
    </div>
  )}
</CardContent>




      </Card>

      {/* Final Exam section removed from here, will be shown in StudentLessonDetails or WelcomeMessage */}
    </div>
  );
};

export default StudentQuickAccess;