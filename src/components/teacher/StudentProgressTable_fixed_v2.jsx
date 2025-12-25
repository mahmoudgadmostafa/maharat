import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Search,
  Filter,
  Eye,
  Video,
  FileText,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const StudentProgressTable = ({ students = [], lessons = [], studentProgress = {} }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [analyticsEvents, setAnalyticsEvents] = useState([]);

  // جمع بيانات الأحداث من Firebase
  useEffect(() => {
    const fetchAnalyticsEvents = async () => {
      try {
        setLoading(true);
        const eventsRef = collection(db, 'analyticsEvents');
        const eventsSnapshot = await getDocs(eventsRef);
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAnalyticsEvents(events);
      } catch (error) {
        console.error('Error fetching analytics events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsEvents();
  }, []);

  // حساب إحصائيات تفصيلية لكل طالب
  const calculateDetailedProgress = () => {
    return students.map(student => {
      const progress = studentProgress[student.id] || { completedLessons: [] };
      const studentEvents = analyticsEvents.filter(event => event.studentId === student.id);
      
      const allLessonIds = lessons.map(lesson => lesson.id);
      const totalLessonsCount = allLessonIds.length;

      // حساب إحصائيات الدروس
      const completedLessons = progress.completedLessons?.length || 0;
      const progressPercentage = totalLessonsCount > 0 ? (completedLessons / totalLessonsCount) * 100 : 0;
      
      // حساب إحصائيات الفيديو، PDF، والأسئلة بناءً على البيانات الموجودة في progress object
      let videoCompletedLessonsCount = 0;
      let pdfOpenedLessonsCount = 0;
      let questionsAccessedLessonsCount = 0;

      for (const lessonId of allLessonIds) {
        if (progress[lessonId]?.videoCompleted) {
          videoCompletedLessonsCount++;
        }
        if (progress[lessonId]?.pdfOpened) {
          pdfOpenedLessonsCount++;
        }
        if (progress[lessonId]?.questionsAccessed) {
          questionsAccessedLessonsCount++;
        }
      }

      const videoCompletionRate = totalLessonsCount > 0 ? (videoCompletedLessonsCount / totalLessonsCount) * 100 : 0;
      const pdfOpenRate = totalLessonsCount > 0 ? (pdfOpenedLessonsCount / totalLessonsCount) * 100 : 0;
      const questionsAccessRate = totalLessonsCount > 0 ? (questionsAccessedLessonsCount / totalLessonsCount) * 100 : 0;
      
      // حساب الدرجات - جميع الدرجات المسجلة
      const studentScores = Object.values(progress)
        .filter(p => p.score !== undefined && p.score !== null)
        .map(p => p.score);
      const averageScore = studentScores.length > 0 
        ? studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length 
        : 0;
      
      // حساب الوقت المقضي (تقديري)
      const totalTimeSpent = studentEvents.reduce((total, event) => {
        if (event.additionalData && event.additionalData.timeSpent) {
          return total + event.additionalData.timeSpent;
        }
        return total;
      }, 0);
      
      // تحديد آخر نشاط
      const lastActivity = studentEvents.length > 0 
        ? new Date(Math.max(...studentEvents.map(event => new Date(event.timestamp).getTime())))
        : null;
      
      // تحديد الحالة
      let status = 'غير نشط';
      if (completedLessons === 0) {
        status = 'لم يبدأ';
      } else if (progressPercentage < 30) {
        status = 'متعثر';
      } else if (progressPercentage < 70) {
        status = 'متوسط';
      } else if (progressPercentage < 90) {
        status = 'جيد';
      } else {
        status = 'ممتاز';
      }
      
      return {
        id: student.id,
        name: student.name || 'غير محدد',
        email: student.email || 'غير محدد',
        completedLessons,
        totalLessons: totalLessonsCount,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        videoCompletedLessons: videoCompletedLessonsCount,
        videoCompletionRate: Math.round(videoCompletionRate * 100) / 100,
        pdfOpenedLessons: pdfOpenedLessonsCount,
        pdfOpenRate: Math.round(pdfOpenRate * 100) / 100,
        questionsAccessedLessons: questionsAccessedLessonsCount,
        questionsAccessRate: Math.round(questionsAccessRate * 100) / 100,
        totalTimeSpent: Math.round(totalTimeSpent / 60), // بالدقائق
        lastActivity: lastActivity ? lastActivity.toLocaleDateString('ar-EG') : 'لا يوجد',
        status,
        statusColor: status === 'ممتاز' ? 'bg-green-100 text-green-800' :
                    status === 'جيد' ? 'bg-blue-100 text-blue-800' :
                    status === 'متوسط' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'متعثر' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
      };
    });
  };

  // تطبيق الفلاتر والبحث
  useEffect(() => {
    let data = calculateDetailedProgress();
    
    // تطبيق البحث
    if (searchTerm) {
      data = data.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // تطبيق فلتر الحالة
    if (filterStatus !== 'all') {
      data = data.filter(student => student.status === filterStatus);
    }
    
    // تطبيق الترتيب
    data.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredData(data);
  }, [students, lessons, studentProgress, analyticsEvents, searchTerm, filterStatus, sortBy, sortOrder]);

  // تصدير البيانات إلى Excel
  const exportToExcel = async () => {
    try {
      const { exportStudentProgressToExcel } = await import('@/utils/excelExport');
      
      // إعداد البيانات للتصدير
      const detailedData = calculateDetailedProgress();
      const analyticsData = {
        totalStudents: students.length,
        totalLessons: lessons.length,
        activeStudents: detailedData.filter(s => s.status !== 'لم يبدأ' && s.status !== 'غير نشط').length,
        overallCompletionRate: detailedData.reduce((sum, s) => sum + s.progressPercentage, 0) / detailedData.length || 0,
        overallAverageScore: detailedData.reduce((sum, s) => sum + s.averageScore, 0) / detailedData.length || 0,
        overallVideoCompletionRate: detailedData.reduce((sum, s) => sum + s.videoCompletionRate, 0) / detailedData.length || 0,
        overallPdfOpenRate: detailedData.reduce((sum, s) => sum + s.pdfOpenRate, 0) / detailedData.length || 0,
        overallQuestionsAccessRate: detailedData.reduce((sum, s) => sum + s.questionsAccessRate, 0) / detailedData.length || 0
      };
      
      const result = exportStudentProgressToExcel(students, lessons, studentProgress, analyticsData);
      
      if (result.success) {
        toast({
          title: 'تم تصدير البيانات بنجاح',
          description: `تم إنشاء ملف: ${result.fileName}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير البيانات',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ممتاز':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'جيد':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'متوسط':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'متعثر':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات التقدم...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl gradient-text">جدول إحصائيات تقدم الطلاب</CardTitle>
              <CardDescription>
                تفاصيل شاملة عن تقدم كل طالب في الفيديوهات والـ PDF والأسئلة
              </CardDescription>
            </div>
            <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              تصدير Excel
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* أدوات البحث والفلترة */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="ممتاز">ممتاز</SelectItem>
                <SelectItem value="جيد">جيد</SelectItem>
                <SelectItem value="متوسط">متوسط</SelectItem>
                <SelectItem value="متعثر">متعثر</SelectItem>
                <SelectItem value="لم يبدأ">لم يبدأ</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">الاسم</SelectItem>
                <SelectItem value="progressPercentage">نسبة التقدم</SelectItem>
                <SelectItem value="averageScore">متوسط الدرجات</SelectItem>
                <SelectItem value="videoCompletionRate">إكمال الفيديو</SelectItem>
                <SelectItem value="lastActivity">آخر نشاط</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full sm:w-auto"
            >
              {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
            </Button>
          </div>

          {/* الجدول */}
          <div className="overflow-x-auto">
            <Table className="border-collapse border border-gray-300">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">الطالب</TableHead>
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">الحالة</TableHead>
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">تقدم الدروس</TableHead>
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">الدرجات</TableHead>
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      الفيديو
                    </div>
                  </TableHead>
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      PDF
                    </div>
                  </TableHead>
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">
                    <div className="flex items-center gap-1">
                      <HelpCircle className="w-4 h-4" />
                      الأسئلة
                    </div>
                  </TableHead>
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">الوقت المقضي</TableHead>
                  <TableHead className="text-right border border-gray-300 p-3 font-semibold">آخر نشاط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <TableCell className="border border-gray-300 p-3">
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-3">
                      <Badge className={student.statusColor}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(student.status)}
                          {student.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-3">
                      <div className="text-center">
                        <div className="font-medium text-lg">{student.progressPercentage}%</div>
                        <div className="text-sm text-gray-500">
                          {student.completedLessons} من {student.totalLessons} درس
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${student.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-3">
                      <div className="text-center">
                        <div className="font-medium text-lg">{student.averageScore.toFixed(1)}</div>
                        <div className="text-sm text-gray-500">متوسط</div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-3">
                      <div className="text-center">
                        <div className="font-medium text-lg">{student.videoCompletionRate}%</div>
                        <div className="text-sm text-gray-500">
                          {student.videoCompletedLessons} من {student.totalLessons} فيديو
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${student.videoCompletionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-3">
                      <div className="text-center">
                        <div className="font-medium text-lg">{student.pdfOpenRate}%</div>
                        <div className="text-sm text-gray-500">
                          {student.pdfOpenedLessons} من {student.totalLessons} ملف
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${student.pdfOpenRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-3">
                      <div className="text-center">
                        <div className="font-medium text-lg">{student.questionsAccessRate}%</div>
                        <div className="text-sm text-gray-500">
                          {student.questionsAccessedLessons} من {student.totalLessons} سؤال
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-teal-600 h-2 rounded-full"
                            style={{ width: `${student.questionsAccessRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-3">
                      <div className="text-center">
                        <div className="font-medium text-lg">{student.totalTimeSpent} دقيقة</div>
                        <div className="text-sm text-gray-500">متوسط</div>
                      </div>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-3">
                      <div className="text-sm text-gray-700">{student.lastActivity}</div>
                    </TableCell>
                  </motion.tr>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      لا توجد بيانات لعرضها.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StudentProgressTable;

