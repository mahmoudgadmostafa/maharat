import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// إنشاء رسالة جديدة
export const createMessage = async (messageData) => {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      timestamp: Timestamp.now(),
      edited: false,
      deleted: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

// الحصول على الرسائل بين مستخدمين
export const getMessagesBetweenUsers = (user1Id, user2Id, callback) => {
  const q = query(
    collection(db, 'messages'),
    where('participants', 'array-contains-any', [user1Id, user2Id]),
    where('deleted', '==', false),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(msg =>
        (msg.senderId === user1Id && msg.receiverId === user2Id) ||
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      );
    callback(messages);
  });
};

// الحصول على جميع المحادثات للمستخدم
export const getUserConversations = (userId, callback) => {
  const q = query(
    collection(db, 'messages'),
    where('participants', 'array-contains', userId),
    where('deleted', '==', false),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = new Map();

    snapshot.docs.forEach(doc => {
      const message = { id: doc.id, ...doc.data() };
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;

      if (!conversations.has(otherUserId) ||
        conversations.get(otherUserId).timestamp < message.timestamp) {
        conversations.set(otherUserId, message);
      }
    });

    callback(Array.from(conversations.values()));
  });
};

// تحديث رسالة
export const updateMessage = async (messageId, updates) => {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      ...updates,
      edited: true,
      editedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating message:', error);
    throw error;
  }
};

// حذف رسالة (soft delete)
export const deleteMessage = async (messageId) => {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      deleted: true,
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// حذف رسائل متعددة (للمعلم)
export const deleteMultipleMessages = async (messageIds) => {
  try {
    const batch = writeBatch(db);
    messageIds.forEach(id => {
      batch.update(doc(db, 'messages', id), {
        deleted: true,
        deletedAt: Timestamp.now()
      });
    });
    await batch.commit();
  } catch (error) {
    console.error('Error deleting multiple messages:', error);
    throw error;
  }
};

// الحصول على جميع الرسائل (للمعلم)
export const getAllMessages = (callback) => {
  const q = query(
    collection(db, 'messages'),
    where('deleted', '==', false),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

// الحصول على الطلاب المتاحين للمراسلة (من نفس المجموعة)
export const getAvailableStudents = async (currentUserId, currentUserGroup) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => {
        // استبعاد المستخدم الحالي
        if (user.id === currentUserId) return false;

        // إذا كان المستخدم الحالي ليس له مجموعة، لا يرى أي طلاب
        if (!currentUserGroup || currentUserGroup.trim() === '') return false;

        // إظهار فقط الطلاب من نفس المجموعة
        return user.group === currentUserGroup;
      });
  } catch (error) {
    console.error('Error getting available students:', error);
    throw error;
  }
};

// إرسال رسالة بين الطلاب
export const sendStudentMessage = async (senderId, receiverId, message, senderName, receiverName) => {
  const messageData = {
    senderId,
    receiverId,
    message: message.trim(),
    participants: [senderId, receiverId],
    senderName,
    receiverName,
    type: 'student-to-student'
  };

  return await createMessage(messageData);
};

// إرسال رسالة من المعلم للطالب
export const sendTeacherMessage = async (senderId, receiverId, message, senderName, receiverName) => {
  const messageData = {
    senderId,
    receiverId,
    message: message.trim(),
    participants: [senderId, receiverId],
    senderName,
    receiverName,
    type: 'teacher-to-student'
  };

  return await createMessage(messageData);
};
