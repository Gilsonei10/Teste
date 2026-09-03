import React from 'react';
import { useIptv, MainSection } from '../../context/IptvContext';
import { Home, Tv, Film, Clapperboard, Star, Search, Settings, Server, Maximize2, Minimize2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    searchQuery,
    setSearchQuery,
    setIsConnectModalOpen,
    setIsSettingsModalOpen,
    activePlaylist,
  } = useIptv();

  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

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
    <header className="h-16 md:h-20 bg-tv-surface border-b border-tv-border px-3 md:px-6 flex items-center justify-between z-30 shrink-0 select-none">
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
        {/* Search input */}
        <div className="relative hidden lg:block w-48 xl:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar canais, filmes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-tv-card border border-tv-border rounded-xl pl-9 pr-3 py-1.5 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Connection / Playlist button */}
        <button
          data-nav="true"
          onClick={() => setIsConnectModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 md:py-2 bg-tv-card hover:bg-tv-border border border-tv-border rounded-xl text-xs md:text-sm text-slate-200 hover:text-white transition-all focus:ring-2 focus:ring-blue-400"
          title="Conexões e Listas"
        >
          <Server className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline font-medium max-w-[120px] truncate">
            {activePlaylist ? activePlaylist.name : 'Conectar'}
          </span>
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
