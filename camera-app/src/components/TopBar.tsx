import React from 'react';
import { LayoutGrid, RectangleVertical, RectangleHorizontal, Video, Sparkles } from 'lucide-react';
import type { LayoutMode } from '../types/camera';

interface TopBarProps {
  layoutMode: LayoutMode;
  onSelectLayout: (mode: LayoutMode) => void;
  isRecording: boolean;
  recordingDuration: number;
  isSimultaneousSupported: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  layoutMode,
  onSelectLayout,
  isRecording,
  recordingDuration,
  isSimultaneousSupported,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="safe-top absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
      {/* App branding & status badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold tracking-wide text-white">DUAL CAM</span>
        </div>

        {isSimultaneousSupported ? (
          <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            2 Câmeras Ativas
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Dual Cam Ativa
          </span>
        )}
      </div>

      {/* Recording Duration Indicator */}
      {isRecording && (
        <div className="flex items-center gap-1.5 bg-red-600/90 text-white px-3 py-1 rounded-full shadow-lg shadow-red-500/30 animate-pulse font-mono text-xs font-bold">
          <Video className="w-3.5 h-3.5" />
          <span>{formatDuration(recordingDuration)}</span>
        </div>
      )}

      {/* Layout Mode Selector */}
      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10">
        <button
          type="button"
          onClick={() => onSelectLayout('pip')}
          title="Picture in Picture"
          className={`p-1.5 rounded-full transition-all ${
            layoutMode === 'pip'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelectLayout('split-v')}
          title="Divisão Vertical"
          className={`p-1.5 rounded-full transition-all ${
            layoutMode === 'split-v'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <RectangleVertical className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onSelectLayout('split-h')}
          title="Divisão Horizontal"
          className={`p-1.5 rounded-full transition-all ${
            layoutMode === 'split-h'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <RectangleHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
