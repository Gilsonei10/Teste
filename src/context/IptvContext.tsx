import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Category,
  LiveChannel,
  MovieItem,
  SeriesItem,
  EpisodeItem,
  SavedPlaylist,
  AppSettings,
  XtreamCredentials,
} from '../types/iptv';
import { StorageService } from '../services/storageService';
import { XtreamService } from '../services/xtreamService';
import { parseM3U } from '../services/m3uParser';
import {
  DEMO_LIVE_CATEGORIES,
  DEMO_LIVE_CHANNELS,
  DEMO_MOVIE_CATEGORIES,
  DEMO_MOVIES,
  DEMO_SERIES_CATEGORIES,
  DEMO_SERIES,
} from '../services/demoData';

export type MainSection = 'home' | 'live' | 'movies' | 'series' | 'favorites';

export interface PlayingMedia {
  type: 'live' | 'movie' | 'episode';
  title: string;
  streamUrl: string;
  poster?: string;
  category?: string;
  channelNum?: number | string;
  seasonNum?: number;
  episodeNum?: number;
  id: string;
  rawItem: LiveChannel | MovieItem | EpisodeItem;
  seriesContext?: SeriesItem;
}

interface IptvContextType {
  // Navigation
  activeSection: MainSection;
  setActiveSection: (sec: MainSection) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Modals & Panels
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  selectedMovieForDetails: MovieItem | null;
  setSelectedMovieForDetails: (movie: MovieItem | null) => void;
  selectedSeriesForDetails: SeriesItem | null;
  setSelectedSeriesForDetails: (series: SeriesItem | null) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Playlists & Connection
  activePlaylist: SavedPlaylist | null;
  savedPlaylists: SavedPlaylist[];
  connectXtream: (credentials: XtreamCredentials, name?: string, silentFail?: boolean) => Promise<boolean>;
  connectM3UUrl: (url: string, name?: string) => Promise<void>;
  connectM3UFile: (content: string, name?: string) => Promise<void>;
  refreshActivePlaylist: () => Promise<{ liveChannels: LiveChannel[] } | null>;
  loadDemoData: () => void;
  disconnectPlaylist: () => void;
  removeSavedPlaylist: (id: string) => void;

  // Data
  isLoading: boolean;
  loadingMessage: string;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;

  // Live TV
  liveCategories: Category[];
  liveChannels: LiveChannel[];
  selectedLiveCategoryId: string;
  setSelectedLiveCategoryId: (id: string) => void;

  // Movies
  movieCategories: Category[];
  movies: MovieItem[];
  selectedMovieCategoryId: string;
  setSelectedMovieCategoryId: (id: string) => void;

  // Series
  seriesCategories: Category[];
  seriesList: SeriesItem[];
  selectedSeriesCategoryId: string;
  setSelectedSeriesCategoryId: (id: string) => void;
  fetchSeriesDetails: (seriesId: string | number, fallbackItem?: SeriesItem) => Promise<SeriesItem | null>;

  // Playback
  currentPlaying: PlayingMedia | null;
  playLiveChannel: (channel: LiveChannel) => void;
  playMovie: (movie: MovieItem) => void;
  playEpisode: (episode: EpisodeItem, series: SeriesItem) => void;
  closePlayer: () => void;
  playNextChannel: () => void;
  playPrevChannel: () => void;

  // Favorites
  favorites: { live: string[]; movies: string[]; series: string[] };
  toggleFavorite: (type: 'live' | 'movies' | 'series', id: string) => void;
  isFavorite: (type: 'live' | 'movies' | 'series', id: string) => boolean;
}

const IptvContext = createContext<IptvContextType | null>(null);

export const IptvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<MainSection>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState<MovieItem | null>(null);
  const [selectedSeriesForDetails, setSelectedSeriesForDetails] = useState<SeriesItem | null>(null);

  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [activePlaylist, setActivePlaylistState] = useState<SavedPlaylist | null>(StorageService.getActivePlaylist());
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(StorageService.getPlaylists());

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [selectedLiveCategoryId, setSelectedLiveCategoryId] = useState<string>('all');

  const [movieCategories, setMovieCategories] = useState<Category[]>([]);
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [selectedMovieCategoryId, setSelectedMovieCategoryId] = useState<string>('all');

  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const seriesListRef = useRef<SeriesItem[]>(seriesList);
  useEffect(() => {
    seriesListRef.current = seriesList;
  }, [seriesList]);
  const pendingSeriesRequests = useRef<Map<string, Promise<SeriesItem | null>>>(new Map());
  const [selectedSeriesCategoryId, setSelectedSeriesCategoryId] = useState<string>('all');

  const [currentPlaying, setCurrentPlaying] = useState<PlayingMedia | null>(null);
  const [favorites, setFavorites] = useState<{ live: string[]; movies: string[]; series: string[] }>(
    StorageService.getFavorites()
  );

  const [xtreamInstance, setXtreamInstance] = useState<XtreamService | null>(null);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      StorageService.saveSettings(updated);
      return updated;
    });
  }, []);

  const loadDemoData = useCallback(() => {
    setIsLoading(true);
    setLoadingMessage('Carregando canais e mídias de demonstração...');
    setErrorMessage(null);

    setLiveCategories(DEMO_LIVE_CATEGORIES);
    setLiveChannels(DEMO_LIVE_CHANNELS);
    setMovieCategories(DEMO_MOVIE_CATEGORIES);
    setMovies(DEMO_MOVIES);
    setSeriesCategories(DEMO_SERIES_CATEGORIES);
    setSeriesList(DEMO_SERIES);

    const demoPlaylist: SavedPlaylist = {
      id: 'demo_playlist',
      name: 'Demonstração Gratuita',
      type: 'demo',
      createdAt: Date.now(),
    };
    StorageService.savePlaylist(demoPlaylist);
    setActivePlaylistState(demoPlaylist);
    setSavedPlaylists(StorageService.getPlaylists());
    setIsLoading(false);
  }, []);

  const connectXtream = useCallback(
    async (credentials: XtreamCredentials, name?: string, silentFail = false) => {
      setIsLoading(true);
      setLoadingMessage('Autenticando no servidor Xtream Codes...');
      if (!silentFail) setErrorMessage(null);

      try {
        const client = new XtreamService(credentials, settings);
        await client.authenticate();
        setXtreamInstance(client);

        setLoadingMessage('Carregando categorias e canais de TV ao vivo...');
        const [liveCats, liveStreams] = await Promise.all([
          client.getLiveCategories(),
          client.getLiveStreams(),
        ]);

        setLoadingMessage('Carregando catálogo de filmes...');
        const [movieCats, movieStreams] = await Promise.all([
          client.getMovieCategories(),
          client.getMovies(),
        ]);

        setLoadingMessage('Carregando catálogo de séries...');
        const [seriesCats, seriesItems] = await Promise.all([
          client.getSeriesCategories(),
          client.getSeries(),
        ]);

        setLiveCategories(liveCats);
        setLiveChannels(liveStreams);
        setMovieCategories(movieCats);
        setMovies(movieStreams);
        setSeriesCategories(seriesCats);
        setSeriesList(seriesItems);

        const playlistName = name || credentials.username || 'Xtream Server';
        const playlist: SavedPlaylist = {
          id: `xtream_${Date.now()}`,
          name: playlistName,
          type: 'xtream',
          credentials,
          createdAt: Date.now(),
        };

        StorageService.savePlaylist(playlist);
        setActivePlaylistState(playlist);
        setSavedPlaylists(StorageService.getPlaylists());
        setIsConnectModalOpen(false);
        return true;
      } catch (err: any) {
        console.error(err);
        if (!silentFail) {
          setErrorMessage(err.message || 'Erro ao conectar no servidor Xtream Codes.');
        }
        return false;
      } finally {
        if (!silentFail) {
          setIsLoading(false);
        }
      }
    },
    [settings]
  );

  const connectM3UUrl = useCallback(
    async (rawInputUrl: string, name?: string) => {
      setIsLoading(true);
      setLoadingMessage('Conectando à lista IPTV...');
      setErrorMessage(null);

      const cleanUrl = rawInputUrl.trim();

      // 1. Otimização Inteligente: Se o link for gerado por servidor Xtream (get.php/player_api.php), tentar conectar via API ultrarrápida
      try {
        const urlObj = new URL(cleanUrl);
        const u = urlObj.searchParams.get('username') || urlObj.searchParams.get('user');
        const p = urlObj.searchParams.get('password') || urlObj.searchParams.get('pass');
        if (u && p && (cleanUrl.includes('get.php') || cleanUrl.includes('player_api.php') || cleanUrl.includes('m3u_plus') || cleanUrl.includes(':80/') || cleanUrl.includes(':8080/'))) {
          const sUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port && urlObj.port !== '80' && urlObj.port !== '443' ? `:${urlObj.port}` : ''}`;
          setLoadingMessage('Tentando conexão rápida via API...');
          const success = await connectXtream({ serverUrl: sUrl, username: u, password: p }, name || 'Lista IPTV', true);
          if (success) {
            return;
          }
        }
      } catch (e) {
        console.warn('Conexão rápida falhou, prosseguindo com download da lista M3U...', e);
      }

      // 2. Para arquivos M3U normais/estáticos (ou caso a API Xtream não responda), baixar e processar diretamente
      try {
        setLoadingMessage('Baixando lista M3U...');
        let fetchUrl = cleanUrl;
        if (settings.useCorsProxy && settings.corsProxyUrl) {
          fetchUrl = `${settings.corsProxyUrl}${encodeURIComponent(cleanUrl)}`;
        }

        let res = await fetch(fetchUrl);

        // Fallback to direct fetch if proxy fails
        if (!res.ok && settings.useCorsProxy) {
          try {
            const directRes = await fetch(cleanUrl);
            if (directRes.ok) {
              res = directRes;
            }
          } catch {
            // keep original response
          }
        }

        if (!res.ok) {
          if (res.status === 500) {
            throw new Error('O servidor retornou erro interno (500). Verifique se o servidor está online ou se as credenciais estão corretas.');
          }
          if (res.status === 404) {
            throw new Error('Lista não encontrada (404). Verifique se o link ou a senha foram digitados corretamente.');
          }
          throw new Error(`Falha ao baixar lista M3U (Status HTTP ${res.status}). Verifique se o link está online.`);
        }

        const text = await res.text();
        if (!text || text.length < 10) {
          throw new Error('A lista M3U retornou vazia ou inválida.');
        }

        setLoadingMessage('Processando canais, filmes e séries...');
        const parsed = parseM3U(text);

        if (parsed.liveChannels.length === 0 && parsed.movies.length === 0 && parsed.series.length === 0) {
          throw new Error('Nenhum canal ou mídia foi encontrado dentro deste arquivo M3U.');
        }

        setLiveCategories(parsed.liveCategories);
        setLiveChannels(parsed.liveChannels);
        setMovieCategories(parsed.movieCategories);
        setMovies(parsed.movies);
        setSeriesCategories(parsed.seriesCategories);
        setSeriesList(parsed.series);

        const playlistName = name || 'Lista M3U Web';
        const playlist: SavedPlaylist = {
          id: `m3u_${Date.now()}`,
          name: playlistName,
          type: 'm3u_url',
          url: cleanUrl,
          createdAt: Date.now(),
        };

        StorageService.savePlaylist(playlist);
        setActivePlaylistState(playlist);
        setSavedPlaylists(StorageService.getPlaylists());
        setIsConnectModalOpen(false);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Erro ao carregar lista M3U.');
      } finally {
        setIsLoading(false);
      }
    },
    [settings, connectXtream]
  );

  const refreshActivePlaylist = useCallback(async (): Promise<{ liveChannels: LiveChannel[] } | null> => {
    const active = StorageService.getActivePlaylist();
    if (!active) return null;

    if (active.type === 'm3u_url' && active.url) {
      try {
        let fetchUrl = active.url;
        if (settings.useCorsProxy && settings.corsProxyUrl) {
          fetchUrl = `${settings.corsProxyUrl}${encodeURIComponent(active.url)}`;
        }
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const text = await res.text();
          const parsed = parseM3U(text);
          if (parsed.liveChannels.length > 0) {
            setLiveChannels(parsed.liveChannels);
            setMovies(parsed.movies);
            setSeriesList(parsed.series);
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Background token refresh failed', e);
      }
    }
    return null;
  }, [settings]);

  const connectM3UFile = useCallback(
    async (content: string, name?: string) => {
      setIsLoading(true);
      setLoadingMessage('Processando arquivo de lista M3U...');
      setErrorMessage(null);

      try {
        const parsed = parseM3U(content);

        if (parsed.liveChannels.length === 0 && parsed.movies.length === 0 && parsed.series.length === 0) {
          throw new Error('Nenhum canal ou mídia foi encontrado dentro deste arquivo M3U.');
        }

        setLiveCategories(parsed.liveCategories);
        setLiveChannels(parsed.liveChannels);
        setMovieCategories(parsed.movieCategories);
        setMovies(parsed.movies);
        setSeriesCategories(parsed.seriesCategories);
        setSeriesList(parsed.series);

        const playlistName = name || 'Arquivo M3U Local';
        const playlist: SavedPlaylist = {
          id: `m3ufile_${Date.now()}`,
          name: playlistName,
          type: 'm3u_file',
          createdAt: Date.now(),
        };

        StorageService.savePlaylist(playlist);
        setActivePlaylistState(playlist);
        setSavedPlaylists(StorageService.getPlaylists());
        setIsConnectModalOpen(false);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Erro ao processar o arquivo M3U.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const disconnectPlaylist = useCallback(() => {
    StorageService.setActivePlaylist(null);
    setActivePlaylistState(null);
    setLiveCategories([]);
    setLiveChannels([]);
    setMovieCategories([]);
    setMovies([]);
    setSeriesCategories([]);
    setSeriesList([]);
    setCurrentPlaying(null);
    setXtreamInstance(null);
    setIsConnectModalOpen(true);
  }, []);

  const removeSavedPlaylist = useCallback((id: string) => {
    StorageService.removePlaylist(id);
    setSavedPlaylists(StorageService.getPlaylists());
    const active = StorageService.getActivePlaylist();
    if (!active) {
      disconnectPlaylist();
    }
  }, [disconnectPlaylist]);

  const fetchSeriesDetails = useCallback(
    async (seriesId: string | number, fallbackItem?: SeriesItem): Promise<SeriesItem | null> => {
      const seriesKey = String(seriesId);
      if (pendingSeriesRequests.current.has(seriesKey)) {
        return pendingSeriesRequests.current.get(seriesKey)!;
      }

      const requestPromise = (async () => {
        try {
          const existing =
            fallbackItem ||
            seriesListRef.current.find(
              s =>
                String(s.seriesId) === seriesKey ||
                String(s.id) === seriesKey ||
                String(s.id).replace('series_', '') === seriesKey
            );

          if (!existing) return null;

          if (
            existing.seasons &&
            existing.seasons.length > 0 &&
            existing.seasons.some(s => s.episodes && s.episodes.length > 0)
          ) {
            setSelectedSeriesForDetails(prev =>
              prev && (String(prev.id) === String(existing!.id) || String(prev.seriesId) === seriesKey)
                ? existing!
                : prev
            );
            return existing;
          }

          if (xtreamInstance) {
            try {
              const targetId =
                existing.seriesId ||
                parseInt(String(existing.id).replace(/\D+/g, ''), 10) ||
                existing.id;

              if (targetId) {
                const { seasons, info } = await xtreamInstance.getSeriesDetails(targetId);
                if (seasons && seasons.length > 0) {
                  const updatedSeries: SeriesItem = {
                    ...existing,
                    seriesId: targetId,
                    seasons,
                    plot: existing.plot || info?.plot,
                    backdrop:
                      existing.backdrop ||
                      (Array.isArray(info?.backdrop_path) ? info?.backdrop_path[0] : info?.backdrop_path) ||
                      info?.cover,
                    poster: existing.poster || info?.cover,
                    genre: existing.genre || info?.genre,
                    year: existing.year || info?.releaseDate || info?.year,
                    rating: existing.rating || info?.rating_5based || info?.rating,
                  };
                  setSeriesList(prev => prev.map(s => (String(s.id) === String(existing!.id) ? updatedSeries : s)));
                  setSelectedSeriesForDetails(prev =>
                    prev && (String(prev.id) === String(existing!.id) || String(prev.seriesId) === String(targetId))
                      ? updatedSeries
                      : prev
                  );
                  return updatedSeries;
                }
              }
            } catch (e) {
              console.error('Erro ao buscar episódios da série:', e);
            }
          }

          if (existing.seasons && existing.seasons.length > 0) {
            setSelectedSeriesForDetails(prev =>
              prev && (String(prev.id) === String(existing!.id) || String(prev.seriesId) === seriesKey)
                ? existing!
                : prev
            );
            return existing;
          }

          return existing;
        } finally {
          pendingSeriesRequests.current.delete(seriesKey);
        }
      })();

      pendingSeriesRequests.current.set(seriesKey, requestPromise);
      return requestPromise;
    },
    [xtreamInstance]
  );

  // Playback handlers
  const playLiveChannel = useCallback((channel: LiveChannel) => {
    setCurrentPlaying({
      type: 'live',
      title: channel.name,
      streamUrl: channel.streamUrl,
      poster: channel.logo,
      category: channel.category,
      channelNum: channel.num,
      id: channel.id,
      rawItem: channel,
    });
  }, []);

  const playMovie = useCallback((movie: MovieItem) => {
    setCurrentPlaying({
      type: 'movie',
      title: movie.title || movie.name,
      streamUrl: movie.streamUrl,
      poster: movie.poster || movie.backdrop,
      category: movie.category,
      id: movie.id,
      rawItem: movie,
    });
    setSelectedMovieForDetails(null);
  }, []);

  const playEpisode = useCallback((episode: EpisodeItem, series: SeriesItem) => {
    setCurrentPlaying({
      type: 'episode',
      title: `${series.name} - T${episode.seasonNum}E${episode.episodeNum}: ${episode.title}`,
      streamUrl: episode.streamUrl,
      poster: episode.thumbnail || series.poster,
      category: series.category,
      seasonNum: episode.seasonNum,
      episodeNum: episode.episodeNum,
      id: episode.id,
      rawItem: episode,
      seriesContext: series,
    });
    setSelectedSeriesForDetails(null);
  }, []);

  const closePlayer = useCallback(() => {
    setCurrentPlaying(null);
  }, []);

  const playNextChannel = useCallback(() => {
    if (!currentPlaying || currentPlaying.type !== 'live' || liveChannels.length === 0) return;
    const currentIdx = liveChannels.findIndex(c => c.id === currentPlaying.id);
    const nextIdx = (currentIdx + 1) % liveChannels.length;
    playLiveChannel(liveChannels[nextIdx]);
  }, [currentPlaying, liveChannels, playLiveChannel]);

  const playPrevChannel = useCallback(() => {
    if (!currentPlaying || currentPlaying.type !== 'live' || liveChannels.length === 0) return;
    const currentIdx = liveChannels.findIndex(c => c.id === currentPlaying.id);
    const prevIdx = (currentIdx - 1 + liveChannels.length) % liveChannels.length;
    playLiveChannel(liveChannels[prevIdx]);
  }, [currentPlaying, liveChannels, playLiveChannel]);

  // Favorites
  const toggleFavorite = useCallback((type: 'live' | 'movies' | 'series', id: string) => {
    StorageService.toggleFavorite(type, id);
    setFavorites(StorageService.getFavorites());
  }, []);

  const isFavorite = useCallback(
    (type: 'live' | 'movies' | 'series', id: string) => {
      return (favorites[type] || []).includes(id);
    },
    [favorites]
  );

  // Auto-load on mount
  useEffect(() => {
    const active = StorageService.getActivePlaylist();
    if (active) {
      if (active.type === 'demo') {
        loadDemoData();
      } else if (active.type === 'xtream' && active.credentials) {
        connectXtream(active.credentials, active.name);
      } else if (active.type === 'm3u_url' && active.url) {
        connectM3UUrl(active.url, active.name);
      }
    } else {
      loadDemoData();
    }
  }, []);

  return (
    <IptvContext.Provider
      value={{
        activeSection,
        setActiveSection,
        searchQuery,
        setSearchQuery,
        isConnectModalOpen,
        setIsConnectModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        selectedMovieForDetails,
        setSelectedMovieForDetails,
        selectedSeriesForDetails,
        setSelectedSeriesForDetails,
        settings,
        updateSettings,
        activePlaylist,
        savedPlaylists,
        connectXtream,
        connectM3UUrl,
        connectM3UFile,
        refreshActivePlaylist,
        loadDemoData,
        disconnectPlaylist,
        removeSavedPlaylist,
        isLoading,
        loadingMessage,
        errorMessage,
        setErrorMessage,
        liveCategories,
        liveChannels,
        selectedLiveCategoryId,
        setSelectedLiveCategoryId,
        movieCategories,
        movies,
        selectedMovieCategoryId,
        setSelectedMovieCategoryId,
        seriesCategories,
        seriesList,
        selectedSeriesCategoryId,
        setSelectedSeriesCategoryId,
        fetchSeriesDetails,
        currentPlaying,
        playLiveChannel,
        playMovie,
        playEpisode,
        closePlayer,
        playNextChannel,
        playPrevChannel,
        favorites,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </IptvContext.Provider>
  );
};

export const useIptv = () => {
  const context = useContext(IptvContext);
  if (!context) {
    throw new Error('useIptv must be used within an IptvProvider');
  }
  return context;
};
