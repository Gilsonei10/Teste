import React from 'react';
import { X, Download, Share2, Trash2, Calendar, Film, Image as ImageIcon } from 'lucide-react';
import type { CapturedMedia } from '../types/camera';

interface MediaPreviewModalProps {
  media: CapturedMedia | null;
  mediaList: CapturedMedia[];
  onClose: () => void;
  onSelectMedia: (item: CapturedMedia) => void;
  onDeleteMedia: (id: string) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  media,
  mediaList,
  onClose,
  onSelectMedia,
  onDeleteMedia,
}) => {
  if (!media) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = media.url;
    const extension = media.type === 'photo' ? 'jpg' : 'webm';
    a.download = `dual_cam_${media.id}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share && navigator.canShare) {
      try {
        const extension = media.type === 'photo' ? 'jpg' : 'webm';
        const file = new File([media.blob], `dual_cam_${media.id}.${extension}`, {
          type: media.blob.type,
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Captura Dual Camera',
            text: 'Foto/Vídeo gravado com ambas as câmeras no Dual Camera!',
          });
          return;
        }
      } catch (err) {
        console.warn('Erro ao compartilhar via Web Share:', err);
      }
    }
    // Fallback to download if sharing not supported by browser
    handleDownload();
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col backdrop-blur-xl animate-in fade-in duration-200">
      {/* Header with actions */}
      <header className="safe-top flex items-center justify-between px-4 py-3 bg-black/50 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-gray-300">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>{formatTimestamp(media.timestamp)}</span>
          {media.duration && (
            <span className="ml-2 bg-white/10 px-2 py-0.5 rounded text-[11px] font-mono">
              {media.duration}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            title="Compartilhar"
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Baixar Arquivo"
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 active:scale-95 transition-all"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteMedia(media.id)}
            title="Excluir"
            className="p-2 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/30 active:scale-95 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Preview Area */}
      <div className="flex-1 relative flex items-center justify-center p-2 overflow-hidden">
        {media.type === 'photo' ? (
          <img
            src={media.url}
            alt="Captura"
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <video
            src={media.url}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-lg shadow-2xl"
          />
        )}
      </div>

      {/* Bottom Thumbnail Gallery Strip */}
      {mediaList.length > 1 && (
        <div className="safe-bottom p-3 bg-black/60 border-t border-white/10 overflow-x-auto flex items-center gap-3">
          {mediaList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMedia(item)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                item.id === media.id ? 'border-blue-500 scale-105' : 'border-white/20 opacity-60'
              }`}
            >
              {item.type === 'photo' ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Film className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-0.5 right-0.5 bg-black/70 p-0.5 rounded text-[8px]">
                {item.type === 'photo' ? (
                  <ImageIcon className="w-2.5 h-2.5 text-white" />
                ) : (
                  <Film className="w-2.5 h-2.5 text-blue-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
