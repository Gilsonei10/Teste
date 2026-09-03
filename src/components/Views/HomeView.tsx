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
  ChevronRight,
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
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-tv-bg via-tv-surface/40 to-tv-bg overflow-y-auto scrollbar-thin select-none p-4 md:p-8 justify-between">
      {/* Top Header / Greeting & Info */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-b border-tv-border/40 shrink-0">
        <div className="flex items-center gap-3 text-left">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Lista Ativa
            </span>
            <span className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              {activePlaylist?.name || 'Lista Padrão'}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {activePlaylist?.type === 'xtream' ? 'Xtream API' : 'M3U'}
              </span>
            </span>
          </div>
        </div>

        {/* Date & Time Widget */}
        <div className="flex items-center gap-3 bg-tv-card/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-tv-border/50">
          <Clock className="w-5 h-5 text-blue-400" />
          <div className="text-right">
            <span className="text-lg md:text-xl font-black text-white tracking-wider leading-none block">
              {currentTime}
            </span>
            <span className="text-[11px] text-slate-400 capitalize block leading-tight">
              {currentDate}
            </span>
          </div>
        </div>
      </div>

      {/* Main Center Stage: 3 Hero Cards Side by Side */}
      <div className="max-w-6xl w-full mx-auto my-auto py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin-slow" />
            Selecione uma Categoria
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Navegue pelos canais ao vivo, catálogo de filmes ou séries completas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
          {/* Card 1: TV AO VIVO */}
          <button
            data-nav="true"
            onClick={() => setActiveSection('live')}
            className="group relative flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-gradient-to-b from-blue-950/40 via-tv-card/90 to-blue-950/20 border-2 border-blue-500/30 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 focus:border-blue-400 focus:shadow-2xl focus:shadow-blue-500/30 focus:scale-[1.02] hover:scale-[1.02] transition-all duration-300 text-left overflow-hidden outline-none"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/35 transition-all duration-500" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">
                  <Tv className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Ao Vivo
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight group-hover:text-blue-300 transition-colors">
                TV AO VIVO
              </h3>
              <p className="text-xs md:text-sm text-slate-300 mt-2 font-medium leading-relaxed">
                Transmissão em tempo real de esportes, notícias, entretenimento e canais abertos.
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-4 border-t border-blue-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                  Disponíveis
                </span>
                <span className="text-lg md:text-xl font-extrabold text-blue-400">
                  {liveChannels.length} canais
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Card 2: FILMES */}
          <button
            data-nav="true"
            onClick={() => setActiveSection('movies')}
            className="group relative flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-gradient-to-b from-purple-950/40 via-tv-card/90 to-purple-950/20 border-2 border-purple-500/30 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 focus:border-purple-400 focus:shadow-2xl focus:shadow-purple-500/30 focus:scale-[1.02] hover:scale-[1.02] transition-all duration-300 text-left overflow-hidden outline-none"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/35 transition-all duration-500" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">
                  <Film className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  VOD
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight group-hover:text-purple-300 transition-colors">
                FILMES
              </h3>
              <p className="text-xs md:text-sm text-slate-300 mt-2 font-medium leading-relaxed">
                Catálogo completo de filmes, lançamentos do cinema, ação, comédia e clássicos.
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-4 border-t border-purple-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                  Disponíveis
                </span>
                <span className="text-lg md:text-xl font-extrabold text-purple-400">
                  {movies.length} títulos
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Card 3: SÉRIES */}
          <button
            data-nav="true"
            onClick={() => setActiveSection('series')}
            className="group relative flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-tv-card/90 to-emerald-950/20 border-2 border-emerald-500/30 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20 focus:border-emerald-400 focus:shadow-2xl focus:shadow-emerald-500/30 focus:scale-[1.02] hover:scale-[1.02] transition-all duration-300 text-left overflow-hidden outline-none"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/35 transition-all duration-500" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-focus:scale-110 transition-transform duration-300">
                  <Clapperboard className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Séries
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                SÉRIES
              </h3>
              <p className="text-xs md:text-sm text-slate-300 mt-2 font-medium leading-relaxed">
                Temporadas completas, episódios atualizados e maratonas das melhores séries.
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-4 border-t border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                  Disponíveis
                </span>
                <span className="text-lg md:text-xl font-extrabold text-emerald-400">
                  {seriesList.length} séries
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Quick Actions Bar */}
      <div className="max-w-6xl w-full mx-auto pt-4 border-t border-tv-border/40 flex flex-wrap items-center justify-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Favorites Button */}
          <button
            data-nav="true"
            onClick={() => setActiveSection('favorites')}
            className="flex items-center gap-2 px-4 py-2 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-xs md:text-sm font-semibold text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-yellow-400 group"
          >
            <Star className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform fill-yellow-400/30" />
            <span>Favoritos</span>
            <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-md text-[11px] font-bold">
              {totalFavorites}
            </span>
          </button>

          {/* Refresh Playlist */}
          <button
            data-nav="true"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-xs md:text-sm font-semibold text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            title="Recarregar catálogo"
          >
            <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch Playlist */}
          <button
            data-nav="true"
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-xs md:text-sm font-semibold text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-blue-400"
          >
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Trocar Lista</span>
          </button>

          {/* Settings */}
          <button
            data-nav="true"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-xs md:text-sm font-semibold text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-blue-400"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Configurações</span>
          </button>
        </div>
      </div>
    </div>
  );
};
