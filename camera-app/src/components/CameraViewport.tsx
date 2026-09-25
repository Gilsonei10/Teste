import React, { useEffect } from 'react';
import { RefreshCw, Camera } from 'lucide-react';
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
          <div className="relative flex-1 w-full bg-black overflow-hidden">
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/60 p-4 text-center">
                <Camera className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-xs text-gray-400">
                  Câmera secundária indisponível simultaneamente neste dispositivo.
                </p>
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
          <div className="relative flex-1 h-full bg-black overflow-hidden">
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/60 p-4 text-center">
                <Camera className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-xs text-gray-400">
                  Câmera secundária em espera.
                </p>
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
          {secondaryStream && isSimultaneousSupported && (
            <div
              onClick={onSwap}
              role="button"
              tabIndex={0}
              title="Toque para alternar câmeras"
              className="absolute top-16 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/90 shadow-2xl z-20 cursor-pointer active:scale-95 transition-transform group bg-black"
            >
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
              <div className="absolute bottom-1.5 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-medium text-white uppercase">
                {isSecondaryFront ? 'Frontal' : 'Traseira'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
