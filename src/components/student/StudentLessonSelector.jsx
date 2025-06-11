import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StudentLessonSelector = ({ lessons, selectedLessonId, onLessonClick, studentProgress }) => {
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
              {lessons.map(lesson => (
                <SelectItem key={lesson.id} value={lesson.id}>
                  الدرس {lesson.lessonNumber}: {lesson.title} {studentProgress.completedLessons.includes(lesson.id) ? '✅' : ''}
                </SelectItem>
              ))}
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