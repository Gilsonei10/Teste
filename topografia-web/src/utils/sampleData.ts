import type { TopographyPoint, BaseStation, ReferenceLevelMark } from '../types/topography';

export const SAMPLE_BASE: BaseStation = {
  name: 'BASE-01',
  x: 250000.0,
  y: 7420000.0,
  z: 785.45,
  antennaHeight: 1.80,
  coordinateSystem: 'SIRGAS 2000 UTM 23S',
  description: 'Marco Geodésico de Concreto Base RTK',
};

export const SAMPLE_RN: ReferenceLevelMark = {
  name: 'RN-12B',
  knownElevation: 784.120, // Cota oficial
  measuredElevation: 784.128, // Cota medida
  backSight: 1.450,
  instrumentHeight: 1.550,
  description: 'Pino de Latão em Cabeceira de Ponte',
};

/**
 * Generates an interesting topographic terrain (hill + gentle slope + depression)
 */
export function generateSampleSurvey(): TopographyPoint[] {
  const points: TopographyPoint[] = [];
  const originX = 250000;
  const originY = 7420000;

  // Grid coordinates spanning 120m x 120m
  const rows = 8;
  const cols = 8;
  const step = 15; // 15 meters between points

  let idCounter = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Add slight jitter for realistic surveying points
      const jitterX = (Math.sin(r * 3 + c * 7) * 2.5);
      const jitterY = (Math.cos(r * 5 + c * 2) * 2.5);

      const x = originX + c * step + jitterX;
      const y = originY + r * step + jitterY;

      // Realistic topographic elevation function:
      // Base elevation 780m + a hill in the north-east + slope to the south-west
      const distFromHillCenter = Math.hypot(c - 5.5, r - 5.5);
      const hillHeight = Math.max(0, 16 * Math.exp(-0.25 * (distFromHillCenter ** 2)));
      
      const valley = 3.5 * Math.sin(c * 0.5) * Math.cos(r * 0.4);
      const slope = (r * 0.8) + (c * 0.3);

      const z = Math.round((778.0 + hillHeight + slope + valley) * 100) / 100;

      let desc = 'TN';
      if (r === 0) desc = 'CERCA';
      if (r === rows - 1) desc = 'DIVISA';
      if (c === 0 && r % 2 === 0) desc = 'POSTE';
      if (distFromHillCenter < 1.5) desc = 'TOPO';

      points.push({
        id: `sample_${idCounter}`,
        name: `P${idCounter}`,
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        z,
        description: desc,
        deltaZ: Math.round((z - SAMPLE_RN.knownElevation) * 1000) / 1000,
      });

      idCounter++;
    }
  }

  return points;
}
