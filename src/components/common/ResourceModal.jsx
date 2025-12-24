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

export const ResourceModal = ({ isOpen, onClose, title, url, resourceType }) => {
  if (!isOpen || !url) return null;

  const isExternalSite = resourceType === 'finalExam' || resourceType === 'meeting' || resourceType === 'ai_tool';
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
            {isExternalSite
              ? "يتم عرض هذا المحتوى من موقع خارجي. قد تحتاج إلى التفاعل مباشرة مع النافذة أدناه."
              : "عرض المورد."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-auto py-4 border rounded-md my-2">
          {renderIframe(url)}
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
