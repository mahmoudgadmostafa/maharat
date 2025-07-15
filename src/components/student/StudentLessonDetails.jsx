import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, FileText, MessageSquare, CheckSquare, Award, ExternalLink, BookOpen } from 'lucide-react';

const StudentLessonDetails = ({ 
  lesson, 
  studentProgress, 
  onMarkLessonComplete, 
  onOpenResourceModal, 
  platformSettings,
  hasAccessedQuestions,
  onAccessQuestions
}) => {
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

  const finalExams = platformSettings?.finalExamsList || [];

  const handleQuestionsClick = () => {
    // استخدم quizUrl إذا كان موجودًا، وإلا استخدم questionsUrl
    const questionsUrl = lesson.quizUrl || lesson.questionsUrl;
    if (questionsUrl) {
      onOpenResourceModal(questionsUrl, `أسئلة ${lesson.title}`, 'questions');
      onAccessQuestions();
    } else {
      console.error('رابط الأسئلة غير متوفر');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect-alt border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gray-50/50">
          <CardTitle className="text-2xl gradient-text-alt">الدرس {lesson.lessonNumber}: {lesson.title}</CardTitle>
          {studentProgress.completedLessons.includes(lesson.id) && (
            <Badge variant="default" className="mt-1 bg-green-500 text-white w-fit">مكتمل</Badge>
          )}
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {lesson.videoUrl && getYouTubeEmbedUrl(lesson.videoUrl) ? (
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><PlayCircle className="text-red-500" /> مشاهدة الفيديو</h3>
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe
                  width="100%"
                  height="100%"
                  src={getYouTubeEmbedUrl(lesson.videoUrl)}
                  title={`فيديو الدرس: ${lesson.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          ) : lesson.videoUrl ? (
            <p className="text-orange-600">رابط الفيديو غير صحيح أو غير مدعوم حاليًا. <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="underline">جرب فتحه مباشرة</a>.</p>
          ) : (
            <p className="text-gray-500">لا يوجد فيديو لهذا الدرس.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lesson.pdfUrl && (
              <Button variant="outline" className="w-full justify-start p-4 h-auto glass-button-alt"
                onClick={() => onOpenResourceModal(lesson.pdfUrl, `ملف PDF: ${lesson.title}`, 'pdf')}>
                <FileText className="w-8 h-8 ml-3 text-red-600" />
                <div>
                  <span className="font-semibold">ملف PDF</span>
                  <p className="text-xs text-muted-foreground">عرض أو تحميل المادة النصية</p>
                </div>
              </Button>
            )}
            {(lesson.quizUrl || lesson.questionsUrl) && (
              <Button variant="outline" className="w-full justify-start p-4 h-auto glass-button-alt"
                onClick={handleQuestionsClick}>
                <BookOpen className="w-8 h-8 ml-3 text-blue-600" />
                <div>
                  <span className="font-semibold">أسئلة الدرس</span>
                  <p className="text-xs text-muted-foreground">اختبر فهمك لهذا الدرس</p>
                </div>
              </Button>
            )}
          </div>



          {!lesson.pdfUrl && !lesson.quizUrl && !lesson.questionsUrl && !lesson.videoUrl && (
            <p className="text-center text-gray-500 py-6">لا يوجد محتوى إضافي (PDF أو أسئلة) لهذا الدرس حاليًا.</p>
          )}

        </CardContent>
        <CardFooter className="bg-gray-50/50">
          {!studentProgress.completedLessons.includes(lesson.id) ? (
            <Button
              onClick={() => onMarkLessonComplete(lesson.id)}
              disabled={!hasAccessedQuestions}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <CheckSquare className="w-4 h-4 ml-2" />
              {hasAccessedQuestions ? "وضع علامة كمكتمل" : "يجب الاطلاع على الأسئلة أولاً"}
            </Button>
          ) : (
            <p className="text-green-600 font-medium text-center w-full">لقد أكملت هذا الدرس بنجاح! 🎉</p>
          )}
        </CardFooter>
      </Card>

      {finalExams.length > 0 && (
        <Card className="glass-effect-alt border-0 shadow-xl bg-gradient-to-r from-red-500/10 to-orange-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Award className="w-6 h-6" />
              الاختبارات 
            </CardTitle>
            <CardDescription>قم بإجراء الاختبارات  لتقييم فهمك للمادة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {finalExams.map((exam) => (
              <Button
                key={exam.id}
                variant="outline"
                className="w-full justify-start p-4 h-auto glass-button-alt border-red-300 hover:border-red-500"
                onClick={() => onOpenResourceModal(exam.url, exam.name, 'finalExam')}
              >
                <ExternalLink className="w-5 h-5 ml-3 text-red-600" />
                <div>
                  <span className="font-semibold">{exam.name}</span>
                  <p className="text-xs text-muted-foreground">بدء الاختبار </p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentLessonDetails;