import React from 'react';
import { IptvProvider, useIptv } from './context/IptvContext';
import { Navbar } from './components/Common/Navbar';
import { HomeView } from './components/Views/HomeView';
import { LiveTvView } from './components/Views/LiveTvView';
import { MoviesView } from './components/Views/MoviesView';
import { SeriesView } from './components/Views/SeriesView';
import { FavoritesView } from './components/Views/FavoritesView';
import { VideoPlayer } from './components/Player/VideoPlayer';
import { ConnectModal } from './components/Modals/ConnectModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { MovieDetailsModal } from './components/Modals/MovieDetailsModal';
import { SeriesDetailsModal } from './components/Modals/SeriesDetailsModal';
import { useSpatialNav } from './hooks/useSpatialNav';

const MainLayout: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    currentPlaying,
    closePlayer,
    selectedMovieForDetails,
    setSelectedMovieForDetails,
    selectedSeriesForDetails,
    setSelectedSeriesForDetails,
    isConnectModalOpen,
    setIsConnectModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settings,
  } = useIptv();

  // Spatial navigation for Smart TV Remotes
  useSpatialNav({
    onBack: () => {
      if (currentPlaying) {
        closePlayer();
      } else if (selectedMovieForDetails) {
        setSelectedMovieForDetails(null);
      } else if (selectedSeriesForDetails) {
        setSelectedSeriesForDetails(null);
      } else if (isConnectModalOpen) {
        setIsConnectModalOpen(false);
      } else if (isSettingsModalOpen) {
        setIsSettingsModalOpen(false);
      } else if (activeSection !== 'home') {
        setActiveSection('home');
      }
    },
  });

  return (
    <div
      className={`h-screen w-screen flex flex-col bg-tv-bg text-slate-100 overflow-hidden ${
        settings.tvMode ? 'text-lg tv-mode-active' : ''
      }`}
    >
      {/* Top Header / Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeSection === 'home' && <HomeView />}
        {activeSection === 'live' && <LiveTvView />}
        {activeSection === 'movies' && <MoviesView />}
        {activeSection === 'series' && <SeriesView />}
        {activeSection === 'favorites' && <FavoritesView />}
      </div>

      {/* Smart TV Remote Control Helper Footer */}
      <div className="h-7 bg-tv-surface/80 border-t border-tv-border/50 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-slate-200">D-Pad:</strong> ◀ ▲ ▼ ▶ Navegar
          </span>
          <span>
            <strong className="text-slate-200">OK / Enter:</strong> Selecionar
          </span>
          <span>
            <strong className="text-slate-200">Voltar / Esc:</strong> Retornar
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Conexão
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> TV Ao Vivo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Filmes
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Séries
          </span>
        </div>
      </div>

      {/* Video Player Modal / Overlay */}
      <VideoPlayer />

      {/* Connection & Auth Modal */}
      <ConnectModal />

      {/* Settings Modal */}
      <SettingsModal />

      {/* Movie Details Modal */}
      <MovieDetailsModal />

      {/* Series Details Modal */}
      <SeriesDetailsModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <IptvProvider>
      <MainLayout />
    </IptvProvider>
  );
};

export default App;
