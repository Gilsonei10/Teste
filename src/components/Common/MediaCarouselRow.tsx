import React, { useRef } from 'react';
import { MovieItem, SeriesItem } from '../../types/iptv';
import { ChevronLeft, ChevronRight, Play, Star, Clapperboard, Film, ArrowRight } from 'lucide-react';
import { cleanMediaTitle, extractYear } from '../../utils/mediaUtils';

interface MediaCarouselRowProps {
  title: string;
  items: (MovieItem | SeriesItem)[];
  type: 'movie' | 'series';
  onSelectItem: (item: any) => void;
  onViewAll?: () => void;
  isFavorite: (type: 'movies' | 'series', id: string) => boolean;
  toggleFavorite: (type: 'movies' | 'series', id: string) => void;
  themeColor: 'blue' | 'purple';
}

export const MediaCarouselRow: React.FC<MediaCarouselRowProps> = ({
  title,
  items,
  type,
  onSelectItem,
  onViewAll,
  isFavorite,
  toggleFavorite,
  themeColor,
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -700 : 700;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const activeColorBg = themeColor === 'purple' ? 'bg-purple-600' : 'bg-blue-600';
  const activeColorText = themeColor === 'purple' ? 'text-purple-400' : 'text-blue-400';
  const borderColorHover = themeColor === 'purple' ? 'hover:border-purple-500/50' : 'hover:border-blue-500/50';

  return (
    <div className="space-y-3 py-2 group/row">
      {/* Row Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {type === 'series' ? (
            <Clapperboard className={`w-5 h-5 ${activeColorText}`} />
          ) : (
            <Film className={`w-5 h-5 ${activeColorText}`} />
          )}
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {title}
          </h3>
          <span className="text-xs text-slate-400 font-semibold px-2 py-0.5 bg-tv-card rounded-md border border-tv-border">
            {items.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onViewAll && (
            <button
              onClick={onViewAll}
              className={`flex items-center gap-1 text-xs font-bold ${activeColorText} hover:text-white transition-colors`}
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
            <button
              onClick={() => scroll('left')}
              className="p-1.5 bg-tv-card hover:bg-tv-border text-slate-300 hover:text-white rounded-lg border border-tv-border transition-all"
              title="Rolar para esquerda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 bg-tv-card hover:bg-tv-border text-slate-300 hover:text-white rounded-lg border border-tv-border transition-all"
              title="Rolar para direita"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={rowRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map(item => {
          const isFav = isFavorite(type === 'series' ? 'series' : 'movies', item.id);
          const cleanTitle = cleanMediaTitle(item.title || item.name);
          const year = extractYear(item.title || item.name, item.year);

          return (
            <div
              key={item.id}
              data-nav="true"
              tabIndex={0}
              onClick={() => onSelectItem(item)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSelectItem(item);
              }}
              style={{ scrollSnapAlign: 'start' }}
              className={`w-36 sm:w-44 md:w-48 shrink-0 group relative bg-tv-surface hover:bg-tv-card focus:bg-tv-card border border-tv-border ${borderColorHover} focus:ring-2 focus:ring-blue-500 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg outline-none flex flex-col transform hover:-translate-y-1.5 hover:shadow-2xl`}
            >
              {/* Poster Image */}
              <div className="relative aspect-[2/3] w-full bg-tv-card overflow-hidden">
                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={cleanTitle}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                    {type === 'series' ? (
                      <Clapperboard className="w-8 h-8 text-slate-600" />
                    ) : (
                      <Film className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                )}

                {/* Gradient Shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-tv-surface via-transparent to-transparent opacity-80" />

                {/* Favorite Star Button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleFavorite(type === 'series' ? 'series' : 'movies', item.id);
                  }}
                  className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all ${
                    isFav
                      ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30'
                      : 'text-white/80 hover:text-white bg-black/50 hover:bg-black/80'
                  }`}
                  title="Favoritar"
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-yellow-400' : ''}`} />
                </button>

                {/* Rating Badge */}
                {item.rating && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/75 backdrop-blur-md rounded-md text-[10px] font-bold text-yellow-400">
                    <Star className="w-2.5 h-2.5 fill-yellow-400" />
                    <span>{typeof item.rating === 'number' ? item.rating.toFixed(1) : item.rating}</span>
                  </div>
                )}

                {/* Play Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`p-3 ${activeColorBg} text-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform`}>
                    <Play className="w-5 h-5 fill-white" />
                  </div>
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                  {cleanTitle}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  {year ? <span>{year}</span> : <span>{type === 'series' ? 'Série' : 'Filme'}</span>}
                  <span className={`${activeColorText} font-semibold`}>Ver mais</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
