import React, { useEffect } from 'react';
import { RefreshCw, Camera, Sparkles, SwitchCamera } from 'lucide-react';
import type { LayoutMode } from '../types/camera';

interface CameraViewportProps {
  primaryVideoRef: React.RefObject<HTMLVideoElement | null>;
  secondaryVideoRef: React.RefObject<HTMLVideoElement | null>;
  primaryStream: MediaStream | null;
  secondaryStream: MediaStream | null;
  primaryFacing: 'user' | 'environment';
  layoutMode: LayoutMode;
  isSimultaneousSupported: boolean;
  isFlashing: boolean;
  isCapturingDual?: boolean;
  dualCaptureStatus?: string | null;
  onSwap: () => void;
}

export const CameraViewport: React.FC<CameraViewportProps> = ({
  primaryVideoRef,
  secondaryVideoRef,
  primaryStream,
  secondaryStream,
  primaryFacing,
  layoutMode,
  isSimultaneousSupported,
  isFlashing,
  isCapturingDual = false,
  dualCaptureStatus = null,
  onSwap,
}) => {
  // Bind primary stream to primary video element
  useEffect(() => {
    if (primaryVideoRef.current && primaryStream) {
      primaryVideoRef.current.srcObject = primaryStream;
    }
  }, [primaryStream, primaryVideoRef]);

  // Bind secondary stream to secondary video element
  useEffect(() => {
    if (secondaryVideoRef.current && secondaryStream) {
      secondaryVideoRef.current.srcObject = secondaryStream;
    }
  }, [secondaryStream, secondaryVideoRef]);

  const isPrimaryFront = primaryFacing === 'user';
  const isSecondaryFront = !isPrimaryFront;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Visual Shutter Flash Overlay */}
      {isFlashing && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-150" />
      )}

      {/* Dual Photo Capture Progress Overlay (BeReal mode) */}
      {isCapturingDual && (
        <div className="absolute inset-0 bg-black/75 z-40 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
          <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-full font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{dualCaptureStatus || 'Capturando Foto Dupla...'}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Segure firme para unir as duas câmeras</p>
        </div>
      )}

      {/* RENDER MODE: SPLIT VERTICAL */}
      {layoutMode === 'split-v' && (
        <div className="w-full h-full flex flex-col">
          {/* Top Video Feed */}
          <div className="relative flex-1 w-full bg-black overflow-hidden border-b-2 border-white/20">
            <video
              ref={primaryVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isPrimaryFront ? '-scale-x-100' : ''}`}
            />
            <div className="absolute top-16 left-4 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider text-white uppercase border border-white/10">
              {isPrimaryFront ? 'Frontal' : 'Traseira'}
            </div>
          </div>

          {/* Bottom Video Feed */}
          <div className="relative flex-1 w-full bg-gray-950 overflow-hidden flex flex-col items-center justify-center">
            {secondaryStream && isSimultaneousSupported ? (
              <>
                <video
                  ref={secondaryVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isSecondaryFront ? '-scale-x-100' : ''}`}
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider text-white uppercase border border-white/10">
                  {isSecondaryFront ? 'Frontal' : 'Traseira'}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-gray-950 to-black">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3">
                  <Camera className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Câmera {isSecondaryFront ? 'Frontal' : 'Traseira'}
                </h3>
                <p className="text-xs text-gray-400 max-w-xs mb-4">
                  Captura automática combinada: ao bater a foto, as duas câmeras são salvas juntas.
                </p>
                <button
                  type="button"
                  onClick={onSwap}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/20 transition-all"
                >
                  <SwitchCamera className="w-4 h-4 text-blue-400" />
                  Alternar Visor para {isSecondaryFront ? 'Frontal' : 'Traseira'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER MODE: SPLIT HORIZONTAL */}
      {layoutMode === 'split-h' && (
        <div className="w-full h-full flex flex-row">
          {/* Left Video Feed */}
          <div className="relative flex-1 h-full bg-black overflow-hidden border-r-2 border-white/20">
            <video
              ref={primaryVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isPrimaryFront ? '-scale-x-100' : ''}`}
            />
            <div className="absolute top-16 left-4 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider text-white uppercase border border-white/10">
              {isPrimaryFront ? 'Frontal' : 'Traseira'}
            </div>
          </div>

          {/* Right Video Feed */}
          <div className="relative flex-1 h-full bg-gray-950 overflow-hidden flex flex-col items-center justify-center">
            {secondaryStream && isSimultaneousSupported ? (
              <>
                <video
                  ref={secondaryVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isSecondaryFront ? '-scale-x-100' : ''}`}
                />
                <div className="absolute top-16 left-4 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider text-white uppercase border border-white/10">
                  {isSecondaryFront ? 'Frontal' : 'Traseira'}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-black/90">
                <Camera className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-xs text-gray-300 font-medium mb-3">
                  {isSecondaryFront ? 'Frontal' : 'Traseira'}
                </p>
                <button
                  type="button"
                  onClick={onSwap}
                  className="p-2 rounded-full bg-white/20 text-white active:scale-95"
                  title="Alternar Câmera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER MODE: PICTURE-IN-PICTURE (PIP) */}
      {layoutMode === 'pip' && (
        <div className="relative w-full h-full">
          {/* Full Screen Main Video Feed */}
          <video
            ref={primaryVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isPrimaryFront ? '-scale-x-100' : ''}`}
          />

          <div className="absolute top-16 left-4 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider text-white uppercase border border-white/10 pointer-events-none">
            {isPrimaryFront ? 'Principal: Frontal' : 'Principal: Traseira'}
          </div>

          {/* Floating Picture-in-Picture Window */}
          <div
            onClick={onSwap}
            role="button"
            tabIndex={0}
            title="Toque para alternar câmeras"
            className="absolute top-16 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/90 shadow-2xl z-20 cursor-pointer active:scale-95 transition-transform group bg-black/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            {secondaryStream && isSimultaneousSupported ? (
              <>
                <video
                  ref={secondaryVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isSecondaryFront ? '-scale-x-100' : ''}`}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <RefreshCw className="w-5 h-5 text-white drop-shadow-md" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gray-900/90 group-hover:bg-gray-800 transition-colors">
                <SwitchCamera className="w-6 h-6 text-blue-400 mb-1.5 animate-pulse" />
                <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
                  {isSecondaryFront ? 'Frontal' : 'Traseira'}
                </span>
                <span className="text-[9px] text-gray-400 mt-1">Toque p/ alternar</span>
              </div>
            )}

            <div className="absolute bottom-1.5 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-medium text-white uppercase pointer-events-none">
              {isSecondaryFront ? 'Frontal' : 'Traseira'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
