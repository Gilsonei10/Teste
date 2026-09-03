import { Category, LiveChannel, MovieItem, SeriesItem, SeasonItem, EpisodeItem } from '../types/iptv';

export interface ParsedM3UResult {
  liveCategories: Category[];
  liveChannels: LiveChannel[];
  movieCategories: Category[];
  movies: MovieItem[];
  seriesCategories: Category[];
  series: SeriesItem[];
}

export function parseM3U(content: string): ParsedM3UResult {
  const lines = content.split(/\r?\n/);
  
  const liveChannels: LiveChannel[] = [];
  const movies: MovieItem[] = [];
  const seriesMap: Map<string, { series: SeriesItem; episodes: { season: number; episode: number; item: EpisodeItem }[] }> = new Map();
  
  const liveCatSet = new Set<string>();
  const movieCatSet = new Set<string>();
  const seriesCatSet = new Set<string>();

  let currentExtInf: {
    tvgId?: string;
    tvgName?: string;
    tvgLogo?: string;
    groupTitle?: string;
    name: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      // Parse EXTINF attributes
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/i);

      // Channel name is after the last comma
      const commaIndex = line.lastIndexOf(',');
      const rawName = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal';

      currentExtInf = {
        tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
        tvgName: tvgNameMatch ? tvgNameMatch[1] : undefined,
        tvgLogo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
        groupTitle: groupTitleMatch ? groupTitleMatch[1].trim() : 'Geral',
        name: rawName,
      };
    } else if (!line.startsWith('#') && currentExtInf) {
      // It's the stream URL
      const streamUrl = line;
      const group = currentExtInf.groupTitle || 'Geral';
      const name = currentExtInf.name || currentExtInf.tvgName || 'Sem Nome';
      const logo = currentExtInf.tvgLogo;
      const lowerGroup = group.toLowerCase();
      const lowerUrl = streamUrl.toLowerCase();

      // Detection heuristic for Series, Movies and Live
      const cleanUrlPath = streamUrl.split('?')[0].toLowerCase();
      const isVideoFile =
        cleanUrlPath.endsWith('.mp4') ||
        cleanUrlPath.endsWith('.mkv') ||
        cleanUrlPath.endsWith('.avi') ||
        cleanUrlPath.endsWith('.ts') ||
        cleanUrlPath.endsWith('.m3u8') ||
        cleanUrlPath.endsWith('.webm') ||
        cleanUrlPath.endsWith('.mov') ||
        cleanUrlPath.endsWith('.m4v') ||
        lowerUrl.includes('/series/') ||
        lowerUrl.includes('/movie/');

      const isSeriesPattern = /(?:[SsTt]\d{1,2}[\s._-]*[Ee][Pp]?\d{1,3}|temporada\s*\d+|season\s*\d+|epis[oó]dio\s*\d+|\b\d{1,2}x\d{1,3}\b)/i;
      const isSeriesGroup =
        lowerGroup.includes('série') ||
        lowerGroup.includes('series') ||
        lowerGroup.includes('novela') ||
        lowerGroup.includes('netflix') ||
        lowerGroup.includes('prime') ||
        lowerGroup.includes('disney') ||
        lowerGroup.includes('hbo') ||
        lowerGroup.includes('max') ||
        lowerGroup.includes('apple') ||
        lowerGroup.includes('paramount') ||
        lowerGroup.includes('globoplay');

      const isMovieGroup =
        lowerGroup.includes('filme') ||
        lowerGroup.includes('movie') ||
        lowerGroup.includes('vod') ||
        lowerGroup.includes('cinema');

      const isExplicitSeries = (isSeriesGroup || isSeriesPattern.test(name) || lowerUrl.includes('/series/')) && !isMovieGroup;

      if (isExplicitSeries && isVideoFile) {
        // Classify as Series
        seriesCatSet.add(group);

        // Limpar prefixos e extrair série base, temporada e episódio
        let cleanName = name.replace(/^\[.*?\]\s*|^[A-Za-z0-9_+\- ]+\|\s*/i, '').trim();

        const sMatch =
          cleanName.match(/^(.*?)(?:[-_\s.]+)?(?:[Ss]eason|[Tt]emporada|[Tt]emp)?\s*(?:[SsTt](\d{1,2})|(\d{1,2}))\s*(?:[Ee][Pp]?|[Xx]|[-_.:]|Epis[oó]dio|[Ee]pisode)\s*(\d{1,3})(.*)$/i) ||
          cleanName.match(/^(.*?)(?:[-_\s.]+)?(?:[Ss](\d{1,2})|[Tt](\d{1,2}))[\s._-]*[Ee](\d{1,3})(.*)$/i) ||
          cleanName.match(/^(.*?)(?:[-_\s.]+)?(\d{1,2})x(\d{1,3})(.*)$/i);

        let baseSeriesName = cleanName;
        let seasonNum = 1;
        let episodeNum = 1;
        let epTitle = name;

        if (sMatch) {
          baseSeriesName = (sMatch[1] || cleanName).replace(/[-_.]/g, ' ').trim();
          seasonNum = parseInt(sMatch[2] || sMatch[3] || '1', 10) || 1;
          episodeNum = parseInt(sMatch[4] || '1', 10) || 1;
          const extraInfo = (sMatch[5] || '').replace(/^[\s\-_:]+/, '').trim();
          if (extraInfo) {
            epTitle = `Episódio ${episodeNum}: ${extraInfo}`;
          }
        }

        if (!baseSeriesName) {
          baseSeriesName = name;
        }

        const seriesId = `series_${baseSeriesName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        const epItem: EpisodeItem = {
          id: `ep_${seriesId}_s${seasonNum}_e${episodeNum}_${Math.random().toString(36).substr(2, 4)}`,
          seasonNum,
          episodeNum,
          title: epTitle,
          streamUrl,
          thumbnail: logo,
        };

        if (!seriesMap.has(seriesId)) {
          seriesMap.set(seriesId, {
            series: {
              id: seriesId,
              name: baseSeriesName,
              title: baseSeriesName,
              poster: logo,
              category: group,
              seasons: [],
            },
            episodes: [{ season: seasonNum, episode: episodeNum, item: epItem }],
          });
        } else {
          seriesMap.get(seriesId)!.episodes.push({ season: seasonNum, episode: episodeNum, item: epItem });
          if (!seriesMap.get(seriesId)!.series.poster && logo) {
            seriesMap.get(seriesId)!.series.poster = logo;
          }
        }
      } else if (isMovieGroup || (isVideoFile && !lowerGroup.includes('ao vivo') && !lowerGroup.includes('live'))) {
        // Classify as Movie / VOD
        movieCatSet.add(group);
        movies.push({
          id: `movie_${movies.length + 1}_${Math.random().toString(36).substr(2, 5)}`,
          name,
          title: name,
          streamUrl,
          poster: logo,
          category: group,
        });
      } else {
        // Classify as Live TV Channel
        liveCatSet.add(group);
        liveChannels.push({
          id: `live_${liveChannels.length + 1}_${Math.random().toString(36).substr(2, 5)}`,
          name,
          streamUrl,
          logo,
          category: group,
          epgChannelId: currentExtInf.tvgId,
        });
      }

      currentExtInf = null;
    }
  }

  // Finalize series seasons structure
  const seriesList: SeriesItem[] = [];
  seriesMap.forEach(({ series, episodes }) => {
    const seasonsMap: Map<number, EpisodeItem[]> = new Map();
    episodes.forEach(ep => {
      if (!seasonsMap.has(ep.season)) {
        seasonsMap.set(ep.season, []);
      }
      seasonsMap.get(ep.season)!.push(ep.item);
    });

    const seasons: SeasonItem[] = [];
    seasonsMap.forEach((eps, seasonNum) => {
      eps.sort((a, b) => a.episodeNum - b.episodeNum);
      seasons.push({
        seasonNumber: seasonNum,
        name: `Temporada ${seasonNum}`,
        episodes: eps,
      });
    });

    seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    series.seasons = seasons;
    seriesList.push(series);
  });

  const liveCategories: Category[] = Array.from(liveCatSet).map(c => ({ id: c, name: c, type: 'live' }));
  const movieCategories: Category[] = Array.from(movieCatSet).map(c => ({ id: c, name: c, type: 'movie' }));
  const seriesCategories: Category[] = Array.from(seriesCatSet).map(c => ({ id: c, name: c, type: 'series' }));

  return {
    liveCategories,
    liveChannels,
    movieCategories,
    movies,
    seriesCategories,
    series: seriesList,
  };
}
