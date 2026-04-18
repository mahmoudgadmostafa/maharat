import React, { useRef, useEffect, useState, useCallback } from 'react';
import { trackEvent, EVENT_TYPES } from '@/lib/analyticsService';
import { useAuth } from '@/contexts/AuthContext';
import { useMotivation } from '@/contexts/MotivationContext';
import { MOTIVATION_TYPES } from '@/lib/motivationMessages';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trophy, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VideoPlayer = ({ videoUrl, lessonId, className = "", onMarkComplete }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastTimeRef = useRef(0);

  const { currentUser } = useAuth();
  const studentId = currentUser?.uid;
  const { showMotivation } = useMotivation();

  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [savedTime, setSavedTime] = useState(0);
  const [isApiReady, setIsApiReady] = useState(false);
  const [showResumeNotice, setShowResumeNotice] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);

  const getYouTubeId = (url) => {
    if (!url) return null;
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    if (url.includes('youtube.com/watch?v=')) return url.split('watch?v=')[1].split('&')[0];
    if (url.includes('youtube.com/embed/')) return url.split('embed/')[1].split('?')[0];
    if (url.includes('youtube.com/shorts/')) return url.split('shorts/')[1].split('?')[0];
    return null;
  };

  const videoId = getYouTubeId(videoUrl);
  const isYouTube = !!videoId;

  // Save progress to Firestore
  const saveProgress = useCallback(async (currentTime, isCompleted = false) => {
    if (!isProgressLoaded || !studentId || !lessonId || isNaN(currentTime)) return;

    // Protection: If we already know the video is completed and this call isn't setting it to completed,
    // we should NOT overwrite the "isCompleted: true" state in the DB with "false".
    // This prevents race conditions during unmount or state transitions.
    if (hasCompleted && !isCompleted) {
      // We only allow reset via manual playback start which sets hasCompleted to false first
      return;
    }

    try {
      lastTimeRef.current = currentTime;
      const progressRef = doc(db, 'videoProgress', `${studentId}_${lessonId}`);
      await setDoc(progressRef, {
        currentTime,
        isCompleted,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving video progress:", error);
    }
  }, [studentId, lessonId, hasCompleted]);

  // Load progress from Firestore
  useEffect(() => {
    const loadProgress = async () => {
      if (!studentId || !lessonId) return;

      // 🔄 Reset local state immediately on lesson change to prevent leakage
      setIsProgressLoaded(false);
      setShowSuccessOverlay(false);
      setHasCompleted(false);
      setHasStarted(false);
      setSavedTime(0);
      setCurrentTime(0);
      setIsPlaying(false);
      setShowResumeNotice(false);
      lastTimeRef.current = 0;

      try {
        const progressRef = doc(db, 'videoProgress', `${studentId}_${lessonId}`);
        const snap = await getDoc(progressRef);
        if (snap.exists()) {
          const data = snap.data();
          const time = data.currentTime || 0;
          setSavedTime(time);
          lastTimeRef.current = time;

          if (data.isCompleted) {
            setShowSuccessOverlay(true);
            setHasCompleted(true);
            if (onMarkComplete) onMarkComplete();
          } else if (time > 2) { // Only show notice if more than 2 seconds saved
            setShowResumeNotice(true);
            setTimeout(() => setShowResumeNotice(false), 4000);
          }
        }
      } catch (error) {
        console.error("Error loading video progress:", error);
      } finally {
        setIsProgressLoaded(true);
      }
    };
    loadProgress();
  }, [studentId, lessonId]);

  // Handle Playback Start/Resume
  const handlePlaybackStart = useCallback((manualAction = false) => {
    // Only dismiss the overlay if it's a manual action or if we're not currently in completion state
    if (showSuccessOverlay) {
      if (!manualAction) {
        // Strict guard: if video tries to auto-play while completed, force it back to pause
        if (isYouTube && playerRef.current?.pauseVideo) playerRef.current.pauseVideo();
        else if (videoRef.current) videoRef.current.pause();
        return;
      }
      setShowSuccessOverlay(false);
      setHasCompleted(false); // Reset completion state locally to allow the DB reset
      saveProgress(0, false); // Reset completion in DB
    }
    if (!hasStarted) {
      setHasStarted(true);
      trackEvent(EVENT_TYPES.VIDEO_STARTED, studentId, lessonId, { videoUrl });
    }
  }, [hasStarted, studentId, lessonId, videoUrl, showSuccessOverlay, saveProgress, isYouTube]);

  // Handle Playback Completion
  const handlePlaybackComplete = useCallback(() => {
    // Force pause and update internal state before showing overlay
    setIsPlaying(false);

    if (isYouTube && playerRef.current) {
      if (playerRef.current.pauseVideo) playerRef.current.pauseVideo();
    } else if (videoRef.current) {
      videoRef.current.pause();
    }

    if (!hasCompleted) {
      setHasCompleted(true);
      trackEvent(EVENT_TYPES.VIDEO_COMPLETED, studentId, lessonId, { videoUrl });
      showMotivation(MOTIVATION_TYPES.VIDEO_COMPLETE);
    }
    saveProgress(0, true); // Mark as completed in DB
    setShowSuccessOverlay(true);
    if (onMarkComplete) onMarkComplete();
  }, [hasCompleted, studentId, lessonId, videoUrl, showMotivation, saveProgress, isYouTube, onMarkComplete]);

  // YouTube API Integration
  const saveProgressRef = useRef(saveProgress);
  const handlePlaybackStartRef = useRef(handlePlaybackStart);
  const handlePlaybackCompleteRef = useRef(handlePlaybackComplete);
  const hasCompletedRef = useRef(hasCompleted);

  useEffect(() => {
    saveProgressRef.current = saveProgress;
    handlePlaybackStartRef.current = handlePlaybackStart;
    handlePlaybackCompleteRef.current = handlePlaybackComplete;
    hasCompletedRef.current = hasCompleted;
  });

  useEffect(() => {
    if (!isYouTube || !videoId || !isProgressLoaded) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }
  }, [isYouTube, videoId, isProgressLoaded]); // Added isProgressLoaded to ensure we have savedTime

  useEffect(() => {
    if (!isYouTube || !isApiReady || !videoId || !isProgressLoaded) return;

    const onPlayerStateChange = (event) => {
      if (event.data === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        setShowCenterIcon(true);
        setTimeout(() => setShowCenterIcon(false), 800);
        handlePlaybackStartRef.current();
      }

      if (event.data === window.YT.PlayerState.PAUSED) {
        setIsPlaying(false);
        setShowCenterIcon(true);
        const currentTime = event.target.getCurrentTime();
        saveProgressRef.current(currentTime);
      }

      if (event.data === window.YT.PlayerState.ENDED) {
        handlePlaybackCompleteRef.current();
      }
    };

    const initPlayer = () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { }
      }
      playerRef.current = new window.YT.Player(`yt-player-${lessonId}`, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 0,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          origin: window.location.origin,
          start: Math.floor(savedTime)
        },
        events: {
          'onStateChange': onPlayerStateChange,
          'onReady': (event) => {
            setDuration(event.target.getDuration());
            if (savedTime > 0) {
              event.target.seekTo(savedTime);
            }
          }
        }
      });
    };

    initPlayer();

    const progressInterval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getPlayerState && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
        const time = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        setCurrentTime(time);
        if (total > 0 && duration !== total) setDuration(total);

        // Safety Trigger: If we're within 1 second of the end, trigger completion
        if (total > 0 && time >= total - 1 && !hasCompletedRef.current) {
          handlePlaybackCompleteRef.current();
        }

        // Only save progress if video is NOT already completed to avoid overwriting state
        if (time > 0 && !hasCompletedRef.current) {
          saveProgressRef.current(time);
        }
      }
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const finalTime = playerRef.current.getCurrentTime();
        // Strict guard: NEVER save on unmount if video is completed
        if (finalTime > 1 && !hasCompletedRef.current) saveProgressRef.current(finalTime);
      }
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) { }
        playerRef.current = null;
      }
    };
  }, [isYouTube, isApiReady, videoId, lessonId, isProgressLoaded]); // Removed hasCompleted dependency

  // HTML5 Video Support
  useEffect(() => {
    if (isYouTube || !videoRef.current) return;

    const video = videoRef.current;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (savedTime > 0) {
        video.currentTime = savedTime;
      }
    };

    const handlePlay = () => {
      handlePlaybackStart();
    };

    const handlePause = () => {
      if (!video.ended) {
        saveProgress(video.currentTime);
      }
    };

    const handleEnded = () => {
      handlePlaybackComplete();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    const progressInterval = setInterval(() => {
      if (!video.paused && video.currentTime > 0 && !video.ended) {
        setCurrentTime(video.currentTime);

        // Safety Trigger: If we're within 0.5 seconds of the end, trigger completion
        if (video.duration > 0 && video.currentTime >= video.duration - 0.5 && !hasCompletedRef.current) {
          handlePlaybackCompleteRef.current();
        }

        if (!hasCompletedRef.current) {
          saveProgressRef.current(video.currentTime);
        }
      }
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      if (video.currentTime > 1 && !video.ended && !hasCompletedRef.current) saveProgressRef.current(video.currentTime);

      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isYouTube, isProgressLoaded, savedTime]); // Removed handlePlaybackStart, handlePlaybackComplete, saveProgress, hasCompleted

  if (!videoUrl) {
    return <p className="text-gray-500">لا يوجد فيديو لهذا الدرس.</p>;
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    if (isYouTube && playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    handlePlaybackStart(true); // Manually trigger start to hide overlay and reset DB
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedPercentage = x / rect.width;
    const seekTime = clickedPercentage * duration;

    if (isYouTube && playerRef.current) {
      playerRef.current.seekTo(seekTime, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
    setCurrentTime(seekTime);
  };

  const handleTogglePlay = () => {
    if (showSuccessOverlay) return;

    // 🔄 Auto-Restart: If video is at the end, clicking restarts it
    const isAtEnd = duration > 0 && currentTime >= duration - 1;
    if (isAtEnd) {
      handleRestart();
      return;
    }

    if (isYouTube && playerRef.current) {
      const state = playerRef.current.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } else if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="space-y-3">

      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`aspect-video rounded-xl overflow-hidden shadow-2xl bg-black relative group select-none ${className}`}
      >
        {/* Cropping Wrapper to hide YouTube branding (titles/logos) */}
        <div className={`w-full h-full relative ${isYouTube ? 'scale-[1.15]' : ''}`}>
          {isYouTube ? (
            <div id={`yt-player-${lessonId}`} className="w-full h-full"></div>
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              className={`w-full h-full ${className}`}
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          )}
        </div>

        {/* Transparent Interaction Layer */}
        {!showSuccessOverlay && (
          <div
            onClick={handleTogglePlay}
            className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
          >
            {/* Central Status Icon */}
            <AnimatePresence>
              {(showCenterIcon || !isPlaying) && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="bg-sky-500/80 p-6 rounded-full text-white shadow-2xl backdrop-blur-sm"
                >
                  {currentTime >= duration - 1 && duration > 0 ? (
                    <RotateCcw className="w-8 h-8 fill-current" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8 fill-current" />
                  ) : (
                    <Play className="w-8 h-8 fill-current ml-1" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Custom Minimal Progress Bar */}
        <AnimatePresence>
          {isHovering && !showSuccessOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4 pt-10 bg-gradient-to-t from-black/80 to-transparent"
            >
              <div className="flex flex-col gap-2">
                {/* Progress Slider */}
                <div
                  onClick={handleSeek}
                  className="h-1.5 w-full bg-white/20 rounded-full cursor-pointer relative group/bar"
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-sky-500 rounded-full transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full scale-0 group-hover/bar:scale-100 transition-transform shadow-xl" />
                  </div>
                </div>

                {/* Time Display */}
                <div className="flex justify-between items-center text-[10px] sm:text-xs text-white/80 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Persistent Success Overlay */}
        <AnimatePresence>
          {showSuccessOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-sky-950/90 backdrop-blur-sm text-white p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="bg-white/10 p-5 rounded-full mb-6 border border-white/20 shadow-2xl"
              >
                <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-lg" />
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl font-bold mb-3"
              >
                أحسنت صنعاً! 🎉
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sky-100/80 mb-8 max-w-md text-sm sm:text-base leading-relaxed"
              >
                لقد أكملت مشاهدة هذا الدرس بنجاح. استمر في هذا الأداء الرائع واستكشف الدروس القادمة!
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 justify-center"
              >
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 border-white/30 text-white rounded-full px-6 py-2 h-auto"
                >
                  <Play className="w-4 h-4 ml-2" />
                  مشاهدة مرة أخرى
                </Button>
                <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-green-100">تم الإنجاز</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* High-Precision Resume Notice */}
        <AnimatePresence>
          {showResumeNotice && savedTime > 0 && !showSuccessOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none"
            >
              <div className="bg-sky-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-sky-400/30 flex items-center justify-between max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  <div className="bg-sky-500/20 p-2 rounded-full">
                    <Clock className="w-5 h-5 text-sky-300 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">تم استئناف المشاهدة</p>
                    <p className="text-[10px] text-sky-200/70">من الدقيقة {formatTime(savedTime)}</p>
                  </div>
                </div>
                <div className="text-[10px] bg-white/10 px-2 py-1 rounded-lg">بيانات محفوظة ✓</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 pointer-events-none border-4 border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
};

export default VideoPlayer;