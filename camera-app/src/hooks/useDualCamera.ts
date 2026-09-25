import { useState, useEffect, useRef, useCallback } from 'react';
import type { CameraDeviceInfo, LayoutMode } from '../types/camera';

export function useDualCamera() {
  const [backStream, setBackStream] = useState<MediaStream | null>(null);
  const [frontStream, setFrontStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [primaryFacing, setPrimaryFacing] = useState<'environment' | 'user'>('environment');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('pip');
  const [isSimultaneousSupported, setIsSimultaneousSupported] = useState<boolean>(true);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturingDual, setIsCapturingDual] = useState<boolean>(false);
  const [dualCaptureStatus, setDualCaptureStatus] = useState<string | null>(null);

  // References to keep track of active tracks for clean disposal
  const backStreamRef = useRef<MediaStream | null>(null);
  const frontStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const stopAllStreams = useCallback(() => {
    if (backStreamRef.current) {
      backStreamRef.current.getTracks().forEach(track => track.stop());
      backStreamRef.current = null;
      setBackStream(null);
    }
    if (frontStreamRef.current) {
      frontStreamRef.current.getTracks().forEach(track => track.stop());
      frontStreamRef.current = null;
      setFrontStream(null);
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
      setAudioStream(null);
    }
  }, []);

  const initializeCameras = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Request initial permission to get device labels and microphone
      const initialStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Keep the audio stream for recording
      const audioTracks = initialStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioOnlyStream = new MediaStream(audioTracks);
        audioStreamRef.current = audioOnlyStream;
        setAudioStream(audioOnlyStream);
      }

      // Stop temporary initial video track so we can allocate dedicated streams
      initialStream.getVideoTracks().forEach(t => t.stop());
      setIsPermissionGranted(true);

      // 2. Enumerate video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');

      const cameras: CameraDeviceInfo[] = videoInputs.map((device, index) => {
        const label = device.label.toLowerCase();
        let facing: 'user' | 'environment' | 'unknown' = 'unknown';

        if (label.includes('front') || label.includes('user') || label.includes('anterior') || label.includes('selfie') || label.includes('face')) {
          facing = 'user';
        } else if (label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('traseira')) {
          facing = 'environment';
        } else {
          facing = index === 0 ? 'environment' : 'user';
        }

        return {
          deviceId: device.deviceId,
          label: device.label || `Câmera ${index + 1} (${facing})`,
          facing
        };
      });

      setAvailableCameras(cameras);

      // 3. Open primary camera (environment / back)
      let rearStream: MediaStream | null = null;
      try {
        rearStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        });
        backStreamRef.current = rearStream;
        setBackStream(rearStream);
      } catch (err) {
        console.warn('Fallback opening rear camera:', err);
        rearStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        backStreamRef.current = rearStream;
        setBackStream(rearStream);
      }

      // 4. Test opening front camera simultaneously with low resolution (to be as lightweight as possible)
      try {
        const selfieStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'user' },
            width: { ideal: 640 },
            height: { ideal: 480 },
          }
        });
        frontStreamRef.current = selfieStream;
        setFrontStream(selfieStream);
        setIsSimultaneousSupported(true);
      } catch (simultaneousErr) {
        console.warn('Hardware camera lock detectado: Ativando Modo Duplo Inteligente (BeReal).', simultaneousErr);
        setIsSimultaneousSupported(false);
      }
    } catch (err: unknown) {
      console.error('Erro ao acessar câmeras:', err);
      const msg = err instanceof Error ? err.message : 'Permissão negada ou câmera inacessível.';
      setErrorMessage(msg);
      setIsPermissionGranted(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Actively switch which camera sensor is open on the hardware
  const switchActiveCamera = useCallback(async (targetFacing: 'environment' | 'user') => {
    try {
      setIsLoading(true);

      // Stop current active streams
      if (backStreamRef.current) {
        backStreamRef.current.getTracks().forEach(t => t.stop());
        backStreamRef.current = null;
        setBackStream(null);
      }
      if (frontStreamRef.current) {
        frontStreamRef.current.getTracks().forEach(t => t.stop());
        frontStreamRef.current = null;
        setFrontStream(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      });

      if (targetFacing === 'environment') {
        backStreamRef.current = stream;
        setBackStream(stream);
      } else {
        frontStreamRef.current = stream;
        setFrontStream(stream);
      }
      setPrimaryFacing(targetFacing);
    } catch (err) {
      console.error('Falha ao alternar câmera no hardware:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Swap primary view (back <-> front)
  const swapCameras = useCallback(async () => {
    if (isSimultaneousSupported) {
      setPrimaryFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
    } else {
      const nextFacing = primaryFacing === 'environment' ? 'user' : 'environment';
      await switchActiveCamera(nextFacing);
    }
  }, [isSimultaneousSupported, primaryFacing, switchActiveCamera]);

  // Capture sequential dual frames (BeReal mode) when hardware locks simultaneous sessions
  const captureSequentialDualFrames = useCallback(async (
    primaryVideo: HTMLVideoElement
  ): Promise<{ primaryCanvas: HTMLCanvasElement; secondaryCanvas: HTMLCanvasElement } | null> => {
    setIsCapturingDual(true);
    try {
      // 1. Capture primary frame (e.g. Back camera)
      setDualCaptureStatus(primaryFacing === 'environment' ? 'Capturando Traseira...' : 'Capturando Frontal...');
      const c1 = document.createElement('canvas');
      c1.width = primaryVideo.videoWidth || 1280;
      c1.height = primaryVideo.videoHeight || 720;
      const ctx1 = c1.getContext('2d');
      if (ctx1) {
        ctx1.drawImage(primaryVideo, 0, 0, c1.width, c1.height);
      }

      // 2. Switch to opposite camera
      const oppositeFacing = primaryFacing === 'environment' ? 'user' : 'environment';
      setDualCaptureStatus(oppositeFacing === 'user' ? 'Capturando Frontal...' : 'Capturando Traseira...');

      // Stop current active stream
      const currentStream = primaryFacing === 'environment' ? backStreamRef.current : frontStreamRef.current;
      currentStream?.getTracks().forEach(t => t.stop());

      // Open opposite camera
      const secondStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: oppositeFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      primaryVideo.srcObject = secondStream;
      await new Promise<void>((resolve) => {
        primaryVideo.onloadeddata = () => resolve();
        setTimeout(resolve, 400);
      });

      // Brief delay for camera sensor auto-exposure stabilization
      await new Promise(r => setTimeout(r, 200));

      // 3. Capture second frame
      const c2 = document.createElement('canvas');
      c2.width = primaryVideo.videoWidth || 1280;
      c2.height = primaryVideo.videoHeight || 720;
      const ctx2 = c2.getContext('2d');
      if (ctx2) {
        ctx2.drawImage(primaryVideo, 0, 0, c2.width, c2.height);
      }

      // 4. Restore original camera stream
      secondStream.getTracks().forEach(t => t.stop());
      const restoredStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: primaryFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (primaryFacing === 'environment') {
        backStreamRef.current = restoredStream;
        setBackStream(restoredStream);
      } else {
        frontStreamRef.current = restoredStream;
        setFrontStream(restoredStream);
      }
      primaryVideo.srcObject = restoredStream;

      return {
        primaryCanvas: c1,
        secondaryCanvas: c2,
      };
    } catch (err) {
      console.error('Erro na captura sequencial dupla:', err);
      return null;
    } finally {
      setIsCapturingDual(false);
      setDualCaptureStatus(null);
    }
  }, [primaryFacing]);

  useEffect(() => {
    initializeCameras();
    return () => {
      stopAllStreams();
    };
  }, [initializeCameras, stopAllStreams]);

  return {
    backStream,
    frontStream,
    audioStream,
    primaryFacing,
    layoutMode,
    isSimultaneousSupported,
    isPermissionGranted,
    isLoading,
    errorMessage,
    availableCameras,
    isCapturingDual,
    dualCaptureStatus,
    setLayoutMode,
    swapCameras,
    switchActiveCamera,
    captureSequentialDualFrames,
    initializeCameras,
  };
}
