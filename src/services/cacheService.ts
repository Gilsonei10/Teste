import { Category, LiveChannel, MovieItem, SeriesItem } from '../types/iptv';

export interface PlaylistCacheData {
  playlistId: string;
  liveCategories: Category[];
  liveChannels: LiveChannel[];
  movieCategories: Category[];
  movies: MovieItem[];
  seriesCategories: Category[];
  seriesList: SeriesItem[];
  savedAt: number;
}

const DB_NAME = 'playlive_iptv_db';
const DB_VERSION = 1;
const STORE_NAME = 'playlists_cache';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado no ambiente atual'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'playlistId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const CacheService = {
  /**
   * Salva os canais, filmes, séries e categorias de uma lista no cache persistente do dispositivo.
   */
  async savePlaylistCache(data: PlaylistCacheData): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(data);

        tx.oncomplete = () => {
          db.close();
          resolve();
        };

        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (e) {
      console.warn('[CacheService] Erro ao salvar lista no cache:', e);
    }
  },

  /**
   * Obtém os dados completos em cache de uma lista específica.
   */
  async getPlaylistCache(playlistId: string): Promise<PlaylistCacheData | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(playlistId);

        req.onsuccess = () => {
          db.close();
          resolve(req.result || null);
        };

        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      });
    } catch (e) {
      console.warn('[CacheService] Erro ao carregar lista do cache:', e);
      return null;
    }
  },

  /**
   * Remove os dados em cache de uma lista excluída.
   */
  async removePlaylistCache(playlistId: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(playlistId);

        tx.oncomplete = () => {
          db.close();
          resolve();
        };

        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (e) {
      console.warn('[CacheService] Erro ao remover cache da lista:', e);
    }
  },

  /**
   * Limpa todo o cache de listas salvas.
   */
  async clearAllCache(): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();

        tx.oncomplete = () => {
          db.close();
          resolve();
        };

        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (e) {
      console.warn('[CacheService] Erro ao limpar cache geral:', e);
    }
  },
};
