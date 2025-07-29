import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  Edit, 
  Users, 
  AlertTriangle,
  Filter,
  Eye
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  getAllMessages, 
  deleteMultipleMessages, 
  updateMessage 
} from '@/lib/messageService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export const TeacherMessagesManager = () => {
  const { currentUser } = useAuth();
  const [allMessages, setAllMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = getAllMessages((messages) => {
      setAllMessages(messages);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  useEffect(() => {
    let filtered = allMessages;

    // تطبيق فلتر النوع
    if (filterType !== 'all') {
      filtered = filtered.filter(msg => msg.type === filterType);
    }

    // تطبيق البحث
    if (searchTerm) {
      filtered = filtered.filter(msg =>
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.receiverName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMessages(filtered);
  }, [allMessages, searchTerm, filterType]);

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.length === 1
      ? names[0].substring(0, 2).toUpperCase()
      : names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ar-EG');
  };

  const handleSelectMessage = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map(msg => msg.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;

    try {
      await deleteMultipleMessages(selectedMessages);
      toast({
        title: "تم حذف الرسائل",
        description: `تم حذف ${selectedMessages.length} رسالة بنجاح`,
      });
      setSelectedMessages([]);
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast({
        title: "خطأ في حذف الرسائل",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditText(message.message);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await updateMessage(editingMessage.id, { message: editText.trim() });
      toast({
        title: "تم تعديل الرسالة",
        description: "تم حفظ التعديلات بنجاح",
      });
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "خطأ في تعديل الرسالة",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getMessageTypeLabel = (type) => {
    switch (type) {
      case 'student-to-student':
        return 'طالب إلى طالب';
      case 'teacher-to-student':
        return 'معلم إلى طالب';
      default:
        return 'غير محدد';
    }
  };

  const getMessageTypeBadgeColor = (type) => {
    switch (type) {
      case 'student-to-student':
        return 'bg-blue-100 text-blue-800';
      case 'teacher-to-student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold gradient-text">إدارة الرسائل</h2>
        <Badge variant="outline" className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          {filteredMessages.length} رسالة
        </Badge>
      </div>

      {/* أدوات التحكم */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الرسائل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="فلترة حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الرسائل</SelectItem>
                <SelectItem value="student-to-student">طالب إلى طالب</SelectItem>
                <SelectItem value="teacher-to-student">معلم إلى طالب</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={filteredMessages.length === 0}
              >
                {selectedMessages.length === filteredMessages.length ? 'إلغاء التحديد' : 'تحديد الكل'}
              </Button>
              
              {selectedMessages.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف ({selectedMessages.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        تأكيد الحذف
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف {selectedMessages.length} رسالة؟ 
                        هذا الإجراء لا يمكن التراجع عنه.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الرسائل */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            الرسائل
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchTerm || filterType !== 'all' ? 'لا توجد رسائل تطابق البحث' : 'لا توجد رسائل'}
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                    selectedMessages.includes(message.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <Checkbox
                    checked={selectedMessages.includes(message.id)}
                    onCheckedChange={() => handleSelectMessage(message.id)}
                  />
                  
                  <div className="flex gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback>
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.senderName || 'مستخدم غير معروف'}
                        </span>
                        <span className="text-gray-400 text-xs">→</span>
                        <span className="text-sm text-gray-600">
                          {message.receiverName || 'مستخدم غير معروف'}
                        </span>
                        <Badge className={`text-xs ${getMessageTypeBadgeColor(message.type)}`}>
                          {getMessageTypeLabel(message.type)}
                        </Badge>
                      </div>
                      
                      {editingMessage?.id === message.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              حفظ
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setEditingMessage(null);
                                setEditText('');
                              }}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700 mb-2 break-words">
                            {message.message}
                            {message.edited && (
                              <span className="text-xs text-yellow-600 ml-2">(معدلة)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditMessage(message)}
                      disabled={editingMessage?.id === message.id}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

