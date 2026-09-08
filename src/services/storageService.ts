import { AppSettings, SavedPlaylist } from '../types/iptv';

const STORAGE_KEYS = {
  PLAYLISTS: 'iptv_saved_playlists',
  ACTIVE_PLAYLIST: 'iptv_active_playlist',
  FAVORITES: 'iptv_favorites',
  SETTINGS: 'iptv_settings',
  WATCH_HISTORY: 'iptv_watch_history',
  LAST_CHANNEL: 'iptv_last_channel',
};

export const defaultSettings: AppSettings = {
  corsProxyUrl: '/proxy?url=',
  useCorsProxy: true,
  tvMode: false,
  bufferLengthSeconds: 30,
  aspectRatio: 'contain',
  autoPlayNextEpisode: true,
};

export const StorageService = {
  getSettings(): AppSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!saved) return defaultSettings;
      const parsed = JSON.parse(saved);
      if (parsed.corsProxyUrl && parsed.corsProxyUrl.includes('corsproxy.io')) {
        parsed.corsProxyUrl = '/proxy?url=';
        parsed.useCorsProxy = true;
      }
      return { ...defaultSettings, ...parsed };
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  },

  isSamePlaylist(a: SavedPlaylist, b: SavedPlaylist): boolean {
    if (a.id === b.id) return true;
    if (a.type === 'xtream' && b.type === 'xtream' && a.credentials && b.credentials) {
      const urlA = (a.credentials.serverUrl || '').replace(/\/+$/, '').toLowerCase();
      const urlB = (b.credentials.serverUrl || '').replace(/\/+$/, '').toLowerCase();
      const userA = (a.credentials.username || '').trim().toLowerCase();
      const userB = (b.credentials.username || '').trim().toLowerCase();
      return urlA === urlB && userA === userB;
    }
    if (a.type === 'm3u_url' && b.type === 'm3u_url' && a.url && b.url) {
      return a.url.trim().toLowerCase() === b.url.trim().toLowerCase();
    }
    if (a.type === 'demo' && b.type === 'demo') return true;
    return false;
  },

  getPlaylists(): SavedPlaylist[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (!saved) return [];
      const list: SavedPlaylist[] = JSON.parse(saved);
      if (!Array.isArray(list)) return [];

      const unique: SavedPlaylist[] = [];
      for (const p of list) {
        const isDuplicate = unique.some(existing => this.isSamePlaylist(existing, p));
        if (!isDuplicate) {
          unique.push(p);
        }
      }
      if (unique.length !== list.length) {
        localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(unique));
      }
      return unique;
    } catch {
      return [];
    }
  },

  savePlaylist(playlist: SavedPlaylist): SavedPlaylist {
    try {
      const existingPlaylists = this.getPlaylists();
      const existing = existingPlaylists.find(p => this.isSamePlaylist(p, playlist));

      const playlistToSave: SavedPlaylist = existing
        ? { ...playlist, id: existing.id, createdAt: existing.createdAt }
        : playlist;

      const playlists = existingPlaylists.filter(p => !this.isSamePlaylist(p, playlistToSave));
      playlists.unshift(playlistToSave);
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
      this.setActivePlaylist(playlistToSave);
      return playlistToSave;
    } catch (e) {
      console.error('Error saving playlist', e);
      return playlist;
    }
  },

  removePlaylist(id: string): void {
    try {
      const playlists = this.getPlaylists().filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
      const active = this.getActivePlaylist();
      if (active?.id === id) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAYLIST);
      }
    } catch (e) {
      console.error('Error removing playlist', e);
    }
  },

  getActivePlaylist(): SavedPlaylist | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAYLIST);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  setActivePlaylist(playlist: SavedPlaylist | null): void {
    try {
      if (playlist) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAYLIST, JSON.stringify(playlist));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAYLIST);
      }
    } catch (e) {
      console.error('Error setting active playlist', e);
    }
  },

  getFavorites(): { live: string[]; movies: string[]; series: string[] } {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : { live: [], movies: [], series: [] };
    } catch {
      return { live: [], movies: [], series: [] };
    }
  },

  toggleFavorite(type: 'live' | 'movies' | 'series', id: string): boolean {
    try {
      const favs = this.getFavorites();
      const list = favs[type] || [];
      const index = list.indexOf(id);
      let isFav = false;
      if (index >= 0) {
        list.splice(index, 1);
        isFav = false;
      } else {
        list.push(id);
        isFav = true;
      }
      favs[type] = list;
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
      return isFav;
    } catch {
      return false;
    }
  },

  getWatchProgress(id: string): number {
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY) || '{}');
      return history[id] || 0;
    } catch {
      return 0;
    }
  },

  saveWatchProgress(id: string, time: number): void {
    try {
      const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY) || '{}');
      history[id] = time;
      localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving progress', e);
    }
  }
};
