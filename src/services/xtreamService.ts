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
    // Remove porta padrão redundante (:80 no http, :443 no https) para evitar problemas de proxy e host header
    base = base.replace(/:80(?=\/|$)/, '').replace(/:443(?=\/|$)/, '');
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
      if (res.status === 500) {
        throw new Error('Servidor indisponível ou erro interno (500). Verifique suas credenciais ou tente novamente.');
      }
      if (res.status === 404) {
        throw new Error('Servidor ou rota não encontrada (404). Verifique se o usuário/senha estão corretos.');
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error('Acesso não autorizado (401/403). Usuário ou senha incorretos ou expirados.');
      }
      throw new Error(`Falha ao conectar no servidor (${res.status})`);
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

      // 1. Inicializar temporadas se informadas na chave seasons
      if (data.seasons && Array.isArray(data.seasons)) {
        data.seasons.forEach((s: any) => {
          const sNum = parseInt(s.season_number ?? s.season ?? '1', 10) || 1;
          seasonsMap.set(sNum, {
            seasonNumber: sNum,
            name: s.name || `Temporada ${sNum}`,
            episodes: [],
          });
        });
      }

      const parseEp = (ep: any, fallbackSeasonNum: number): EpisodeItem => {
        const ext = (ep.container_extension || ep.info?.container_extension || 'mp4').toString().replace(/^\.+/, '');
        const epId = ep.id ?? ep.stream_id ?? ep.episode_id;
        const sNum = parseInt(ep.season || ep.season_num || ep.season_number || fallbackSeasonNum || 1, 10) || fallbackSeasonNum || 1;
        const epNum = parseInt(ep.episode_num || ep.episode || ep.num || 1, 10) || 1;
        const directUrl = ep.direct_source || ep.stream_url || ep.url;
        const rawUrl = directUrl || `${this.serverUrl}/series/${this.username}/${this.password}/${epId}.${ext}`;

        return {
          id: `ep_${epId}`,
          episodeNum: epNum,
          seasonNum: sNum,
          title: ep.title || ep.name || `Episódio ${epNum}`,
          streamUrl: rawUrl,
          thumbnail: ep.info?.movie_image || ep.movie_image || ep.info?.cover || ep.cover,
          plot: ep.info?.plot || ep.plot,
          duration: ep.info?.duration || ep.duration,
          containerExtension: ext,
        };
      };

      // 2. Extrair episódios (Array direto ou Objeto chaveado por temporada/episódio)
      if (data.episodes) {
        if (Array.isArray(data.episodes)) {
          data.episodes.forEach((ep: any) => {
            const sNum = parseInt(ep.season || ep.season_num || ep.season_number || 1, 10) || 1;
            if (!seasonsMap.has(sNum)) {
              seasonsMap.set(sNum, {
                seasonNumber: sNum,
                name: `Temporada ${sNum}`,
                episodes: [],
              });
            }
            seasonsMap.get(sNum)!.episodes.push(parseEp(ep, sNum));
          });
        } else if (typeof data.episodes === 'object') {
          Object.entries(data.episodes).forEach(([seasonKey, epList]: [string, any]) => {
            const parsedNum = parseInt(String(seasonKey).replace(/\D+/g, '') || '1', 10) || 1;
            const sNum = isNaN(parsedNum) ? 1 : parsedNum;

            if (!seasonsMap.has(sNum)) {
              seasonsMap.set(sNum, {
                seasonNumber: sNum,
                name: `Temporada ${sNum}`,
                episodes: [],
              });
            }

            if (Array.isArray(epList)) {
              const episodes: EpisodeItem[] = epList.map((ep: any) => parseEp(ep, sNum));
              seasonsMap.get(sNum)!.episodes.push(...episodes);
            } else if (epList && typeof epList === 'object') {
              Object.values(epList).forEach((ep: any) => {
                seasonsMap.get(sNum)!.episodes.push(parseEp(ep, sNum));
              });
            }
          });
        }
      }

      if (seasonsMap.size === 0) {
        seasonsMap.set(1, {
          seasonNumber: 1,
          name: 'Temporada 1',
          episodes: [],
        });
      }

      // Ordenar episódios
      seasonsMap.forEach(season => {
        season.episodes.sort((a, b) => a.episodeNum - b.episodeNum);
      });

      // Filtrar temporadas com episódios
      let seasons = Array.from(seasonsMap.values()).sort((a, b) => a.seasonNumber - b.seasonNumber);
      const populatedSeasons = seasons.filter(s => s.episodes.length > 0);
      if (populatedSeasons.length > 0) {
        seasons = populatedSeasons;
      }

      return { seasons, info: data.info };
    } catch (e) {
      console.error('Error fetching series details', e);
      return { seasons: [] };
    }
  }
}
