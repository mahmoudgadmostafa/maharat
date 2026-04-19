import * as XLSX from 'xlsx';

const createProgressBar = (percentage) => {
  const p = parseFloat(percentage) || 0;
  const filled = Math.round(p / 10);
  const empty = 10 - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty > 0 ? empty : 0)}  ${p.toFixed(1)}%`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'ممتاز': return '🟢 ممتاز';
    case 'جيد': return '🔵 جيد';
    case 'متوسط': return '🟡 متوسط';
    case 'متعثر': return '🔴 متعثر';
    default: return '⚪ ' + (status || 'غير محدد');
  }
};

// تصدير بيانات تقدم الطلاب إلى Excel
export const exportStudentProgressToExcel = (students, lessons, studentProgress, analyticsData) => {
  try {
    // إنشاء workbook جديد
    const workbook = XLSX.utils.book_new();

    // ورقة 1: ملخص عام
    const summaryData = [
      ['إحصائيات عامة', 'القيمة'],
      ['إجمالي الطلاب', analyticsData.totalStudents || 0],
      ['إجمالي الدروس', analyticsData.totalLessons || 0],
      ['الطلاب النشطين', analyticsData.activeStudents || 0],
      ['الطلاب غير النشطين', analyticsData.inactiveStudents || 0],
      ['نسبة الإكمال العامة', createProgressBar(analyticsData.overallCompletionRate || 0)],
      ['متوسط الدرجات العام', `⭐ ${(analyticsData.overallAverageScore || 0).toFixed(2)}`],
      ['نسبة إكمال الفيديو', createProgressBar(analyticsData.overallVideoCompletionRate || 0)],
      ['نسبة فتح PDF', createProgressBar(analyticsData.overallPdfOpenRate || 0)],
      ['نسبة الوصول للأسئلة', createProgressBar(analyticsData.overallQuestionsAccessRate || 0)],
      ['', ''],
      ['تاريخ التصدير', new Date().toLocaleString('ar-EG')]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    // Adjust column widths
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص العام');

    // ورقة 2: تقدم الطلاب التفصيلي
    const studentProgressData = [
      ['اسم الطالب', 'البريد الإلكتروني', 'الدروس المكتملة', 'إجمالي الدروس', 'شريط التقدم', 'متوسط الدرجات', 'الأوسمة', 'الحالة']
    ];

    students.forEach(student => {
      const progress = studentProgress[student.id] || {};
      const completedLessons = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.completed
      ).length;
      
      const studentScores = Object.values(progress)
        .filter(p => p.completed && p.score !== undefined)
        .map(p => p.score);
      
      const averageScore = studentScores.length > 0 
        ? (studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length).toFixed(2)
        : '0.00';
      
      const progressPercentage = lessons.length > 0 
        ? ((completedLessons / lessons.length) * 100).toFixed(2) 
        : '0.00';
      
      const status = completedLessons === 0 ? 'لم يبدأ' : 
                    parseFloat(progressPercentage) < 30 ? 'متعثر' :
                    parseFloat(progressPercentage) < 70 ? 'متوسط' :
                    parseFloat(progressPercentage) < 90 ? 'جيد' : 'ممتاز';

      studentProgressData.push([
        student.name || 'غير محدد',
        student.email || 'غير محدد',
        completedLessons,
        lessons.length,
        createProgressBar(progressPercentage),
        `🎯 ${averageScore} نقطة`,
        `🏆 ${completedLessons} وسام`,
        getStatusBadge(status)
      ]);
    });

    const progressSheet = XLSX.utils.aoa_to_sheet(studentProgressData);
    progressSheet['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, progressSheet, 'تقدم الطلاب');

    // ورقة 3: إحصائيات الدروس
    const lessonStatsData = [
      ['رقم الدرس', 'عنوان الدرس', 'عدد الطلاب المكملين', 'إجمالي الطلاب', 'نسبة الإكمال', 'متوسط الدرجات']
    ];

    lessons.forEach(lesson => {
      const studentsCompleted = students.filter(student => 
        studentProgress[student.id]?.[lesson.id]?.completed
      ).length;
      
      const lessonScores = students
        .map(student => studentProgress[student.id]?.[lesson.id]?.score)
        .filter(score => score !== undefined);
      
      const averageScore = lessonScores.length > 0 
        ? (lessonScores.reduce((sum, score) => sum + score, 0) / lessonScores.length).toFixed(2)
        : '0.00';
      
      const completionRate = students.length > 0 
        ? ((studentsCompleted / students.length) * 100).toFixed(2)
        : '0.00';

      lessonStatsData.push([
        lesson.lessonNumber || 'غير محدد',
        lesson.title || 'غير محدد',
        studentsCompleted,
        students.length,
        createProgressBar(completionRate),
        `🎯 ${averageScore}`
      ]);
    });

    const lessonSheet = XLSX.utils.aoa_to_sheet(lessonStatsData);
    lessonSheet['!cols'] = [{ wch: 15 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, lessonSheet, 'إحصائيات الدروس');

    // ورقة 4: الطلاب المتعثرين
    const strugglingData = [
      ['اسم الطالب', 'البريد الإلكتروني', 'شريط التقدم', 'الدروس المكتملة', 'الحالة']
    ];

    const strugglingStudents = students.filter(student => {
      const progress = studentProgress[student.id] || {};
      const completedLessons = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.completed
      ).length;
      const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;
      return progressPercentage < 30 && completedLessons > 0;
    });

    strugglingStudents.forEach(student => {
      const progress = studentProgress[student.id] || {};
      const completedLessons = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.completed
      ).length;
      const progressPercentage = lessons.length > 0 
        ? ((completedLessons / lessons.length) * 100).toFixed(2) 
        : '0.00';

      strugglingData.push([
        student.name || 'غير محدد',
        student.email || 'غير محدد',
        createProgressBar(progressPercentage),
        completedLessons,
        getStatusBadge('متعثر')
      ]);
    });

    const strugglingSheet = XLSX.utils.aoa_to_sheet(strugglingData);
    strugglingSheet['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, strugglingSheet, 'الطلاب المتعثرين');

    // ورقة 5: الطلاب المتفوقين
    const topPerformersData = [
      ['اسم الطالب', 'البريد الإلكتروني', 'شريط التقدم', 'متوسط الدرجات', 'الدروس المكتملة', 'الأوسمة']
    ];

    const topPerformers = students.filter(student => {
      const progress = studentProgress[student.id] || {};
      const completedLessons = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.completed
      ).length;
      const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;
      
      const studentScores = Object.values(progress)
        .filter(p => p.completed && p.score !== undefined)
        .map(p => p.score);
      const averageScore = studentScores.length > 0 
        ? studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length 
        : 0;
      
      return progressPercentage > 80 && averageScore > 85;
    });

    topPerformers.forEach(student => {
      const progress = studentProgress[student.id] || {};
      const completedLessons = Object.keys(progress).filter(lessonId => 
        progress[lessonId]?.completed
      ).length;
      const progressPercentage = lessons.length > 0 
        ? ((completedLessons / lessons.length) * 100).toFixed(2) 
        : '0.00';
      
      const studentScores = Object.values(progress)
        .filter(p => p.completed && p.score !== undefined)
        .map(p => p.score);
      const averageScore = studentScores.length > 0 
        ? (studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length).toFixed(2)
        : '0.00';

      topPerformersData.push([
        student.name || 'غير محدد',
        student.email || 'غير محدد',
        createProgressBar(progressPercentage),
        `⭐ ${averageScore}`,
        completedLessons,
        `🏆 ${completedLessons} وسام`
      ]);
    });

    const topPerformersSheet = XLSX.utils.aoa_to_sheet(topPerformersData);
    topPerformersSheet['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, topPerformersSheet, 'الطلاب المتفوقين');

    // تصدير الملف
    const fileName = `تقرير_تقدم_الطلاب_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

// تصدير إحصائيات الفيديو والـ PDF والأسئلة إلى Excel
export const exportMediaAnalyticsToExcel = (analyticsData, events = []) => {
  try {
    const workbook = XLSX.utils.book_new();

    // ورقة 1: إحصائيات الفيديو
    const videoData = [
      ['إحصائيات الفيديو', 'القيمة'],
      ['إجمالي مرات بدء الفيديو', analyticsData.totalVideosStarted || 0],
      ['إجمالي مرات إكمال الفيديو', analyticsData.totalVideosCompleted || 0],
      ['نسبة إكمال الفيديو', createProgressBar(analyticsData.overallVideoCompletionRate || 0)],
      ['', ''],
      ['تفاصيل الفيديوهات حسب الدرس', ''],
      ['رقم الدرس', 'عنوان الدرس', 'مرات البدء', 'مرات الإكمال', 'شريط التقدم']
    ];

    // إضافة بيانات الفيديو لكل درس (محاكاة)
    if (analyticsData.videoAnalyticsData && analyticsData.videoAnalyticsData.length > 0) {
      analyticsData.videoAnalyticsData.forEach(video => {
        videoData.push([
          video.lessonNumber || 'غير محدد',
          video.lessonTitle || 'غير محدد',
          video.starts || 0,
          video.completions || 0,
          createProgressBar(video.completionRate || 0)
        ]);
      });
    }

    const videoSheet = XLSX.utils.aoa_to_sheet(videoData);
    videoSheet['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, videoSheet, 'إحصائيات الفيديو');

    // ورقة 2: إحصائيات PDF
    const pdfData = [
      ['إحصائيات ملفات PDF', 'القيمة'],
      ['إجمالي مرات فتح PDF', analyticsData.totalPdfsOpened || 0],
      ['نسبة فتح PDF', createProgressBar(analyticsData.overallPdfOpenRate || 0)],
      ['', ''],
      ['تفاصيل ملفات PDF حسب الدرس', ''],
      ['رقم الدرس', 'عنوان الدرس', 'مرات الفتح', 'عدد الطلاب الذين فتحوا', 'شريط التقدم']
    ];

    // إضافة بيانات PDF لكل درس (محاكاة)
    if (analyticsData.pdfAnalyticsData && analyticsData.pdfAnalyticsData.length > 0) {
      analyticsData.pdfAnalyticsData.forEach(pdf => {
        pdfData.push([
          pdf.lessonNumber || 'غير محدد',
          pdf.lessonTitle || 'غير محدد',
          pdf.opens || 0,
          pdf.uniqueOpeners || 0,
          createProgressBar(pdf.openRate || 0)
        ]);
      });
    }

    const pdfSheet = XLSX.utils.aoa_to_sheet(pdfData);
    pdfSheet['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, pdfSheet, 'إحصائيات PDF');

    // ورقة 3: إحصائيات الأسئلة
    const questionsData = [
      ['إحصائيات الأسئلة', 'القيمة'],
      ['إجمالي مرات الوصول للأسئلة', analyticsData.totalQuestionsAccessed || 0],
      ['نسبة الوصول للأسئلة', createProgressBar(analyticsData.overallQuestionsAccessRate || 0)],
      ['', ''],
      ['تفاصيل الأسئلة حسب الدرس', ''],
      ['رقم الدرس', 'عنوان الدرس', 'مرات الوصول', 'عدد الطلاب', 'شريط التقدم']
    ];

    // إضافة بيانات الأسئلة لكل درس (محاكاة)
    if (analyticsData.questionsAnalyticsData && analyticsData.questionsAnalyticsData.length > 0) {
      analyticsData.questionsAnalyticsData.forEach(questions => {
        questionsData.push([
          questions.lessonNumber || 'غير محدد',
          questions.lessonTitle || 'غير محدد',
          questions.accesses || 0,
          questions.uniqueAccessors || 0,
          createProgressBar(questions.accessRate || 0)
        ]);
      });
    }

    const questionsSheet = XLSX.utils.aoa_to_sheet(questionsData);
    questionsSheet['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, questionsSheet, 'إحصائيات الأسئلة');

    // ورقة 4: سجل الأحداث (إذا كان متوفراً)
    if (events && events.length > 0) {
      const eventsData = [
        ['تاريخ الحدث', 'نوع الحدث', 'اسم الطالب', 'رقم الدرس', 'تفاصيل إضافية']
      ];

      events.slice(0, 1000).forEach(event => { // أول 1000 حدث فقط
        eventsData.push([
          event.timestamp ? new Date(event.timestamp).toLocaleString('ar-EG') : 'غير محدد',
          event.eventType || 'غير محدد',
          event.studentName || 'غير محدد',
          event.lessonId || 'غير محدد',
          event.additionalData ? JSON.stringify(event.additionalData) : 'لا توجد'
        ]);
      });

      const eventsSheet = XLSX.utils.aoa_to_sheet(eventsData);
      XLSX.utils.book_append_sheet(workbook, eventsSheet, 'سجل الأحداث');
    }

    // تصدير الملف
    const fileName = `تقرير_إحصائيات_الوسائط_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting media analytics to Excel:', error);
    return { success: false, error: error.message };
  }
};

