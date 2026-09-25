import React, { useState, useRef } from 'react';
import { useDualCamera } from './hooks/useDualCamera';
import { useMediaCapture } from './hooks/useMediaCapture';
import { TopBar } from './components/TopBar';
import { CameraViewport } from './components/CameraViewport';
import { ControlBar } from './components/ControlBar';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { CameraPermissionPrompt } from './components/CameraPermissionPrompt';
import { APP_VERSION } from './version';
import type { CaptureMode } from './types/camera';

export const App: React.FC = () => {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  const primaryVideoRef = useRef<HTMLVideoElement | null>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement | null>(null);

  const {
    backStream,
    frontStream,
    audioStream,
    primaryFacing,
    layoutMode,
    isSimultaneousSupported,
    isPermissionGranted,
    isLoading,
    errorMessage,
    isCapturingDual,
    dualCaptureStatus,
    setLayoutMode,
    swapCameras,
    captureSequentialDualFrames,
    initializeCameras,
  } = useDualCamera();

  const primaryStream = primaryFacing === 'environment' ? backStream : frontStream;
  const secondaryStream = primaryFacing === 'environment' ? frontStream : backStream;

  const {
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
  } = useMediaCapture({
    primaryVideoRef,
    secondaryVideoRef,
    audioStream,
    layoutMode,
    isSimultaneousSupported,
    primaryFacing,
    captureSequentialDualFrames,
  });

  const latestMedia = capturedMediaList.length > 0 ? capturedMediaList[0] : null;

  if (isLoading && !isCapturingDual) {
    return (
      <main className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-300">Iniciando câmeras...</p>
      </main>
    );
  }

  if (!isPermissionGranted || (!backStream && !frontStream)) {
    return (
      <main className="w-full h-screen bg-black">
        <CameraPermissionPrompt
          errorMessage={errorMessage}
          onRetry={initializeCameras}
        />
      </main>
    );
  }

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden flex flex-col justify-between">
      {/* Top Bar Navigation & Controls */}
      <TopBar
        layoutMode={layoutMode}
        onSelectLayout={setLayoutMode}
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        isSimultaneousSupported={isSimultaneousSupported}
      />

      {/* Main Dual Camera Viewport */}
      <div className="flex-1 w-full h-full relative">
        <CameraViewport
          primaryVideoRef={primaryVideoRef}
          secondaryVideoRef={secondaryVideoRef}
          primaryStream={primaryStream}
          secondaryStream={secondaryStream}
          primaryFacing={primaryFacing}
          layoutMode={layoutMode}
          isSimultaneousSupported={isSimultaneousSupported}
          isFlashing={isFlashing}
          isCapturingDual={isCapturingDual}
          dualCaptureStatus={dualCaptureStatus}
          onSwap={swapCameras}
        />
      </div>

      {/* Bottom Camera Controls & Shutter */}
      <ControlBar
        captureMode={captureMode}
        onChangeCaptureMode={setCaptureMode}
        isRecording={isRecording}
        onTakePhoto={takePhoto}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onSwapCameras={swapCameras}
        latestMedia={latestMedia}
        onOpenGallery={() => {
          if (latestMedia) {
            setActiveMedia(latestMedia);
          } else {
            setIsGalleryOpen(true);
          }
        }}
      />

      {/* Media Preview / Gallery Modal */}
      {(activeMedia || isGalleryOpen) && (
        <MediaPreviewModal
          media={activeMedia || latestMedia}
          mediaList={capturedMediaList}
          onClose={() => {
            setActiveMedia(null);
            setIsGalleryOpen(false);
          }}
          onSelectMedia={(item) => setActiveMedia(item)}
          onDeleteMedia={deleteMedia}
        />
      )}

      {/* App Version Stamp */}
      <footer className="absolute bottom-1 right-2 z-20 pointer-events-none opacity-40 text-[10px] font-mono text-gray-400">
        v{APP_VERSION}
      </footer>
    </main>
  );
};

export default App;
