import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, FileText, MessageSquare, CheckSquare, Award, ExternalLink, BookOpen } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import PDFViewer from '@/components/PDFViewer';
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
          {lesson.videoUrl && getYouTubeEmbedUrl(lesson.videoUrl) ? (
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><PlayCircle className="text-red-500" /> مشاهدة الفيديو</h3>
              <VideoPlayer videoUrl={lesson.videoUrl} lessonId={lesson.id} />
            </div>
          ) : lesson.videoUrl ? (
            <p className="text-orange-600">رابط الفيديو غير صحيح أو غير مدعوم حاليًا. <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="underline">جرب فتحه مباشرة</a>.</p>
          ) : (
            <p className="text-gray-500">لا يوجد فيديو لهذا الدرس.</p>
          )}

          <div className="space-y-4">
            {lesson.pdfUrl && (
              <PDFViewer pdfUrl={lesson.pdfUrl} lessonId={lesson.id} />
            )}
            {(lesson.quizUrl || lesson.questionsUrl) && (
              <QuestionsAccess questionsUrl={lesson.quizUrl || lesson.questionsUrl} lessonId={lesson.id} />
            )}
          </div>

          {!lesson.pdfUrl && !lesson.quizUrl && !lesson.questionsUrl && !lesson.videoUrl && (
            <p className="text-center text-gray-500 py-6">لا يوجد محتوى إضافي (PDF أو أسئلة) لهذا الدرس حاليًا.</p>
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

