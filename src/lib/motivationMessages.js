
export const MOTIVATION_TYPES = {
    LESSON_COMPLETE: 'lesson_complete',
    VIDEO_COMPLETE: 'video_complete',
    QUIZ_COMPLETE: 'quiz_complete',
    EXAM_COMPLETE: 'exam_complete',
    PDF_VIEWED: 'pdf_viewed',
    STREAK: 'streak'
};

const MESSAGES = {
    [MOTIVATION_TYPES.LESSON_COMPLETE]: [
        { text: "أحسنت! خطوة أخرى نحو التفوق 🌟", emoji: "🌟" },
        { text: "درس رائع! استمر في هذا الحماس 🚀", emoji: "🚀" },
        { text: "ممتاز! أنت تقترب من هدفك 🎯", emoji: "🎯" },
        { text: "عمل عظيم! المعرفة قوة 💪", emoji: "💪" },
        { text: "رائع! لقد أضفت إنجازاً جديداً 🏆", emoji: "🏆" }
    ],
    [MOTIVATION_TYPES.VIDEO_COMPLETE]: [
        { text: "مشاهدة ممتعة ومفيدة! 🎥", emoji: "🎥" },
        { text: "تركيز رائع! استمر في التعلم 🧠", emoji: "🧠" },
        { text: "لقد استوعبت فكرة جديدة اليوم! 💡", emoji: "💡" },
        { text: "كل فيديو يقربك من النجاح 🎬", emoji: "🎬" }
    ],
    [MOTIVATION_TYPES.QUIZ_COMPLETE]: [
        { text: "ذكاء خارق! إجابات موفقة 🤓", emoji: "🤓" },
        { text: "أنت بطل الاختبارات! 📝", emoji: "📝" },
        { text: "مجهود يستحق التقدير! 🌟", emoji: "🌟" },
        { text: "استمر في تحدي نفسك! ⭐", emoji: "⭐" }
    ],
    [MOTIVATION_TYPES.EXAM_COMPLETE]: [
        { text: "إنجاز كبير! ننتظر منك الأفضل دائماً 🎓", emoji: "🎓" },
        { text: "بطل! لقد أنهيت التحدي بنجاح 🏅", emoji: "🏅" },
        { text: "خطوة واثقة نحو النجاح النهائي! 🚀", emoji: "🚀" }
    ],
    [MOTIVATION_TYPES.PDF_VIEWED]: [
        { text: "القراءة مفتاح المعرفة! 📚", emoji: "📚" },
        { text: "رائع! الاطلاع يزيدك فقهاً 📖", emoji: "📖" },
        { text: "معلومات قيمة تمت إضافتها لرصيدك 🧠", emoji: "🧠" }
    ]
};

export const getRandomMessage = (type) => {
    const messages = MESSAGES[type] || MESSAGES[MOTIVATION_TYPES.LESSON_COMPLETE];
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
};

export const ACHIEVEMENT_EMOJIS = [
    { emoji: '🏆', name: 'كأس التميز' },
    { emoji: '🚀', name: 'انطلاقة سريعة' },
    { emoji: '💎', name: 'جوهرة المعرفة' },
    { emoji: '🌟', name: 'نجم ساطع' },
    { emoji: '🎯', name: 'دقة الهدف' },
    { emoji: '🧠', name: 'عبقرية فذة' },
    { emoji: '💡', name: 'فكرة نيرة' },
    { emoji: '⚡', name: 'طاقة الإبداع' },
    { emoji: '🥇', name: 'المركز الأول' },
    { emoji: '👑', name: 'ملك الإبداع' },
    { emoji: '🌈', name: 'طيف النجاح' },
    { emoji: '🔥', name: 'حماس متقد' },
    { emoji: '🛡️', name: 'درع العلم' },
    { emoji: '⚔️', name: 'فارس المعرفة' },
    { emoji: '🎨', name: 'فنان المهارات' },
    { emoji: '🔭', name: 'رؤية ثاقبة' },
    { emoji: '🧪', name: 'عالم المستقبل' },
    { emoji: '🧬', name: 'بصمة علمية' },
    { emoji: '🦾', name: 'قوة الإرادة' },
    { emoji: '🛰️', name: 'طموح فضائي' },
    { emoji: '⚓', name: 'مرساة التفوق' },
    { emoji: '🛸', name: 'خيال واسع' },
    { emoji: '⚙️', name: 'عقل هندسي' },
    { emoji: '🛠️', name: 'بناء المهارات' },
    { emoji: '💎', name: 'نفائس العلم' },
    { emoji: '✨', name: 'لمسة سحرية' }
];
