
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Users, Award, Sparkles, User, Phone, MessageCircle, Facebook } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LOGO_URL = "https://storage.googleapis.com/hostinger-horizons-assets-prod/3760d6a6-ab96-447b-8deb-dbeb7cec4327/ddb9811d5f3df3eb28c2f555087dd5ba.jpg";

const HomePage = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ email: '', password: '', name: '', role: 'student' });
  const { login, register } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginData.email, loginData.password);
      setLoginOpen(false);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(registerData.email, registerData.password, registerData.role, registerData.name);
      setRegisterOpen(false);
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pattern-bg">
      {/* Header with Logo */}
      <header className="py-4 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <img src={LOGO_URL} alt="شعار منصة مهارات التعليمية" className="h-12 w-auto" />
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
              <img src={LOGO_URL} alt="شعار منصة مهارات التعليمية يتأرجح" className="w-32 h-32 mx-auto rounded-full shadow-lg" />
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              مرحباً بك في منصة مهارات التعليمية
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              ابدأ رحلتك التعليمية باسلوب تفاعلي مع احدث تطبيقات الذكاء الاصطناعي
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                    <User className="w-5 h-5 ml-2" />
                    تسجيل الدخول
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl gradient-text">تسجيل الدخول</DialogTitle>
                    <DialogDescription className="text-center">
                      ادخل بياناتك للوصول إلى المنصة
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">البريد الإلكتروني</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">كلمة المرور</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                      دخول
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white px-8 py-4 text-lg rounded-full transition-all duration-300">
                    <Sparkles className="w-5 h-5 ml-2" />
                    إنشاء حساب جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-2xl gradient-text">إنشاء حساب جديد</DialogTitle>
                    <DialogDescription className="text-center">
                      انضم إلى منصة مهارات التعليمية
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-name">الاسم الكامل</Label>
                      <Input
                        id="register-name"
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-email">البريد الإلكتروني</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-password">كلمة المرور</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-role">نوع الحساب</Label>
                      <select
                        id="register-role"
                        value={registerData.role}
                        onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="student">طالب</option>
                        <option value="teacher">معلم</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                      إنشاء الحساب
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
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
            <div className="inline-block p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-6">
              <Sparkles className="w-12 h-12 text-white animate-pulse-slow" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              مدعوم بالذكاء الاصطناعي
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              استفيد من احدث تطبيقات الذكاء الاصطناعي فى التعليم مع تطبيقات magic school المدمجة في المنصة
            </p>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl">
              <img  class="w-full h-64 object-cover rounded-xl mb-6" alt="AI-powered learning interface" src="https://images.unsplash.com/photo-1678995635432-d9e89c7a8fc5" />
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              تواصل معنا
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              نحن هنا لمساعدتك! لا تتردد في التواصل معنا لأي استفسارات.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}>
              <Card className="card-hover glass-effect border-0 shadow-xl text-center h-full">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 flex items-center justify-center">
                    <Facebook className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">فيسبوك</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="text-lg text-blue-600 hover:text-blue-700 p-0">
                    <a href="https://web.facebook.com/maharet.edu" target="_blank" rel="noopener noreferrer">
                      maharet.edu
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }}>
              <Card className="card-hover glass-effect border-0 shadow-xl text-center h-full">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">الهاتف</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="tel:01060607654" className="text-lg text-gray-700 hover:text-green-600">
                    01060607654
                  </a>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} viewport={{ once: true }}>
              <Card className="card-hover glass-effect border-0 shadow-xl text-center h-full">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">واتساب</CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href="https://wa.me/201060607654" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-lg text-gray-700 hover:text-teal-600"
                  >
                    00201060607654
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 bg-white/70 backdrop-blur-sm border-t">
        <p>&copy; {new Date().getFullYear()} منصة مهارات التعليمية. جميع الحقوق محفوظة.</p>
        <p className="text-sm">
          تصميم وتطوير بواسطة Hostinger Horizons ✨
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
