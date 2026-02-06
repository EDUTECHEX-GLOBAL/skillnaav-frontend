// hooks/useProctoring.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useProctoring = (onViolation) => {
  const [violations, setViolations] = useState([]);
  const [stream, setStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const violationCountRef = useRef(0);
  const lastViolationTimeRef = useRef(0);

  // ✅ DEBOUNCE VIOLATIONS (prevent spam)
  const VIOLATION_COOLDOWN = 3000; // 3 seconds

  const addViolation = useCallback((type, message) => {
    const now = Date.now();
    
    // Prevent duplicate violations within cooldown period
    if (now - lastViolationTimeRef.current < VIOLATION_COOLDOWN) {
      return;
    }

    lastViolationTimeRef.current = now;

    const violation = {
      type,
      timestamp: new Date().toISOString(),
      message,
    };

    setViolations(prev => [...prev, violation]);
    violationCountRef.current += 1;
    
    if (onViolation) {
      onViolation(violation, violationCountRef.current);
    }
  }, [onViolation]);

  // ✅ TAB SWITCH DETECTION
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('TAB_SWITCH', 'Switched to another tab or window');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [addViolation]);

  // ✅ WINDOW BLUR DETECTION (additional layer)
  useEffect(() => {
    const handleBlur = () => {
      addViolation('WINDOW_BLUR', 'Assessment window lost focus');
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [addViolation]);

  // ✅ PREVENT KEYBOARD SHORTCUTS
  useEffect(() => {
    const preventShortcuts = (e) => {
      const prohibitedKeys = [
        'F11', 'F12', 'Escape',
        ...(e.ctrlKey && ['t', 'w', 'n', 'Tab'] || []),
        ...(e.altKey && ['Tab', 'F4'] || []),
        ...(e.metaKey && ['Tab', 't', 'w'] || [])
      ];

      if (prohibitedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        addViolation('KEYBOARD_ATTEMPT', `Attempted to use prohibited key: ${e.key}`);
      }

      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        addViolation('KEYBOARD_ATTEMPT', 'Attempted to open developer tools');
      }
    };

    window.addEventListener('keydown', preventShortcuts, true);
    return () => window.removeEventListener('keydown', preventShortcuts, true);
  }, [addViolation]);

  // ✅ PREVENT CONTEXT MENU (right-click)
  useEffect(() => {
    const preventContextMenu = (e) => {
      e.preventDefault();
      addViolation('RIGHT_CLICK', 'Attempted to open context menu');
    };

    window.addEventListener('contextmenu', preventContextMenu);
    return () => window.removeEventListener('contextmenu', preventContextMenu);
  }, [addViolation]);

  // ✅ DETECT COPY/PASTE ATTEMPTS
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      addViolation('COPY_PASTE', 'Attempted to copy content');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      addViolation('COPY_PASTE', 'Attempted to paste content');
    };

    const handleCut = (e) => {
      e.preventDefault();
      addViolation('COPY_PASTE', 'Attempted to cut content');
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [addViolation]);

  // ✅ FULLSCREEN CHANGE DETECTION
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
        addViolation('FULLSCREEN_EXIT', 'Exited fullscreen mode');
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
  }, [addViolation]);

  // ✅ DETECT DEVTOOLS (basic detection)
  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        addViolation('DEVTOOLS_OPEN', 'Developer tools may be open');
      }
    };

    const interval = setInterval(detectDevTools, 5000);
    return () => clearInterval(interval);
  }, [addViolation]);

  // ✅ START PROCTORING (Camera + Mic)
  const startProctoring = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      return true;
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
      
      let message = 'Camera and microphone access is required to take this assessment.';
      
      if (error.name === 'NotAllowedError') {
        message += '\n\nPlease allow camera and microphone permissions in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        message += '\n\nNo camera or microphone found. Please connect a device.';
      } else if (error.name === 'NotReadableError') {
        message += '\n\nCamera or microphone is already in use by another application.';
      }

      alert(message);
      return false;
    }
  };

  // ✅ STOP PROCTORING
  const stopProctoring = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // ✅ ENTER FULLSCREEN
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
      } else {
        throw new Error('Fullscreen not supported');
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      alert('Fullscreen mode is required for this assessment.');
    }
  };

  // ✅ EXIT FULLSCREEN
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

  // ✅ CLEANUP ON UNMOUNT
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, []);

  return {
    violations,
    stream,
    isFullscreen,
    videoRef,
    startProctoring,
    stopProctoring,
    enterFullscreen,
    exitFullscreen,
    violationCount: violationCountRef.current,
    addViolation, // ✅ Expose for manual violation logging
  };
};