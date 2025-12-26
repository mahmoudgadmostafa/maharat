import React, { useState, useCallback, useEffect } from 'react';
import { trackEvent, EVENT_TYPES } from '@/lib/analyticsService';
import { Award, ExternalLink, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useMotivation } from '@/contexts/MotivationContext';
import { MOTIVATION_TYPES } from '@/lib/motivationMessages';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ExamAccess = ({ examUrl, examName, examId }) => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.uid;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { showMotivation } = useMotivation();

  // Save progress to Firestore
  const saveProgress = useCallback(async (unlocked, completed) => {
    if (!studentId || !examId) return;
    try {
      const progressRef = doc(db, 'contentProgress', `${studentId}_${examId}_exam`);
      await setDoc(progressRef, {
        isUnlocked: unlocked,
        isCompleted: completed,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving Exam progress:", error);
    }
  }, [studentId, examId]);

  // Load progress from Firestore
  useEffect(() => {
    const loadProgress = async () => {
      if (!studentId || !examId) return;

      // 🔄 Reset local state immediately on lesson change to prevent leakage
      setIsUnlocked(false);
      setIsCompleted(false);
      setIsExpanded(false);

      try {
        const progressRef = doc(db, 'contentProgress', `${studentId}_${examId}_exam`);
        const snap = await getDoc(progressRef);
        if (snap.exists()) {
          const data = snap.data();
          setIsUnlocked(data.isUnlocked || false);
          setIsCompleted(data.isCompleted || false);
        }
      } catch (error) {
        console.error("Error loading Exam progress:", error);
      }
    };
    loadProgress();
  }, [studentId, examId]);

  const handleExamAccess = () => {
    if (!isUnlocked) {
      setIsUnlocked(true);
      saveProgress(true, isCompleted);
    }
    if (studentId && examId) {
      trackEvent(EVENT_TYPES.QUESTIONS_ACCESSED, studentId, examId, {
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
      if (!isUnlocked) {
        setIsUnlocked(true);
        saveProgress(true, isCompleted);
      }
      trackEvent(EVENT_TYPES.QUESTIONS_ACCESSED, studentId, examId, {
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
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            <span className="text-base sm:text-lg text-red-700">{examName || 'الاختبار'}</span>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleExpanded}
              className="glass-button-alt border-red-300 hover:border-red-500 min-h-[36px] flex-1 sm:flex-none"
            >
              {isExpanded ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                  <span className="text-xs sm:text-sm">إخفاء</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                  <span className="text-xs sm:text-sm">عرض</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExamAccess}
              className="glass-button-alt border-red-300 hover:border-red-500 min-h-[36px] flex-1 sm:flex-none"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              <span className="text-xs sm:text-sm">فتح خارجي</span>
            </Button>
            <Button
              variant={isCompleted ? "success" : "default"}
              size="sm"
              onClick={() => {
                setIsCompleted(true);
                saveProgress(isUnlocked, true);
                showMotivation(MOTIVATION_TYPES.EXAM_COMPLETE);
              }}
              disabled={!isUnlocked || isCompleted}
              className={`${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white shadow-sm transition-all duration-300 disabled:opacity-50 disabled:grayscale min-h-[36px] flex-1 sm:flex-none`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                  <span className="text-xs sm:text-sm">أنهيت الاختبار ✓</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                  <span className="text-xs sm:text-sm">أنهيت الاختبار</span>
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="border rounded-lg overflow-hidden bg-white" style={{ height: 'clamp(400px, 60vh, 600px)' }}>
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

