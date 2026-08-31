import React, { useState } from 'react';
import { useIptv } from '../../context/IptvContext';
import { Star, Tv, Film, Clapperboard, Play } from 'lucide-react';

export const FavoritesView: React.FC = () => {
  const {
    favorites,
    liveChannels,
    movies,
    seriesList,
    playLiveChannel,
    playMovie,
    setSelectedSeriesForDetails,
    toggleFavorite,
  } = useIptv();

  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'movies' | 'series'>('all');

  const favChannels = liveChannels.filter(c => favorites.live.includes(c.id));
  const favMovies = movies.filter(m => favorites.movies.includes(m.id));
  const favSeries = seriesList.filter(s => favorites.series.includes(s.id));

  const totalFavs = favChannels.length + favMovies.length + favSeries.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-tv-bg overflow-y-auto p-4 md:p-8 scrollbar-thin space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tv-border pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span>Meus Favoritos ({totalFavs})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Acesso rápido aos seus canais, filmes e séries marcados</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-tv-surface p-1 rounded-xl border border-tv-border shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({totalFavs})
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'live' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Canais ({favChannels.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'movies' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filmes ({favMovies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'series' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Séries ({favSeries.length})</span>
          </button>
        </div>
      </div>

      {totalFavs === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-tv-card/30 rounded-2xl border border-tv-border">
          <Star className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Nenhum item favoritado ainda</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Clique na estrela ao lado de qualquer canal, filme ou série para salvá-lo aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Channels */}
          {(activeTab === 'all' || activeTab === 'live') && favChannels.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Tv className="w-4 h-4 text-blue-400" /> Canais Ao Vivo ({favChannels.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {favChannels.map(channel => (
                  <div
                    key={channel.id}
                    onClick={() => playLiveChannel(channel)}
                    className="p-3 bg-tv-surface hover:bg-tv-card border border-tv-border rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-tv-bg rounded-lg p-1 flex items-center justify-center shrink-0">
                        {channel.logo ? (
                          <img src={channel.logo} alt={channel.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Tv className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-300">
                          {channel.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">{channel.category}</span>
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite('live', channel.id);
                      }}
                      className="p-1.5 text-yellow-400 hover:text-slate-400 transition-colors"
                      title="Remover dos favoritos"
                    >
                      <Star className="w-4 h-4 fill-yellow-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Movies */}
          {(activeTab === 'all' || activeTab === 'movies') && favMovies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-blue-400" /> Filmes ({favMovies.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {favMovies.map(movie => (
                  <div
                    key={movie.id}
                    onClick={() => playMovie(movie)}
                    className="group bg-tv-surface border border-tv-border rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all"
                  >
                    <div className="relative aspect-[2/3] w-full bg-tv-card">
                      {movie.poster && (
                        <img src={movie.poster} alt={movie.name} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite('movies', movie.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-yellow-400 rounded-lg"
                      >
                        <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      </button>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h4 className="text-xs font-bold text-white truncate">{movie.title || movie.name}</h4>
                      <span className="text-[10px] text-slate-400">{movie.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Series */}
          {(activeTab === 'all' || activeTab === 'series') && favSeries.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-purple-400" /> Séries ({favSeries.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {favSeries.map(series => (
                  <div
                    key={series.id}
                    onClick={() => setSelectedSeriesForDetails(series)}
                    className="group bg-tv-surface border border-tv-border rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all"
                  >
                    <div className="relative aspect-[2/3] w-full bg-tv-card">
                      {series.poster && (
                        <img src={series.poster} alt={series.name} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite('series', series.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-yellow-400 rounded-lg"
                      >
                        <Star className="w-3.5 h-3.5 fill-yellow-400" />
                      </button>
                    </div>
                    <div className="p-2.5">
                      <h4 className="text-xs font-bold text-white truncate">{series.title || series.name}</h4>
                      <span className="text-[10px] text-purple-400">{series.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
