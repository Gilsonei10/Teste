import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { useIptv } from '../../context/IptvContext';
import { StorageService } from '../../services/storageService';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  FastForward,
  Rewind,
  Layers,
  AlertTriangle,
  RefreshCw,
  Tv,
} from 'lucide-react';

export const VideoPlayer: React.FC = () => {
  const {
    currentPlaying,
    closePlayer,
    playNextChannel,
    playPrevChannel,
    toggleFavorite,
    isFavorite,
    settings,
    refreshActivePlaylist,
    fetchSeriesDetails,
  } = useIptv();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mpegtsRef = useRef<mpegts.Player | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRetryingTokenRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatioIndex, setAspectRatioIndex] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [streamFormat, setStreamFormat] = useState<'hls' | 'ts' | 'native'>('ts');

  const aspectRatios: ('contain' | 'cover' | 'fill' | '16:9' | '4:3')[] = [
    'contain',
    'cover',
    '16:9',
    '4:3',
    'fill',
  ];

  // Auto-hide controls
  const showControls = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false);
      }
    }, 3500);
  }, [isPlaying]);

  // Clean up any existing player instances
  const cleanupPlayers = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.warn('hls destroy error', e);
      }
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.pause();
        mpegtsRef.current.unload();
        mpegtsRef.current.detachMediaElement();
        mpegtsRef.current.destroy();
      } catch (e) {
        console.warn('mpegts cleanup error', e);
      }
      mpegtsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, []);

  const safePlayVideo = (video: HTMLVideoElement) => {
    const p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(err => {
        if (err.name === 'NotAllowedError') {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => setIsPlaying(false));
        } else {
          setIsPlaying(false);
        }
      });
    }
  };

  // Attempt auto token refresh on expired channel token
  const handleAutoTokenRecovery = useCallback(
    async (targetChannelId: string) => {
      if (isRetryingTokenRef.current) return false;
      isRetryingTokenRef.current = true;

      try {
        const refreshed = await refreshActivePlaylist();
        if (refreshed && refreshed.liveChannels) {
          const freshChannel = refreshed.liveChannels.find(c => c.id === targetChannelId || c.name === currentPlaying?.title);
          if (freshChannel && freshChannel.streamUrl) {
            console.info('Token renovado com sucesso! Reiniciando canal...');
            isRetryingTokenRef.current = false;
            startPlayback(freshChannel.streamUrl);
            return true;
          }
        }
      } catch (e) {
        console.warn('Erro ao renovar token:', e);
      }

      isRetryingTokenRef.current = false;
      return false;
    },
    [currentPlaying, refreshActivePlaylist]
  );

  // Attempt auto recovery on series episode
  const handleAutoEpisodeRecovery = useCallback(async () => {
    if (isRetryingTokenRef.current || !currentPlaying) return false;
    isRetryingTokenRef.current = true;

    try {
      if (currentPlaying.type === 'episode') {
        const seriesId = currentPlaying.seriesContext?.seriesId || currentPlaying.seriesContext?.id;
        if (seriesId) {
          console.info('Buscando link atualizado do episódio no servidor...');
          const updatedSeries = await fetchSeriesDetails(seriesId);
          if (updatedSeries && updatedSeries.seasons) {
            const season = updatedSeries.seasons.find(s => s.seasonNumber === currentPlaying.seasonNum);
            const freshEp = season?.episodes.find(
              e => e.episodeNum === currentPlaying.episodeNum || e.id === currentPlaying.id
            );
            if (freshEp && freshEp.streamUrl && freshEp.streamUrl !== currentPlaying.streamUrl) {
              console.info('Link atualizado do episódio obtido! Reiniciando...');
              isRetryingTokenRef.current = false;
              startPlayback(freshEp.streamUrl);
              return true;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao atualizar link do episódio:', e);
    }

    isRetryingTokenRef.current = false;
    return false;
  }, [currentPlaying, fetchSeriesDetails]);

  // Initialize playback
  const startPlayback = useCallback(
    (rawUrl: string, forceFormat?: 'hls' | 'ts' | 'native') => {
      if (!videoRef.current) return;
      const video = videoRef.current;

      cleanupPlayers();
      setPlaybackError(null);
      setIsBuffering(true);

      // Determine target URL with proxy
      let targetUrl = rawUrl;
      if (settings.useCorsProxy && settings.corsProxyUrl && !targetUrl.startsWith('/proxy?url=')) {
        targetUrl = `${settings.corsProxyUrl}${encodeURIComponent(rawUrl)}`;
      }

      // Format detection
      const lowerRaw = rawUrl.toLowerCase();
      const isExplicitHls = lowerRaw.endsWith('.m3u8') || lowerRaw.includes('.m3u8');
      const isEpisodeOrMovie = currentPlaying?.type === 'episode' || currentPlaying?.type === 'movie';
      const isExplicitTs =
        !isEpisodeOrMovie &&
        (lowerRaw.endsWith('.ts') ||
          lowerRaw.includes('/play/') ||
          lowerRaw.includes('/live/') ||
          lowerRaw.includes('/auth/'));

      let chosenFormat: 'hls' | 'ts' | 'native' = 'native';
      if (forceFormat) {
        chosenFormat = forceFormat;
      } else if (isExplicitHls) {
        chosenFormat = 'hls';
      } else if (isEpisodeOrMovie) {
        chosenFormat = 'native';
      } else if (isExplicitTs || currentPlaying?.type === 'live') {
        chosenFormat = 'ts';
      } else {
        chosenFormat = 'native';
      }

      setStreamFormat(chosenFormat);

      // 1. PLAY VIA MPEGTS.JS (MPEG-TS Live Stream)
      if (chosenFormat === 'ts' && mpegts.isSupported()) {
        try {
          const player = mpegts.createPlayer(
            {
              type: 'mse',
              isLive: true,
              url: targetUrl,
            },
            {
              enableWorker: false,
              lazyLoad: false,
              liveBufferLatencyChasing: true,
              autoCleanupSourceBuffer: true,
              deferLoadAfterSourceOpen: false,
              enableStashBuffer: true,
              stashInitialSize: 384,
            }
          );

          mpegtsRef.current = player;
          player.attachMediaElement(video);
          player.load();
          const playPromise = player.play();
          if (playPromise && typeof (playPromise as any).catch === 'function') {
            (playPromise as any).catch((err: any) => {
              if (err.name === 'NotAllowedError') {
                video.muted = true;
                setIsMuted(true);
                player.play();
              }
            });
          }

          player.on(mpegts.Events.ERROR, async (errType: any, errDetail: any) => {
            console.warn('MPEGTS Error:', errType, errDetail);

            // Auto-refresh token if expired
            if (currentPlaying && currentPlaying.type === 'live' && !isRetryingTokenRef.current) {
              const recovered = await handleAutoTokenRecovery(currentPlaying.id);
              if (recovered) return;
            }

            if (currentPlaying && currentPlaying.type === 'episode') {
              startPlayback(rawUrl, 'native');
              return;
            }

            setPlaybackError('Falha ao decodificar sinal do canal. Tentando recuperar...');
            setIsBuffering(false);
          });
          return;
        } catch (e: any) {
          console.warn('Failed to init mpegts player, falling back to Hls', e);
        }
      }

      // 2. PLAY VIA HLS.JS
      if (chosenFormat === 'hls' && Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: settings.bufferLengthSeconds || 30,
          enableWorker: false,
          lowLatencyMode: currentPlaying?.type === 'live',
          backBufferLength: 60,
        });

        hlsRef.current = hls;
        hls.loadSource(targetUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          safePlayVideo(video);
        });

        hls.on(Hls.Events.ERROR, async (_event, data) => {
          console.warn('HLS Error Event:', data);
          if (data.fatal) {
            if (currentPlaying && currentPlaying.type === 'live' && !isRetryingTokenRef.current) {
              const recovered = await handleAutoTokenRecovery(currentPlaying.id);
              if (recovered) return;
            }

            if (currentPlaying && currentPlaying.type === 'episode') {
              if (chosenFormat === 'hls' && !forceFormat) {
                startPlayback(rawUrl, 'native');
                return;
              }
            }

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setPlaybackError(
                  currentPlaying?.type === 'episode'
                    ? 'Erro de conexão no stream do episódio.'
                    : 'Erro de conexão no stream do canal.'
                );
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setPlaybackError('Recuperando decodificação...');
                hls.recoverMediaError();
                break;
              default:
                setPlaybackError(
                  currentPlaying?.type === 'episode'
                    ? 'Não foi possível carregar o episódio da série.'
                    : 'Não foi possível carregar a transmissão.'
                );
                hls.destroy();
                break;
            }
          }
        });
        return;
      }

      // 3. NATIVE VIDEO ELEMENT
      if (video.canPlayType('application/vnd.apple.mpegurl') || chosenFormat === 'native' || !chosenFormat) {
        video.src = targetUrl;
        video.load();
        safePlayVideo(video);
      } else {
        setPlaybackError('Formato de stream não suportado neste navegador.');
      }
    },
    [settings.useCorsProxy, settings.corsProxyUrl, settings.bufferLengthSeconds, currentPlaying, cleanupPlayers, handleAutoTokenRecovery]
  );

  // Trigger playback when currentPlaying changes
  useEffect(() => {
    if (!currentPlaying) {
      cleanupPlayers();
      return;
    }

    startPlayback(currentPlaying.streamUrl);

    // Restore watch progress for Movies & Episodes
    if (currentPlaying.type !== 'live') {
      const savedTime = StorageService.getWatchProgress(currentPlaying.id);
      if (savedTime > 0 && videoRef.current) {
        videoRef.current.currentTime = savedTime;
      }
    }

    return () => {
      cleanupPlayers();
    };
  }, [currentPlaying, startPlayback, cleanupPlayers]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setPlaybackError(null);
    };
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (currentPlaying && currentPlaying.type !== 'live' && video.currentTime > 5) {
        StorageService.saveWatchProgress(currentPlaying.id, video.currentTime);
      }
    };
    const onDurationChange = () => setDuration(video.duration || 0);
    const onError = async () => {
      setIsBuffering(false);
      if (currentPlaying && currentPlaying.type === 'live' && !isRetryingTokenRef.current) {
        const recovered = await handleAutoTokenRecovery(currentPlaying.id);
        if (recovered) return;
      }
      if (currentPlaying && currentPlaying.type === 'episode') {
        if (!isRetryingTokenRef.current) {
          const recovered = await handleAutoEpisodeRecovery();
          if (recovered) return;
        }

        const lowerUrl = (currentPlaying.streamUrl || '').toLowerCase();
        if (streamFormat === 'native' && lowerUrl.includes('.m3u8') && Hls.isSupported()) {
          console.info('Vídeo nativo falhou para episódio HLS. Tentando HLS.js...');
          startPlayback(currentPlaying.streamUrl, 'hls');
          return;
        }
        setPlaybackError('Episódio temporariamente indisponível no servidor do provedor IPTV (Fonte offline ou link expirado).');
        return;
      }
      setPlaybackError('Falha ao reproduzir o stream.');
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('error', onError);
    };
  }, [currentPlaying, handleAutoTokenRecovery, handleAutoEpisodeRecovery, streamFormat, startPlayback]);

  // Keyboard shortcut handlers for TV Remotes / PC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      showControls();

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          if (currentPlaying?.type !== 'live' && videoRef.current) {
            e.preventDefault();
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          if (currentPlaying?.type !== 'live' && videoRef.current) {
            e.preventDefault();
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
          }
          break;
        case 'ArrowUp':
          if (currentPlaying?.type === 'live') {
            e.preventDefault();
            playNextChannel();
          }
          break;
        case 'ArrowDown':
          if (currentPlaying?.type === 'live') {
            e.preventDefault();
            playPrevChannel();
          }
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
        case 'BrowserBack':
        case 'Back':
          closePlayer();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, currentPlaying, showControls, playNextChannel, playPrevChannel, closePlayer]);

  if (!currentPlaying) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const cycleAspectRatio = () => {
    const nextIdx = (aspectRatioIndex + 1) % aspectRatios.length;
    setAspectRatioIndex(nextIdx);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getObjectFitStyle = () => {
    const mode = aspectRatios[aspectRatioIndex];
    if (mode === 'cover') return 'object-cover';
    if (mode === 'fill') return 'object-fill';
    return 'object-contain';
  };

  const favType = currentPlaying.type === 'live' ? 'live' : currentPlaying.type === 'movie' ? 'movies' : 'series';
  const favTargetId =
    currentPlaying.type === 'episode' ? currentPlaying.seriesContext?.id || currentPlaying.id : currentPlaying.id;
  const isFav = isFavorite(favType, favTargetId);

  return (
    <div
      ref={containerRef}
      onMouseMove={showControls}
      onClick={showControls}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video ref={videoRef} playsInline className={`w-full h-full ${getObjectFitStyle()} transition-all`} />

      {/* Buffering Spinner */}
      {isBuffering && !playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg" />
          <p className="mt-4 text-white text-sm font-medium tracking-wide">
            Carregando transmissão ({streamFormat.toUpperCase()})...
          </p>
        </div>
      )}

      {/* Error Overlay with Smart Controls */}
      {playbackError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 z-30 animate-in fade-in duration-200">
          <div className="p-4 bg-red-500/20 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {currentPlaying.type === 'episode'
              ? 'Falha na Reprodução do Episódio'
              : currentPlaying.type === 'movie'
              ? 'Falha na Reprodução do Filme'
              : 'Falha na Reprodução do Canal'}
          </h3>
          <p className="text-slate-300 text-sm max-w-md text-center mb-6">{playbackError}</p>

          <div className="flex flex-wrap gap-3 items-center justify-center max-w-lg">
            {currentPlaying.type === 'live' ? (
              <>
                {/* Auto Renovar Token */}
                <button
                  onClick={async () => {
                    if (currentPlaying) {
                      setIsBuffering(true);
                      setPlaybackError(null);
                      await handleAutoTokenRecovery(currentPlaying.id);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Renovar Token e Tentar Novamente
                </button>

                {/* Format Switcher */}
                <button
                  onClick={() => startPlayback(currentPlaying.streamUrl, 'ts')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  <Tv className="w-4 h-4" />
                  Engine MPEG-TS
                </button>

                <button
                  onClick={() => startPlayback(currentPlaying.streamUrl, 'hls')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  <Tv className="w-4 h-4" />
                  Engine HLS
                </button>
              </>
            ) : (
              <>
                {/* Series & Movies Controls */}
                <button
                  onClick={() => startPlayback(currentPlaying.streamUrl, 'native')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Player Padrão (MP4/Web)
                </button>

                <button
                  onClick={() => startPlayback(currentPlaying.streamUrl, 'hls')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  <Tv className="w-4 h-4" />
                  Engine HLS
                </button>

                <button
                  onClick={async () => {
                    if (currentPlaying) {
                      setIsBuffering(true);
                      setPlaybackError(null);
                      const recovered = await handleAutoEpisodeRecovery();
                      if (!recovered) {
                        startPlayback(currentPlaying.streamUrl);
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recarregar / Atualizar Link
                </button>
              </>
            )}

            <button
              onClick={closePlayer}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      )}

      {/* Player Overlays & Controls */}
      <div
        className={`absolute inset-0 flex flex-col justify-between p-4 md:p-8 bg-gradient-to-t from-black/90 via-transparent to-black/80 transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              data-nav="true"
              onClick={closePlayer}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all focus:ring-2 focus:ring-blue-400"
              title="Voltar / Fechar (Esc)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                {currentPlaying.type === 'live' && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-red-600 text-white text-xs font-bold uppercase rounded-md tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Ao Vivo
                  </span>
                )}
                {currentPlaying.category && (
                  <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                    {currentPlaying.category}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono bg-white/10 px-2 py-0.5 rounded">
                  {streamFormat.toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg md:text-2xl font-extrabold text-white mt-0.5 max-w-xl truncate">
                {currentPlaying.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              data-nav="true"
              onClick={() => toggleFavorite(favType, favTargetId)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                isFav
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Favoritar"
            >
              <Star className={`w-5 h-5 ${isFav ? 'fill-yellow-400' : ''}`} />
            </button>

            <button
              data-nav="true"
              onClick={closePlayer}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Actions */}
        <div className="flex items-center justify-center gap-6">
          {currentPlaying.type === 'live' ? (
            <>
              <button
                data-nav="true"
                onClick={playPrevChannel}
                className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all focus:ring-2 focus:ring-blue-400"
                title="Canal Anterior (Seta Baixo)"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>

              <button
                data-nav="true"
                onClick={togglePlay}
                className="p-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-xl shadow-blue-600/40 transform hover:scale-110 focus:ring-4 focus:ring-blue-400"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
              </button>

              <button
                data-nav="true"
                onClick={playNextChannel}
                className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all focus:ring-2 focus:ring-blue-400"
                title="Próximo Canal (Seta Cima)"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          ) : (
            <>
              <button
                data-nav="true"
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                }}
                className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
                title="Voltar 10s"
              >
                <Rewind className="w-6 h-6" />
              </button>

              <button
                data-nav="true"
                onClick={togglePlay}
                className="p-5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all shadow-xl shadow-blue-600/40 transform hover:scale-110 focus:ring-4 focus:ring-blue-400"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
              </button>

              <button
                data-nav="true"
                onClick={() => {
                  if (videoRef.current)
                    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
                }}
                className="p-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
                title="Avançar 10s"
              >
                <FastForward className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="space-y-3">
          {/* Progress bar for VOD */}
          {currentPlaying.type !== 'live' && duration > 0 && (
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2.5 transition-all"
              />
              <div className="flex justify-between text-xs text-slate-300 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Action Controls */}
          <div className="flex items-center justify-between">
            {/* Volume */}
            <div className="flex items-center gap-3">
              <button
                data-nav="true"
                onClick={toggleMute}
                className="p-2 text-white hover:text-blue-400 transition-colors"
                title="Mudo (M)"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 md:w-28 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Aspect Ratio & Fullscreen */}
            <div className="flex items-center gap-3">
              <button
                data-nav="true"
                onClick={cycleAspectRatio}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold text-white transition-all"
                title="Proporção da Tela"
              >
                <Layers className="w-4 h-4" />
                <span className="uppercase">{aspectRatios[aspectRatioIndex]}</span>
              </button>

              <button
                data-nav="true"
                onClick={toggleFullscreen}
                className="p-2 text-white hover:text-blue-400 transition-colors"
                title="Tela Cheia (F)"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
