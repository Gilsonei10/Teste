import { Category } from '../types/iptv';

export type SortOption = 'default' | 'alpha_asc' | 'alpha_desc' | 'rating' | 'year';

/**
 * Limpa prefixos redundantes de categorias (ex: "FILMES | AÇÃO" -> "Ação", "SERIES | NETFLIX" -> "Netflix")
 */
export function cleanCategoryName(rawName: string): string {
  if (!rawName) return 'Geral';

  let clean = rawName
    .replace(/^\[.*?\]\s*/i, '')
    .replace(/^(?:filmes?|s[eé]ries?|vod|canais?|tv|iptv)\s*[|\-:/]\s*/i, '')
    .replace(/^(?:filmes?|s[eé]ries?|vod)\s+/i, '')
    .trim();

  // Normalizações de serviços de streaming e gêneros comuns
  const lower = clean.toLowerCase();
  if (lower === 'netflix' || lower.includes('netflix')) return 'Netflix';
  if (lower === 'amazon prime' || lower === 'prime video' || lower.includes('prime')) return 'Prime Video';
  if (lower === 'disney plus' || lower === 'disney+' || lower.includes('disney')) return 'Disney+';
  if (lower === 'hbo max' || lower === 'max' || lower.includes('hbo')) return 'Max (HBO)';
  if (lower === 'globoplay' || lower.includes('globoplay')) return 'Globoplay';
  if (lower === 'apple plus' || lower === 'apple tv' || lower.includes('apple')) return 'Apple TV+';
  if (lower === 'paramount plus' || lower === 'paramount+' || lower.includes('paramount')) return 'Paramount+';
  if (lower === 'discovery plus' || lower.includes('discovery')) return 'Discovery+';
  if (lower === 'animes' || lower.includes('anime')) return 'Animes';
  if (lower === 'doramas' || lower.includes('dorama')) return 'Doramas';
  if (lower === 'novelas' || lower.includes('novela')) return 'Novelas';
  if (lower === '4k' || lower.includes('4k') || lower.includes('ultra hd')) return '4K Ultra HD';
  if (lower.includes('lançamento') || lower.includes('lancamento') || lower.includes('novos')) return 'Lançamentos';

  return clean || rawName;
}

/**
 * Remove tags desnecessárias do título (ex: "[FHD]", "[Dual]", "1080p") para uma exibição limpa
 */
export function cleanMediaTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\[(?:fhd|hd|sd|4k|uhd|hevc|h265|dual|legendado|dublado|1080p|720p|web-dl|bluray)\]/gi, '')
    .replace(/\((?:fhd|hd|sd|4k|uhd|hevc|h265|dual|legendado|dublado|1080p|720p|web-dl|bluray)\)/gi, '')
    .replace(/\b(?:fhd|1080p|720p|4k|dual\s*áudio|legendado|dublado)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai o ano do título se não estiver explícito
 */
export function extractYear(title?: string, existingYear?: string | number): string | undefined {
  if (existingYear && String(existingYear).length === 4) {
    return String(existingYear);
  }
  if (!title) return undefined;
  const match = title.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : undefined;
}

/**
 * Ordena lista de filmes ou séries
 */
export function sortMediaItems<T extends { name: string; title?: string; rating?: number | string; year?: string | number }>(
  items: T[],
  sortBy: SortOption
): T[] {
  const result = [...items];

  switch (sortBy) {
    case 'alpha_asc':
      return result.sort((a, b) => {
        const nameA = (a.title || a.name || '').toLowerCase();
        const nameB = (b.title || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'pt-BR');
      });

    case 'alpha_desc':
      return result.sort((a, b) => {
        const nameA = (a.title || a.name || '').toLowerCase();
        const nameB = (b.title || b.name || '').toLowerCase();
        return nameB.localeCompare(nameA, 'pt-BR');
      });

    case 'rating':
      return result.sort((a, b) => {
        const numA = typeof a.rating === 'number' ? a.rating : parseFloat(String(a.rating || 0)) || 0;
        const numB = typeof b.rating === 'number' ? b.rating : parseFloat(String(b.rating || 0)) || 0;
        return numB - numA;
      });

    case 'year':
      return result.sort((a, b) => {
        const yearA = parseInt(String(extractYear(a.title || a.name, a.year) || '0'), 10);
        const yearB = parseInt(String(extractYear(b.title || b.name, b.year) || '0'), 10);
        return yearB - yearA;
      });

    case 'default':
    default:
      return result;
  }
}

/**
 * Ordena as categorias priorizando streaming e categorias populares, seguidas por ordem alfabética
 */
export function sortCategories(categories: Category[]): Category[] {
  const priorityOrder = [
    'lançamentos',
    'destaques',
    'netflix',
    'prime video',
    'max (hbo)',
    'disney+',
    'globoplay',
    'apple tv+',
    'paramount+',
    '4k ultra hd',
    'cinema',
    'ação',
    'acao',
    'comédia',
    'comedia',
    'ficção',
    'terror',
    'suspense',
    'drama',
    'infantil',
    'família',
    'animes',
    'doramas',
    'novelas',
    'documentários',
    'documentarios',
  ];

  return [...categories].sort((a, b) => {
    const cleanA = cleanCategoryName(a.name).toLowerCase();
    const cleanB = cleanCategoryName(b.name).toLowerCase();

    const indexA = priorityOrder.findIndex(p => cleanA.includes(p));
    const indexB = priorityOrder.findIndex(p => cleanB.includes(p));

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return cleanA.localeCompare(cleanB, 'pt-BR');
  });
}
