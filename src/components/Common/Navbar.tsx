import React from 'react';
import { useIptv, MainSection } from '../../context/IptvContext';
import { Home, Tv, Film, Clapperboard, Star, Search, Settings, Server, Maximize2, Minimize2, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    searchQuery,
    setSearchQuery,
    setIsConnectModalOpen,
    setIsTvPairingModalOpen,
    setIsSettingsModalOpen,
    activePlaylist,
  } = useIptv();

  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const navItems: { id: MainSection; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'live', label: 'TV Ao Vivo', icon: <Tv className="w-5 h-5" /> },
    { id: 'movies', label: 'Filmes', icon: <Film className="w-5 h-5" /> },
    { id: 'series', label: 'Séries', icon: <Clapperboard className="w-5 h-5" /> },
    { id: 'favorites', label: 'Favoritos', icon: <Star className="w-5 h-5" /> },
  ];

  return (
    <header className="relative h-16 md:h-20 bg-tv-surface border-b border-tv-border px-3 md:px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Mobile Search Overlay when expanded */}
      {isMobileSearchOpen && (
        <div className="absolute inset-x-2 inset-y-2 z-50 bg-tv-surface border-2 border-blue-500 rounded-2xl px-3 flex items-center gap-2.5 shadow-2xl">
          <Search className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar canais, filmes, séries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none py-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-white"
              title="Limpar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="px-2.5 py-1 text-xs font-semibold bg-tv-card hover:bg-tv-border border border-tv-border rounded-lg text-slate-200"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Brand & Logo */}
      <div className="flex items-center gap-3 md:gap-6">
        <button
          data-nav="true"
          onClick={() => setActiveSection('home')}
          className="flex items-center gap-2.5 text-left outline-none rounded-xl focus:ring-2 focus:ring-blue-400 group cursor-pointer"
          title="Ir para o Início"
        >
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Tv className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-lg md:text-xl tracking-tight text-white leading-none">
              Play Live <span className="text-blue-500">IPTV</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Player Universal</p>
          </div>
        </button>

        {/* Section Navigation Tabs */}
        <nav className="flex items-center gap-1 md:gap-2">
          {navItems.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                data-nav="true"
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-medium text-xs md:text-sm transition-all outline-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-tv-card focus:bg-tv-card focus:ring-2 focus:ring-blue-400'
                }`}
              >
                {item.icon}
                <span className="hidden xs:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Action Icons & Search */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search input (visible on mobile landscape, tablets and desktop) */}
        <div className="relative hidden sm:block w-36 sm:w-44 md:w-56 xl:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar canais, filmes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-tv-card border border-tv-border rounded-xl pl-9 pr-8 py-1.5 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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

        {/* Mobile Search Button (< sm) */}
        <button
          data-nav="true"
          onClick={() => setIsMobileSearchOpen(true)}
          className="sm:hidden p-2 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-slate-300 hover:text-white transition-all focus:ring-2 focus:ring-blue-400 relative"
          title="Buscar canais, filmes..."
        >
          <Search className="w-4 h-4" />
          {searchQuery && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Connection / Playlist button */}
        <button
          data-nav="true"
          onClick={() => setIsConnectModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 md:py-2 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-xs md:text-sm text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-blue-400 cursor-pointer"
          title="Conexões e Listas"
        >
          <Server className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline font-medium max-w-[120px] truncate">
            {activePlaylist ? activePlaylist.name : 'Conectar'}
          </span>
        </button>

        {/* Smart TV Pairing Quick Button */}
        <button
          data-nav="true"
          onClick={() => setIsTvPairingModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 md:py-2 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 rounded-xl text-xs md:text-sm text-blue-300 hover:text-blue-200 transition-all focus:ring-2 focus:ring-blue-400 cursor-pointer"
          title="Conectar TV por Código"
        >
          <Tv className="w-4 h-4 text-blue-400" />
          <span className="hidden md:inline font-semibold">Código TV</span>
        </button>

        {/* Settings button */}
        <button
          data-nav="true"
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-2 md:p-2.5 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-slate-300 hover:text-white transition-all focus:ring-2 focus:ring-blue-400"
          title="Configurações"
        >
          <Settings className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          data-nav="true"
          onClick={toggleFullscreen}
          className="p-2 md:p-2.5 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-slate-300 hover:text-white transition-all focus:ring-2 focus:ring-blue-400"
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
      </div>
    </header>
  );
};
