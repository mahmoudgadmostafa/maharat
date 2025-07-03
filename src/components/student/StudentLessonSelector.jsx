import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StudentLessonSelector = ({ lessons, selectedLessonId, onLessonClick, studentProgress }) => {
  // دالة للتحقق من استكمال جميع الدروس السابقة
  const isPreviousLessonsCompleted = (currentLessonNumber) => {
    for (let i = 1; i < currentLessonNumber; i++) {
      const previousLesson = lessons.find(lesson => lesson.lessonNumber === i);
      if (previousLesson && !studentProgress.completedLessons.includes(previousLesson.id)) {
        return false;
      }
    }
    return true;
  };

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
                    <SelectItem
                      key={lesson.id}
                      value={lesson.id}
                      disabled={!canAccess}
                    >
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
      </CardContent>
    </Card>
  );
};

export default StudentLessonSelector;
