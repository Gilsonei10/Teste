import { useState, useRef, useCallback, useEffect } from 'react';
import type { LayoutMode, CapturedMedia } from '../types/camera';

interface UseMediaCaptureProps {
  primaryVideoRef: React.RefObject<HTMLVideoElement | null>;
  secondaryVideoRef: React.RefObject<HTMLVideoElement | null>;
  audioStream: MediaStream | null;
  layoutMode: LayoutMode;
  isSimultaneousSupported: boolean;
  primaryFacing: 'user' | 'environment';
}

export function useMediaCapture({
  primaryVideoRef,
  secondaryVideoRef,
  audioStream,
  layoutMode,
  isSimultaneousSupported,
  primaryFacing,
}: UseMediaCaptureProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [capturedMediaList, setCapturedMediaList] = useState<CapturedMedia[]>([]);
  const [activeMedia, setActiveMedia] = useState<CapturedMedia | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize offscreen composition canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // 9:16 vertical mobile aspect ratio
    canvasRef.current = canvas;

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Draw video elements onto composite canvas
  const drawCompositeFrame = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const v1 = primaryVideoRef.current;
      const v2 = secondaryVideoRef.current;

      const hasV1 = v1 && v1.readyState >= 2;
      const hasV2 = v2 && v2.readyState >= 2 && isSimultaneousSupported;

      if (layoutMode === 'split-v') {
        // Top half and Bottom half
        const halfHeight = height / 2;
        if (hasV1) {
          ctx.drawImage(v1, 0, 0, width, halfHeight);
        }
        if (hasV2) {
          ctx.drawImage(v2, 0, halfHeight, width, halfHeight);
        } else if (hasV1 && !hasV2) {
          // If only 1 video active, center it or duplicate with placeholder
          ctx.drawImage(v1, 0, halfHeight, width, halfHeight);
        }
        // Divider line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, halfHeight);
        ctx.lineTo(width, halfHeight);
        ctx.stroke();
      } else if (layoutMode === 'split-h') {
        // Left half and Right half
        const halfWidth = width / 2;
        if (hasV1) {
          ctx.drawImage(v1, 0, 0, halfWidth, height);
        }
        if (hasV2) {
          ctx.drawImage(v2, halfWidth, 0, halfWidth, height);
        } else if (hasV1 && !hasV2) {
          ctx.drawImage(v1, halfWidth, 0, halfWidth, height);
        }
        // Divider line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(halfWidth, 0);
        ctx.lineTo(halfWidth, height);
        ctx.stroke();
      } else {
        // Picture-in-Picture (PiP)
        if (hasV1) {
          ctx.drawImage(v1, 0, 0, width, height);
        }

        if (hasV2) {
          // Inset window at top-right
          const insetW = width * 0.32;
          const insetH = height * 0.24;
          const insetX = width - insetW - 40;
          const insetY = 80;
          const radius = 24;

          ctx.save();
          // Rounded clip for PiP preview
          ctx.beginPath();
          ctx.roundRect(insetX, insetY, insetW, insetH, radius);
          ctx.clip();

          // Mirror front camera in PiP if secondary is front
          const isSecondaryFront = primaryFacing === 'environment';
          if (isSecondaryFront) {
            ctx.save();
            ctx.translate(insetX + insetW, insetY);
            ctx.scale(-1, 1);
            ctx.drawImage(v2, 0, 0, insetW, insetH);
            ctx.restore();
          } else {
            ctx.drawImage(v2, insetX, insetY, insetW, insetH);
          }

          ctx.restore();

          // Border for PiP window
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.roundRect(insetX, insetY, insetW, insetH, radius);
          ctx.stroke();
        }
      }
    },
    [layoutMode, primaryFacing, isSimultaneousSupported, primaryVideoRef, secondaryVideoRef]
  );

  // Trigger visual shutter flash
  const triggerFlash = useCallback(() => {
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
    }, 150);
  }, []);

  // Take combined photo
  const takePhoto = useCallback(async (): Promise<CapturedMedia | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    triggerFlash();
    drawCompositeFrame(ctx, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const url = URL.createObjectURL(blob);
          const newMedia: CapturedMedia = {
            id: 'photo_' + Date.now(),
            type: 'photo',
            url,
            blob,
            timestamp: Date.now(),
            layoutMode,
          };

          setCapturedMediaList((prev) => [newMedia, ...prev]);
          setActiveMedia(newMedia);
          resolve(newMedia);
        },
        'image/jpeg',
        0.95
      );
    });
  }, [drawCompositeFrame, layoutMode, triggerFlash]);

  // Start recording video
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    recordedChunksRef.current = [];

    // Animation loop to keep drawing video feeds onto canvas during recording
    const renderLoop = () => {
      drawCompositeFrame(ctx, canvas.width, canvas.height);
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Capture 30fps canvas stream
    const canvasStream = canvas.captureStream(30);

    // Combine audio tracks from microphone if available
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track) => {
        tracks.push(track);
      });
    }

    const combinedStream = new MediaStream(tracks);

    // Pick best supported MIME type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }

    try {
      const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }

        const totalDuration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        const finalBlob = new Blob(recordedChunksRef.current, {
          type: mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(finalBlob);

        const newMedia: CapturedMedia = {
          id: 'video_' + Date.now(),
          type: 'video',
          url,
          blob: finalBlob,
          timestamp: Date.now(),
          duration: totalDuration,
          layoutMode,
        };

        setCapturedMediaList((prev) => [newMedia, ...prev]);
        setActiveMedia(newMedia);
        setIsRecording(false);
        setRecordingDuration(0);
      };

      recorder.start(500); // 500ms chunk slices
      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration ticker
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);
    } catch (err) {
      console.error('Falha ao iniciar gravação de vídeo:', err);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      setIsRecording(false);
    }
  }, [audioStream, drawCompositeFrame, layoutMode]);

  // Stop recording video
  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const deleteMedia = useCallback(
    (id: string) => {
      setCapturedMediaList((prev) => {
        const item = prev.find((m) => m.id === id);
        if (item) URL.revokeObjectURL(item.url);
        return prev.filter((m) => m.id !== id);
      });
      if (activeMedia?.id === id) {
        setActiveMedia(null);
      }
    },
    [activeMedia]
  );

  return {
    isRecording,
    recordingDuration,
    capturedMediaList,
    activeMedia,
    isFlashing,
    setActiveMedia,
    takePhoto,
    startRecording,
    stopRecording,
    deleteMedia,
  };
}
