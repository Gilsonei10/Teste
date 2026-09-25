import React, { useMemo } from 'react';
import { useIptv } from '../../context/IptvContext';
import { LiveChannel } from '../../types/iptv';
import { Tv, Star, Play, Filter, Search, X } from 'lucide-react';

export const LiveTvView: React.FC = () => {
  const {
    liveCategories,
    liveChannels,
    selectedLiveCategoryId,
    setSelectedLiveCategoryId,
    searchQuery,
    setSearchQuery,
    playLiveChannel,
    toggleFavorite,
    isFavorite,
    setIsConnectModalOpen,
    favorites,
  } = useIptv();

  const favChannelsCount = useMemo(() => {
    return liveChannels.filter(ch => isFavorite('live', ch.id)).length;
  }, [liveChannels, isFavorite, favorites.live]);

  // Filter channels by category and search query
  const filteredChannels = useMemo(() => {
    return liveChannels.filter(ch => {
      const matchesCategory =
        selectedLiveCategoryId === 'favorites'
          ? isFavorite('live', ch.id)
          : selectedLiveCategoryId === 'all' ||
            ch.categoryId === selectedLiveCategoryId ||
            ch.category === selectedLiveCategoryId;

      const matchesSearch =
        !searchQuery ||
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [liveChannels, selectedLiveCategoryId, searchQuery, isFavorite, favorites.live]);

  return (
    <div className="flex-1 flex flex-col sm:flex-row h-full overflow-hidden">
      {/* Category Sidebar */}
      <aside className="w-full sm:w-52 md:w-64 lg:w-72 bg-tv-surface/90 border-r border-tv-border flex flex-col shrink-0">
        <div className="p-2.5 sm:p-4 border-b border-tv-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            <span>Categorias TV</span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-400 bg-tv-card px-2 py-0.5 rounded-full border border-tv-border">
            {liveChannels.length} canais
          </span>
        </div>

        {/* Categories List (Scrollable horizontally on mobile, vertically on desktop) */}
        <div className="flex-1 overflow-x-auto sm:overflow-y-auto p-1.5 sm:p-2 flex sm:flex-col gap-1 sm:gap-1.5 scrollbar-thin">
          <button
            data-nav="true"
            onClick={() => setSelectedLiveCategoryId('all')}
            className={`w-full text-left px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all outline-none whitespace-nowrap sm:whitespace-normal ${
              selectedLiveCategoryId === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-tv-card focus:bg-tv-card focus:ring-2 focus:ring-blue-400'
            }`}
          >
            <span>Todos os Canais</span>
            <span className="text-[11px] opacity-70 ml-2 hidden sm:inline">({liveChannels.length})</span>
          </button>

          {/* Pasta de Favoritos de TV */}
          <button
            data-nav="true"
            onClick={() => setSelectedLiveCategoryId('favorites')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold flex items-center justify-between transition-all outline-none whitespace-nowrap md:whitespace-normal ${
              selectedLiveCategoryId === 'favorites'
                ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/30 font-bold'
                : 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 focus:bg-yellow-500/10 focus:ring-2 focus:ring-yellow-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${selectedLiveCategoryId === 'favorites' ? 'fill-black text-black' : 'fill-yellow-400 text-yellow-400'}`} />
              <span>Canais Favoritos</span>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              selectedLiveCategoryId === 'favorites' ? 'bg-black/20 text-black' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {favChannelsCount}
            </span>
          </button>

          {liveCategories.map(cat => {
            const isSelected = selectedLiveCategoryId === cat.id || selectedLiveCategoryId === cat.name;
            return (
              <button
                key={cat.id}
                data-nav="true"
                onClick={() => setSelectedLiveCategoryId(cat.id || cat.name)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium flex items-center justify-between transition-all outline-none whitespace-nowrap md:whitespace-normal ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-tv-card focus:bg-tv-card focus:ring-2 focus:ring-blue-400'
                }`}
              >
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Channels Content */}
      <main className="flex-1 flex flex-col h-full bg-tv-bg overflow-hidden">
        {/* Header Bar */}
        <div className="p-3 sm:p-4 border-b border-tv-border flex flex-wrap items-center justify-between gap-3 bg-tv-surface/40 shrink-0">
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center gap-2">
              {selectedLiveCategoryId === 'favorites' ? (
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
              ) : (
                <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              )}
              <span>{selectedLiveCategoryId === 'favorites' ? 'Canais Favoritos' : 'Grade de TV Ao Vivo'}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              {selectedLiveCategoryId === 'favorites'
                ? `${filteredChannels.length} canais salvos nos seus favoritos`
                : `Mostrando ${filteredChannels.length} canais disponíveis`}
            </p>
          </div>

          {/* Search Bar with Magnifying Glass */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar canais de TV..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-tv-card border border-tv-border rounded-xl pl-9 pr-8 py-1.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Channel Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
          {filteredChannels.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-tv-card/30 rounded-2xl border border-tv-border">
              {selectedLiveCategoryId === 'favorites' ? (
                <Star className="w-12 h-12 text-yellow-500/60 mb-3 fill-yellow-500/20" />
              ) : (
                <Tv className="w-12 h-12 text-slate-600 mb-3" />
              )}
              <h3 className="text-base font-bold text-white mb-1">
                {selectedLiveCategoryId === 'favorites' ? 'Nenhum canal favoritado' : 'Nenhum canal encontrado'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {selectedLiveCategoryId === 'favorites'
                  ? 'Você ainda não adicionou canais aos favoritos. Clique no ícone de estrela ⭐ nos canais para acessá-los rapidamente por aqui!'
                  : liveChannels.length === 0
                  ? 'Você ainda não conectou nenhuma lista de IPTV com canais ao vivo.'
                  : 'Nenhum canal corresponde aos filtros ou busca selecionada.'}
              </p>
              {liveChannels.length === 0 && (
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  Conectar Lista IPTV
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
              {filteredChannels.map((channel: LiveChannel) => {
                const isFav = isFavorite('live', channel.id);
                return (
                  <div
                    key={channel.id}
                    data-nav="true"
                    data-fav-card="true"
                    data-fav-type="live"
                    data-fav-id={channel.id}
                    tabIndex={0}
                    onClick={() => playLiveChannel(channel)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') playLiveChannel(channel);
                    }}
                    className="group relative bg-tv-surface hover:bg-tv-card focus:bg-tv-card border border-tv-border hover:border-blue-500/50 focus:ring-2 focus:ring-blue-500 rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg outline-none"
                  >
                    {/* Top: Logo & Channel Number */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-14 h-14 bg-tv-bg rounded-xl p-1.5 flex items-center justify-center border border-tv-border group-hover:border-blue-500/30 transition-colors shrink-0 overflow-hidden">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className="max-w-full max-h-full object-contain"
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Tv className="w-6 h-6 text-slate-500" />
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        data-fav-btn="true"
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite('live', channel.id);
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          isFav
                            ? 'text-yellow-400 bg-yellow-500/20 border border-yellow-500/30'
                            : 'text-slate-400 hover:text-white bg-tv-bg hover:bg-tv-border'
                        }`}
                        title="Favoritar"
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400' : ''}`} />
                      </button>
                    </div>

                    {/* Bottom: Channel Info & Play Indicator */}
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block truncate">
                        {channel.category}
                      </span>
                      <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mt-0.5">
                        {channel.name}
                      </h4>
                    </div>

                    {/* Hover Play Button Overlay */}
                    <div className="mt-3 pt-2.5 border-t border-tv-border/60 flex items-center justify-between text-xs text-slate-400 group-hover:text-blue-400 transition-colors">
                      <span className="flex items-center gap-1 font-semibold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Ao Vivo
                      </span>
                      <span className="flex items-center gap-1 font-bold text-[11px]">
                        <Play className="w-3.5 h-3.5 fill-current" /> Assistir
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
