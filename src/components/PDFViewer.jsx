import React, { useEffect, useState, useCallback } from 'react';
import { trackEvent, EVENT_TYPES } from '@/lib/analyticsService';
import { FileText, ExternalLink, Eye, EyeOff, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useMotivation } from '@/contexts/MotivationContext';
import { MOTIVATION_TYPES } from '@/lib/motivationMessages';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PDFViewer = ({ pdfUrl, lessonId, className = "", onMarkComplete }) => {
  const { currentUser } = useAuth();
  const studentId = currentUser?.uid;
  const [isExpanded, setIsExpanded] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { showMotivation } = useMotivation();

  // Save progress to Firestore
  const saveProgress = useCallback(async (unlocked, completed) => {
    if (!studentId || !lessonId) return;
    try {
      const progressRef = doc(db, 'contentProgress', `${studentId}_${lessonId}_pdf`);
      await setDoc(progressRef, {
        isUnlocked: unlocked,
        isCompleted: completed,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving PDF progress:", error);
    }
  }, [studentId, lessonId]);

  // Load progress from Firestore
  useEffect(() => {
    const loadProgress = async () => {
      if (!studentId || !lessonId) return;

      // 🔄 Reset local state immediately on lesson change to prevent leakage
      setIsUnlocked(false);
      setIsCompleted(false);
      setIsExpanded(false);

      try {
        const progressRef = doc(db, 'contentProgress', `${studentId}_${lessonId}_pdf`);
        const snap = await getDoc(progressRef);
        if (snap.exists()) {
          const data = snap.data();
          setIsUnlocked(data.isUnlocked || false);
          setIsCompleted(data.isCompleted || false);
          if (data.isCompleted && onMarkComplete) {
            onMarkComplete();
          }
        }
      } catch (error) {
        console.error("Error loading PDF progress:", error);
      }
    };
    loadProgress();
  }, [studentId, lessonId]);

  const handlePDFOpen = () => {
    if (!isUnlocked) {
      setIsUnlocked(true);
      saveProgress(true, isCompleted);
    }
    if (studentId && lessonId) {
      trackEvent(studentId, EVENT_TYPES.PDF_OPENED, lessonId, null, {
        pdfUrl,
        timestamp: new Date().toISOString()
      });
    }
    window.open(pdfUrl, '_blank');
  };

  const handleToggleExpanded = () => {
    if (!isExpanded && studentId && lessonId) {
      if (!isUnlocked) {
        setIsUnlocked(true);
        saveProgress(true, isCompleted);
      }
      trackEvent(studentId, EVENT_TYPES.PDF_OPENED, lessonId, null, {
        pdfUrl,
        timestamp: new Date().toISOString(),
        viewType: 'inline'
      });
    }
    setIsExpanded(!isExpanded);
    setPdfError(false); // إعادة تعيين حالة الخطأ عند التبديل
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

  const getDirectDownloadUrl = (url) => {
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
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    return url;
  };

  const handleIframeError = () => {
    setPdfError(true);
  };

  if (!pdfUrl) {
    return <p className="text-gray-500">لا يوجد ملف PDF لهذا الدرس.</p>;
  }

  const processedUrl = processGoogleDriveUrl(pdfUrl);
  const downloadUrl = getDirectDownloadUrl(pdfUrl);

  return (
    <Card className="glass-effect-alt border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            <span className="text-base sm:text-lg">ملف PDF</span>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleExpanded}
              className="glass-button-alt min-h-[36px] flex-1 sm:flex-none"
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
              onClick={() => window.open(downloadUrl, '_blank')}
              className="glass-button-alt min-h-[36px] flex-1 sm:flex-none"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              <span className="text-xs sm:text-sm">تحميل</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePDFOpen}
              className="glass-button-alt min-h-[36px] flex-1 sm:flex-none"
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
                showMotivation(MOTIVATION_TYPES.PDF_VIEWED);
                if (onMarkComplete) onMarkComplete();
              }}
              disabled={!isUnlocked || isCompleted}
              className={`${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-sm transition-all duration-300 disabled:opacity-50 disabled:grayscale min-h-[36px] flex-1 sm:flex-none`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                  <span className="text-xs sm:text-sm">تم الاطلاع ✓</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                  <span className="text-xs sm:text-sm">تم الاطلاع</span>
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {pdfError ? (
            <div className="border rounded-lg overflow-hidden bg-gray-50 p-4 sm:p-8 text-center" style={{ height: 'clamp(400px, 60vh, 600px)' }}>
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <FileText className="w-16 h-16 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-700">تعذر عرض ملف PDF</h3>
                <p className="text-gray-600 max-w-md">
                  لا يمكن عرض هذا الملف مباشرة في المتصفح. يرجى استخدام أحد الخيارات التالية:
                </p>
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    تحميل الملف
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePDFOpen}
                  >
                    <ExternalLink className="w-4 h-4 ml-1" />
                    فتح في تبويب جديد
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white" style={{ height: 'clamp(400px, 60vh, 600px)' }}>
              <iframe
                src={processedUrl}
                width="100%"
                height="100%"
                className="border-0"
                title="PDF Viewer"
                allowFullScreen
                onError={handleIframeError}
                onLoad={(e) => {
                  // التحقق من محتوى الإطار بعد التحميل
                  setTimeout(() => {
                    try {
                      const iframe = e.target;
                      if (iframe.contentDocument && iframe.contentDocument.body.innerHTML.trim() === '') {
                        setPdfError(true);
                      }
                    } catch (error) {
                      // تجاهل أخطاء CORS
                    }
                  }, 3000);
                }}
              />
            </div>
          )}
          <div className="mt-3 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              عرض أو تحميل المادة النصية
            </p>
            {!pdfError && (
              <p className="text-xs text-orange-600">
                إذا لم يظهر المحتوى، جرب تحميل الملف أو فتحه في تبويب جديد
              </p>
            )}
          </div>
        </CardContent>
      )}

      {!isExpanded && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground text-center">
            انقر على "عرض" لمشاهدة ملف PDF في نفس الصفحة، أو "تحميل" لحفظ الملف
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default PDFViewer;

