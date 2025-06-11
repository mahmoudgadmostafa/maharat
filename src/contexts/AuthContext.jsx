
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في منصة مهارات التعليمية",
        });
        return userDoc.data().role;
      }
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "تأكد من البريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email, password, role, name) => {
    try {
      // Check if trying to register as teacher
      if (role === 'teacher') {
        const teacherDoc = await getDoc(doc(db, 'settings', 'teacher'));
        if (teacherDoc.exists() && teacherDoc.data().exists) {
          toast({
            title: "خطأ في التسجيل",
            description: "يوجد معلم مسجل بالفعل في المنصة",
            variant: "destructive",
          });
          throw new Error('Teacher already exists');
        }
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role,
        name,
        createdAt: new Date().toISOString(),
      });

      // If teacher, mark teacher as existing
      if (role === 'teacher') {
        await setDoc(doc(db, 'settings', 'teacher'), {
          exists: true,
          teacherId: result.user.uid,
        });
      }

      setUserRole(role);
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في منصة مهارات التعليمية",
      });
      
      return role;
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message === 'Teacher already exists' ? 
          "يوجد معلم مسجل بالفعل في المنصة" : 
          "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      toast({
        title: "تم تسجيل الخروج",
        description: "نراك قريباً!",
      });
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
