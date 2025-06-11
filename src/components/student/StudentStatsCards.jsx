import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckSquare, Award } from 'lucide-react';

const StudentStatsCards = ({ lessonsCount, completedLessonsCount, overallProgress }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid md:grid-cols-3 gap-6 mb-8"
    >
      <Card className="glass-effect-alt border-0 shadow-xl bg-white/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sky-700">
            <BookOpen className="w-5 h-5" />
            الدروس المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{lessonsCount}</p>
          <p className="text-sm text-gray-500">درس متاح للتعلم</p>
        </CardContent>
      </Card>
      <Card className="glass-effect-alt border-0 shadow-xl bg-white/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckSquare className="w-5 h-5" />
            الدروس المكتملة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{completedLessonsCount}</p>
          <p className="text-sm text-gray-500">من أصل {lessonsCount} درس</p>
        </CardContent>
      </Card>
      <Card className="glass-effect-alt border-0 shadow-xl bg-white/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-600">
            <Award className="w-5 h-5" />
            تقدمك العام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="w-full h-3 mb-1" indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500" />
          <p className="text-sm text-gray-500 text-center">{overallProgress}% مكتمل</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StudentStatsCards;