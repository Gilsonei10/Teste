import React from 'react';
import { Camera, Mic, ShieldAlert, RefreshCw } from 'lucide-react';

interface CameraPermissionPromptProps {
  errorMessage: string | null;
  onRetry: () => void;
}

export const CameraPermissionPrompt: React.FC<CameraPermissionPromptProps> = ({
  errorMessage,
  onRetry,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-950 to-black text-center">
      <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6">
        <Camera className="w-10 h-10 text-blue-400" />
      </div>

      <h1 className="text-xl font-bold text-white mb-2">Permissão de Câmera Necessária</h1>

      <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
        Para ativar a câmera frontal e traseira simultaneamente para fotos e vídeos, autorize o
        acesso à câmera e ao microfone no seu aparelho.
      </p>

      <div className="flex items-center gap-4 mb-8 text-xs text-gray-300 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
        <div className="flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span>Vídeo Frontal & Traseira</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <div className="flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-emerald-400" />
          <span>Áudio</span>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg mb-6 max-w-xs text-left">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm px-6 py-3 rounded-full shadow-lg shadow-blue-500/25 transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Permitir e Iniciar Câmeras
      </button>
    </div>
  );
};
