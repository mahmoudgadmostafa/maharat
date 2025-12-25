import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const StudentWelcomeMessage = ({ siteName }) => {
  return (
    <Card className="glass-effect-alt border-0 shadow-xl">
      <CardContent className="text-center py-12 sm:py-20 px-4 sm:px-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <BookOpen className="w-16 h-16 sm:w-24 sm:h-24 text-blue-400/50 mx-auto mb-4 sm:mb-6" />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold gradient-text-alt mb-3">مرحبًا بك في {siteName || 'منصتك التعليمية'}!</h2>
        <p className="text-base sm:text-lg text-gray-600">اختر درساً من القائمة لتبدأ رحلتك التعليمية الممتعة.</p>
        <p className="text-sm text-gray-500 mt-2 italic flex items-center justify-center gap-2">
          انطلق نحو القمة ✨
        </p>
      </CardContent>
    </Card>
  );
};

export default StudentWelcomeMessage;