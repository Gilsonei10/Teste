import type { RNBenchmark, RNDetectionResult } from '../types/rnDetector';

/**
 * Calculates 2D Euclidean Distance (horizontal distance in meters)
 */
export function calculateDistance2D(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Calculates Topographic Azimuth (0° to 360° from True North clockwise)
 * Northing = Y, Easting = X
 */
export function calculateAzimuth(fromX: number, fromY: number, toX: number, toY: number): number {
  const dx = toX - fromX;
  const dy = toY - fromY;
  let rad = Math.atan2(dx, dy);
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) {
    deg += 360;
  }
  return Math.round(deg * 10) / 10;
}

/**
 * Returns cardinal / intercardinal direction label for an azimuth
 */
export function getAzimuthLabel(azimuthDeg: number): string {
  const normalized = (azimuthDeg % 360 + 360) % 360;
  const directions = [
    { label: 'Norte (N)', min: 348.75, max: 360 },
    { label: 'Norte (N)', min: 0, max: 11.25 },
    { label: 'Norte-Nordeste (NNE)', min: 11.25, max: 33.75 },
    { label: 'Nordeste (NE)', min: 33.75, max: 56.25 },
    { label: 'Leste-Nordeste (ENE)', min: 56.25, max: 78.75 },
    { label: 'Leste (L/E)', min: 78.75, max: 101.25 },
    { label: 'Leste-Sudeste (ESE)', min: 101.25, max: 123.75 },
    { label: 'Sudeste (SE)', min: 123.75, max: 146.25 },
    { label: 'Sul-Sudeste (SSE)', min: 146.25, max: 168.75 },
    { label: 'Sul (S)', min: 168.75, max: 191.25 },
    { label: 'Sul-Sudoeste (SSO)', min: 191.25, max: 213.75 },
    { label: 'Sudoeste (SO)', min: 213.75, max: 236.25 },
    { label: 'Oeste-Sudoeste (OSO)', min: 236.25, max: 258.75 },
    { label: 'Oeste (O/W)', min: 258.75, max: 281.25 },
    { label: 'Oeste-Noroeste (ONO)', min: 281.25, max: 303.75 },
    { label: 'Noroeste (NO)', min: 303.75, max: 326.25 },
    { label: 'Norte-Noroeste (NNO)', min: 326.25, max: 348.75 },
  ];

  for (const d of directions) {
    if (normalized >= d.min && normalized < d.max) {
      return d.label;
    }
  }
  return 'Norte (N)';
}

/**
 * Evaluates and detects all registered benchmarks relative to current GNSS position
 */
export function detectNearbyRNs(
  currentX: number,
  currentY: number,
  currentZ: number,
  benchmarks: RNBenchmark[],
  toleranceMeters: number = 2.0
): RNDetectionResult[] {
  return benchmarks
    .map((bm) => {
      const distance = Math.round(calculateDistance2D(currentX, currentY, bm.x, bm.y) * 100) / 100;
      const azimuth = calculateAzimuth(currentX, currentY, bm.x, bm.y);
      const directionLabel = getAzimuthLabel(azimuth);
      const deltaZ = Math.round((currentZ - bm.z) * 1000) / 1000;
      const isDetected = distance <= toleranceMeters;

      let status: 'occupied' | 'nearby' | 'far' = 'far';
      if (isDetected) {
        status = 'occupied';
      } else if (distance <= 25.0) {
        status = 'nearby';
      }

      return {
        benchmark: bm,
        distance,
        azimuth,
        directionLabel,
        deltaZ,
        isDetected,
        status,
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Pre-configured reference level marks (Marcos Geodésicos de Referência)
 */
export const SAMPLE_BENCHMARKS: RNBenchmark[] = [
  {
    id: 'rn-01',
    code: 'RN-12B',
    name: 'Marco RN-12B (Cabeceira de Ponte)',
    type: 'chapa_metalica',
    x: 250000.85,
    y: 7420001.20,
    z: 784.120,
    municipality: 'Região Operacional',
    description: 'Pino de latão cravado em estrutura de concreto na cabeceira da ponte',
  },
  {
    id: 'rn-02',
    code: 'SAT-93452',
    name: 'Vértice Geodésico IBGE 93452',
    type: 'vertice_ibge',
    x: 250042.10,
    y: 7420065.50,
    z: 788.640,
    municipality: 'Rede Geodésica Nacional',
    description: 'Marco tronco piramidal com chapa esmaltada do IBGE',
  },
  {
    id: 'rn-03',
    code: 'RN-15',
    name: 'Marco de Concreto RN-15',
    type: 'marco_concreto',
    x: 249915.40,
    y: 7419940.80,
    z: 781.450,
    municipality: 'Setor Sul',
    description: 'Marco de concreto cravado no limite da cerca da propriedade',
  },
  {
    id: 'rn-04',
    code: 'RN-20',
    name: 'Pino em Rocha RN-20 (Crista)',
    type: 'pino_rocha',
    x: 250125.00,
    y: 7420130.00,
    z: 792.830,
    municipality: 'Afloramento Rochoso',
    description: 'Pino de aço cravado em afloramento de rocha sã',
  },
  {
    id: 'rn-05',
    code: 'RN-LOC-01',
    name: 'RN de Obra 01 (Estaca Zero)',
    type: 'local',
    x: 250012.30,
    y: 7419985.70,
    z: 783.950,
    municipality: 'Canteiro de Obras',
    description: 'Piquete cravado com testemunha e prego de aço',
  }
];
