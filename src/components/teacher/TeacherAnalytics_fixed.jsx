import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Award,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  Calendar,
  Target,
  Play,
  FileText,
  HelpCircle,
  Video,
  CheckCircle,
  XCircle,
  Table as TableIcon
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import {
  getGeneralAnalytics,
  getStudentAnalytics,
  getLessonAnalytics,
  getStrugglingStudents,
  getTopPerformers,
  exportAnalyticsData,
  trackEvent,
  EVENT_TYPES
} from '@/lib/analyticsService';
import StudentProgressTable from './StudentProgressTable';

const TeacherAnalytics = ({ students = [], lessons = [] }) => {
  const [analyticsData, setAnalyticsData] = useState({
    totalStudents: 0,
    totalLessons: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    overallCompletionRate: 0,
    overallAverageScore: 0,
    overallVideoCompletionRate: 0,
    overallPdfOpenRate: 0,
    overallQuestionsAccessRate: 0,
    totalVideosStarted: 0,
    totalVideosCompleted: 0,
    totalPdfsOpened: 0,
    totalQuestionsAccessed: 0,
    strugglingStudents: [],
    topPerformers: [],
    lessonCompletionData: [],
    studentProgressData: [],
    activityData: [],
    timeSpentData: [],
    videoAnalyticsData: [],
    pdfAnalyticsData: [],
    questionsAnalyticsData: [],
    studentAnalytics: []
  });
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [allStudentProgress, setAllStudentProgress] = useState({});

  // ألوان للرسوم البيانية
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
  const CHART_COLORS = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
  };

  // جلب بيانات التقدم لجميع الطلاب
  const fetchAllStudentProgress = useCallback(async () => {
    try {
      const progressData = {};
      
      // جلب بيانات التقدم لكل طالب
      for (const student of students) {
        const progressDocRef = doc(db, 'studentProgress', student.id);
        const progressSnap = await getDoc(progressDocRef);
        
        if (progressSnap.exists()) {
          progressData[student.id] = progressSnap.data();
        } else {
          progressData[student.id] = { completedLessons: [] };
        }
      }
      
      setAllStudentProgress(progressData);
      return progressData;
    } catch (error) {
      console.error('Error fetching student progress:', error);
      toast({
        title: "خطأ في جلب بيانات التقدم",
        description: "حدث خطأ أثناء جلب بيانات تقدم الطلاب",
        variant: "destructive"
      });
      return {};
    }
  }, [students]);

  // حساب الإحصائيات من البيانات الحالية
  const calculateAnalytics = useCallback((progressData) => {
    const totalStudents = students.length;
    const totalLessons = lessons.length;

    let activeStudents = 0;
    let totalCompletedLessons = 0;
    let totalScores = 0;
    let scoreCount = 0;
    const strugglingStudents = [];
    const topPerformers = [];

    // تحليل تقدم كل طالب
    const studentAnalytics = students.map(student => {
      const progress = progressData[student.id] || { completedLessons: [] };
      const completedLessons = progress.completedLessons?.length || 0;

      // حساب تقدم الفيديوهات والملفات والأسئلة (محاكاة بناءً على الدروس المكتملة)
      // في التطبيق الحقيقي، يجب أن تكون هذه البيانات مخزنة في قاعدة البيانات
      const completedVideos = Math.floor(completedLessons * 0.8); // افتراض أن 80% من الدروس المكتملة تحتوي على فيديوهات مكتملة
      const openedPdfs = Math.floor(completedLessons * 0.9); // افتراض أن 90% من الدروس المكتملة تحتوي على ملفات مفتوحة
      const accessedQuestions = Math.floor(completedLessons * 0.7); // افتراض أن 70% من الدروس المكتملة تحتوي على أسئلة تم الوصول إليها

      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      const videoProgressPercentage = totalLessons > 0 ? (completedVideos / totalLessons) * 100 : 0;
      const pdfProgressPercentage = totalLessons > 0 ? (openedPdfs / totalLessons) * 100 : 0;
      const questionsProgressPercentage = totalLessons > 0 ? (accessedQuestions / totalLessons) * 100 : 0;

      // تحديد إذا كان الطالب نشط (افتراضياً نشط إذا أكمل درس واحد على الأقل)
      const isActive = completedLessons > 0;
      if (isActive) activeStudents++;

      totalCompletedLessons += completedLessons;

      // محاكاة متوسط الدرجات (في التطبيق الحقيقي يجب جلبها من قاعدة البيانات)
      const averageScore = completedLessons > 0 ? Math.floor(Math.random() * 30) + 70 : 0; // درجات بين 70-100
      if (completedLessons > 0) {
        totalScores += averageScore;
        scoreCount++;
      }

      // تحديد الطلاب المتعثرين (أقل من 30% تقدم)
      if (progressPercentage < 30 && completedLessons > 0) {
        strugglingStudents.push({
          id: student.id,
          name: student.name,
          progress: progressPercentage,
          completedLessons
        });
      }

      // تحديد الطلاب المتفوقين (أكثر من 80% تقدم ومتوسط درجات أكثر من 85)
      if (progressPercentage > 80 && averageScore > 85) {
        topPerformers.push({
          id: student.id,
          name: student.name,
          progress: progressPercentage,
          averageScore,
          completedLessons
        });
      }

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        completedLessons,
        progressPercentage,
        videoProgressPercentage,
        pdfProgressPercentage,
        questionsProgressPercentage,
        averageScore: averageScore || 0,
        isActive
      };
    });

    const inactiveStudents = totalStudents - activeStudents;
    const overallCompletionRate = totalLessons > 0 
      ? (totalCompletedLessons / (totalStudents * totalLessons)) * 100 
      : 0;

    const overallVideoCompletionRate = studentAnalytics.length > 0 
      ? studentAnalytics.reduce((sum, s) => sum + s.videoProgressPercentage, 0) / studentAnalytics.length 
      : 0;
    const overallPdfOpenRate = studentAnalytics.length > 0 
      ? studentAnalytics.reduce((sum, s) => sum + s.pdfProgressPercentage, 0) / studentAnalytics.length 
      : 0;
    const overallQuestionsAccessRate = studentAnalytics.length > 0 
      ? studentAnalytics.reduce((sum, s) => sum + s.questionsProgressPercentage, 0) / studentAnalytics.length 
      : 0;
    const overallAverageScore = scoreCount > 0 ? totalScores / scoreCount : 0;

    // إعداد بيانات الرسوم البيانية
    const lessonCompletionData = lessons.map(lesson => {
      const studentsStarted = students.length; // افتراضياً جميع الطلاب بدأوا
      const studentsCompleted = students.filter(student => {
        const progress = progressData[student.id] || { completedLessons: [] };
        return progress.completedLessons?.includes(lesson.id);
      }).length;

      return {
        name: lesson.title || `الدرس ${lesson.lessonNumber}`,
        lessonNumber: lesson.lessonNumber || 0,
        started: studentsStarted,
        completed: studentsCompleted,
        completionRate: studentsStarted > 0 ? (studentsCompleted / studentsStarted) * 100 : 0
      };
    }).sort((a, b) => a.lessonNumber - b.lessonNumber);

    // بيانات توزيع الطلاب حسب التقدم
    const progressRanges = [
      { name: 'مبتدئ (0-25%)', min: 0, max: 25, count: 0, color: CHART_COLORS.danger },
      { name: 'متوسط (26-50%)', min: 26, max: 50, count: 0, color: CHART_COLORS.warning },
      { name: 'جيد (51-75%)', min: 51, max: 75, count: 0, color: CHART_COLORS.info },
      { name: 'ممتاز (76-100%)', min: 76, max: 100, count: 0, color: CHART_COLORS.success }
    ];

    studentAnalytics.forEach(student => {
      const range = progressRanges.find(r => 
        student.progressPercentage >= r.min && student.progressPercentage <= r.max
      );
      if (range) range.count++;
    });

    const studentProgressData = progressRanges.filter(range => range.count > 0);

    // بيانات النشاط الأسبوعي (محاكاة)
    const activityData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
        date: date.toLocaleDateString('ar-EG'),
        activeStudents: Math.floor(Math.random() * activeStudents) + 1,
        completedLessons: Math.floor(Math.random() * 10) + 1
      };
    });

    // بيانات الوقت المقضي (محاكاة)
    const timeSpentData = lessons.slice(0, 10).map(lesson => ({
      name: lesson.title || `الدرس ${lesson.lessonNumber}`,
      averageTime: Math.floor(Math.random() * 60) + 15, // 15-75 دقيقة
      totalTime: Math.floor(Math.random() * 300) + 50 // 50-350 دقيقة إجمالية
    }));

    return {
      totalStudents,
      totalLessons,
      activeStudents,
      inactiveStudents,
      overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
      overallAverageScore: Math.round(overallAverageScore * 100) / 100,
      overallVideoCompletionRate: Math.round(overallVideoCompletionRate * 100) / 100,
      overallPdfOpenRate: Math.round(overallPdfOpenRate * 100) / 100,
      overallQuestionsAccessRate: Math.round(overallQuestionsAccessRate * 100) / 100,
      strugglingStudents: strugglingStudents.slice(0, 10),
      topPerformers: topPerformers.slice(0, 10),
      lessonCompletionData,
      studentProgressData,
      activityData,
      timeSpentData,
      videoAnalyticsData: studentAnalytics.map(s => ({ name: s.name, value: s.videoProgressPercentage })),
      pdfAnalyticsData: studentAnalytics.map(s => ({ name: s.name, value: s.pdfProgressPercentage })),
      questionsAnalyticsData: studentAnalytics.map(s => ({ name: s.name, value: s.questionsProgressPercentage })),
      studentAnalytics
    };
  }, [students, lessons]);

  // تحديث الإحصائيات
  const updateAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const progressData = await fetchAllStudentProgress();
      const newAnalytics = calculateAnalytics(progressData);
      setAnalyticsData(newAnalytics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error calculating analytics:', error);
      toast({
        title: "خطأ في حساب الإحصائيات",
        description: "حدث خطأ أثناء حساب البيانات التحليلية",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [fetchAllStudentProgress, calculateAnalytics]);

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    if (students.length > 0) {
      updateAnalytics();
    } else {
      setLoading(false);
    }
  }, [students, updateAnalytics]);

  // تصدير البيانات
  const exportData = async () => {
    try {
      const dataToExport = await exportAnalyticsData();
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "تم تصدير البيانات",
        description: "تم تحميل ملف البيانات التحليلية بنجاح"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "خطأ في تصدير البيانات",
        description: "حدث خطأ أثناء تصدير البيانات التحليلية",
        variant: "destructive"
      });
    }
  };

  // تصدير البيانات إلى Excel
  const exportToExcel = async () => {
    try {
      // استيراد وظائف التصدير
      const { exportStudentProgressToExcel, exportMediaAnalyticsToExcel } = await import('@/utils/excelExport');
      
      // تصدير تقدم الطلاب
      const progressResult = exportStudentProgressToExcel(students, lessons, allStudentProgress, analyticsData);
      
      if (progressResult.success) {
        toast({
          title: "تم تصدير تقرير تقدم الطلاب",
          description: `تم إنشاء ملف: ${progressResult.fileName}`,
        });
      }
      
      // تصدير إحصائيات الوسائط
      const mediaResult = exportMediaAnalyticsToExcel(analyticsData, events);
      
      if (mediaResult.success) {
        toast({
          title: "تم تصدير تقرير إحصائيات الوسائط",
          description: `تم إنشاء ملف: ${mediaResult.fileName}`,
        });
      }
      
      if (!progressResult.success && !mediaResult.success) {
        throw new Error('فشل في تصدير جميع التقارير');
      }
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "خطأ في تصدير Excel",
        description: "حدث خطأ أثناء تصدير البيانات إلى Excel",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات التحليلية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">تحليلات البيانات</h2>
          <p className="text-gray-600 mt-1">إحصائيات شاملة عن أداء الطلاب والدروس</p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              آخر تحديث: {lastUpdated.toLocaleString('ar-EG')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={updateAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          <Button onClick={exportToExcel} variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300">
            <Download className="w-4 h-4 mr-2" />
            تصدير Excel
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            تصدير JSON
          </Button>
        </div>
      </div>

      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">إجمالي الطلاب</p>
                  <p className="text-3xl font-bold text-blue-900">{analyticsData.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">إجمالي الدروس</p>
                  <p className="text-3xl font-bold text-green-900">{analyticsData.totalLessons}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">الطلاب النشطين</p>
                  <p className="text-3xl font-bold text-purple-900">{analyticsData.activeStudents}</p>
                  <p className="text-xs text-purple-600">
                    {analyticsData.inactiveStudents} غير نشط
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">معدل الإكمال</p>
                  <p className="text-3xl font-bold text-orange-900">{analyticsData.overallCompletionRate}%</p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* بطاقات تقدم الوسائط */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">تقدم الفيديوهات</p>
                  <p className="text-3xl font-bold text-red-900">{analyticsData.overallVideoCompletionRate.toFixed(1)}%</p>
                  <p className="text-xs text-red-600">متوسط إكمال الفيديوهات</p>
                </div>
                <Video className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-600 text-sm font-medium">تقدم الملفات</p>
                  <p className="text-3xl font-bold text-indigo-900">{analyticsData.overallPdfOpenRate.toFixed(1)}%</p>
                  <p className="text-xs text-indigo-600">متوسط فتح الملفات</p>
                </div>
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-600 text-sm font-medium">تقدم الأسئلة</p>
                  <p className="text-3xl font-bold text-teal-900">{analyticsData.overallQuestionsAccessRate.toFixed(1)}%</p>
                  <p className="text-xs text-teal-600">متوسط الوصول للأسئلة</p>
                </div>
                <HelpCircle className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="lessons">الدروس</TabsTrigger>
          <TabsTrigger value="students">الطلاب</TabsTrigger>
          <TabsTrigger value="media">الوسائط</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* رسم بياني لتوزيع الطلاب */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  توزيع الطلاب حسب التقدم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.studentProgressData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.studentProgressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* رسم بياني للنشاط الأسبوعي */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  النشاط الأسبوعي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="activeStudents" 
                      stackId="1" 
                      stroke={CHART_COLORS.primary} 
                      fill={CHART_COLORS.primary} 
                      name="الطلاب النشطين"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completedLessons" 
                      stackId="1" 
                      stroke={CHART_COLORS.success} 
                      fill={CHART_COLORS.success} 
                      name="الدروس المكتملة"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* قوائم الطلاب المتفوقين والمتعثرين */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الطلاب المتفوقين */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Award className="w-5 h-5" />
                  الطلاب المتفوقين
                </CardTitle>
                <CardDescription>
                  الطلاب الذين حققوا أكثر من 80% تقدم
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.topPerformers.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsData.topPerformers.map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900">{student.name}</p>
                          <p className="text-sm text-green-600">
                            {student.completedLessons} دروس مكتملة
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="bg-green-500">
                            {student.progress.toFixed(1)}%
                          </Badge>
                          <p className="text-xs text-green-600 mt-1">
                            متوسط: {student.averageScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">لا يوجد طلاب متفوقين حالياً</p>
                )}
              </CardContent>
            </Card>

            {/* الطلاب المتعثرين */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  الطلاب المتعثرين
                </CardTitle>
                <CardDescription>
                  الطلاب الذين يحتاجون إلى مساعدة إضافية
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.strugglingStudents.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsData.strugglingStudents.map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium text-orange-900">{student.name}</p>
                          <p className="text-sm text-orange-600">
                            {student.completedLessons} دروس مكتملة
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {student.progress.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">جميع الطلاب يحققون تقدماً جيداً</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                إحصائيات الدروس
              </CardTitle>
              <CardDescription>
                معدل إكمال كل درس من قبل الطلاب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.lessonCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill={CHART_COLORS.success} name="مكتمل" />
                  <Bar dataKey="started" fill={CHART_COLORS.info} name="بدأ" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="w-5 h-5" />
                تفاصيل تقدم الطلاب
              </CardTitle>
              <CardDescription>
                جدول شامل بتقدم كل طالب في الدروس والوسائط
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentProgressTable 
                students={analyticsData.studentAnalytics}
                lessons={lessons}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* إحصائيات الفيديوهات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <Video className="w-5 h-5" />
                  إحصائيات الفيديوهات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.videoAnalyticsData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={CHART_COLORS.danger} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* إحصائيات الملفات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-700">
                  <FileText className="w-5 h-5" />
                  إحصائيات الملفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.pdfAnalyticsData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={CHART_COLORS.info} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* إحصائيات الأسئلة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-700">
                  <HelpCircle className="w-5 h-5" />
                  إحصائيات الأسئلة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.questionsAnalyticsData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={CHART_COLORS.secondary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherAnalytics;

