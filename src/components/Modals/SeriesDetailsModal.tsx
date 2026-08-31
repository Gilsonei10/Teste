import React, { useState, useEffect } from 'react';
import { useIptv } from '../../context/IptvContext';
import { SeasonItem, EpisodeItem } from '../../types/iptv';
import { Play, Star, X, Calendar, Clapperboard, Layers } from 'lucide-react';

export const SeriesDetailsModal: React.FC = () => {
  const {
    selectedSeriesForDetails,
    setSelectedSeriesForDetails,
    fetchSeriesDetails,
    playEpisode,
    toggleFavorite,
    isFavorite,
  } = useIptv();

  const [activeSeasonIndex, setActiveSeasonIndex] = useState<number>(0);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  useEffect(() => {
    if (selectedSeriesForDetails && (!selectedSeriesForDetails.seasons || selectedSeriesForDetails.seasons.length === 0)) {
      setIsLoadingDetails(true);
      fetchSeriesDetails(selectedSeriesForDetails.id).finally(() => {
        setIsLoadingDetails(false);
      });
    }
  }, [selectedSeriesForDetails, fetchSeriesDetails]);

  if (!selectedSeriesForDetails) return null;

  const series = selectedSeriesForDetails;
  const isFav = isFavorite('series', series.id);
  const seasons: SeasonItem[] = series.seasons || [];
  const currentSeason = seasons[activeSeasonIndex] || seasons[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-3 md:p-6 select-none overflow-y-auto">
      <div className="bg-tv-surface border border-tv-border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Backdrop Image Banner */}
        <div className="relative h-44 md:h-64 w-full bg-tv-card overflow-hidden">
          {series.backdrop || series.poster ? (
            <img
              src={series.backdrop || series.poster}
              alt={series.title || series.name}
              className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-blue-950">
              <Clapperboard className="w-16 h-16 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-tv-surface via-tv-surface/60 to-transparent" />

          {/* Close Button */}
          <button
            onClick={() => setSelectedSeriesForDetails(null)}
            className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all focus:ring-2 focus:ring-blue-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Section */}
        <div className="p-6 md:p-8 -mt-16 md:-mt-20 relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster Thumbnail */}
            {series.poster && (
              <img
                src={series.poster}
                alt={series.title || series.name}
                className="w-28 md:w-36 aspect-[2/3] object-cover rounded-2xl shadow-2xl border-2 border-tv-border shrink-0 hidden sm:block"
              />
            )}

            <div className="space-y-3 flex-1">
              {/* Category & Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                  {series.category}
                </span>
                {series.rating && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                    {typeof series.rating === 'number' ? series.rating.toFixed(1) : series.rating}
                  </span>
                )}
                {series.year && (
                  <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    {series.year}
                  </span>
                )}
              </div>

              {/* Title & Plot */}
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {series.title || series.name}
                </h1>
                <button
                  data-nav="true"
                  onClick={() => toggleFavorite('series', series.id)}
                  className={`p-3 rounded-xl border transition-all focus:ring-2 focus:ring-blue-400 shrink-0 ${
                    isFav
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                      : 'bg-tv-card border-tv-border text-slate-300 hover:text-white hover:bg-tv-border'
                  }`}
                  title="Favoritar Série"
                >
                  <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-400' : ''}`} />
                </button>
              </div>

              {series.genre && <p className="text-xs text-purple-300 font-medium">{series.genre}</p>}

              <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                {series.plot || 'Nenhuma sinopse disponível para esta série.'}
              </p>
            </div>
          </div>

          {/* Seasons & Episodes Selector */}
          <div className="space-y-4 pt-2 border-t border-tv-border">
            {/* Season Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1.5 shrink-0">
                <Layers className="w-4 h-4 text-blue-400" /> Temporadas:
              </span>
              {seasons.length > 0 ? (
                seasons.map((season, idx) => (
                  <button
                    key={season.seasonNumber}
                    data-nav="true"
                    onClick={() => setActiveSeasonIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all outline-none ${
                      activeSeasonIndex === idx
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-tv-card hover:bg-tv-border text-slate-300 hover:text-white'
                    }`}
                  >
                    {season.name || `Temporada ${season.seasonNumber}`} ({season.episodes.length})
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400">Nenhuma temporada listada.</span>
              )}
            </div>

            {/* Episode List */}
            {isLoadingDetails ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Carregando episódios da série...</span>
              </div>
            ) : currentSeason && currentSeason.episodes && currentSeason.episodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {currentSeason.episodes.map((episode: EpisodeItem) => (
                  <div
                    key={episode.id}
                    className="p-3 bg-tv-card/80 hover:bg-tv-card border border-tv-border hover:border-blue-500/40 rounded-2xl flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnail with Play Hover */}
                      <div className="relative w-20 h-14 bg-tv-surface rounded-xl overflow-hidden shrink-0 border border-tv-border">
                        {episode.thumbnail || series.poster ? (
                          <img
                            src={episode.thumbnail || series.poster}
                            alt={episode.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Clapperboard className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <span className="text-[11px] text-blue-400 font-bold block">
                          Episódio {episode.episodeNum}
                        </span>
                        <h4 className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                          {episode.title}
                        </h4>
                        {episode.duration && (
                          <span className="text-[10px] text-slate-400">{episode.duration}</span>
                        )}
                      </div>
                    </div>

                    <button
                      data-nav="true"
                      onClick={() => playEpisode(episode, series)}
                      className="p-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all shrink-0"
                      title="Assistir Episódio"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Nenhum episódio encontrado para esta temporada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
