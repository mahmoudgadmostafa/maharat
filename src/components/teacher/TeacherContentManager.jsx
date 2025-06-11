
import React from 'react';
import { motion } from 'framer-motion';
import { TeacherLessonsManager } from '@/components/teacher/TeacherLessonsManager';
import { TeacherFinalExamManager } from '@/components/teacher/TeacherFinalExamManager';

export const TeacherContentManager = ({ lessons, onLessonsUpdate, platformSettings, onSettingsUpdate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <TeacherLessonsManager 
        lessons={lessons} 
        onLessonsUpdate={onLessonsUpdate} 
      />
      <TeacherFinalExamManager
        platformSettings={platformSettings}
        onSettingsUpdate={onSettingsUpdate}
      />
    </motion.div>
  );
};
