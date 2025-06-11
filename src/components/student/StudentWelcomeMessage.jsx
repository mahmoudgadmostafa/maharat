import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const StudentWelcomeMessage = ({ siteName }) => {
  return (
    <Card className="glass-effect-alt border-0 shadow-xl">
      <CardContent className="text-center py-20">
        <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">مرحبًا بك في {siteName || 'منصتك التعليمية'}!</h2>
        <p className="text-gray-500">اختر درسًا من القائمة على اليمين لبدء رحلتك التعليمية.</p>
        <p className="text-gray-500 mt-1">نتمنى لك تجربة تعلم ممتعة ومفيدة. ✨</p>
      </CardContent>
    </Card>
  );
};

export default StudentWelcomeMessage;