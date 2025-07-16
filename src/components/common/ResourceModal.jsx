import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export const ResourceModal = ({ isOpen, onClose, title, url, resourceType }) => {
  if (!isOpen || !url) return null;

  const isExternalSite = resourceType === 'quiz' || resourceType === 'finalExam' || resourceType === 'meeting';
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [fallbackToIframe, setFallbackToIframe] = useState(false);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

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
      // رابط معاينة مباشر لملف Google Drive
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }

    return url;
  };

  const renderPdfContent = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error("Error loading PDF document:", error);
            setFallbackToIframe(true);
          }}
          className="w-full h-full"
          loading={<div className="text-center p-4">جاري تحميل ملف PDF...</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            width={Math.min(window.innerWidth * 0.7, 600)}
            loading={<div className="text-center p-2">جاري تحميل الصفحة...</div>}
          />
        </Document>
        {numPages && (
          <div className="flex gap-2 mt-2 items-center">
            <Button
              size="sm"
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
            >
              السابق
            </Button>
            <span className="text-sm">صفحة {pageNumber} من {numPages}</span>
            <Button
              size="sm"
              onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
            >
              التالي
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderIframe = (embedUrl) => (
    <iframe
      src={embedUrl}
      width="100%"
      height="100%"
      className="border-0"
      title={title}
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );

  const isGoogleDrive = url.includes("drive.google.com");
  const processedUrl = processGoogleDriveUrl(url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl gradient-text-alt">{title}</DialogTitle>
          <DialogDescription>
            {resourceType === 'pdf' 
              ? "يتم عرض ملف PDF. إذا لم يظهر بشكل صحيح، قد يكون بسبب إعدادات الخصوصية للملف. جرب 'فتح في تبويب جديد'."
              : isExternalSite 
                ? "يتم عرض هذا المحتوى من موقع خارجي. قد تحتاج إلى التفاعل مباشرة مع النافذة أدناه."
                : "عرض المورد."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-auto py-4 border rounded-md my-2">
          {resourceType === 'pdf' ? (
            isGoogleDrive ? renderIframe(processedUrl)
            : fallbackToIframe ? renderIframe(`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`)
            : renderPdfContent()
          ) : (
            renderIframe(url)
          )}
        </div>

        <DialogFooter className="sm:justify-between mt-auto">
          <Button variant="outline" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="w-4 h-4 ml-2" />
            فتح في تبويب جديد
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              إغلاق
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
