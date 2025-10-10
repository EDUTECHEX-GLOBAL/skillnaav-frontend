// hooks/useProctoring.js
import { useState, useEffect, useRef } from 'react';

export const useProctoring = (onViolation) => {
  const [violations, setViolations] = useState([]);
  const [stream, setStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const violationCountRef = useRef(0);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const violation = {
          type: 'TAB_SWITCH',
          timestamp: new Date().toISOString(),
          message: 'Switched to another tab or window'
        };
        setViolations(prev => [...prev, violation]);
        violationCountRef.current += 1;
        onViolation?.(violation, violationCountRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onViolation]);

  // Prevent keyboard shortcuts
  useEffect(() => {
    const preventShortcuts = (e) => {
      // Prevent common shortcuts: Alt+Tab, Ctrl+Tab, Cmd+Tab, F11, etc.
      if (
        e.altKey ||
        (e.ctrlKey && (e.key === 'Tab' || e.key === 't' || e.key === 'w')) ||
        (e.metaKey && e.key === 'Tab') ||
        e.key === 'F11' ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
        e.stopPropagation();
        const violation = {
          type: 'KEYBOARD_ATTEMPT',
          timestamp: new Date().toISOString(),
          message: `Attempted to use prohibited key: ${e.key}`
        };
        setViolations(prev => [...prev, violation]);
        violationCountRef.current += 1;
        onViolation?.(violation, violationCountRef.current);
      }
    };

    window.addEventListener('keydown', preventShortcuts, true);
    return () => window.removeEventListener('keydown', preventShortcuts, true);
  }, [onViolation]);

  // Prevent context menu (right-click)
  useEffect(() => {
    const preventContextMenu = (e) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', preventContextMenu);
    return () => window.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen) {
        const violation = {
          type: 'FULLSCREEN_EXIT',
          timestamp: new Date().toISOString(),
          message: 'Exited fullscreen mode'
        };
        setViolations(prev => [...prev, violation]);
        violationCountRef.current += 1;
        onViolation?.(violation, violationCountRef.current);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [onViolation]);

  // Camera and Microphone access
  const startProctoring = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      return true;
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
      alert('Camera and microphone access is required to take this assessment.');
      return false;
    }
  };

  const stopProctoring = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const enterFullscreen = async (element) => {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  return {
    violations,
    stream,
    isFullscreen,
    videoRef,
    startProctoring,
    stopProctoring,
    enterFullscreen,
    exitFullscreen,
    violationCount: violationCountRef.current
  };
};
