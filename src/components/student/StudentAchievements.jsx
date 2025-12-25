import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { ACHIEVEMENT_EMOJIS } from '@/lib/motivationMessages';

const StudentAchievements = ({ lessons, completedLessonIds }) => {
    if (!completedLessonIds || completedLessonIds.length === 0) {
        return (
            <Card className="glass-effect-alt border-0 shadow-lg bg-white/40 mb-8 overflow-hidden">
                <CardContent className="py-6 flex flex-col items-center justify-center text-center">
                    <div className="bg-sky-100 p-3 rounded-full mb-3">
                        <Trophy className="w-6 h-6 text-sky-600 opacity-50" />
                    </div>
                    <p className="text-gray-500 font-medium">أكمل أول درس لك لتحصل على وسام الإنجاز الأول! 🚀</p>
                </CardContent>
            </Card>
        );
    }

    // Map each completed lesson to a unique emoji based on its index in the lessons array
    const earnedAchievements = completedLessonIds.map(lessonId => {
        const lessonIndex = lessons.findIndex(l => l.id === lessonId);
        const lesson = lessons[lessonIndex];
        // Use modulo to cycle through emojis if there are more lessons than emojis
        const emojiInfo = ACHIEVEMENT_EMOJIS[lessonIndex % ACHIEVEMENT_EMOJIS.length];

        return {
            id: lessonId,
            title: lesson?.title || 'درس مكتمل',
            ...emojiInfo
        };
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
        >
            <Card className="glass-effect-alt border-0 shadow-xl bg-white/60 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-600/10 to-purple-600/10 px-6 py-3 border-b border-white/20">
                    <h3 className="text-lg font-bold text-sky-800 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        أوسمة الإنجاز والتميز
                        <span className="text-sm font-normal text-sky-600/70 mr-2">
                            ({earnedAchievements.length} وسام مكتسب)
                        </span>
                    </h3>
                </div>
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-4 justify-start">
                        <AnimatePresence>
                            {earnedAchievements.map((achievement, index) => (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0, scale: 0, rotate: -45 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: index * 0.05
                                    }}
                                    whileHover={{ scale: 1.2, rotate: 5 }}
                                    className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-3xl sm:text-4xl bg-white rounded-2xl shadow-md border-2 border-sky-100/50 cursor-pointer hover:border-sky-300 hover:shadow-lg transition-all duration-300 relative group"
                                >
                                    <span className="drop-shadow-sm">{achievement.emoji}</span>

                                    {/* Custom Tooltip */}
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-sky-100 shadow-xl p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-32 text-center scale-90 group-hover:scale-100 duration-200">
                                        <p className="font-bold text-sky-900 text-xs">{achievement.name}</p>
                                        <p className="text-[10px] text-sky-600 mt-1 line-clamp-1">{achievement.title}</p>
                                        {/* Tooltip Arrow */}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-sky-100 rotate-45"></div>
                                    </div>

                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        ✓
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default StudentAchievements;
