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
      const isSeriesPattern = /(?:s\d{1,2}\s*e\d{1,2}|t\d{1,2}\s*e\d{1,2}|temporada\s*\d+|season\s*\d+|ep\s*\d+)/i;
      const isSeriesGroup = lowerGroup.includes('série') || lowerGroup.includes('series') || lowerGroup.includes('novela');
      const isMovieGroup = lowerGroup.includes('filme') || lowerGroup.includes('movie') || lowerGroup.includes('vod') || lowerGroup.includes('cinema');
      const isVideoFile = lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mkv') || lowerUrl.endsWith('.avi');

      if ((isSeriesGroup || isSeriesPattern.test(name)) && isVideoFile) {
        // Classify as Series
        seriesCatSet.add(group);
        
        // Extract series base name, season and episode
        const seriesMatch = name.match(/^(.*?)(?:[Ss](\d{1,2})[Ee](\d{1,2})|[Tt](\d{1,2})[Ee](\d{1,2})|Temporada\s*(\d+).*?Epis[oó]dio\s*(\d+)|-(\d+)x(\d+))/i);
        let baseSeriesName = name;
        let seasonNum = 1;
        let episodeNum = 1;

        if (seriesMatch) {
          baseSeriesName = (seriesMatch[1] || name).replace(/[-_.]/g, ' ').trim();
          seasonNum = parseInt(seriesMatch[2] || seriesMatch[4] || seriesMatch[6] || seriesMatch[8] || '1', 10);
          episodeNum = parseInt(seriesMatch[3] || seriesMatch[5] || seriesMatch[7] || seriesMatch[9] || '1', 10);
        }

        const seriesId = `series_${baseSeriesName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        const epItem: EpisodeItem = {
          id: `ep_${seriesId}_s${seasonNum}_e${episodeNum}_${Math.random().toString(36).substr(2, 4)}`,
          seasonNum,
          episodeNum,
          title: name,
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
              seasons: []
            },
            episodes: [{ season: seasonNum, episode: episodeNum, item: epItem }]
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
