import React, { useEffect, useState } from 'react';
import { useMotivation } from '@/contexts/MotivationContext';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const StudentMotivationNotification = () => {
    const { activeMotivation, hideMotivation } = useMotivation();

    useEffect(() => {
        if (activeMotivation) {
            // Trigger confetti
            const count = 200;
            const defaults = {
                origin: { y: 0.7 }
            };

            function fire(particleRatio, opts) {
                confetti({
                    ...defaults,
                    ...opts,
                    particleCount: Math.floor(count * particleRatio)
                });
            }

            fire(0.25, {
                spread: 26,
                startVelocity: 55,
            });

            fire(0.2, {
                spread: 60,
            });

            fire(0.35, {
                spread: 100,
                decay: 0.91,
                scalar: 0.8
            });

            fire(0.1, {
                spread: 120,
                startVelocity: 25,
                decay: 0.92,
                scalar: 1.2
            });

            fire(0.1, {
                spread: 120,
                startVelocity: 45,
            });
        }
    }, [activeMotivation]);

    return (
        <AnimatePresence>
            {activeMotivation && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -50 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        className="pointer-events-auto"
                    >
                        <div className="bg-white/90 backdrop-blur-md border-2 border-yellow-400/50 shadow-2xl rounded-2xl p-8 max-w-md text-center transform hover:scale-105 transition-transform duration-300">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="text-6xl mb-4 block"
                            >
                                {activeMotivation.emoji}
                            </motion.div>

                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-600 mb-2"
                            >
                                ممتاز!
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-gray-700 text-lg font-medium"
                            >
                                {activeMotivation.text}
                            </motion.p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default StudentMotivationNotification;
