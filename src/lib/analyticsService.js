import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// أنواع الأحداث
export const EVENT_TYPES = {
  VIDEO_STARTED: 'video_started',
  VIDEO_COMPLETED: 'video_completed',
  VIDEO_WATCHED: 'video_watched',
  PDF_OPENED: 'pdf_opened',
  PDF_VIEWED: 'pdf_viewed',
  QUESTIONS_ACCESSED: 'questions_accessed',
  QUIZ_STARTED: 'quiz_started',
  QUIZ_COMPLETED: 'quiz_completed',
  LESSON_COMPLETED: 'lesson_completed',
  RESOURCE_ACCESSED: 'resource_accessed',
  LOGIN: 'login',
  LOGOUT: 'logout'
};

// تسجيل حدث جديد
export const trackEvent = async (eventType, studentId, lessonId = null, additionalData = {}) => {
  try {
    const eventData = {
      eventType,
      studentId,
      lessonId,
      additionalData,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'analyticsEvents'), eventData);
    console.log('Event tracked:', eventType, studentId, lessonId);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// جلب الأحداث لطالب معين
export const getStudentEvents = async (studentId) => {
  try {
    const q = query(
      collection(db, 'analyticsEvents'),
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching student events:', error);
    return [];
  }
};

// جلب الأحداث لدرس معين
export const getLessonEvents = async (lessonId) => {
  try {
    const q = query(
      collection(db, 'analyticsEvents'),
      where('lessonId', '==', lessonId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching lesson events:', error);
    return [];
  }
};

// جلب جميع الأحداث
export const getAllEvents = async () => {
  try {
    const q = query(
      collection(db, 'analyticsEvents'),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching all events:', error);
    return [];
  }
};

// حساب الإحصائيات العامة
export const getGeneralAnalytics = async () => {
  try {
    const events = await getAllEvents();
    
    const analytics = {
      totalEvents: events.length,
      uniqueStudents: new Set(events.map(e => e.studentId)).size,
      uniqueLessons: new Set(events.filter(e => e.lessonId).map(e => e.lessonId)).size,
      eventsByType: {}
    };
    
    // تجميع الأحداث حسب النوع
    events.forEach(event => {
      analytics.eventsByType[event.eventType] = (analytics.eventsByType[event.eventType] || 0) + 1;
    });
    
    return analytics;
  } catch (error) {
    console.error('Error calculating general analytics:', error);
    return {};
  }
};

// حساب إحصائيات الطلاب
export const getStudentAnalytics = async (studentId) => {
  try {
    const events = await getStudentEvents(studentId);
    
    const analytics = {
      totalEvents: events.length,
      lessonsAccessed: new Set(events.filter(e => e.lessonId).map(e => e.lessonId)).size,
      videosWatched: events.filter(e => e.eventType === EVENT_TYPES.VIDEO_COMPLETED).length,
      pdfsOpened: events.filter(e => e.eventType === EVENT_TYPES.PDF_OPENED).length,
      questionsAccessed: events.filter(e => e.eventType === EVENT_TYPES.QUESTIONS_ACCESSED).length,
      quizzesCompleted: events.filter(e => e.eventType === EVENT_TYPES.QUIZ_COMPLETED).length,
      averageScore: 0,
      totalTimeSpent: 0
    };
    
    // حساب متوسط الدرجات
    const scoreEvents = events.filter(e => e.eventType === EVENT_TYPES.QUIZ_COMPLETED && e.additionalData?.score);
    if (scoreEvents.length > 0) {
      analytics.averageScore = scoreEvents.reduce((sum, e) => sum + e.additionalData.score, 0) / scoreEvents.length;
    }
    
    // حساب الوقت المقضي
    const timeEvents = events.filter(e => e.additionalData?.timeSpent);
    if (timeEvents.length > 0) {
      analytics.totalTimeSpent = timeEvents.reduce((sum, e) => sum + e.additionalData.timeSpent, 0);
    }
    
    return analytics;
  } catch (error) {
    console.error('Error calculating student analytics:', error);
    return {};
  }
};

// حساب إحصائيات الدروس
export const getLessonAnalytics = async (lessonId) => {
  try {
    const events = await getLessonEvents(lessonId);
    
    const analytics = {
      totalEvents: events.length,
      uniqueStudents: new Set(events.map(e => e.studentId)).size,
      videosStarted: events.filter(e => e.eventType === EVENT_TYPES.VIDEO_STARTED).length,
      videosCompleted: events.filter(e => e.eventType === EVENT_TYPES.VIDEO_COMPLETED).length,
      pdfsOpened: events.filter(e => e.eventType === EVENT_TYPES.PDF_OPENED).length,
      questionsAccessed: events.filter(e => e.eventType === EVENT_TYPES.QUESTIONS_ACCESSED).length,
      completionRate: 0
    };
    
    // حساب معدل الإكمال
    if (analytics.videosStarted > 0) {
      analytics.completionRate = (analytics.videosCompleted / analytics.videosStarted) * 100;
    }
    
    return analytics;
  } catch (error) {
    console.error('Error calculating lesson analytics:', error);
    return {};
  }
};

// جلب الطلاب المتعثرين
export const getStrugglingStudents = async (students, threshold = 30) => {
  try {
    const strugglingStudents = [];
    
    for (const student of students) {
      const analytics = await getStudentAnalytics(student.id);
      // يمكن تحديد المعايير حسب الحاجة
      if (analytics.lessonsAccessed < threshold) {
        strugglingStudents.push({
          ...student,
          analytics
        });
      }
    }
    
    return strugglingStudents;
  } catch (error) {
    console.error('Error getting struggling students:', error);
    return [];
  }
};

// جلب الطلاب المتفوقين
export const getTopPerformers = async (students, threshold = 80) => {
  try {
    const topPerformers = [];
    
    for (const student of students) {
      const analytics = await getStudentAnalytics(student.id);
      // يمكن تحديد المعايير حسب الحاجة
      if (analytics.averageScore >= threshold && analytics.quizzesCompleted > 0) {
        topPerformers.push({
          ...student,
          analytics
        });
      }
    }
    
    return topPerformers.sort((a, b) => b.analytics.averageScore - a.analytics.averageScore);
  } catch (error) {
    console.error('Error getting top performers:', error);
    return [];
  }
};

// تصدير البيانات التحليلية
export const exportAnalyticsData = async () => {
  try {
    const events = await getAllEvents();
    const generalAnalytics = await getGeneralAnalytics();
    
    return {
      events,
      generalAnalytics,
      exportDate: new Date().toISOString(),
      totalRecords: events.length
    };
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    return {};
  }
};