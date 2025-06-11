import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Edit, PlusCircle, Save, Trash2 } from 'lucide-react'; // Removed LinkIcon
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


export const TeacherMeetingRoomManager = ({ platformSettings, onSettingsUpdate }) => {
  const [meetingRooms, setMeetingRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null); 
  const [newRoom, setNewRoom] = useState({ name: '', url: '' });

  useEffect(() => {
    setMeetingRooms(platformSettings?.meetingRoomsList || []);
  }, [platformSettings?.meetingRoomsList]);

  const handleSaveRooms = async (updatedRooms) => {
    try {
      const roomsToSave = updatedRooms.map(room => ({ ...room, id: String(room.id || Date.now() + Math.random()) }));
      await onSettingsUpdate({ ...platformSettings, meetingRoomsList: roomsToSave });
      toast({
        title: "تم حفظ التغييرات على غرف الاجتماعات",
      });
    } catch (error) {
      console.error("Error saving meeting rooms:", error);
      toast({
        title: "خطأ",
        description: "لم نتمكن من حفظ التغييرات على غرف الاجتماعات.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewRoom = () => {
    if (!newRoom.name.trim() || !newRoom.url.trim()) {
      toast({ title: "بيانات غير مكتملة", description: "يرجى إدخال اسم ورابط للغرفة.", variant: "destructive" });
      return;
    }
    const roomToAdd = { ...newRoom, id: Date.now().toString() + Math.random().toString(36).substring(2, 15) };
    const updatedRooms = [...meetingRooms, roomToAdd];
    handleSaveRooms(updatedRooms);
    setNewRoom({ name: '', url: '' });
  };

  const handleEditRoom = (roomToEdit) => {
    setEditingRoom({ ...roomToEdit });
  };

  const handleSaveEditedRoom = () => {
    if (!editingRoom || !editingRoom.name.trim() || !editingRoom.url.trim()) {
      toast({ title: "بيانات غير مكتملة", description: "يرجى إدخال اسم ورابط للغرفة.", variant: "destructive" });
      return;
    }
    const updatedRooms = meetingRooms.map(room => 
      room.id === editingRoom.id ? { ...editingRoom } : room
    );
    handleSaveRooms(updatedRooms);
    setEditingRoom(null);
  };

  const handleDeleteRoom = (roomIdToDelete) => {
    const updatedRooms = meetingRooms.filter(room => room.id !== roomIdToDelete);
    handleSaveRooms(updatedRooms);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-6 h-6 text-red-600" />
            إدارة غرف الاجتماعات الافتراضية
          </CardTitle>
          <CardDescription>
            أضف أو قم بتحديث روابط غرف الاجتماعات (مثل Zoom, Google Meet). يمكنك إضافة أكثر من غرفة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {meetingRooms.length === 0 && !editingRoom && (
            <p className="text-center text-gray-500">لا توجد غرف اجتماعات مضافة حاليًا.</p>
          )}
          {meetingRooms.map((room) => (
            <motion.div 
              key={room.id} 
              className="p-4 border rounded-lg bg-white/50 backdrop-blur-sm space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: meetingRooms.indexOf(room) * 0.05 }}
            >
              {editingRoom?.id === room.id ? (
                <div className="space-y-2">
                  <Label htmlFor={`roomName-${room.id}`}>اسم الغرفة</Label>
                  <Input
                    id={`roomName-${room.id}`}
                    value={editingRoom.name}
                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                    placeholder="مثال: محاضرة الأسبوع الأول"
                  />
                  <Label htmlFor={`roomUrl-${room.id}`}>رابط الغرفة</Label>
                  <Input
                    id={`roomUrl-${room.id}`}
                    type="url"
                    value={editingRoom.url}
                    onChange={(e) => setEditingRoom({ ...editingRoom, url: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveEditedRoom} size="sm"><Save className="w-4 h-4 ml-1" /> حفظ التعديل</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingRoom(null)}>إلغاء</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">{room.name}</p>
                  <a href={room.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{room.url}</a>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditRoom(room)}>
                      <Edit className="w-3.5 h-3.5 ml-1" /> تعديل
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-3.5 h-3.5 ml-1" /> حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيتم حذف هذه الغرفة ({room.name}) نهائياً. لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRoom(room.id)} className="bg-red-600 hover:bg-red-700">
                            حذف الغرفة
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          <div className="pt-4 border-t mt-6">
            <h3 className="text-lg font-semibold mb-2">إضافة غرفة اجتماعات جديدة</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="newRoomName">اسم الغرفة الجديدة</Label>
                <Input
                  id="newRoomName"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="مثال: غرفة المراجعة العامة"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newRoomUrl">رابط الغرفة الجديدة</Label>
                <Input
                  id="newRoomUrl"
                  type="url"
                  value={newRoom.url}
                  onChange={(e) => setNewRoom({ ...newRoom, url: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddNewRoom} className="bg-gradient-to-r from-red-500 to-pink-600">
                <PlusCircle className="w-4 h-4 ml-2" /> إضافة غرفة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};