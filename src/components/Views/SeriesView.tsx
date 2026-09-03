import React, { useState, useMemo } from 'react';
import { useIptv } from '../../context/IptvContext';
import { SeriesItem } from '../../types/iptv';
import { Clapperboard, Star, Layers, Calendar } from 'lucide-react';
import { CatalogControls } from '../Common/CatalogControls';
import { MediaCarouselRow } from '../Common/MediaCarouselRow';
import {
  SortOption,
  sortMediaItems,
  sortCategories,
  cleanMediaTitle,
  cleanCategoryName,
  extractYear,
} from '../../utils/mediaUtils';

export const SeriesView: React.FC = () => {
  const {
    seriesCategories,
    seriesList,
    selectedSeriesCategoryId,
    setSelectedSeriesCategoryId,
    searchQuery,
    setSelectedSeriesForDetails,
    toggleFavorite,
    isFavorite,
    setIsConnectModalOpen,
  } = useIptv();

  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'showcase' | 'grid'>('showcase');
  const [displayLimit, setDisplayLimit] = useState<number>(48);

  const handleSelectSeries = (series: SeriesItem) => {
    setSelectedSeriesForDetails(series);
  };

  // Categorias ordenadas e organizadas
  const sortedCategories = useMemo(() => {
    return sortCategories(seriesCategories);
  }, [seriesCategories]);

  // Séries filtradas e ordenadas
  const filteredSeries = useMemo(() => {
    const list = seriesList.filter(series => {
      const matchesCategory =
        selectedSeriesCategoryId === 'all' ||
        series.categoryId === selectedSeriesCategoryId ||
        series.category === selectedSeriesCategoryId;

      const matchesSearch =
        !searchQuery ||
        series.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (series.plot && series.plot.toLowerCase().includes(searchQuery.toLowerCase())) ||
        series.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    return sortMediaItems(list, sortBy);
  }, [seriesList, selectedSeriesCategoryId, searchQuery, sortBy]);

  // Seções por categoria para o modo Vitrine
  const showcaseSections = useMemo(() => {
    if (selectedSeriesCategoryId !== 'all' || searchQuery) return [];

    const sections: { categoryId: string; title: string; items: SeriesItem[] }[] = [];

    // 1. Destaques / Melhores Séries
    const topRated = sortMediaItems(seriesList, 'rating').slice(0, 20);
    if (topRated.length > 0) {
      sections.push({ categoryId: 'all', title: '⭐ Séries Mais Bem Avaliadas', items: topRated });
    }

    // 2. Trilhas por categoria de streaming/gênero
    sortedCategories.forEach(cat => {
      const catSeries = seriesList.filter(
        s => s.categoryId === cat.id || s.category === cat.id || s.category === cat.name
      );
      if (catSeries.length > 0) {
        sections.push({
          categoryId: cat.id || cat.name,
          title: cleanCategoryName(cat.name),
          items: sortMediaItems(catSeries, sortBy).slice(0, 24),
        });
      }
    });

    return sections;
  }, [seriesList, sortedCategories, selectedSeriesCategoryId, searchQuery, sortBy]);

  // Destaque do banner principal
  const featuredSeries = seriesList.length > 0 ? seriesList[0] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-tv-bg overflow-y-auto scrollbar-thin">
      {/* Featured Hero Banner */}
      {featuredSeries && !searchQuery && selectedSeriesCategoryId === 'all' && (
        <div className="relative h-64 sm:h-80 md:h-96 w-full bg-tv-card overflow-hidden shrink-0">
          <img
            src={featuredSeries.backdrop || featuredSeries.poster}
            alt={cleanMediaTitle(featuredSeries.title || featuredSeries.name)}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-tv-bg via-tv-bg/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-tv-bg via-tv-bg/40 to-transparent" />

          {/* Banner Content */}
          <div className="absolute bottom-0 left-0 p-6 md:p-10 max-w-2xl space-y-3 z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-600 text-white text-[11px] font-bold uppercase rounded-lg tracking-wider">
                Série em Destaque
              </span>
              <span className="text-xs text-slate-300 font-semibold">
                {cleanCategoryName(featuredSeries.category)}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {cleanMediaTitle(featuredSeries.title || featuredSeries.name)}
            </h2>

            {featuredSeries.plot && (
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {featuredSeries.plot}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                data-nav="true"
                onClick={() => setSelectedSeriesForDetails(featuredSeries)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl shadow-purple-600/30 transition-all transform hover:scale-105 focus:ring-4 focus:ring-purple-400"
              >
                <Layers className="w-4 h-4" />
                <span>Ver Temporadas & Episódios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Series Catalog */}
      <div className="p-4 md:p-8 space-y-6">
        {/* Controls: Categories, Sorting, View Mode */}
        <CatalogControls
          categories={sortedCategories}
          selectedCategoryId={selectedSeriesCategoryId}
          onSelectCategory={setSelectedSeriesCategoryId}
          totalItemsCount={seriesList.length}
          filteredCount={filteredSeries.length}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          themeColor="purple"
        />

        {/* Catalog Body */}
        {filteredSeries.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-tv-card/30 rounded-2xl border border-tv-border">
            <Clapperboard className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Nenhuma série encontrada</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {seriesList.length === 0
                ? 'Nenhuma série carregada nesta lista IPTV.'
                : 'Nenhuma série corresponde aos filtros selecionados.'}
            </p>
            {seriesList.length === 0 && (
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                Conectar Lista IPTV
              </button>
            )}
          </div>
        ) : viewMode === 'showcase' && selectedSeriesCategoryId === 'all' && !searchQuery ? (
          /* Modo Vitrine (Trilhas organizadas por categoria) */
          <div className="space-y-6 animate-in fade-in duration-300">
            {showcaseSections.map(section => (
              <MediaCarouselRow
                key={section.title}
                title={section.title}
                items={section.items}
                type="series"
                onSelectItem={handleSelectSeries}
                onViewAll={
                  section.categoryId !== 'all'
                    ? () => {
                        setSelectedSeriesCategoryId(section.categoryId);
                        setViewMode('grid');
                      }
                    : undefined
                }
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
                themeColor="purple"
              />
            ))}
          </div>
        ) : (
          /* Modo Grade Completa */
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
              {filteredSeries.slice(0, displayLimit).map((series: SeriesItem) => {
                const isFav = isFavorite('series', series.id);
                const cleanTitle = cleanMediaTitle(series.title || series.name);
                const year = extractYear(series.title || series.name, series.year);

                return (
                  <div
                    key={series.id}
                    data-nav="true"
                    tabIndex={0}
                    onClick={() => handleSelectSeries(series)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSelectSeries(series);
                    }}
                    className="group relative bg-tv-surface hover:bg-tv-card focus:bg-tv-card border border-tv-border hover:border-purple-500/50 focus:ring-2 focus:ring-purple-500 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg outline-none flex flex-col transform hover:-translate-y-1.5 hover:shadow-2xl"
                  >
                    {/* Poster Image */}
                    <div className="relative aspect-[2/3] w-full bg-tv-card overflow-hidden">
                      {series.poster ? (
                        <img
                          src={series.poster}
                          alt={cleanTitle}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-950">
                          <Clapperboard className="w-10 h-10 text-slate-600" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-tv-surface via-transparent to-transparent opacity-80" />

                      {/* Favorite Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite('series', series.id);
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
                      {series.rating && (
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 bg-black/75 backdrop-blur-md rounded-md text-[11px] font-bold text-yellow-400">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          <span>{typeof series.rating === 'number' ? series.rating.toFixed(1) : series.rating}</span>
                        </div>
                      )}

                      {/* Hover Icon */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3.5 bg-purple-600 text-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Layers className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    {/* Series Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block truncate">
                          {cleanCategoryName(series.category)}
                        </span>
                        <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1 mt-0.5">
                          {cleanTitle}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        {year ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {year}
                          </span>
                        ) : (
                          <span>Série</span>
                        )}
                        <span className="text-purple-400 font-semibold">Episódios</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {filteredSeries.length > displayLimit && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 48)}
                  className="px-6 py-3 bg-tv-card hover:bg-tv-border text-white text-xs font-bold rounded-xl border border-tv-border transition-all shadow-lg hover:scale-105"
                >
                  Carregar Mais Séries ({filteredSeries.length - displayLimit} restantes)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
