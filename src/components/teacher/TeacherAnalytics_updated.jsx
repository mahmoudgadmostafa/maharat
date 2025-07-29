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

const TeacherAnalytics = ({ students = [], lessons = [], studentProgress = {} }) => {
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

  // حساب الإحصائيات من البيانات الحالية
  const calculateAnalytics = useCallback(() => {
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
      const progress = studentProgress[student.id] || {};
      const completedLessons = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.completed
      ).length;

      const completedVideos = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.videoCompleted
      ).length;

      const openedPdfs = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.pdfOpened
      ).length;

      const accessedQuestions = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.questionsAccessed
      ).length;

      const studentScores = Object.values(progress)
        .filter(p => p.completed && p.score !== undefined)
        .map(p => p.score);

      const averageScore = studentScores.length > 0 
        ? studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length 
        : 0;

      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      const videoProgressPercentage = totalLessons > 0 ? (completedVideos / totalLessons) * 100 : 0;
      const pdfProgressPercentage = totalLessons > 0 ? (openedPdfs / totalLessons) * 100 : 0;
      const questionsProgressPercentage = totalLessons > 0 ? (accessedQuestions / totalLessons) * 100 : 0;

      // تحديد إذا كان الطالب نشط (افتراضياً نشط إذا أكمل درس واحد على الأقل)
      const isActive = completedLessons > 0;
      if (isActive) activeStudents++;

      totalCompletedLessons += completedLessons;
      if (studentScores.length > 0) {
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
      const studentsCompleted = students.filter(student => 
        studentProgress[student.id]?.[lesson.id]?.completed
      ).length;

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
  }, [students, lessons, studentProgress]);

  // تحديث الإحصائيات
  const updateAnalytics = useCallback(() => {
    setLoading(true);
    try {
      const newAnalytics = calculateAnalytics();
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
  }, [calculateAnalytics]);

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    updateAnalytics();
  }, [updateAnalytics]);

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
      const progressResult = exportStudentProgressToExcel(students, lessons, studentProgress, analyticsData);
      
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
                  <p className="text-orange-600 text-sm font-medium">متوسط الدرجات</p>
                  <p className="text-3xl font-bold text-orange-900">{analyticsData.overallAverageScore.toFixed(1)}%</p>
                </div>
                <Award className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">متوسط تقدم الفيديو</p>
                  <p className="text-3xl font-bold text-yellow-900">{analyticsData.overallVideoCompletionRate.toFixed(1)}%</p>
                </div>
                <Video className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">متوسط تقدم الملفات</p>
                  <p className="text-3xl font-bold text-red-900">{analyticsData.overallPdfOpenRate.toFixed(1)}%</p>
                </div>
                <FileText className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-600 text-sm font-medium">متوسط تقدم الأسئلة</p>
                  <p className="text-3xl font-bold text-indigo-900">{analyticsData.overallQuestionsAccessRate.toFixed(1)}%</p>
                </div>
                <HelpCircle className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-600 text-sm font-medium">معدل إكمال الدروس</p>
                  <p className="text-3xl font-bold text-teal-900">{analyticsData.overallCompletionRate.toFixed(1)}%</p>
                </div>
                <Target className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* الرسوم البيانية */}
      <Tabs defaultValue="lessonCompletion" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5 h-auto">
          <TabsTrigger value="lessonCompletion">إكمال الدروس</TabsTrigger>
          <TabsTrigger value="studentProgress">تقدم الطلاب</TabsTrigger>
          <TabsTrigger value="videoProgress">تقدم الفيديو</TabsTrigger>
          <TabsTrigger value="pdfProgress">تقدم الملفات</TabsTrigger>
          <TabsTrigger value="questionsProgress">تقدم الأسئلة</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lessonCompletion">
          <Card>
            <CardHeader>
              <CardTitle>معدل إكمال الدروس</CardTitle>
              <CardDescription>نسبة إكمال كل درس من قبل الطلاب.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.lessonCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completionRate" fill={CHART_COLORS.primary} name="نسبة الإكمال" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="studentProgress">
          <Card>
            <CardHeader>
              <CardTitle>توزيع تقدم الطلاب</CardTitle>
              <CardDescription>توزيع الطلاب حسب نطاقات التقدم.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.studentProgressData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
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
        </TabsContent>
        
        <TabsContent value="videoProgress">
          <Card>
            <CardHeader>
              <CardTitle>تقدم مشاهدة الفيديو</CardTitle>
              <CardDescription>نسبة تقدم الطلاب في مشاهدة الفيديوهات.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.videoAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS.warning} name="نسبة التقدم" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pdfProgress">
          <Card>
            <CardHeader>
              <CardTitle>تقدم قراءة الملفات</CardTitle>
              <CardDescription>نسبة تقدم الطلاب في قراءة ملفات PDF.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.pdfAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS.danger} name="نسبة التقدم" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questionsProgress">
          <Card>
            <CardHeader>
              <CardTitle>تقدم الوصول للأسئلة</CardTitle>
              <CardDescription>نسبة تقدم الطلاب في الوصول للأسئلة.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.questionsAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS.info} name="نسبة التقدم" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* جداول الطلاب */}
      <Tabs defaultValue="struggling" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="struggling">الطلاب المتعثرون</TabsTrigger>
          <TabsTrigger value="topPerformers">الطلاب المتفوقون</TabsTrigger>
        </TabsList>
        <TabsContent value="struggling">
          <Card>
            <CardHeader>
              <CardTitle>الطلاب المتعثرون</CardTitle>
              <CardDescription>الطلاب الذين يواجهون صعوبة في التقدم.</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentProgressTable students={analyticsData.strugglingStudents} type="struggling" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="topPerformers">
          <Card>
            <CardHeader>
              <CardTitle>الطلاب المتفوقون</CardTitle>
              <CardDescription>الطلاب ذوو الأداء العالي.</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentProgressTable students={analyticsData.topPerformers} type="topPerformers" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* جدول تقدم الطلاب العام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="w-5 h-5" />
            جدول تقدم الطلاب العام
          </CardTitle>
          <CardDescription>عرض تفصيلي لتقدم كل طالب في الدروس والفيديوهات والملفات والأسئلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-right">الاسم</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">البريد الإلكتروني</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">تقدم الدروس</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">تقدم الفيديو</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">تقدم الملفات</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">تقدم الأسئلة</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">متوسط الدرجات</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">نشط</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.studentAnalytics.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">{student.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.email}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.progressPercentage.toFixed(1)}%</td>
                    <td className="border border-gray-300 px-4 py-2">{student.videoProgressPercentage.toFixed(1)}%</td>
                    <td className="border border-gray-300 px-4 py-2">{student.pdfProgressPercentage.toFixed(1)}%</td>
                    <td className="border border-gray-300 px-4 py-2">{student.questionsProgressPercentage.toFixed(1)}%</td>
                    <td className="border border-gray-300 px-4 py-2">{student.averageScore.toFixed(1)}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {student.isActive ? (
                        <Badge className="bg-green-100 text-green-700">نعم</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700">لا</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAnalytics;

