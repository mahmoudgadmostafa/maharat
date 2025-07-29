import React, { useRef, useEffect, useState } from 'react';
import { trackEvent, EVENT_TYPES } from '@/lib/analyticsService';
import { useAuth } from '@/contexts/AuthContext';

const VideoPlayer = ({ videoUrl, lessonId, className = "" }) => {
  const videoRef = useRef(null);
  const { currentUser } = useAuth();
  const studentId = currentUser?.uid;

  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [lastProgressTime, setLastProgressTime] = useState(0);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId;
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1].split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('shorts/')[1].split('?')[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1&fs=1&iv_load_policy=3&cc_load_policy=0&autohide=1` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const isYouTube = !!embedUrl;

  useEffect(() => {
    if (!studentId || !lessonId) return;

    const videoElement = isYouTube ? null : videoRef.current;

    const handlePlay = () => {
      if (!hasStarted) {
        setHasStarted(true);
        trackEvent(studentId, EVENT_TYPES.VIDEO_STARTED, lessonId, null, {
          videoUrl,
          timestamp: new Date().toISOString()
        });
      }
    };

    const handleEnded = () => {
      if (!hasCompleted) {
        setHasCompleted(true);
        trackEvent(studentId, EVENT_TYPES.VIDEO_COMPLETED, lessonId, null, {
          videoUrl,
          completedAt: new Date().toISOString()
        });
      }
    };

    // For non-YouTube videos, track progress
    const handleTimeUpdate = () => {
      if (videoElement) {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        
        if (duration > 0) {
          const progressPercentage = (currentTime / duration) * 100;
          
          if (currentTime - lastProgressTime >= 10) { // Track every 10 seconds
            setLastProgressTime(currentTime);
            trackEvent(studentId, EVENT_TYPES.VIDEO_PROGRESS, lessonId, null, {
              videoUrl,
              currentTime,
              duration,
              progressPercentage,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    };

    if (videoElement) {
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('ended', handleEnded);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
    }

    // For YouTube videos, we can't directly access play/end events from iframe for security reasons.
    // A common workaround is to use the YouTube IFrame Player API, but for simple tracking,
    // we'll just log 'started' when the component mounts and assume 'completed' if the user stays on the page for a long time.
    // For more accurate YouTube tracking, a more complex implementation with the YouTube API would be needed.
    if (isYouTube && !hasStarted) {
      setHasStarted(true);
      trackEvent(studentId, EVENT_TYPES.VIDEO_STARTED, lessonId, null, {
        videoUrl,
        timestamp: new Date().toISOString()
      });
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [studentId, lessonId, videoUrl, hasStarted, hasCompleted, lastProgressTime, isYouTube]);

  if (!videoUrl) {
    return <p className="text-gray-500">لا يوجد فيديو لهذا الدرس.</p>;
  }

  return (
    <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
      {isYouTube ? (
        <iframe
          width="100%"
          height="100%"
          src={embedUrl}
          title="فيديو الدرس"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        ></iframe>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className={`w-full h-full ${className}`}
          preload="metadata"
        >
          متصفحك لا يدعم تشغيل الفيديو.
        </video>
      )}
    </div>
  );
};

export default VideoPlayer;