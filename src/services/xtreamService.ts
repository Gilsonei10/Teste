import { Category, LiveChannel, MovieItem, SeriesItem, SeasonItem, EpisodeItem, XtreamCredentials, AppSettings } from '../types/iptv';

export interface XtreamAuthResponse {
  user_info: {
    username: string;
    status: string;
    exp_date?: string;
    is_trial?: string;
    active_cons?: string;
    max_connections?: string;
  };
  server_info: {
    url?: string;
    port?: string;
    https_port?: string;
    server_protocol?: string;
    timezone?: string;
  };
}

export class XtreamService {
  private serverUrl: string;
  private username: string;
  private password: string;
  private settings: AppSettings;

  constructor(credentials: XtreamCredentials, settings: AppSettings) {
    let base = credentials.serverUrl.trim();
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `http://${base}`;
    }
    this.serverUrl = base.replace(/\/+$/, '');
    this.username = credentials.username.trim();
    this.password = credentials.password.trim();
    this.settings = settings;
  }

  private buildApiUrl(action?: string, params?: Record<string, string>): string {
    let url = `${this.serverUrl}/player_api.php?username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`;
    if (action) {
      url += `&action=${action}`;
    }
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        url += `&${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
      });
    }
    if (this.settings.useCorsProxy && this.settings.corsProxyUrl) {
      return `${this.settings.corsProxyUrl}${encodeURIComponent(url)}`;
    }
    return url;
  }

  async authenticate(): Promise<XtreamAuthResponse> {
    const url = this.buildApiUrl();
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Falha ao conectar no servidor Xtream (${res.status})`);
    }
    const data = await res.json();
    if (data.user_info && data.user_info.auth === 0) {
      throw new Error('Usuário ou senha incorretos');
    }
    return data;
  }

  async getLiveCategories(): Promise<Category[]> {
    try {
      const url = this.buildApiUrl('get_live_categories');
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: String(item.category_id),
        name: item.category_name,
        type: 'live',
      }));
    } catch (e) {
      console.error('Error fetching live categories', e);
      return [];
    }
  }

  async getLiveStreams(categoryId?: string): Promise<LiveChannel[]> {
    try {
      const params = categoryId && categoryId !== 'all' ? { category_id: categoryId } : undefined;
      const url = this.buildApiUrl('get_live_streams', params);
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => {
        const streamId = item.stream_id;
        const rawUrl = `${this.serverUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`;
        return {
          id: `live_${streamId}`,
          streamId: streamId,
          num: item.num,
          name: item.name || 'Canal',
          streamUrl: rawUrl,
          logo: item.stream_icon,
          category: item.category_name || 'Geral',
          categoryId: String(item.category_id),
          epgChannelId: item.epg_channel_id,
        };
      });
    } catch (e) {
      console.error('Error fetching live streams', e);
      return [];
    }
  }

  async getMovieCategories(): Promise<Category[]> {
    try {
      const url = this.buildApiUrl('get_vod_categories');
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: String(item.category_id),
        name: item.category_name,
        type: 'movie',
      }));
    } catch (e) {
      console.error('Error fetching movie categories', e);
      return [];
    }
  }

  async getMovies(categoryId?: string): Promise<MovieItem[]> {
    try {
      const params = categoryId && categoryId !== 'all' ? { category_id: categoryId } : undefined;
      const url = this.buildApiUrl('get_vod_streams', params);
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => {
        const streamId = item.stream_id;
        const ext = item.container_extension || 'mp4';
        const rawUrl = `${this.serverUrl}/movie/${this.username}/${this.password}/${streamId}.${ext}`;
        return {
          id: `movie_${streamId}`,
          streamId: streamId,
          name: item.name || 'Filme',
          title: item.name,
          streamUrl: rawUrl,
          poster: item.stream_icon,
          category: item.category_name || 'Geral',
          categoryId: String(item.category_id),
          rating: item.rating_5based || item.rating,
          containerExtension: ext,
        };
      });
    } catch (e) {
      console.error('Error fetching movies', e);
      return [];
    }
  }

  async getSeriesCategories(): Promise<Category[]> {
    try {
      const url = this.buildApiUrl('get_series_categories');
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        id: String(item.category_id),
        name: item.category_name,
        type: 'series',
      }));
    } catch (e) {
      console.error('Error fetching series categories', e);
      return [];
    }
  }

  async getSeries(categoryId?: string): Promise<SeriesItem[]> {
    try {
      const params = categoryId && categoryId !== 'all' ? { category_id: categoryId } : undefined;
      const url = this.buildApiUrl('get_series', params);
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        id: `series_${item.series_id}`,
        seriesId: item.series_id,
        name: item.name || 'Série',
        title: item.name,
        poster: item.cover,
        backdrop: Array.isArray(item.backdrop_path) ? item.backdrop_path[0] : item.backdrop_path,
        category: item.category_name || 'Geral',
        categoryId: String(item.category_id),
        rating: item.rating_5based || item.rating,
        plot: item.plot,
        genre: item.genre,
        year: item.releaseDate,
        director: item.director,
        cast: item.cast,
      }));
    } catch (e) {
      console.error('Error fetching series', e);
      return [];
    }
  }

  async getSeriesDetails(seriesId: string | number): Promise<{ seasons: SeasonItem[]; info?: any }> {
    try {
      const url = this.buildApiUrl('get_series_info', { series_id: String(seriesId) });
      const res = await fetch(url);
      const data = await res.json();

      const seasonsMap: Map<number, SeasonItem> = new Map();

      if (data.seasons && Array.isArray(data.seasons)) {
        data.seasons.forEach((s: any) => {
          const sNum = parseInt(s.season_number, 10);
          seasonsMap.set(sNum, {
            seasonNumber: sNum,
            name: s.name || `Temporada ${sNum}`,
            episodes: [],
          });
        });
      }

      if (data.episodes && typeof data.episodes === 'object') {
        Object.entries(data.episodes).forEach(([seasonKey, epList]: [string, any]) => {
          const sNum = parseInt(seasonKey, 10);
          if (!seasonsMap.has(sNum)) {
            seasonsMap.set(sNum, {
              seasonNumber: sNum,
              name: `Temporada ${sNum}`,
              episodes: [],
            });
          }

          if (Array.isArray(epList)) {
            const episodes: EpisodeItem[] = epList.map((ep: any) => {
              const ext = ep.container_extension || 'mp4';
              const rawUrl = `${this.serverUrl}/series/${this.username}/${this.password}/${ep.id}.${ext}`;
              return {
                id: `ep_${ep.id}`,
                episodeNum: parseInt(ep.episode_num, 10) || 1,
                seasonNum: sNum,
                title: ep.title || `Episódio ${ep.episode_num}`,
                streamUrl: rawUrl,
                thumbnail: ep.info?.movie_image,
                plot: ep.info?.plot,
                duration: ep.info?.duration,
                containerExtension: ext,
              };
            });
            seasonsMap.get(sNum)!.episodes = episodes;
          }
        });
      }

      const seasons = Array.from(seasonsMap.values()).sort((a, b) => a.seasonNumber - b.seasonNumber);
      return { seasons, info: data.info };
    } catch (e) {
      console.error('Error fetching series details', e);
      return { seasons: [] };
    }
  }
}
