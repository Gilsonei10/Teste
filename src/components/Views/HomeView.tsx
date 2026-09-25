import React, { useState, useEffect } from 'react';
import { useIptv } from '../../context/IptvContext';
import {
  Tv,
  Film,
  Clapperboard,
  Star,
  Server,
  Settings,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    setActiveSection,
    liveChannels,
    movies,
    seriesList,
    favorites,
    activePlaylist,
    setIsConnectModalOpen,
    setIsSettingsModalOpen,
    refreshActivePlaylist,
  } = useIptv();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshActivePlaylist();
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalFavorites =
    (favorites.live?.length || 0) +
    (favorites.movies?.length || 0) +
    (favorites.series?.length || 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-tv-bg via-tv-surface/40 to-tv-bg overflow-y-auto scrollbar-thin select-none p-1.5 sm:p-3 md:p-6 justify-between gap-1 sm:gap-2">
      {/* Top Header / Greeting & Info */}
      <div className="w-full max-w-6xl mx-auto flex flex-row items-center justify-between gap-2 py-1 sm:py-1.5 border-b border-tv-border/40 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 text-left">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <span className="text-[9px] sm:text-xs text-slate-400 font-medium block leading-none mb-0.5">
              Lista Ativa
            </span>
            <span className="text-xs sm:text-sm md:text-base font-bold text-white flex items-center gap-1.5 leading-tight">
              <span className="truncate max-w-[110px] sm:max-w-xs">{activePlaylist?.name || 'Lista Padrão'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                {activePlaylist?.type === 'xtream' ? 'Xtream' : 'M3U'}
              </span>
            </span>
          </div>
        </div>

        {/* Date & Time Widget */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 bg-tv-card/60 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-lg sm:rounded-xl border border-tv-border/50">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
          <div className="text-right">
            <span className="text-xs sm:text-base md:text-lg font-black text-white tracking-wider leading-none block">
              {currentTime}
            </span>
            <span className="text-[8px] sm:text-[10px] text-slate-400 capitalize block leading-tight truncate">
              {currentDate}
            </span>
          </div>
        </div>
      </div>

      {/* Main Center Stage: 3 Hero Cards Side by Side (Horizontal) */}
      <div className="w-full max-w-6xl mx-auto flex flex-col justify-center my-auto py-1 sm:py-2 shrink-0">
        <div className="text-center mb-1.5 sm:mb-2 md:mb-3 shrink-0">
          <h2 className="text-xs sm:text-base md:text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 animate-spin-slow shrink-0" />
            Selecione uma Categoria
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">
            Navegue pelos canais ao vivo, catálogo de filmes ou séries completas
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 w-full">
          {/* Card 1: TV AO VIVO */}
          <button
            data-nav="true"
            onClick={() => setActiveSection('live')}
            className="group relative flex flex-col justify-between p-2 xs:p-2.5 sm:p-3.5 md:p-5 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-b from-blue-950/60 via-tv-card to-blue-950/40 border-2 border-blue-500/40 hover:border-blue-400 active:scale-95 focus:scale-[1.02] transition-all text-left outline-none cursor-pointer h-24 xs:h-28 sm:h-36 md:h-48 min-h-[96px] shrink-0 shadow-lg shadow-blue-950/50"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Tv className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 shrink-0">
                Ao Vivo
              </span>
            </div>

            <div className="relative z-10 w-full mt-auto">
              <h3 className="text-xs xs:text-sm sm:text-base md:text-xl font-black text-white tracking-tight group-hover:text-blue-300 transition-colors leading-tight truncate">
                TV AO VIVO
              </h3>
              <div className="flex items-center justify-between mt-0.5 sm:mt-1 pt-1 border-t border-blue-500/20 w-full">
                <span className="text-[9px] xs:text-[10px] sm:text-xs text-blue-300 font-semibold truncate">
                  {liveChannels.length} canais
                </span>
                {(favorites.live?.length || 0) > 0 && (
                  <span className="text-[8px] xs:text-[9px] text-yellow-400 font-bold flex items-center gap-0.5 shrink-0">
                    ⭐ {favorites.live.length}
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Card 2: FILMES */}
          <button
            data-nav="true"
            onClick={() => setActiveSection('movies')}
            className="group relative flex flex-col justify-between p-2 xs:p-2.5 sm:p-3.5 md:p-5 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-b from-purple-950/60 via-tv-card to-purple-950/40 border-2 border-purple-500/40 hover:border-purple-400 active:scale-95 focus:scale-[1.02] transition-all text-left outline-none cursor-pointer h-24 xs:h-28 sm:h-36 md:h-48 min-h-[96px] shrink-0 shadow-lg shadow-purple-950/50"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Film className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                VOD
              </span>
            </div>

            <div className="relative z-10 w-full mt-auto">
              <h3 className="text-xs xs:text-sm sm:text-base md:text-xl font-black text-white tracking-tight group-hover:text-purple-300 transition-colors leading-tight truncate">
                FILMES
              </h3>
              <div className="flex items-center justify-between mt-0.5 sm:mt-1 pt-1 border-t border-purple-500/20 w-full">
                <span className="text-[9px] xs:text-[10px] sm:text-xs text-purple-300 font-semibold truncate">
                  {movies.length} títulos
                </span>
                {(favorites.movies?.length || 0) > 0 && (
                  <span className="text-[8px] xs:text-[9px] text-yellow-400 font-bold flex items-center gap-0.5 shrink-0">
                    ⭐ {favorites.movies.length}
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Card 3: SÉRIES */}
          <button
            data-nav="true"
            onClick={() => setActiveSection('series')}
            className="group relative flex flex-col justify-between p-2 xs:p-2.5 sm:p-3.5 md:p-5 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-b from-emerald-950/60 via-tv-card to-emerald-950/40 border-2 border-emerald-500/40 hover:border-emerald-400 active:scale-95 focus:scale-[1.02] transition-all text-left outline-none cursor-pointer h-24 xs:h-28 sm:h-36 md:h-48 min-h-[96px] shrink-0 shadow-lg shadow-emerald-950/50"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Clapperboard className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                Séries
              </span>
            </div>

            <div className="relative z-10 w-full mt-auto">
              <h3 className="text-xs xs:text-sm sm:text-base md:text-xl font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors leading-tight truncate">
                SÉRIES
              </h3>
              <div className="flex items-center justify-between mt-0.5 sm:mt-1 pt-1 border-t border-emerald-500/20 w-full">
                <span className="text-[9px] xs:text-[10px] sm:text-xs text-emerald-300 font-semibold truncate">
                  {seriesList.length} séries
                </span>
                {(favorites.series?.length || 0) > 0 && (
                  <span className="text-[8px] xs:text-[9px] text-yellow-400 font-bold flex items-center gap-0.5 shrink-0">
                    ⭐ {favorites.series.length}
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Quick Actions Bar */}
      <div className="w-full max-w-6xl mx-auto pt-1 sm:pt-2 md:pt-3 border-t border-tv-border/40 flex flex-wrap items-center justify-center sm:justify-between gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Favorites Button */}
          <button
            data-nav="true"
            onClick={() => setActiveSection('favorites')}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-tv-card hover:bg-tv-border border border-tv-border rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-yellow-400 group"
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 group-hover:scale-110 transition-transform fill-yellow-400/30" />
            <span>Favoritos</span>
            <span className="px-1.5 py-0.2 bg-yellow-500/20 text-yellow-300 rounded text-[10px] font-bold">
              {totalFavorites}
            </span>
          </button>

          {/* Refresh Playlist */}
          <button
            data-nav="true"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-tv-card hover:bg-tv-border border border-tv-border rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            title="Recarregar catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Switch Playlist */}
          <button
            data-nav="true"
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-tv-card hover:bg-tv-border border border-tv-border rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-blue-400"
          >
            <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span>Trocar Lista</span>
          </button>

          {/* Settings */}
          <button
            data-nav="true"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-tv-card hover:bg-tv-border border border-tv-border rounded-lg sm:rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-blue-400"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <span>Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
};
