import * as XLSX from 'xlsx';

// تصدير بيانات تقدم الطلاب إلى Excel
export const exportStudentProgressToExcel = (students, lessons, studentProgress, analyticsData) => {
  try {
    // إنشاء workbook جديد
    const workbook = XLSX.utils.book_new();

    // ورقة 1: ملخص عام
    const summaryData = [
      ['إحصائيات عامة', ''],
      ['إجمالي الطلاب', analyticsData.totalStudents || 0],
      ['إجمالي الدروس', analyticsData.totalLessons || 0],
      ['الطلاب النشطين', analyticsData.activeStudents || 0],
      ['الطلاب غير النشطين', analyticsData.inactiveStudents || 0],
      ['نسبة الإكمال العامة (%)', (analyticsData.overallCompletionRate || 0).toFixed(2)],
      ['متوسط الدرجات العام', (analyticsData.overallAverageScore || 0).toFixed(2)],
      ['نسبة إكمال الفيديو (%)', (analyticsData.overallVideoCompletionRate || 0).toFixed(2)],
      ['نسبة فتح PDF (%)', (analyticsData.overallPdfOpenRate || 0).toFixed(2)],
      ['نسبة الوصول للأسئلة (%)', (analyticsData.overallQuestionsAccessRate || 0).toFixed(2)],
      ['', ''],
      ['تاريخ التصدير', new Date().toLocaleString('ar-EG')]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص العام');

    // ورقة 2: تقدم الطلاب التفصيلي
    const studentProgressData = [
      ['اسم الطالب', 'البريد الإلكتروني', 'الدروس المكتملة', 'إجمالي الدروس', 'نسبة التقدم (%)', 'متوسط الدرجات', 'الحالة']
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
        : 'لا توجد درجات';
      
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
        progressPercentage,
        averageScore,
        status
      ]);
    });

    const progressSheet = XLSX.utils.aoa_to_sheet(studentProgressData);
    XLSX.utils.book_append_sheet(workbook, progressSheet, 'تقدم الطلاب');

    // ورقة 3: إحصائيات الدروس
    const lessonStatsData = [
      ['رقم الدرس', 'عنوان الدرس', 'عدد الطلاب المكملين', 'إجمالي الطلاب', 'نسبة الإكمال (%)', 'متوسط الدرجات']
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
        : 'لا توجد درجات';
      
      const completionRate = students.length > 0 
        ? ((studentsCompleted / students.length) * 100).toFixed(2)
        : '0.00';

      lessonStatsData.push([
        lesson.lessonNumber || 'غير محدد',
        lesson.title || 'غير محدد',
        studentsCompleted,
        students.length,
        completionRate,
        averageScore
      ]);
    });

    const lessonSheet = XLSX.utils.aoa_to_sheet(lessonStatsData);
    XLSX.utils.book_append_sheet(workbook, lessonSheet, 'إحصائيات الدروس');

    // ورقة 4: الطلاب المتعثرين
    const strugglingData = [
      ['اسم الطالب', 'البريد الإلكتروني', 'نسبة التقدم (%)', 'الدروس المكتملة', 'آخر نشاط']
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
        progressPercentage,
        completedLessons,
        'غير متوفر' // يمكن إضافة تاريخ آخر نشاط لاحقاً
      ]);
    });

    const strugglingSheet = XLSX.utils.aoa_to_sheet(strugglingData);
    XLSX.utils.book_append_sheet(workbook, strugglingSheet, 'الطلاب المتعثرين');

    // ورقة 5: الطلاب المتفوقين
    const topPerformersData = [
      ['اسم الطالب', 'البريد الإلكتروني', 'نسبة التقدم (%)', 'متوسط الدرجات', 'الدروس المكتملة']
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
        : 'لا توجد درجات';

      topPerformersData.push([
        student.name || 'غير محدد',
        student.email || 'غير محدد',
        progressPercentage,
        averageScore,
        completedLessons
      ]);
    });

    const topPerformersSheet = XLSX.utils.aoa_to_sheet(topPerformersData);
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
      ['إحصائيات الفيديو', ''],
      ['إجمالي مرات بدء الفيديو', analyticsData.totalVideosStarted || 0],
      ['إجمالي مرات إكمال الفيديو', analyticsData.totalVideosCompleted || 0],
      ['نسبة إكمال الفيديو (%)', (analyticsData.overallVideoCompletionRate || 0).toFixed(2)],
      ['', ''],
      ['تفاصيل الفيديوهات حسب الدرس', ''],
      ['رقم الدرس', 'عنوان الدرس', 'مرات البدء', 'مرات الإكمال', 'نسبة الإكمال (%)']
    ];

    // إضافة بيانات الفيديو لكل درس (محاكاة)
    if (analyticsData.videoAnalyticsData && analyticsData.videoAnalyticsData.length > 0) {
      analyticsData.videoAnalyticsData.forEach(video => {
        videoData.push([
          video.lessonNumber || 'غير محدد',
          video.lessonTitle || 'غير محدد',
          video.starts || 0,
          video.completions || 0,
          video.completionRate ? video.completionRate.toFixed(2) : '0.00'
        ]);
      });
    }

    const videoSheet = XLSX.utils.aoa_to_sheet(videoData);
    XLSX.utils.book_append_sheet(workbook, videoSheet, 'إحصائيات الفيديو');

    // ورقة 2: إحصائيات PDF
    const pdfData = [
      ['إحصائيات ملفات PDF', ''],
      ['إجمالي مرات فتح PDF', analyticsData.totalPdfsOpened || 0],
      ['نسبة فتح PDF (%)', (analyticsData.overallPdfOpenRate || 0).toFixed(2)],
      ['', ''],
      ['تفاصيل ملفات PDF حسب الدرس', ''],
      ['رقم الدرس', 'عنوان الدرس', 'مرات الفتح', 'عدد الطلاب الذين فتحوا', 'نسبة الفتح (%)']
    ];

    // إضافة بيانات PDF لكل درس (محاكاة)
    if (analyticsData.pdfAnalyticsData && analyticsData.pdfAnalyticsData.length > 0) {
      analyticsData.pdfAnalyticsData.forEach(pdf => {
        pdfData.push([
          pdf.lessonNumber || 'غير محدد',
          pdf.lessonTitle || 'غير محدد',
          pdf.opens || 0,
          pdf.uniqueOpeners || 0,
          pdf.openRate ? pdf.openRate.toFixed(2) : '0.00'
        ]);
      });
    }

    const pdfSheet = XLSX.utils.aoa_to_sheet(pdfData);
    XLSX.utils.book_append_sheet(workbook, pdfSheet, 'إحصائيات PDF');

    // ورقة 3: إحصائيات الأسئلة
    const questionsData = [
      ['إحصائيات الأسئلة', ''],
      ['إجمالي مرات الوصول للأسئلة', analyticsData.totalQuestionsAccessed || 0],
      ['نسبة الوصول للأسئلة (%)', (analyticsData.overallQuestionsAccessRate || 0).toFixed(2)],
      ['', ''],
      ['تفاصيل الأسئلة حسب الدرس', ''],
      ['رقم الدرس', 'عنوان الدرس', 'مرات الوصول', 'عدد الطلاب', 'نسبة الوصول (%)']
    ];

    // إضافة بيانات الأسئلة لكل درس (محاكاة)
    if (analyticsData.questionsAnalyticsData && analyticsData.questionsAnalyticsData.length > 0) {
      analyticsData.questionsAnalyticsData.forEach(questions => {
        questionsData.push([
          questions.lessonNumber || 'غير محدد',
          questions.lessonTitle || 'غير محدد',
          questions.accesses || 0,
          questions.uniqueAccessors || 0,
          questions.accessRate ? questions.accessRate.toFixed(2) : '0.00'
        ]);
      });
    }

    const questionsSheet = XLSX.utils.aoa_to_sheet(questionsData);
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

