export interface TopographyPoint {
  id: string;
  name: string;
  x: number; // Este / Longitude
  y: number; // Norte / Latitude
  z: number; // Cota / Altitude Ortometrica
  description: string; // Ex: TN, CERCA, POSTE, MEIO_FIO, etc.
  rodHeight?: number; // Altura do Bastão (m)
  deltaZ?: number; // Desnível em relação à Base ou RN
}

export interface BaseStation {
  name: string;
  x: number;
  y: number;
  z: number;
  antennaHeight: number;
  coordinateSystem: string; // ex: SIRGAS 2000 UTM 23S, 24S ou Local
  description?: string;
}

export interface ReferenceLevelMark {
  name: string;
  knownElevation: number; // Cota Oficial do RN (m)
  measuredElevation?: number; // Cota medida no campo (m)
  backSight?: number; // Visada a ré (leitura de mira)
  instrumentHeight?: number; // Altura do instrumento
  description?: string;
  error?: number; // Erro de fechamento altimétrico (m)
}

export interface Triangle {
  p1: TopographyPoint;
  p2: TopographyPoint;
  p3: TopographyPoint;
}

export interface ContourSegment {
  p1: { x: number; y: number; z: number };
  p2: { x: number; y: number; z: number };
  elevation: number;
  isMaster: boolean; // Curva mestra
}

export interface ContourSettings {
  equidistance: number; // Ex: 1.0 m, 0.5 m, 2.0 m
  masterInterval: number; // A cada 5 curvas, 1 é mestra (ex: 5x)
  showContours: boolean;
  showTriangles: boolean;
  showPoints: boolean;
  showElevations: boolean;
  showPointNames: boolean;
  showBaseAndRN: boolean;
  showMap: boolean; // Mapa de satélite / fundo
  mapProvider?: 'google_earth' | 'google_hybrid' | 'esri'; // Provedor do mapa (Google Earth por padrão)
  utmZone: number; // Fuso UTM (ex: 21, 22, 23, 24, 25)
}

