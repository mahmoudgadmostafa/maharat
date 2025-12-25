import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const LoginForm = (props) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [emailDomain, setEmailDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // جلب إعدادات النطاق من Firestore
  useEffect(() => {
    const fetchEmailDomain = async () => {
      try {
        const settingsRef = doc(db, "platformSettings", "main");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          setEmailDomain(settingsSnap.data()?.emailDomain || '@maharat.eg');
        } else {
          setEmailDomain('@maharat.eg');
        }
      } catch (error) {
        console.error('خطأ في جلب إعدادات النطاق:', error);
        setEmailDomain('@maharat.eg');
      }
    };

    fetchEmailDomain();
  }, []);

  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!formData.identifier || !formData.password) {
        throw new Error('الرجاء إدخال جميع البيانات المطلوبة');
      }

      // تحديد البريد الإلكتروني النهائي (دعم الكود والبريد)
      const finalEmail = formData.identifier.includes('@')
        ? formData.identifier
        : `${formData.identifier}${emailDomain}`;

      // استخدام وظيفة login المركزية من AuthContext
      await login(finalEmail, formData.password);

      // تنفيذ onSubmit إذا تم تمريرها (للتوافق مع HomePage)
      if (typeof props.onSubmit === 'function') {
        props.onSubmit({ email: finalEmail, password: formData.password });
      }

    } catch (error) {
      console.error('فشل تسجيل الدخول:', error);
      setError(
        error.code === 'auth/user-not-found' || error.message.includes('not-found') ?
          'الحساب غير موجود' :
          error.code === 'auth/wrong-password' || error.message.includes('wrong-password') ?
            'كلمة المرور غير صحيحة' :
            'حدث خطأ أثناء تسجيل الدخول. يرجى التأكد من الكود وكلمة المرور'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {error && (
        <div className="text-red-500 bg-red-50 p-2 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="identifier">البريد الإلكتروني أو كود الدخول</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          value={formData.identifier}
          onChange={handleChange}
          placeholder="أدخل الكود  أو البريد الإلكتروني"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">كلمة المرور</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="أدخل كلمة المرور"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !emailDomain}
      >
        {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
      </Button>
    </form>
  );
};

export default LoginForm;