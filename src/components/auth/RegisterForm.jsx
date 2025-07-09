import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, setDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    code: '',
    phone: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const checkTeachersCount = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'teacher')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error checking teachers count:", error);
      return 0;
    }
  };

  const generateCredentials = useCallback(async (name) => {
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length < 3) {
      setFormData(prev => ({ ...prev, code: '', email: '' }));
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const settingsRef = doc(db, "platformSettings", "main");
      const settingsSnap = await getDoc(settingsRef);
      const startingCode = settingsSnap.exists() ? 
        (settingsSnap.data()?.studentStartingCodeNumber || 1000) : 1000;
      const emailDomain = settingsSnap.exists() ? 
        (settingsSnap.data()?.emailDomain || "@maharat.eg") : "@maharat.eg";

      const q = query(collection(db, 'users'), orderBy('code', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      const lastCode = snapshot.empty ? 
        startingCode : 
        (parseInt(snapshot.docs[0]?.data()?.code) || startingCode);
      
      const newCode = lastCode + 1;
      const generatedEmail = `${newCode}${emailDomain}`;

      setFormData(prev => ({
        ...prev,
        code: newCode.toString(),
        email: generatedEmail
      }));
    } catch (error) {
      console.error('خطأ في توليد البيانات:', error);
      setError('حدث خطأ أثناء توليد البيانات. يرجى المحاولة مرة أخرى');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name.trim().split(/\s+/).length >= 3) {
        generateCredentials(formData.name);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.name, generateCredentials]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // التحقق من صحة البيانات
      if (!formData.code) {
        throw new Error('الرجاء إدخال اسم ثلاثي صحيح');
      }

      if (formData.password.length < 6) {
        throw new Error('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
      }

      // التحقق من عدد المعلمين إذا كان المستخدم يحاول التسجيل كمعلم
      if (formData.role === 'teacher') {
        const teachersCount = await checkTeachersCount();
        const maxTeachers = 1; // يمكنك تغيير هذا الرقم حسب الحاجة
        
        if (teachersCount >= maxTeachers) {
          throw new Error(`لا يمكن تسجيل أكثر من ${maxTeachers} معلم في المنصة`);
        }
      }

      // إنشاء الحساب في Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // حفظ البيانات في Firestore (بدون تخزين كلمة المرور)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        code: formData.code,
        role: formData.role,
        phone: formData.phone,
        password: formData.password,
        createdAt: new Date()
      });

      await auth.signOut();

      // إظهار رسالة النجاح
      setSuccessMessage('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');

    } catch (error) {
      console.error("فشل في إنشاء الحساب:", error);
      setError(
        error.message.includes('auth/email-already-in-use') ? 
        'البريد الإلكتروني مسجل بالفعل' : 
        error.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      

      {error && (
        <div className="text-red-500 bg-red-50 p-2 rounded text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="text-green-500 bg-green-50 p-2 rounded text-sm">
          {successMessage}
        </div>
      )}

      <div>
        <Label htmlFor="name">الاسم الثلاثي</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="الاسم الأول والثاني والثالث"
          required
        />
      </div>

      {isGenerating && (
        <p className="text-xs text-gray-500">جاري توليد البيانات...</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">كود المستخدم</Label>
          <Input
            id="code"
            name="code"
            value={formData.code}
            readOnly
            className="bg-gray-100"
          />
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            name="email"
            value={formData.email}
            readOnly
            className="bg-gray-100"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          minLength={6}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder=""
        />
      </div>

      <div>
        <Label htmlFor="role">نوع الحساب</Label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        >
          <option value="student">طالب</option>
          <option value="teacher">معلم</option>
        </select>
      </div>

      <Button
        type="submit"
        className="w-full mt-4"
        disabled={isSubmitting || isGenerating || !formData.code}
      >
        {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
      </Button>
    </form>
  );
};

export default RegisterForm;