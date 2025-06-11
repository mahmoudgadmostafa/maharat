
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, UserCircle, Bot, Trash2 } from 'lucide-react';
import { Timestamp, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ChatModal = ({ isOpen, onClose, currentUser, targetUser, messages, onSendMessage, onDeleteMessages }) => {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedMessages([]);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };
  
  const formatMessageTimestamp = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Invalid Date';
    }
  
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSelectMessage = (messageId) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]
    );
  };

  const confirmDeleteSelectedMessages = async () => {
    if (selectedMessages.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedMessages.forEach(messageId => {
        const messageRef = doc(db, 'messages', messageId);
        batch.delete(messageRef);
      });
      await batch.commit();
      toast({ title: "تم حذف الرسائل المحددة بنجاح" });
      setSelectedMessages([]);
      if (onDeleteMessages) {
        onDeleteMessages(selectedMessages); 
      }
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast({ title: "خطأ في حذف الرسائل", variant: "destructive" });
    }
    setShowDeleteConfirm(false);
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
          {selectedMessages.length > 0 && (
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
                    هل أنت متأكد أنك تريد حذف الرسائل المحددة؟ هذا الإجراء لا يمكن التراجع عنه.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDeleteSelectedMessages}>
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogHeader>
        
        <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 bg-muted/30">
          <div className="space-y-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 py-1 group ${
                  msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'
                } ${selectedMessages.includes(msg.id) ? 'bg-blue-500/10 rounded-md' : ''}`}
                onClick={() => toggleSelectMessage(msg.id)}
              >
                {msg.senderId === currentUser?.uid && (
                   <Checkbox
                    id={`select-msg-${msg.id}`}
                    checked={selectedMessages.includes(msg.id)}
                    onCheckedChange={() => toggleSelectMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity mr-2"
                  />
                )}
                {msg.senderId !== currentUser?.uid && (
                  <Avatar className="h-8 w-8 self-start">
                    <AvatarFallback>{targetUser?.name ? getInitials(targetUser.name) : <UserCircle />}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow cursor-pointer ${
                    msg.senderId === currentUser?.uid
                      ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.senderId === currentUser?.uid ? 'text-blue-200' : 'text-gray-400'} text-left`}>
                    {formatMessageTimestamp(msg.timestamp)}
                  </p>
                </div>
                {msg.senderId === currentUser?.uid && (
                  <Avatar className="h-8 w-8 self-start">
                     <AvatarFallback>{currentUser?.displayName ? getInitials(currentUser.displayName) : (currentUser?.name ? getInitials(currentUser.name) : <Bot />)}</AvatarFallback>
                  </Avatar>
                )}
                {msg.senderId !== currentUser?.uid && (
                   <Checkbox
                    id={`select-msg-${msg.id}`}
                    checked={selectedMessages.includes(msg.id)}
                    onCheckedChange={() => toggleSelectMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity ml-2"
                  />
                )}
              </div>
            ))}
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
