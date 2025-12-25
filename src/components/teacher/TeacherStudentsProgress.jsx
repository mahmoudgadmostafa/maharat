import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export const TeacherStudentsProgress = ({ students, lessons, studentProgress, getStudentProgressSummary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className="text-3xl font-bold gradient-text mb-6">تقدم الطلاب</h2>
       {students.length === 0 ? (
          <Card className="glass-effect border-0 shadow-xl">
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">لا يوجد طلاب مسجلون بعد</h3>
              <p className="text-gray-500">سيظهر تقدم الطلاب هنا بمجرد تسجيلهم وبدء الدروس.</p>
            </CardContent>
          </Card>
       ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student, index) => {
            const progress = getStudentProgressSummary(student.id);
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-effect border-0 shadow-xl card-hover">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">{student.name}</CardTitle>
                        <CardDescription className="text-xs">{student.email}</CardDescription>
                      </div>
                      <Badge 
                        variant={progress.percentage >= 70 ? "default" : (progress.percentage >= 30 ? "secondary" : "destructive")}
                        className="text-sm px-3 py-1"
                      >
                        {progress.completed} / {progress.total}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>التقدم</span>
                        <span>{progress.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
       )}
    </motion.div>
  );
};