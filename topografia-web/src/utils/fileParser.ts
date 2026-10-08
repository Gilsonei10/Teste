import type { TopographyPoint } from '../types/topography';

export interface ParseResult {
  points: TopographyPoint[];
  errors: string[];
}

/**
 * Parses raw text from CSV / TXT survey data
 */
export function parseSurveyFile(
  content: string,
  isNorthFirst: boolean = false
): ParseResult {
  const lines = content.split(/\r?\n/);
  const points: TopographyPoint[] = [];
  const errors: string[] = [];

  let index = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('//')) {
      continue;
    }

    // Try delimiters: tab, semicolon, comma, multiple spaces
    let parts: string[] = [];
    if (rawLine.includes('\t')) {
      parts = rawLine.split('\t').map(s => s.trim()).filter(Boolean);
    } else if (rawLine.includes(';')) {
      parts = rawLine.split(';').map(s => s.trim()).filter(Boolean);
    } else if (rawLine.includes(',')) {
      parts = rawLine.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      parts = rawLine.split(/\s+/).map(s => s.trim()).filter(Boolean);
    }

    if (parts.length < 3) {
      continue;
    }

    // Check if line is a header (contains non-numeric coordinates)
    const val2 = parseFloat(parts[1].replace(',', '.'));
    const val3 = parseFloat(parts[2].replace(',', '.'));

    // If both 2nd and 3rd aren't numbers, it's probably a header line
    if (isNaN(val2) && isNaN(val3)) {
      continue;
    }

    let name = '';
    let coordX = 0;
    let coordY = 0;
    let coordZ = 0;
    let desc = '';

    if (parts.length >= 4) {
      // Format: ID, X, Y, Z, [Desc] or ID, Y, X, Z, [Desc]
      name = parts[0];
      const c1 = parseFloat(parts[1].replace(',', '.'));
      const c2 = parseFloat(parts[2].replace(',', '.'));
      coordZ = parseFloat(parts[3].replace(',', '.'));
      desc = parts.slice(4).join(' ');

      // Detecção inteligente UTM: no Brasil e hemisfério sul, Norte é > 1.000.000m e Este é entre 160.000m e 840.000m.
      // Se c1 > 1.000.000 e c2 < 1.000.000, é inquestionavelmente Norte primeiro (N, E, Z).
      const detectNorth = isNorthFirst || (c1 > 1000000 && c2 < 1000000);
      if (detectNorth) {
        coordY = c1;
        coordX = c2;
      } else {
        coordX = c1;
        coordY = c2;
      }
    } else if (parts.length === 3) {
      // Format: X, Y, Z (auto-generate ID)
      name = `P${index}`;
      const c1 = parseFloat(parts[0].replace(',', '.'));
      const c2 = parseFloat(parts[1].replace(',', '.'));
      coordZ = parseFloat(parts[2].replace(',', '.'));

      const detectNorth = isNorthFirst || (c1 > 1000000 && c2 < 1000000);
      if (detectNorth) {
        coordY = c1;
        coordX = c2;
      } else {
        coordX = c1;
        coordY = c2;
      }
    }

    if (isNaN(coordX) || isNaN(coordY) || isNaN(coordZ)) {
      errors.push(`Linha ${i + 1} inválida: "${rawLine}"`);
      continue;
    }

    points.push({
      id: `pt_${Date.now()}_${index}`,
      name: name || `P${index}`,
      x: coordX,
      y: coordY,
      z: coordZ,
      description: desc || 'TN',
    });

    index++;
  }

  return { points, errors };
}

/**
 * Exports points to a CSV formatted string
 */
export function exportToCSV(points: TopographyPoint[], isNorthFirst: boolean = false): string {
  const header = isNorthFirst 
    ? 'Ponto;Norte (Y);Este (X);Cota (Z);Descricao;Desnivel (dZ)' 
    : 'Ponto;Este (X);Norte (Y);Cota (Z);Descricao;Desnivel (dZ)';
  
  const rows = points.map(pt => {
    const c1 = isNorthFirst ? pt.y.toFixed(3) : pt.x.toFixed(3);
    const c2 = isNorthFirst ? pt.x.toFixed(3) : pt.y.toFixed(3);
    const dz = pt.deltaZ !== undefined ? pt.deltaZ.toFixed(3) : '';
    return `${pt.name};${c1};${c2};${pt.z.toFixed(3)};${pt.description};${dz}`;
  });

  return [header, ...rows].join('\r\n');
}
