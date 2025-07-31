import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Sparkles, Facebook, Phone, MessageCircle, BookOpen, Users, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import LazyImage from '@/components/LazyImage';
import LoadingSpinner from '@/components/LoadingSpinner';

const LOGO_URL = "/favicon.png";

const HomePage = ({ platformSettings }) => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { login, register } = useAuth();

  const handleLogin = async (formData) => {
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      setLoginOpen(false);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    setIsLoading(true);
    try {
      const role = await register(formData);
      if (role === 'student') {
        setActiveTab('login');
      }
      setRegisterOpen(false);
    } catch (error) {
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pattern-bg">
      {/* Header with Logo */}
      <header className="py-4 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <LazyImage 
                src={LOGO_URL} 
                alt="شعار منصة مهارات التعليمية" 
                className="h-12 w-auto"
                placeholder={<div className="h-12 w-12 bg-purple-200 rounded animate-pulse"></div>}
              />
            </motion.div>
            <span className="text-2xl font-bold gradient-text">منصة مهارات التعليمية</span>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              className="inline-block mb-6"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <LazyImage 
                src="/og-image.png" 
                alt="شعار منصة مهارات التعليمية يتأرجح" 
                className="w-32 h-32 mx-auto rounded-full shadow-lg"
                placeholder={<div className="w-32 h-32 mx-auto rounded-full bg-purple-200 animate-pulse"></div>}
              />
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              مرحباً بك في منصة مهارات التعليمية
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              ابدأ رحلتك التعليمية بأسلوب تفاعلي مع أحدث تطبيقات الذكاء الاصطناعي
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-md mx-auto">
              {/* زر تسجيل الدخول المحسن */}
              <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                <DialogTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto"
                  >
                    <Button className="enhanced-login-btn w-full sm:w-auto">
                      <User className="w-5 h-5 ml-2" />
                      تسجيل الدخول
                    </Button>
                  </motion.div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تسجيل الدخول</DialogTitle>
                    <DialogDescription>ادخل بياناتك للوصول إلى المنصة</DialogDescription>
                  </DialogHeader>
                  <LoginForm 
                    onSubmit={handleLogin} 
                    isLoading={isLoading}
                    LoadingComponent={<LoadingSpinner size="small" text="جاري تسجيل الدخول..." />}
                  />
                </DialogContent>
              </Dialog>

              {/* زر إنشاء حساب المحسن */}
              {(platformSettings?.showRegisterButton ?? true) && (
                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                  <DialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto"
                    >
                      <Button className="enhanced-register-btn w-full sm:w-auto">
                        <Sparkles className="w-5 h-5 ml-2" />
                        إنشاء حساب جديد
                      </Button>
                    </motion.div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-center text-2xl gradient-text">إنشاء حساب جديد</DialogTitle>
                      <DialogDescription>انضم إلى منصتنا التعليمية</DialogDescription>
                    </DialogHeader>
                    <RegisterForm 
                      onSubmit={handleRegister} 
                      isLoading={isLoading}
                      LoadingComponent={<LoadingSpinner size="small" text="جاري إنشاء الحساب..." />}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              لماذا منصة مهارات؟
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نقدم تجربة تعليمية متكاملة تجمع بين التعليم التقليدي والذكاء الاصطناعي
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "دروس تفاعلية",
                description: "دروس فيديو عالية الجودة مع ملفات PDF تفاعلية",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Users,
                title: "تعلم جماعي",
                description: "بيئة تعليمية تفاعلية بين المعلم والطلاب",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Award,
                title: "اختبارات ذكية",
                description: "اختبارات ذاتية التصحيح مع تتبع التقدم",
                color: "from-green-500 to-emerald-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="card-hover glass-effect border-0 shadow-xl h-full">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Integration Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600/10 to-blue-600/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-block p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-6">
              <Sparkles className="w-12 h-12 text-white animate-pulse-slow" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">منصة مدعومة بالذكاء الاصطناعي</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              استفد من أحدث تطبيقات الذكاء الاصطناعي في التعليم مع التطبيقات المدمجة في المنصة
            </p>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl">
              <img
                className="w-full h-64 object-cover rounded-xl mb-6"
                alt="واجهة تعلم مدعومة بالذكاء الاصطناعي"
                src="https://i.postimg.cc/7Zkpj4x0/1983.webp"
              />
              <p className="text-gray-700 text-lg">
                تجربة تعليمية ذكية تتكيف مع احتياجاتك وتساعدك على تحقيق أهدافك التعليمية بكفاءة عالية
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">تواصل معنا</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نحن هنا لمساعدتك! لا تتردد في التواصل معنا لأي استفسارات.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <ContactCard
              icon={<Facebook className="w-8 h-8 text-white" />}
              title="فيسبوك"
              href="https://web.facebook.com/maharet.edu"
              text="صفحتنا على فيسبوك"
              color="from-blue-500 to-sky-500"
            />
            <ContactCard
              icon={<Phone className="w-8 h-8 text-white" />}
              title="الهاتف"
              href="tel:01060607654"
              text="01060607654"
              color="from-green-500 to-emerald-500"
            />
            <ContactCard
              icon={<MessageCircle className="w-8 h-8 text-white" />}
              title="واتساب"
              href="https://wa.me/201060607654"
              text="راسلنا هنا"
              color="from-teal-500 to-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 bg-white/70 backdrop-blur-sm border-t">
        <p>&copy; {new Date().getFullYear()} منصة مهارات التعليمية. جميع الحقوق محفوظة.</p>
        <p className="text-sm">تصميم وتطوير بواسطة أ/ محمود جاد مصطفى</p>
      </footer>
    </div>
  );
};

// Component for contact cards
const ContactCard = ({ icon, title, href, text, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
  >
    <Card className="card-hover glass-effect border-0 shadow-xl text-center h-full">
      <CardHeader>
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-lg text-blue-700 hover:underline">
          {text}
        </a>
      </CardContent>
    </Card>
  </motion.div>
);

export default HomePage;

