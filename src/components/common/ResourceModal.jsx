import React from 'react';
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
import { ExternalLink, AlertTriangle } from 'lucide-react';

export const ResourceModal = ({ isOpen, onClose, title, url, resourceType }) => {
  if (!isOpen || !url) return null;

  const isExternalSite = resourceType === 'quiz' || resourceType === 'finalExam' || resourceType === 'meeting';
  let displayUrl = url;
  let pdfDisplayError = false;

  if (resourceType === 'pdf') {
    if (url.endsWith('.pdf') || url.includes('drive.google.com/file/d/')) {
      // For direct .pdf links or Google Drive links, try Google Docs Viewer
      // Ensure Google Drive links are in a viewable format (e.g. /preview not /edit)
      // Basic check, might need more robust URL parsing for GDrive
      let gDriveUrl = url;
      if (url.includes('drive.google.com/file/d/')) {
        gDriveUrl = url.replace('/view?usp=sharing', '').replace('/edit?usp=sharing', '');
        if (!gDriveUrl.includes('/preview')) {
             // Attempt to construct a preview URL if it's a file ID link
             const parts = url.split('/');
             const fileId = parts[parts.indexOf('d') + 1];
             if (fileId) {
                gDriveUrl = `https://drive.google.com/file/d/${fileId}/preview`;
             }
        }
      }
      displayUrl = `https://docs.google.com/gview?url=${encodeURIComponent(gDriveUrl)}&embedded=true`;
    } else {
      // If it's not a direct PDF or known GDrive link, it might be a page with an embedded PDF or something else.
      // Try to iframe directly, but acknowledge it might fail.
      // No change to displayUrl, but we might set pdfDisplayError later if iframe fails (not detectable here directly)
      // For now, we assume it might work or the user will use "Open in new tab".
    }
  }
  
  // A simple (and not foolproof) way to detect if Google Viewer might fail due to permissions
  // This is a client-side check and won't know for sure until iframe tries to load.
  // The message "لا يوجد إذن وصول" comes from Google's side.
  // We can preemptively warn if the URL doesn't look like a public sharing link.
  if (resourceType === 'pdf' && url.includes('drive.google.com') && !url.includes('usp=sharing') && !url.includes('/preview')) {
    // pdfDisplayError = true; // This is too aggressive, as some links might work.
    // Instead, the description below will guide the user.
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl gradient-text-alt">{title}</DialogTitle>
          <DialogDescription>
            {resourceType === 'pdf' 
              ? "يتم محاولة عرض ملف PDF. إذا لم يظهر بشكل صحيح أو ظهرت رسالة خطأ (مثل 'لا يوجد إذن وصول')، قد يكون السبب أن الملف غير متاح للمشاركة العامة أو أن الرابط يتطلب تسجيل دخول. جرب 'فتح في تبويب جديد'."
              : isExternalSite 
                ? "يتم عرض هذا المحتوى من موقع خارجي. قد تحتاج إلى التفاعل مباشرة مع النافذة أدناه."
                : "عرض المورد."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-auto py-4 border rounded-md my-2">
          {pdfDisplayError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
              <p className="text-lg font-semibold">مشكلة في عرض الملف</p>
              <p className="text-muted-foreground">
                لا يمكن عرض ملف PDF هذا مباشرة هنا، قد يكون بسبب إعدادات الخصوصية للملف.
                <br />
                الرجاء استخدام زر "فتح في تبويب جديد" لعرضه.
              </p>
            </div>
          ) : (
            <iframe 
              src={displayUrl} 
              width="100%" 
              height="100%" 
              className="border-0" 
              title={title} 
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
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