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
import LoadingSpinner from '@/components/LoadingSpinner';

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
  const [platformSettings, setPlatformSettings] = useState(null);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const mergedUser = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || userData.name,
          ...userData,
        };
        setCurrentUser(mergedUser);
        setUserRole(userData.role);

        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في منصة مهارات التعليمية",
        });

        return userData.role;
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

  const register = async (formData) => {
    const { email, password, role, name, phone, code } = formData;

    try {
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

      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role,
        name,
        phone: phone || '',
        code: code || '',
        createdAt: new Date().toISOString(),
      });

      if (role === 'teacher') {
        await setDoc(doc(db, 'settings', 'teacher'), {
          exists: true,
          teacherId: result.user.uid,
        });
      }

      const newUser = {
        uid: result.user.uid,
        email,
        displayName: name,
        role,
        name,
        phone,
        code,
      };

      setCurrentUser(newUser);
      setUserRole(role);

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في منصة مهارات التعليمية",
      });

      return role;
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message === 'Teacher already exists'
          ? "يوجد معلم مسجل بالفعل في المنصة"
          : "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
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

  const updatePlatformSettings = async (newSettings) => {
    try {
      await setDoc(doc(db, 'platformSettings', 'main'), newSettings);
      setPlatformSettings(newSettings);
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم تحديث إعدادات المنصة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const mergedUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userData.name,
            ...userData,
          };
          setCurrentUser(mergedUser);
          setUserRole(userData.role);
        } else {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          });
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }

      // تحميل إعدادات المنصة من المسار الموحد
      try {
        const platformDoc = await getDoc(doc(db, 'platformSettings', 'main'));
        if (platformDoc.exists()) {
          setPlatformSettings(platformDoc.data());
        }
      } catch (error) {
        console.error('Error loading platform settings:', error);
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
    loading,
    platformSettings,
    updatePlatformSettings,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
          <LoadingSpinner size="large" text="جاري تحميل المنصة..." />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
