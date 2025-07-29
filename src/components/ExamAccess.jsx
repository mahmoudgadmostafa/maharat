import React, { useState } from 'react';
import { trackEvent, EVENT_TYPES } from '@/lib/analyticsService';
import { Award, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const ExamAccess = ({ examUrl, examName, examId }) => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.uid;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExamAccess = () => {
    if (studentId && examId) {
      trackEvent(studentId, EVENT_TYPES.QUESTIONS_ACCESSED, examId, null, {
        examUrl,
        examName,
        timestamp: new Date().toISOString(),
        examType: 'finalExam'
      });
    }
    if (examUrl) {
      window.open(examUrl, '_blank');
    }
  };

  const handleToggleExpanded = () => {
    if (!isExpanded && studentId && examId) {
      trackEvent(studentId, EVENT_TYPES.QUESTIONS_ACCESSED, examId, null, {
        examUrl,
        examName,
        timestamp: new Date().toISOString(),
        viewType: 'inline',
        examType: 'finalExam'
      });
    }
    setIsExpanded(!isExpanded);
  };

  const processGoogleDriveUrl = (url) => {
    if (!url.includes("drive.google.com")) return url;

    let fileId = null;

    if (url.includes("/file/d/")) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
      fileId = match ? match[1] : null;
    } else if (url.includes("id=")) {
      const match = url.match(/id=([a-zA-Z0-9-_]+)/);
      fileId = match ? match[1] : null;
    }

    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    return url;
  };

  if (!examUrl) {
    return <p className="text-gray-500">لا يوجد اختبار متاح.</p>;
  }

  const processedUrl = processGoogleDriveUrl(examUrl);

  return (
    <Card className="glass-effect-alt border-0 shadow-lg bg-gradient-to-r from-red-500/10 to-orange-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-red-600" />
            <span className="text-lg text-red-700">{examName || 'الاختبار'}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleExpanded}
              className="glass-button-alt border-red-300 hover:border-red-500"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="w-4 h-4 ml-1" />
                  إخفاء
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 ml-1" />
                  عرض
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExamAccess}
              className="glass-button-alt border-red-300 hover:border-red-500"
            >
              <ExternalLink className="w-4 h-4 ml-1" />
              فتح خارجي
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
            <iframe
              src={processedUrl}
              width="100%"
              height="100%"
              className="border-0"
              title="Exam Viewer"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center text-red-600">
            قم بإجراء الاختبار لتقييم فهمك للمادة
          </p>
        </CardContent>
      )}
      
      {!isExpanded && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground text-center">
            انقر على "عرض" لمشاهدة الاختبار في نفس الصفحة
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default ExamAccess;

