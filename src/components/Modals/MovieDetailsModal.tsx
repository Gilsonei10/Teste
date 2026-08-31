import React from 'react';
import { useIptv } from '../../context/IptvContext';
import { Play, Star, X, Clock, Calendar, Film } from 'lucide-react';

export const MovieDetailsModal: React.FC = () => {
  const {
    selectedMovieForDetails,
    setSelectedMovieForDetails,
    playMovie,
    toggleFavorite,
    isFavorite,
  } = useIptv();

  if (!selectedMovieForDetails) return null;

  const movie = selectedMovieForDetails;
  const isFav = isFavorite('movies', movie.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-3 md:p-6 select-none overflow-y-auto">
      <div className="bg-tv-surface border border-tv-border rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Backdrop Image Banner */}
        <div className="relative h-48 md:h-72 w-full bg-tv-card overflow-hidden">
          {movie.backdrop || movie.poster ? (
            <img
              src={movie.backdrop || movie.poster}
              alt={movie.title || movie.name}
              className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-blue-950">
              <Film className="w-16 h-16 text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-tv-surface via-tv-surface/60 to-transparent" />

          {/* Close Button */}
          <button
            onClick={() => setSelectedMovieForDetails(null)}
            className="absolute top-4 right-4 p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all focus:ring-2 focus:ring-blue-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details & Actions */}
        <div className="p-6 md:p-8 -mt-16 md:-mt-24 relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Poster Thumbnail */}
            {movie.poster && (
              <img
                src={movie.poster}
                alt={movie.title || movie.name}
                className="w-32 md:w-44 aspect-[2/3] object-cover rounded-2xl shadow-2xl border-2 border-tv-border shrink-0 hidden sm:block"
              />
            )}

            <div className="space-y-3 flex-1">
              {/* Category & Rating */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                  {movie.category}
                </span>
                {movie.rating && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                    {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                  </span>
                )}
                {movie.year && (
                  <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    {movie.year}
                  </span>
                )}
                {movie.duration && (
                  <span className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {movie.duration}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {movie.title || movie.name}
              </h1>

              {/* Genre / Cast */}
              {movie.genre && <p className="text-xs text-blue-300 font-medium">{movie.genre}</p>}

              {/* Synopsis */}
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                {movie.plot || 'Nenhuma sinopse disponível para este título.'}
              </p>

              {/* Cast & Director */}
              {(movie.cast || movie.director) && (
                <div className="text-xs text-slate-400 space-y-1 pt-1">
                  {movie.director && (
                    <p>
                      <strong className="text-slate-300">Direção:</strong> {movie.director}
                    </p>
                  )}
                  {movie.cast && (
                    <p>
                      <strong className="text-slate-300">Elenco:</strong> {movie.cast}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  data-nav="true"
                  autoFocus
                  onClick={() => playMovie(movie)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-blue-600/30 transition-all transform hover:scale-105 focus:ring-4 focus:ring-blue-400"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Assistir Agora</span>
                </button>

                <button
                  data-nav="true"
                  onClick={() => toggleFavorite('movies', movie.id)}
                  className={`p-3.5 rounded-xl border transition-all focus:ring-2 focus:ring-blue-400 ${
                    isFav
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                      : 'bg-tv-card border-tv-border text-slate-300 hover:text-white hover:bg-tv-border'
                  }`}
                  title="Favoritar Filme"
                >
                  <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
