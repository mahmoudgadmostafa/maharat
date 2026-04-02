import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, FileText, MessageSquare, CheckSquare, Award, ExternalLink, BookOpen } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import PDFViewer from '@/components/PDFViewer';
import InfographicViewer from '@/components/InfographicViewer';
import ActivityViewer from '@/components/ActivityViewer';
import QuestionsAccess from '@/components/QuestionsAccess';
import ExamAccess from '@/components/ExamAccess';
import { useMotivation } from '@/contexts/MotivationContext';
import { MOTIVATION_TYPES } from '@/lib/motivationMessages';

const StudentLessonDetails = ({
  lesson,
  studentProgress,
  onMarkLessonComplete,
  platformSettings
}) => {
  const { showMotivation } = useMotivation();
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId;
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1].split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('shorts/')[1].split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleMarkComplete = (lessonId) => {
    onMarkLessonComplete(lessonId);
    showMotivation(MOTIVATION_TYPES.LESSON_COMPLETE);
  };

  const getUrlsList = (arr, str) => {
    if (arr && Array.isArray(arr) && arr.length > 0) return arr;
    if (str && typeof str === 'string' && str.trim() !== '') return [str];
    return [];
  };

  const videoUrls = getUrlsList(lesson.videoUrls, lesson.videoUrl);
  const pdfUrls = getUrlsList(lesson.pdfUrls, lesson.pdfUrl);
  const infographicUrls = getUrlsList(lesson.infographicUrls, lesson.infographicUrl);
  const activityUrls = getUrlsList(lesson.activityUrls, lesson.activityUrl);
  // Support for backward compatibility with `questionsUrl`
  const quizUrlsList = lesson.quizUrls && lesson.quizUrls.length > 0 ? lesson.quizUrls : (lesson.quizUrl ? [lesson.quizUrl] : (lesson.questionsUrl ? [lesson.questionsUrl] : []));
  const quizUrls = getUrlsList(quizUrlsList, null);

  const hasAnyContent = videoUrls.length > 0 || pdfUrls.length > 0 || infographicUrls.length > 0 || activityUrls.length > 0 || quizUrls.length > 0;

  return (
    <div className="space-y-6">
      <Card className="glass-effect-alt border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gray-50/50">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl gradient-text-alt break-words">الدرس {lesson.lessonNumber}: {lesson.title}</CardTitle>
          {studentProgress.completedLessons.includes(lesson.id) && (
            <Badge variant="default" className="mt-1 bg-green-500 text-white w-fit">مكتمل</Badge>
          )}
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {videoUrls.length > 0 ? (
            <div className="space-y-6">
              {videoUrls.map((vUrl, idx) => (
                <div key={`vid-${idx}`}>
                  <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <PlayCircle className="text-red-500" />
                    {videoUrls.length > 1 ? `مشاهدة الفيديو ${idx + 1}` : 'مشاهدة الفيديو'}
                  </h3>
                  {getYouTubeEmbedUrl(vUrl) ? (
                    <VideoPlayer videoUrl={vUrl} lessonId={lesson.id} index={idx} />
                  ) : (
                    <p className="text-orange-600">رابط الفيديو غير صحيح أو غير مدعوم حاليًا. <a href={vUrl} target="_blank" rel="noopener noreferrer" className="underline">جرب فتحه مباشرة</a>.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">لا يوجد فيديو لهذا الدرس.</p>
          )}

          <div className="space-y-4">
            {pdfUrls.map((pUrl, idx) => (
              <PDFViewer key={`pdf-${idx}`} pdfUrl={pUrl} lessonId={lesson.id} index={idx} />
            ))}
            {infographicUrls.map((iUrl, idx) => (
              <InfographicViewer key={`info-${idx}`} infographicUrl={iUrl} lessonId={lesson.id} index={idx} />
            ))}
            {activityUrls.map((aUrl, idx) => (
              <ActivityViewer key={`act-${idx}`} activityUrl={aUrl} lessonId={lesson.id} index={idx} />
            ))}
            {quizUrls.map((qUrl, idx) => (
              <QuestionsAccess key={`quiz-${idx}`} questionsUrl={qUrl} lessonId={lesson.id} index={idx} />
            ))}
          </div>

          {!hasAnyContent && (
            <p className="text-center text-gray-500 py-6">لا يوجد محتوى إضافي (فيديو أو PDF أو إنفوجرافيك أو نشاط أو أسئلة) لهذا الدرس حاليًا.</p>
          )}

        </CardContent>
        <CardFooter className="bg-gray-50/50">
          {!studentProgress.completedLessons.includes(lesson.id) ? (
            <Button
              onClick={() => handleMarkComplete(lesson.id)}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <CheckSquare className="w-4 h-4 ml-2" />
              وضع علامة كمكتمل
            </Button>
          ) : (
            <p className="text-green-600 font-medium text-center w-full">لقد أكملت هذا الدرس بنجاح! 🎉</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default StudentLessonDetails;

