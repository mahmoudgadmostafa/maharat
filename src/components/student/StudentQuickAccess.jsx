import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ExternalLink, Video as MeetingIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const StudentQuickAccess = ({ platformSettings, onOpenResourceModal }) => {
  const [trackingWindows, setTrackingWindows] = useState([]);
  const defaultStudentAiToolsUrl = 'https://app.magicschool.ai/tools';
  const studentAiToolsUrl = platformSettings?.studentAiToolsUrl || defaultStudentAiToolsUrl;
  const meetingRooms = platformSettings?.meetingRoomsList || [];

  // الحصول على أدوات الذكاء الاصطناعي المفلترة
  const studentAiToolsList = React.useMemo(() => {
    return (platformSettings?.studentAiToolsList || []).filter(tool => tool.isVisible !== false);
  }, [platformSettings?.studentAiToolsList]);

  // دالة لفتح غرفة الذكاء الاصطناعي في نافذة تابعة
  const openAiRoomInTrackingWindow = (tool) => {
    if (!tool?.url) {
      toast({
        title: "رابط غير متوفر",
        description: "لم يتم إضافة رابط لهذه الغرفة بعد.",
        variant: "destructive",
      });
      return;
    }

    try {
      // إعدادات النافذة التابعة
      const windowWidth = 1200;
      const windowHeight = 700;
      const left = (window.screen.width - windowWidth) / 2;
      const top = (window.screen.height - windowHeight) / 2;
      
      // إنشاء معرّف فريد للنافذة
      const windowId = `ai_room_${Date.now()}`;
      
      // فتح النافذة التابعة
      const newWindow = window.open(
        tool.url,
        windowId,
        `width=${windowWidth},height=${windowHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=yes,location=no,menubar=no,status=yes`
      );

      if (newWindow) {
        // إضافة النافذة الجديدة إلى التتبع
        setTrackingWindows(prev => [...prev, {
          id: windowId,
          windowRef: newWindow,
          toolName: tool.name,
          openedAt: Date.now()
        }]);

        // إعطاء التركيز للنافذة الجديدة
        newWindow.focus();
        
        // تسجيل حدث فتح الغرفة
        if (onOpenResourceModal) {
          onOpenResourceModal(tool.url, tool.name, 'aiRoom', { trackingWindow: true });
        }

        // إظهار رسالة نجاح
        toast({
          title: "تم فتح غرفة الذكاء الاصطناعي",
          description: "تم فتح الغرفة في نافذة تابعة. يمكنك العودة لهذه النافذة في أي وقت.",
          variant: "default",
        });
      } else {
        // في حالة منع النوافذ المنبثقة
        toast({
          title: "ملاحظة",
          description: "يبدو أن المتصفح يمنع النوافذ المنبثقة. سيتم فتح الرابط في تاب جديد.",
          variant: "default",
        });
        
        // فتح في تاب جديد كحل بديل
        window.open(tool.url, '_blank', 'noopener,noreferrer');
        
        // تسجيل الحدث كأنه فتح في تاب جديد
        if (onOpenResourceModal) {
          onOpenResourceModal(tool.url, tool.name, 'aiRoom', { trackingWindow: false });
        }
      }
    } catch (error) {
      console.error('Error opening AI room:', error);
      toast({
        title: "خطأ في فتح الغرفة",
        description: "حدث خطأ أثناء محاولة فتح غرفة الذكاء الاصطناعي.",
        variant: "destructive",
      });
    }
  };

  // مراقبة إغلاق النوافذ التابعة
  useEffect(() => {
    if (trackingWindows.length === 0) return;

    const interval = setInterval(() => {
      setTrackingWindows(prevWindows => {
        const updatedWindows = prevWindows.filter(windowInfo => {
          if (windowInfo.windowRef && !windowInfo.windowRef.closed) {
            return true;
          }
          
          // النافذة مغلقة - تسجيل الحدث
          if (onOpenResourceModal && windowInfo.windowRef?.closed) {
            const timeSpent = Date.now() - windowInfo.openedAt;
            onOpenResourceModal(null, windowInfo.toolName, 'aiRoomClosed', {
              timeSpent,
              trackingWindow: true
            });
          }
          
          return false;
        });
        
        return updatedWindows;
      });
    }, 1000); // التحقق كل ثانية

    return () => clearInterval(interval);
  }, [trackingWindows, onOpenResourceModal]);

  // دالة لفحص حالة النوافذ المفتوحة
  const checkOpenWindows = () => {
    const openWindowsCount = trackingWindows.filter(w => w.windowRef && !w.windowRef.closed).length;
    
    if (openWindowsCount === 0) {
      toast({
        title: "لا توجد نوافذ مفتوحة",
        description: "جميع غرف الذكاء الاصطناعي مغلقة.",
        variant: "default",
      });
    } else {
      toast({
        title: `لديك ${openWindowsCount} نافذة مفتوحة`,
        description: "يمكنك العودة للنوافذ المفتوحة أو الاستمرار في التعلم.",
        variant: "default",
      });
    }
  };

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
          <CardDescription>
            استكشف أدوات الذكاء الاصطناعي المساعدة.
            {trackingWindows.length > 0 && (
              <span className="text-xs text-purple-600 block mt-1">
                لديك {trackingWindows.length} نافذة مفتوحة
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {studentAiToolsList.length > 0 ? (
            <>
              {studentAiToolsList.map((tool) => (
                <div
                  key={tool.id}
                  className="w-full flex items-center justify-between p-4 sm:p-5 h-auto bg-white/10 backdrop-blur-md border border-purple-200/30 rounded-2xl shadow-md hover:shadow-lg hover:bg-white/20 transition-all duration-300 cursor-pointer group"
                  onClick={() => openAiRoomInTrackingWindow(tool)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openAiRoomInTrackingWindow(tool);
                    }
                  }}
                  aria-label={`فتح ${tool.name} في نافذة تابعة`}
                >
                  {/* أيقونة الذكاء مع تأثير */}
                  <div className="ml-3 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  {/* النص */}
                  <div className="flex-1 text-right">
                    <div className="text-orange-500 font-bold text-sm sm:text-base leading-snug truncate">
                      {tool.name}
                    </div>
                    <p className="text-xs text-green-600 group-hover:text-green-700 transition-colors duration-300">
                      فتح الغرفة في نافذة تابعة
                    </p>
                    {tool.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {tool.description}
                      </p>
                    )}
                  </div>

                  {/* أيقونة الرابط مع تأثير */}
                  <div className="ml-3 text-purple-400 group-hover:text-purple-600 group-hover:scale-110 transition-all duration-300">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              ))}
              
              {/* زر التحقق من النوافذ المفتوحة */}
              {trackingWindows.length > 0 && (
                <div className="pt-4 border-t border-purple-200/30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={checkOpenWindows}
                  >
                    <Brain className="w-4 h-4 ml-2" />
                    التحقق من النوافذ المفتوحة ({trackingWindows.length})
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-2">لا توجد أدوات ذكاء اصطناعي مخصصة متاحة حاليًا.</p>
                <p className="text-sm text-gray-500">يمكنك استخدام الرابط العام للذكاء الاصطناعي.</p>
              </div>
              <Button
                onClick={() => window.open(studentAiToolsUrl, '_blank', 'noopener,noreferrer')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-5 py-3 text-white rounded-xl shadow-md flex items-center gap-2 text-sm sm:text-base font-medium"
              >
                <ExternalLink className="w-4 h-4 text-white" />
                فتح تطبيقات الذكاء الاصطناعي العامة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* تلميح للمستخدم */}
      {trackingWindows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          💡 <strong>نصيحة:</strong> يمكنك إغلاق النوافذ التابعة يدويًا أو العودة لها مباشرة.
          {trackingWindows.map(win => (
            <div key={win.id} className="mt-1 text-xs">
              • {win.toolName} - {win.windowRef?.closed ? 'مغلقة' : 'مفتوحة'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentQuickAccess;
