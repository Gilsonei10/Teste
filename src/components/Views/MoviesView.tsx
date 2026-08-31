import React, { useMemo } from 'react';
import { useIptv } from '../../context/IptvContext';
import { MovieItem } from '../../types/iptv';
import { Film, Star, Play, Info, Filter, Calendar } from 'lucide-react';

export const MoviesView: React.FC = () => {
  const {
    movieCategories,
    movies,
    selectedMovieCategoryId,
    setSelectedMovieCategoryId,
    searchQuery,
    playMovie,
    setSelectedMovieForDetails,
    toggleFavorite,
    isFavorite,
    setIsConnectModalOpen,
  } = useIptv();

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      const matchesCategory =
        selectedMovieCategoryId === 'all' ||
        movie.categoryId === selectedMovieCategoryId ||
        movie.category === selectedMovieCategoryId;

      const matchesSearch =
        !searchQuery ||
        movie.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (movie.plot && movie.plot.toLowerCase().includes(searchQuery.toLowerCase())) ||
        movie.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [movies, selectedMovieCategoryId, searchQuery]);

  // Featured Movie for Hero Banner
  const featuredMovie = movies.length > 0 ? movies[0] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-tv-bg overflow-y-auto scrollbar-thin">
      {/* Featured Hero Banner (if movies available) */}
      {featuredMovie && !searchQuery && selectedMovieCategoryId === 'all' && (
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-tv-card overflow-hidden shrink-0">
          <img
            src={featuredMovie.backdrop || featuredMovie.poster}
            alt={featuredMovie.title || featuredMovie.name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-tv-bg via-tv-bg/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-tv-bg via-tv-bg/40 to-transparent" />

          {/* Banner Content */}
          <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl space-y-3 z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-600 text-white text-[11px] font-bold uppercase rounded-lg tracking-wider">
                Em Destaque
              </span>
              <span className="text-xs text-slate-300 font-semibold">{featuredMovie.category}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {featuredMovie.title || featuredMovie.name}
            </h2>

            {featuredMovie.plot && (
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {featuredMovie.plot}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                data-nav="true"
                onClick={() => playMovie(featuredMovie)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl shadow-blue-600/30 transition-all transform hover:scale-105 focus:ring-4 focus:ring-blue-400"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Assistir Agora</span>
              </button>

              <button
                data-nav="true"
                onClick={() => setSelectedMovieForDetails(featuredMovie)}
                className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs sm:text-sm rounded-xl transition-all focus:ring-2 focus:ring-blue-400"
              >
                <Info className="w-4 h-4" />
                <span>Mais Informações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Movies Catalog */}
      <div className="p-4 md:p-8 space-y-6">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mr-2 shrink-0">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Gêneros:</span>
          </div>

          <button
            data-nav="true"
            onClick={() => setSelectedMovieCategoryId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all outline-none ${
              selectedMovieCategoryId === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'bg-tv-card hover:bg-tv-border text-slate-300 hover:text-white'
            }`}
          >
            Todos ({movies.length})
          </button>

          {movieCategories.map(cat => {
            const isSelected = selectedMovieCategoryId === cat.id || selectedMovieCategoryId === cat.name;
            return (
              <button
                key={cat.id}
                data-nav="true"
                onClick={() => setSelectedMovieCategoryId(cat.id || cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all outline-none ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'bg-tv-card hover:bg-tv-border text-slate-300 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
            <Film className="w-5 h-5 text-blue-500" />
            <span>Catálogo de Filmes ({filteredMovies.length})</span>
          </h3>
        </div>

        {/* Movies Grid */}
        {filteredMovies.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-tv-card/30 rounded-2xl border border-tv-border">
            <Film className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Nenhum filme encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {movies.length === 0
                ? 'Nenhum filme carregado nesta lista IPTV.'
                : 'Nenhum filme corresponde aos filtros atuais.'}
            </p>
            {movies.length === 0 && (
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                Conectar Lista IPTV
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
            {filteredMovies.map((movie: MovieItem) => {
              const isFav = isFavorite('movies', movie.id);
              return (
                <div
                  key={movie.id}
                  data-nav="true"
                  tabIndex={0}
                  onClick={() => setSelectedMovieForDetails(movie)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') setSelectedMovieForDetails(movie);
                  }}
                  className="group relative bg-tv-surface hover:bg-tv-card focus:bg-tv-card border border-tv-border hover:border-blue-500/50 focus:ring-2 focus:ring-blue-500 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg outline-none flex flex-col transform hover:-translate-y-1 hover:shadow-2xl"
                >
                  {/* Poster Image */}
                  <div className="relative aspect-[2/3] w-full bg-tv-card overflow-hidden">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title || movie.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950">
                        <Film className="w-10 h-10 text-slate-600" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-tv-surface via-transparent to-transparent opacity-80" />

                    {/* Favorite Button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite('movies', movie.id);
                      }}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-all ${
                        isFav
                          ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30'
                          : 'text-white/80 hover:text-white bg-black/50 hover:bg-black/80'
                      }`}
                      title="Favoritar"
                    >
                      <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-yellow-400' : ''}`} />
                    </button>

                    {/* Rating Badge */}
                    {movie.rating && (
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[11px] font-bold text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        <span>{typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}</span>
                      </div>
                    )}

                    {/* Play Hover Icon */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-3.5 bg-blue-600 text-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 fill-white" />
                      </div>
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block truncate">
                        {movie.category}
                      </span>
                      <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1 mt-0.5">
                        {movie.title || movie.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      {movie.year ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {movie.year}
                        </span>
                      ) : (
                        <span>Filme VOD</span>
                      )}
                      <span className="text-blue-400 font-semibold">Detalhes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
