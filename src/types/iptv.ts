export type ContentType = 'live' | 'movie' | 'series';

export interface Category {
  id: string;
  name: string;
  type: ContentType;
}

export interface LiveChannel {
  id: string;
  name: string;
  num?: number | string;
  streamId?: number | string;
  streamUrl: string;
  logo?: string;
  category: string;
  categoryId?: string;
  epgChannelId?: string;
  currentProgram?: string;
  isFavorite?: boolean;
}

export interface MovieItem {
  id: string;
  streamId?: number | string;
  name: string;
  title?: string;
  streamUrl: string;
  poster?: string;
  backdrop?: string;
  category: string;
  categoryId?: string;
  rating?: string | number;
  year?: string;
  duration?: string;
  genre?: string;
  plot?: string;
  director?: string;
  cast?: string;
  containerExtension?: string;
  isFavorite?: boolean;
}

export interface EpisodeItem {
  id: string;
  episodeNum: number;
  seasonNum: number;
  title: string;
  streamUrl: string;
  thumbnail?: string;
  plot?: string;
  duration?: string;
  containerExtension?: string;
}

export interface SeasonItem {
  seasonNumber: number;
  name: string;
  episodes: EpisodeItem[];
}

export interface SeriesItem {
  id: string;
  seriesId?: number | string;
  name: string;
  title?: string;
  poster?: string;
  backdrop?: string;
  category: string;
  categoryId?: string;
  rating?: string | number;
  year?: string;
  genre?: string;
  plot?: string;
  director?: string;
  cast?: string;
  seasons?: SeasonItem[];
  isFavorite?: boolean;
}

export interface XtreamCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface SavedPlaylist {
  id: string;
  name: string;
  type: 'xtream' | 'm3u_url' | 'm3u_file' | 'demo';
  credentials?: XtreamCredentials;
  url?: string;
  createdAt: number;
}

export interface AppSettings {
  corsProxyUrl: string;
  useCorsProxy: boolean;
  tvMode: boolean; // Enables larger UI fonts/buttons for 10-foot TV experience
  bufferLengthSeconds: number;
  aspectRatio: 'contain' | 'cover' | 'fill' | '16:9' | '4:3';
  autoPlayNextEpisode: boolean;
}
