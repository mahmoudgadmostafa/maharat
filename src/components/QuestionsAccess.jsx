import React, { useState } from 'react';
import { trackEvent, EVENT_TYPES } from '@/lib/analyticsService';
import { BookOpen, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const QuestionsAccess = ({ questionsUrl, lessonId }) => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.uid;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuestionsAccess = () => {
    if (studentId && lessonId) {
      trackEvent(studentId, EVENT_TYPES.QUESTIONS_ACCESSED, lessonId, null, {
        questionsUrl,
        timestamp: new Date().toISOString()
      });
    }
    if (questionsUrl) {
      window.open(questionsUrl, '_blank');
    }
  };

  const handleToggleExpanded = () => {
    if (!isExpanded && studentId && lessonId) {
      trackEvent(studentId, EVENT_TYPES.QUESTIONS_ACCESSED, lessonId, null, {
        questionsUrl,
        timestamp: new Date().toISOString(),
        viewType: 'inline'
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

  if (!questionsUrl) {
    return <p className="text-gray-500">لا يوجد أسئلة لهذا الدرس.</p>;
  }

  const processedUrl = processGoogleDriveUrl(questionsUrl);

  return (
    <Card className="glass-effect-alt border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span className="text-lg">أسئلة الدرس</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleExpanded}
              className="glass-button-alt"
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
              onClick={handleQuestionsAccess}
              className="glass-button-alt"
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
              title="Questions Viewer"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            اختبر فهمك لهذا الدرس
          </p>
        </CardContent>
      )}
      
      {!isExpanded && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground text-center">
            انقر على "عرض" لمشاهدة أسئلة الدرس في نفس الصفحة
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default QuestionsAccess;

