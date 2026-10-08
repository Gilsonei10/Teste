export type RNType = 'marco_concreto' | 'chapa_metalica' | 'pino_rocha' | 'vertice_ibge' | 'local';

export interface RNBenchmark {
  id: string;
  code: string;
  name: string;
  type: RNType;
  x: number; // Este (m) UTM
  y: number; // Norte (m) UTM
  z: number; // Cota Oficial Ortométrica (m)
  latitude?: number;
  longitude?: number;
  municipality?: string;
  description?: string;
}

export interface RNDetectionResult {
  benchmark: RNBenchmark;
  distance: number; // metros
  azimuth: number; // graus (0 a 360)
  directionLabel: string;
  deltaZ: number; // desnível z_atual - z_rn
  isDetected: boolean;
  status: 'occupied' | 'nearby' | 'far'; // occupied <= tolerance, nearby <= 20m, far > 20m
}

export type GPSStatus = 'idle' | 'searching' | 'active' | 'error' | 'denied';

export interface GPSPositionData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null; // precisão horizontal (m)
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  utmX: number;
  utmY: number;
}
