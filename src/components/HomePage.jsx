import React, { useState } from 'react';
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
  const [activeSection, setActiveSection] = useState('home');
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

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'guide':
        return (
          <div className="container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                <h1 className="text-4xl font-bold mb-8 gradient-text text-center">دليل استخدام الموقع</h1>
                
                <div className="prose prose-lg max-w-none text-right">
                  <h2 className="text-2xl font-bold mb-4 text-purple-700">دليل الاستخدام لموقع منصة مهارات التعليمية</h2>
                  
                  <h3 className="text-xl font-semibold mb-3 text-blue-600">1. المقدمة</h3>
                  <p className="mb-4 text-gray-700">
                    مرحباً بكم في دليل الاستخدام لموقع منصة مهارات التعليمية. تم تصميم هذا الدليل لتقديم شرح وافٍ لكل صفحة من صفحات الموقع، والتبويبات المختلفة، والفيديوهات، والروابط المتوفرة.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-3 text-blue-600">2. نظرة عامة على واجهة الموقع</h3>
                  <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
                    <li><strong>التصميم العام:</strong> يتميز بتصميم بسيط وسهل التصفح مع استخدام ألوان متناسقة وخطوط واضحة</li>
                    <li><strong>الشريط العلوي:</strong> يحتوي على روابط للتبويبات الأساسية، مما يتيح للمستخدم التنقل بين الصفحات بسهولة</li>
                    <li><strong>الواجهة الرئيسية:</strong> تُعرض فيها نبذة عن المنصة، أهداف الموقع، وأحدث الدروس المضافة</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold mb-3 text-blue-600">3. نصائح للاستخدام الفعال</h3>
                  <ul className="list-disc list-inside mb-4 text-gray-700 space-y-2">
                    <li>استخدم القائمة الرئيسية للتنقل بين التبويبات المختلفة بسهولة</li>
                    <li>قم بتجربة كافة العناصر التفاعلية لتتعرف على مزاياها</li>
                    <li>استغل كافة الموارد التعليمية المتاحة لتعزيز فهمك للمواد</li>
                    <li>لا تتردد في التواصل معنا عبر قسم "تواصل معنا" للحصول على المساعدة</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        );
    // في قسم التعريف بالموقع (case 'about')
case 'about':
  return (
    <div className="container mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold mb-8 gradient-text text-center">التعريف بالموقع</h1>
          
          <div className="prose prose-lg max-w-none text-right">
            <h2 className="text-2xl font-bold mb-6 text-purple-700">تكنولوجيا التعليم وتطبيقات الذكاء الاصطناعي</h2>
            <p className="mb-8 text-gray-700 leading-relaxed text-lg">
              يمثل موقع "منصة مهارات التعليمية" منصة تعليمية مبتكرة تهدف إلى توفير بيئة تعلم دامجة لتطبيقات 
              الذكاء الاصطناعي وتفاعلية للطلاب والمعلمين على حد سواء، يسعى الموقع إلى تعزيز قدرات 
              الطلاب على التفكير النقدي والإبداع وحل المشكلات من خلال تقديم محتوى تعليمي متنوع ومرن، 
              مدعوماً بأحدث التقنيات التعليمية، يقدم الموقع مجموعة واسعة من الدورات التدريبية التفاعلية 
              والأنشطة التعليمية المصممة خصيصاً لتلبية احتياجات المتعلمين في مرحلة التعليم الفني.
            </p>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-xl mb-8">
              <h3 className="text-2xl font-bold mb-6 text-purple-800 text-center">الإشراف</h3>
              
              {/* الصورة الأولى */}
              <div className="mb-6">
                <img 
                  src="/images/1.jpg" 
                  alt="المشرفون على المشروع" 
                  className="w-full h-auto rounded-lg shadow-lg border-4 border-white hover:shadow-xl transition-shadow duration-300"
                />
                <p className="mt-3 text-center text-gray-600 font-semibold">المشرفون على المشروع</p>
              </div>

              {/* الصورة الثانية */}
              <div className="mt-6">
                <img 
                  src="/images/2.jpg" 
                  alt="الباحث  " 
                  className="w-full h-auto rounded-lg shadow-lg border-4 border-white hover:shadow-xl transition-shadow duration-300"
                />
                <p className="mt-3 text-center text-gray-600 font-semibold">الباحث</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

         
        
      case 'vision':
        return (
          <div className="container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                <h1 className="text-4xl font-bold mb-8 gradient-text text-center">رؤية الموقع</h1>
                
                <div className="prose prose-lg max-w-none text-right">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      نحن في موقع [منصة مهارات التعليمية] نقدم منصة تعليمية متكاملة توفر لطالب التعليم الفني كل ما يحتاجونه للتفوق في دراستهم، من خلال مكتبتنا الشاملة من الفيديوهات والمذكرات والاختبارات التفاعلية، نتيح للطالب فرصة الاستكشاف والتعلم بعمق.
                    </p>
                  </div>
                  
                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">التواصل والتفاعل</h3>
                      <p className="text-blue-700">يمكن للطالب التواصل مباشرة مع معلميهم والتواصل مع بعضهم البعض للحصول على الدعم والإرشاد</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">هدفنا</h3>
                      <p className="text-green-700">تمكين كل طالب من تحقيق النجاح الأكاديمي والمهني، وبناء جيل جديد من المتعلمين المستقلين والمبدعين</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
        
      case 'message':
        return (
          <div className="container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                <h1 className="text-4xl font-bold mb-8 gradient-text text-center">رسالة الموقع</h1>
                
                <div className="prose prose-lg max-w-none text-right">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      نحن في موقع [منصة مهارات التعليمية] نؤمن بأن التعليم هو مفتاح التقدم والازدهار، وأن التكنولوجيا هي القادرة على الوصول إلى تعليم عال الجودة وفعال.
                    </p>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-4 text-purple-700">ما نقدمه لك</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">محتوى تعليمي غني</h4>
                      <p className="text-blue-700 text-sm">فيديوهات تعليمية شيقة، مذكرات شاملة، واختبارات تقييمية متنوعة</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">تفاعل مباشر</h4>
                      <p className="text-green-700 text-sm">التفاعل مع معلمك، وطرح الأسئلة، ومناقشة الاقتراحات</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">مرونة في التعلم</h4>
                      <p className="text-purple-700 text-sm">تحديد وتيرة دراستك الخاصة واستكشاف المواضيع بعمق</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">ذكاء اصطناعي</h4>
                      <p className="text-orange-700 text-sm">استخدام تطبيقات الذكاء الاصطناعي بطرق احترافية</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-orange-700">هدفنا</h3>
                    <p className="text-gray-700 leading-relaxed">
                      تمكينك من تحقيق أقصى استفادة من قدراتك، وبناء مستقبل مشرق لنفسك ولمجتمعك.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
        
    case 'contact':
  return (
    <div className="container mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold mb-8 gradient-text">تواصل معنا</h1>

          <p className="text-gray-600 mb-6">تواصل معنا مباشرة من خلال وسائل التواصل التالية:</p>

          <div className="flex justify-center gap-6 mb-8">
            <a href="https://web.facebook.com/madrasati.26/" target="_blank" rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="tel:01060607654"
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition">
              <Phone className="w-6 h-6" />
            </a>
            <a href="https://wa.me/201060607654" target="_blank" rel="noopener noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-lg transition">
              <MessageCircle className="w-6 h-6" />
            </a>
          </div>

          
        </div>
      </motion.div>
    </div>
  );

      default: // home
        return (
          <>
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
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pattern-bg">
      {/* Header with Logo and Navigation */}
      <header className="py-4 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
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
          
          {/* Navigation Tabs */}
          <nav className="flex flex-wrap justify-center gap-2 md:gap-4">
            <button 
              onClick={() => setActiveSection('home')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeSection === 'home' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-white/70 text-gray-700 hover:bg-purple-100'
              }`}
            >
              الرئيسية
            </button>
            <button 
              onClick={() => setActiveSection('guide')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeSection === 'guide' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-white/70 text-gray-700 hover:bg-purple-100'
              }`}
            >
              دليل استخدام الموقع
            </button>
            <button 
              onClick={() => setActiveSection('about')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeSection === 'about' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-white/70 text-gray-700 hover:bg-purple-100'
              }`}
            >
              التعريف بالموقع
            </button>
            <button 
              onClick={() => setActiveSection('vision')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeSection === 'vision' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-white/70 text-gray-700 hover:bg-purple-100'
              }`}
            >
              رؤية الموقع
            </button>
            <button 
              onClick={() => setActiveSection('message')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeSection === 'message' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-white/70 text-gray-700 hover:bg-purple-100'
              }`}
            >
              رسالة الموقع
            </button>
            <button 
              onClick={() => setActiveSection('contact')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeSection === 'contact' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-white/70 text-gray-700 hover:bg-purple-100'
              }`}
            >
              تواصل معنا
            </button>
          </nav>
        </div>
      </header>
      
      {/* Dynamic Content */}
      {renderSectionContent()}

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

