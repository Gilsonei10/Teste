import React from 'react';
import { SwitchCamera, Image as ImageIcon } from 'lucide-react';
import type { CaptureMode, CapturedMedia } from '../types/camera';

interface ControlBarProps {
  captureMode: CaptureMode;
  onChangeCaptureMode: (mode: CaptureMode) => void;
  isRecording: boolean;
  onTakePhoto: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSwapCameras: () => void;
  latestMedia: CapturedMedia | null;
  onOpenGallery: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  captureMode,
  onChangeCaptureMode,
  isRecording,
  onTakePhoto,
  onStartRecording,
  onStopRecording,
  onSwapCameras,
  latestMedia,
  onOpenGallery,
}) => {
  const handleShutterClick = () => {
    if (captureMode === 'photo') {
      onTakePhoto();
    } else {
      if (isRecording) {
        onStopRecording();
      } else {
        onStartRecording();
      }
    }
  };

  return (
    <footer className="safe-bottom absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center bg-gradient-to-t from-black via-black/80 to-transparent pb-6 pt-4">
      {/* Photo / Video Mode Selector */}
      {!isRecording && (
        <div className="flex items-center gap-6 mb-5">
          <button
            type="button"
            onClick={() => onChangeCaptureMode('photo')}
            className={`text-xs font-bold tracking-widest uppercase transition-all ${
              captureMode === 'photo'
                ? 'text-amber-400 scale-105 border-b-2 border-amber-400 pb-0.5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            FOTO
          </button>
          <button
            type="button"
            onClick={() => onChangeCaptureMode('video')}
            className={`text-xs font-bold tracking-widest uppercase transition-all ${
              captureMode === 'video'
                ? 'text-amber-400 scale-105 border-b-2 border-amber-400 pb-0.5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            VÍDEO
          </button>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="w-full max-w-md px-8 flex items-center justify-between">
        {/* Gallery / Recent Media Thumbnail */}
        <div className="w-14 h-14 flex items-center justify-center">
          {latestMedia ? (
            <button
              type="button"
              onClick={onOpenGallery}
              title="Abrir Galeria"
              className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white/60 shadow-lg active:scale-95 transition-transform"
            >
              {latestMedia.type === 'photo' ? (
                <img
                  src={latestMedia.url}
                  alt="Última foto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={latestMedia.url}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenGallery}
              title="Galeria vazia"
              className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 active:scale-95 transition-transform border border-white/10"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Central Shutter / Record Button */}
        <div className="flex items-center justify-center">
          {captureMode === 'photo' ? (
            <button
              type="button"
              onClick={handleShutterClick}
              title="Tirar Foto"
              className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-95 transition-transform shadow-2xl focus:outline-none"
            >
              <div className="w-full h-full bg-white rounded-full transition-transform active:scale-90" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleShutterClick}
              title={isRecording ? 'Parar Gravação' : 'Gravar Vídeo'}
              className={`w-20 h-20 rounded-full border-4 p-1 flex items-center justify-center active:scale-95 transition-all shadow-2xl focus:outline-none ${
                isRecording
                  ? 'border-red-500 animate-pulse'
                  : 'border-white'
              }`}
            >
              {isRecording ? (
                <div className="w-8 h-8 bg-red-600 rounded-md transition-all shadow-md" />
              ) : (
                <div className="w-full h-full bg-red-600 rounded-full transition-transform active:scale-90" />
              )}
            </button>
          )}
        </div>

        {/* Swap Cameras Button */}
        <div className="w-14 h-14 flex items-center justify-center">
          <button
            type="button"
            onClick={onSwapCameras}
            disabled={isRecording}
            title="Alternar Câmeras"
            className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-40 disabled:pointer-events-none border border-white/10"
          >
            <SwitchCamera className="w-6 h-6" />
          </button>
        </div>
      </div>
    </footer>
  );
};
