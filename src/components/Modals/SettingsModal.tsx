import React from 'react';
import { useIptv } from '../../context/IptvContext';
import { Settings, X, ShieldCheck, Tv, Film, LogOut, Info } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settings,
    updateSettings,
    disconnectPlaylist,
    activePlaylist,
  } = useIptv();

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-tv-surface border border-tv-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-tv-border flex items-center justify-between bg-tv-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configurações do Player</h2>
              <p className="text-xs text-slate-400">Ajustes de reprodução, rede e interface</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-tv-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* CORS Proxy Section */}
          <div className="p-4 bg-tv-card rounded-xl border border-tv-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="font-semibold text-sm text-white block">Proxy Reverso / CORS</span>
                  <span className="text-xs text-slate-400">Resolve bloqueios de CORS em streams web</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useCorsProxy}
                  onChange={e => updateSettings({ useCorsProxy: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.useCorsProxy && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL do Proxy CORS</label>
                <input
                  type="text"
                  value={settings.corsProxyUrl}
                  onChange={e => updateSettings({ corsProxyUrl: e.target.value })}
                  className="w-full bg-tv-bg border border-tv-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* TV Mode Section */}
          <div className="p-4 bg-tv-card rounded-xl border border-tv-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Tv className="w-5 h-5 text-blue-400" />
              <div>
                <span className="font-semibold text-sm text-white block">Modo Smart TV</span>
                <span className="text-xs text-slate-400">Aumenta botões e textos para visualização à distância</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.tvMode}
                onChange={e => updateSettings({ tvMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Buffer Length Section */}
          <div className="p-4 bg-tv-card rounded-xl border border-tv-border space-y-2">
            <div className="flex items-center gap-2.5 mb-1">
              <Film className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-sm text-white">Tamanho do Buffer de Vídeo</span>
            </div>
            <select
              value={settings.bufferLengthSeconds}
              onChange={e => updateSettings({ bufferLengthSeconds: parseInt(e.target.value, 10) })}
              className="w-full bg-tv-bg border border-tv-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value={15}>15 segundos (Menor latência ao vivo)</option>
              <option value={30}>30 segundos (Recomendado / Padrão)</option>
              <option value={60}>60 segundos (Conexões lentas ou instáveis)</option>
            </select>
          </div>

          {/* Info Card */}
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-blue-300 text-xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Em Smart TVs (LG webOS, Samsung Tizen, Android TV), use as <strong>setas do controle remoto</strong> e <strong>Enter/OK</strong> para navegar fluidamente pela interface.
            </p>
          </div>

          {/* Disconnect Playlist */}
          {activePlaylist && (
            <div className="pt-2">
              <button
                onClick={() => {
                  disconnectPlaylist();
                  setIsSettingsModalOpen(false);
                }}
                className="w-full py-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Desconectar Lista Ativa ({activePlaylist.name})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
