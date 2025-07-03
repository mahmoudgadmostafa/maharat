import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, UserCircle, Bot, Trash2, Pencil, Save } from 'lucide-react';
import { Timestamp, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const ChatModal = ({ isOpen, onClose, currentUser, targetUser, messages, onSendMessage, onDeleteMessages }) => {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const isTeacher = currentUser?.role === "teacher";

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) setSelectedMessages([]);
  }, [isOpen]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length === 1
      ? names[0].substring(0, 2).toUpperCase()
      : names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const formatMessageTimestamp = (timestamp) => {
    if (!timestamp) return '';
    let date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSelectMessage = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const confirmDeleteSelectedMessages = async () => {
    if (selectedMessages.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedMessages.forEach(id => batch.delete(doc(db, 'messages', id)));
      await batch.commit();
      toast({ title: "تم حذف الرسائل بنجاح" });
      setSelectedMessages([]);
      if (onDeleteMessages) onDeleteMessages(selectedMessages);
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast({ title: "حدث خطأ أثناء الحذف", variant: "destructive" });
    }
    setShowDeleteConfirm(false);
  };

  const handleEditMessage = (id, text) => {
    setEditingMessageId(id);
    setEditingMessageText(text);
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId || !editingMessageText.trim()) return;
    try {
      await updateDoc(doc(db, "messages", editingMessageId), {
        message: editingMessageText.trim(),
        edited: true,
      });
      toast({ title: "تم تعديل الرسالة" });
      setEditingMessageId(null);
      setEditingMessageText('');
    } catch (error) {
      console.error("Error editing message:", error);
      toast({ title: "فشل تعديل الرسالة", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{targetUser?.name ? getInitials(targetUser.name) : <UserCircle />}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>محادثة مع {targetUser?.name || 'مستخدم'}</DialogTitle>
              {targetUser?.email && <DialogDescription className="text-xs">{targetUser.email}</DialogDescription>}
            </div>
          </div>
          {isTeacher && selectedMessages.length > 0 && (
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف ({selectedMessages.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل تريد حذف هذه الرسائل؟ هذا الإجراء لا يمكن التراجع عنه.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteSelectedMessages}>حذف</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 bg-muted/30">
          <div className="space-y-1">
            {messages.map((msg) => {
              const isCurrentSender = msg.senderId === currentUser?.uid;
              const isEditable = isTeacher;

              return (
                <div
                  key={msg.id}
                  className={`group flex items-end gap-2 py-1 ${isCurrentSender ? 'justify-end' : 'justify-start'} ${selectedMessages.includes(msg.id) ? 'bg-blue-100 rounded-md' : ''}`}
                  onClick={() => isTeacher && toggleSelectMessage(msg.id)}
                >
                  {!isCurrentSender && (
                    <Avatar className="h-8 w-8 self-start">
                      <AvatarFallback>{targetUser?.name ? getInitials(targetUser.name) : <UserCircle />}</AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`relative max-w-[70%] p-3 rounded-lg shadow cursor-pointer group-hover:bg-opacity-90 ${
                      isCurrentSender
                        ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border rounded-bl-none'
                    }`}
                  >
                    {editingMessageId === msg.id ? (
                      <>
                        <Textarea
                          rows={2}
                          className="text-sm text-black mb-1"
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                        />
                        <Button size="xs" variant="secondary" onClick={saveEditedMessage} className="mt-1">
                          <Save className="w-4 h-4 mr-1" /> حفظ
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap break-words pr-6">{msg.message}</p>
                        {msg.edited && <span className="text-[10px] text-yellow-300 ml-1">(معدلة)</span>}
                        <p className="text-xs mt-1 text-right">{formatMessageTimestamp(msg.timestamp)}</p>
                        {isEditable && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-1 left-1 text-white hover:text-yellow-300 opacity-0 group-hover:opacity-100 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMessage(msg.id, msg.message);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {isCurrentSender && (
                    <Avatar className="h-8 w-8 self-start">
                      <AvatarFallback>
                        {currentUser?.displayName ? getInitials(currentUser.displayName) : <Bot />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-center text-gray-500 py-8">لا توجد رسائل بعد. ابدأ المحادثة!</p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          <div className="flex w-full items-center gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-grow resize-none"
              rows={1}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} size="icon" className="bg-gradient-to-r from-blue-500 to-sky-500">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
