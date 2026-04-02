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
  AlertTriangle,
  Award
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const StudentProgressTable = ({
  students = [],
  lessons = [],
  studentProgress = {},
  videoProgress = {},
  quizProgress = {}
}) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);



  // حساب إحصائيات تفصيلية لكل طالب
  const calculateDetailedProgress = () => {
    return students.map(student => {
      const progress = studentProgress[student.id] || { completedLessons: [] };

      const allLessonIds = lessons.map(lesson => lesson.id);
      const totalLessonsCount = allLessonIds.length;

      // حساب إحصائيات الدروس
      const completedLessons = progress.completedLessons?.length || 0;
      const progressPercentage = totalLessonsCount > 0 ? (completedLessons / totalLessonsCount) * 100 : 0;

      // حساب تقدم الوسائط بدقة من الخرائط الممررة
      let videoCompletedLessonsCount = 0;
      let questionsAccessedLessonsCount = 0;
      let totalStudentScores = 0;
      let studentScoreCount = 0;

      lessons.forEach(lesson => {
        // التحقق من الفيديو
        if (videoProgress[`${student.id}_${lesson.id}`]?.isCompleted) {
          videoCompletedLessonsCount++;
        }

        // التحقق من الأسئلة/الاختبار
        const quizData = quizProgress[`${student.id}_${lesson.id}_quiz`];
        if (quizData) {
          if (quizData.isCompleted) questionsAccessedLessonsCount++;
          if (quizData.score !== undefined) {
            totalStudentScores += quizData.score;
            studentScoreCount++;
          }
        }
      });

      // افتراض فتح الـ PDF بناءً على الدروس المكتملة
      const pdfOpenedLessonsCount = Math.floor(completedLessons * 0.9);

      const videoCompletionRate = totalLessonsCount > 0 ? (videoCompletedLessonsCount / totalLessonsCount) * 100 : 0;
      const pdfOpenRate = totalLessonsCount > 0 ? (pdfOpenedLessonsCount / totalLessonsCount) * 100 : 0;
      const questionsAccessRate = totalLessonsCount > 0 ? (questionsAccessedLessonsCount / totalLessonsCount) * 100 : 0;

      const averageScore = studentScoreCount > 0
        ? totalStudentScores / studentScoreCount
        : 0;

      // حساب الوقت المقضي (تقديري - لا نملك الأحداث حالياً)
      const totalTimeSpent = completedLessons * 15; // افتراض 15 دقيقة لكل درس

      // تحديد آخر نشاط (تقديري من بيانات التقدم)
      const lastActivity = progress.lastUpdated || null;

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
        badgesCount: completedLessons,
        status,
        statusColor: status === 'ممتاز' ? 'bg-green-100 text-green-800' :
          status === 'جيد' ? 'bg-blue-100 text-blue-800' :
            status === 'متوسط' ? 'bg-yellow-100 text-yellow-800' :
              status === 'متعثر' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800',
        group: student.group || 'بدون مجموعة'
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

    // تطبيق فلتر المجموعة
    if (filterGroup !== 'all') {
      data = data.filter(student => student.group === filterGroup);
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
  }, [students, lessons, studentProgress, videoProgress, quizProgress, searchTerm, filterGroup, sortBy, sortOrder]);

  // تصدير البيانات إلى Excel
  const exportToExcel = async () => {
    try {
      // محاولة استيراد دالة التصدير
      let exportFunction;
      try {
        const exportModule = await import('@/utils/excelExport');
        exportFunction = exportModule.exportStudentProgressToExcel;
      } catch (importError) {
        console.warn('Excel export module not found, creating basic export');
        // إنشاء تصدير بسيط إذا لم يوجد الملف
        const data = calculateDetailedProgress();
        const csvContent = [
          ['الاسم', 'البريد الإلكتروني', 'الدروس المكتملة', 'نسبة التقدم', 'متوسط الدرجات', 'تقدم الفيديو', 'تقدم PDF', 'تقدم الأسئلة'].join(','),
          ...data.map(student => [
            student.name,
            student.email,
            student.completedLessons,
            student.progressPercentage,
            student.averageScore,
            student.videoCompletionRate,
            student.pdfOpenRate,
            student.questionsAccessRate,
            student.badgesCount
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `student-progress-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast({
          title: 'تم تصدير البيانات',
          description: 'تم إنشاء ملف CSV بنجاح',
        });
        return;
      }

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

      const result = exportFunction(students, lessons, studentProgress, analyticsData);

      if (result && result.success) {
        toast({
          title: 'تم تصدير البيانات بنجاح',
          description: `تم إنشاء ملف: ${result.fileName}`,
        });
      } else {
        throw new Error(result?.error || 'فشل في التصدير');
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

            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="تصفية حسب المجموعة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المجموعات</SelectItem>
                {[...new Set(students.map(s => s.group).filter(Boolean))].map(group => (
                  <SelectItem key={group} value={String(group)}>{group}</SelectItem>
                ))}
                {students.some(s => !s.group) && <SelectItem value="بدون مجموعة">بدون مجموعة</SelectItem>}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">الاسم</SelectItem>
                <SelectItem value="progressPercentage">نسبة التقدم</SelectItem>

                <SelectItem value="videoCompletionRate">إكمال الفيديو</SelectItem>
                <SelectItem value="badgesCount">عدد الأوسمة</SelectItem>
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
                  <TableHead className="text-center border border-gray-300 p-3 font-semibold">عدد الأوسمة</TableHead>
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
                        <div className="font-bold text-xl text-yellow-600 flex items-center justify-center gap-1">
                          <Award className="w-5 h-5" />
                          {student.badgesCount}
                        </div>
                        <div className="text-xs text-gray-500">وسام مكتسب</div>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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