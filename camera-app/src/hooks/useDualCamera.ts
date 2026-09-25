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

      const backCamera = cameras.find(c => c.facing === 'environment') || cameras[0];
      const frontCamera = cameras.find(c => c.facing === 'user' && c.deviceId !== backCamera?.deviceId) || cameras[1];

      // 3. Try opening rear (environment) camera
      let rearStream: MediaStream | null = null;
      try {
        rearStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: backCamera ? { exact: backCamera.deviceId } : undefined,
            facingMode: backCamera ? undefined : { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
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

      // 4. Try opening front (user) camera simultaneously
      if (frontCamera || cameras.length > 1) {
        try {
          const selfieStream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: frontCamera ? { exact: frontCamera.deviceId } : undefined,
              facingMode: frontCamera ? undefined : { ideal: 'user' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          });
          frontStreamRef.current = selfieStream;
          setFrontStream(selfieStream);
          setIsSimultaneousSupported(true);
        } catch (simultaneousErr) {
          console.warn('O dispositivo não suporta abertura de duas câmeras no mesmo instante de hardware:', simultaneousErr);
          setIsSimultaneousSupported(false);
        }
      } else {
        // Only one camera device was reported by the system
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

  // Swap primary view (back <-> front)
  const swapCameras = useCallback(() => {
    setPrimaryFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  // In case device doesn't support simultaneous hardware streams, allow toggling active camera
  const switchActiveCamera = useCallback(async (targetFacing: 'environment' | 'user') => {
    try {
      setIsLoading(true);
      // Stop existing streams
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
          width: { ideal: 1920 },
          height: { ideal: 1080 }
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
      console.error('Falha ao alternar câmera:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    setLayoutMode,
    swapCameras,
    switchActiveCamera,
    initializeCameras,
  };
}
