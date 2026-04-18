import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle, CheckSquare } from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import PDFViewer from '@/components/PDFViewer';
import InfographicViewer from '@/components/InfographicViewer';
import QuestionsAccess from '@/components/QuestionsAccess';
import { useMotivation } from '@/contexts/MotivationContext';
import { MOTIVATION_TYPES } from '@/lib/motivationMessages';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns the first non-empty string from an array field OR a legacy singular field */
const getFirst = (arrField, singularField) => {
  if (Array.isArray(arrField) && arrField.length > 0) {
    const first = arrField.find(u => u && u.trim() !== '');
    if (first) return first;
  }
  if (singularField && typeof singularField === 'string' && singularField.trim() !== '') {
    return singularField;
  }
  return null;
};

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

/**
 * Check whether a lesson component is visible for the student's group.
 * - If no componentVisibility configured → visible (backwards compat)
 * - If visible === false → hidden for everyone
 * - If groups includes 'الكل' → visible for all
 * - Otherwise → only visible if studentGroup is in the groups list
 */
const isComponentVisible = (lesson, componentKey, studentGroup) => {
  if (!lesson.componentVisibility) return true;
  const cfg = lesson.componentVisibility[componentKey];
  if (!cfg) return true;
  if (cfg.visible === false) return false;
  const groups = cfg.groups || ['الكل'];
  if (groups.includes('الكل')) return true;
  if (!studentGroup) return false;
  return groups.includes(studentGroup);
};

// ─── Component ───────────────────────────────────────────────────────────────

const StudentLessonDetails = ({
  lesson,
  studentProgress,
  onMarkLessonComplete,
  platformSettings,
  studentGroup,
}) => {
  const { showMotivation } = useMotivation();

  // Resolve actual URLs from either array (new) or singular (legacy) fields
  const videoUrl      = getFirst(lesson.videoUrls, lesson.videoUrl);
  const pdfUrl        = getFirst(lesson.pdfUrls, lesson.pdfUrl);
  const infographicUrl= getFirst(lesson.infographicUrls, lesson.infographicUrl);
  const activityUrl   = getFirst(lesson.activityUrls, lesson.activityUrl);
  const quizUrl       = getFirst(lesson.quizUrls, lesson.quizUrl || lesson.questionsUrl);

  // Visibility per component for this student's group
  const showVideo           = isComponentVisible(lesson, 'video',       studentGroup);
  const showPdf             = isComponentVisible(lesson, 'pdf',         studentGroup);
  const showInfographic     = isComponentVisible(lesson, 'infographic', studentGroup);
  const showActivity        = isComponentVisible(lesson, 'activity',    studentGroup);
  const showQuiz            = isComponentVisible(lesson, 'quiz',        studentGroup);
  // Note: learningOutcomes & lessonSteps are shown in StudentLessonSelector (sidebar) only

  const [componentStatus, setComponentStatus] = useState({ video: false, pdf: false, quiz: false });

  useEffect(() => {
    setComponentStatus({ video: false, pdf: false, quiz: false });
  }, [lesson.id]);

  const handleComponentComplete = useCallback((type) => {
    setComponentStatus(prev => {
      const next = { ...prev, [type]: true };
      const hasVideo = !!(videoUrl && getYouTubeEmbedUrl(videoUrl)) && showVideo;
      const hasPdf   = !!pdfUrl && showPdf;
      const hasQuiz  = !!quizUrl && showQuiz;
      const allDone  = (!hasVideo || next.video) && (!hasPdf || next.pdf) && (!hasQuiz || next.quiz);
      if (allDone && !studentProgress.completedLessons.includes(lesson.id)) {
        onMarkLessonComplete(lesson.id);
      }
      return next;
    });
  }, [lesson.id, videoUrl, pdfUrl, quizUrl, showVideo, showPdf, showQuiz, studentProgress.completedLessons, onMarkLessonComplete]);

  const handleMarkComplete = (lessonId) => {
    onMarkLessonComplete(lessonId);
    showMotivation(MOTIVATION_TYPES.LESSON_COMPLETE);
  };

  const hasAnyContent =
    (videoUrl && showVideo) ||
    (pdfUrl && showPdf) ||
    (infographicUrl && showInfographic) ||
    (activityUrl && showActivity) ||
    (quizUrl && showQuiz);

  return (
    <div className="space-y-6">
      <Card className="glass-effect-alt border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gray-50/50">
          <CardTitle className="text-lg sm:text-xl lg:text-2xl gradient-text-alt break-words">
            الدرس {lesson.lessonNumber}: {lesson.title}
          </CardTitle>
          {studentProgress.completedLessons.includes(lesson.id) && (
            <Badge variant="default" className="mt-1 bg-green-500 text-white w-fit">مكتمل</Badge>
          )}
        </CardHeader>

        <CardContent className="pt-6 space-y-6">


          {showVideo && videoUrl && (
            getYouTubeEmbedUrl(videoUrl) ? (
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <PlayCircle className="text-red-500" /> مشاهدة الفيديو
                </h3>
                <VideoPlayer
                  videoUrl={videoUrl}
                  lessonId={lesson.id}
                  onMarkComplete={() => handleComponentComplete('video')}
                />
              </div>
            ) : (
              <p className="text-orange-600">
                رابط الفيديو غير صحيح أو غير مدعوم حاليًا.{' '}
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  جرب فتحه مباشرة
                </a>.
              </p>
            )
          )}

          <div className="space-y-4">
            {/* PDF */}
            {showPdf && pdfUrl && (
              <PDFViewer
                pdfUrl={pdfUrl}
                lessonId={lesson.id}
                onMarkComplete={() => handleComponentComplete('pdf')}
              />
            )}

            {/* Infographic */}
            {showInfographic && infographicUrl && (
              <InfographicViewer infographicUrl={infographicUrl} lessonId={lesson.id} />
            )}

            {/* Activity */}
            {showActivity && activityUrl && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h3 className="text-base font-bold text-yellow-800 mb-2">🎯 النشاط التعليمي</h3>
                <a
                  href={activityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-all text-sm"
                >
                  {activityUrl}
                </a>
              </div>
            )}

            {/* Quiz */}
            {showQuiz && quizUrl && (
              <QuestionsAccess
                questionsUrl={quizUrl}
                lessonId={lesson.id}
                onMarkComplete={() => handleComponentComplete('quiz')}
              />
            )}
          </div>

          {!hasAnyContent && (
            <p className="text-center text-gray-500 py-6">
              لا يوجد محتوى متاح لك في هذا الدرس حاليًا.
            </p>
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
