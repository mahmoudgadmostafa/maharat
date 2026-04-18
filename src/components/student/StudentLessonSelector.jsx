import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, Compass } from 'lucide-react';

/** Same visibility helper as in StudentLessonDetails */
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

const StudentLessonSelector = ({ lessons, selectedLessonId, onLessonClick, studentProgress, studentGroup }) => {
  const isPreviousLessonsCompleted = (currentLessonNumber) => {
    for (let i = 1; i < currentLessonNumber; i++) {
      const previousLesson = lessons.find(lesson => lesson.lessonNumber === i);
      if (previousLesson && !studentProgress.completedLessons.includes(previousLesson.id)) {
        return false;
      }
    }
    return true;
  };

  const selectedLesson = lessons.find(lesson => lesson.id === selectedLessonId);

  const showLearningOutcomes = selectedLesson && isComponentVisible(selectedLesson, 'learningOutcomes', studentGroup);
  const showLessonSteps      = selectedLesson && isComponentVisible(selectedLesson, 'lessonSteps',      studentGroup);

  const hasLearningOutcomes = showLearningOutcomes &&
    selectedLesson.learningOutcomes &&
    selectedLesson.learningOutcomes.filter(o => o?.trim()).length > 0;

  const hasLessonSteps = showLessonSteps &&
    selectedLesson.lessonSteps &&
    selectedLesson.lessonSteps.filter(s => s?.trim()).length > 0;

  return (
    <Card className="glass-effect-alt border-0 shadow-xl">
      <CardHeader>
        <CardTitle>اختر درسًا</CardTitle>
        <CardDescription>اختر درسًا من القائمة لبدء التعلم.</CardDescription>
      </CardHeader>
      <CardContent>
        {lessons.length > 0 ? (
          <Select onValueChange={onLessonClick} value={selectedLessonId || ""}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر درسًا لعرضه" />
            </SelectTrigger>
            <SelectContent>
              {lessons
                .sort((a, b) => a.lessonNumber - b.lessonNumber)
                .map(lesson => {
                  const isCompleted = studentProgress.completedLessons.includes(lesson.id);
                  const canAccess = isCompleted || isPreviousLessonsCompleted(lesson.lessonNumber);
                  const label = `الدرس ${lesson.lessonNumber}: ${lesson.title} ${isCompleted ? '✅' : ''}`;
                  const disabledReason = !canAccess && !isCompleted ? ' - أكمل الدرس السابق أولاً' : '';
                  return (
                    <SelectItem key={lesson.id} value={lesson.id} disabled={!canAccess}>
                      {label}
                      <span className="text-red-500 text-sm">{disabledReason}</span>
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-center text-gray-500 py-4">لا توجد دروس متاحة حاليًا.</p>
        )}

        {/* نواتج التعلم — تظهر فقط إذا كانت مرئية لهذه المجموعة */}
        {hasLearningOutcomes && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-700">
              <Award className="text-yellow-500" />
              نواتج التعلم للدرس {selectedLesson.lessonNumber}: {selectedLesson.title}
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {selectedLesson.learningOutcomes.filter(o => o?.trim()).map((outcome, idx) => (
                <li key={idx} className="text-sm">{outcome}</li>
              ))}
            </ul>
          </div>
        )}

        {/* خطوات السير — تظهر فقط إذا كانت مرئية لهذه المجموعة */}
        {hasLessonSteps && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-700">
              <Compass className="text-blue-500" />
              خطواتك نحو إتقان الدرس
            </h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              {selectedLesson.lessonSteps.filter(s => s?.trim()).map((step, idx) => (
                <li key={idx} className="text-sm">{step}</li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentLessonSelector;
