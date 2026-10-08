// Geodesic conversion between UTM (SIRGAS 2000 / WGS84) and Geographic Coordinates (Lat/Lon)
// WGS84 / GRS80 Ellipsoid constants
const a = 6378137.0; // semi-major axis
const f = 1 / 298.257223563; // flattening
const b = a * (1 - f);
const eSq = (a * a - b * b) / (a * a);
const ePrimeSq = (a * a - b * b) / (b * b);
const k0 = 0.9996; // UTM scale factor

/**
 * Converts UTM coordinates (Easting, Northing) to Latitude / Longitude (degrees)
 */
export function utmToLatLon(
  easting: number,
  northing: number,
  zone: number = 23,
  isSouthernHemisphere: boolean = true
): { lat: number; lon: number } {
  const x = easting - 500000.0; // remove false easting
  const y = isSouthernHemisphere ? northing - 10000000.0 : northing; // remove false northing

  const m = y / k0;
  const mu = m / (a * (1 - eSq / 4 - 3 * eSq * eSq / 64 - 5 * eSq * eSq * eSq / 256));

  const e1 = (1 - Math.sqrt(1 - eSq)) / (1 + Math.sqrt(1 - eSq));

  const j1 = 3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32;
  const j2 = 21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32;
  const j3 = 151 * Math.pow(e1, 3) / 96;
  const j4 = 1097 * Math.pow(e1, 4) / 512;

  const fp = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu);

  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);

  const c1 = ePrimeSq * cosFp * cosFp;
  const t1 = tanFp * tanFp;
  const n1 = a / Math.sqrt(1 - eSq * sinFp * sinFp);
  const r1 = a * (1 - eSq) / Math.pow(1 - eSq * sinFp * sinFp, 1.5);
  const d = x / (n1 * k0);

  const lat = fp - (n1 * tanFp / r1) * (
    (d * d) / 2 -
    (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * ePrimeSq) * Math.pow(d, 4) / 24 +
    (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * ePrimeSq - 3 * c1 * c1) * Math.pow(d, 6) / 720
  );

  const lonOrigin = (zone - 1) * 6 - 180 + 3; // central meridian
  const lon = (
    d -
    (1 + 2 * t1 + c1) * Math.pow(d, 3) / 6 +
    (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * ePrimeSq + 24 * t1 * t1) * Math.pow(d, 5) / 120
  ) / cosFp;

  return {
    lat: (lat * 180) / Math.PI,
    lon: lonOrigin + (lon * 180) / Math.PI,
  };
}

/**
 * Converts Latitude / Longitude (degrees) to UTM coordinates (Easting, Northing)
 */
export function latLonToUtm(
  lat: number,
  lon: number,
  zone: number = 23
): { easting: number; northing: number } {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const lonOrigin = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const tanLat = Math.tan(latRad);

  const n = a / Math.sqrt(1 - eSq * sinLat * sinLat);
  const t = tanLat * tanLat;
  const c = ePrimeSq * cosLat * cosLat;
  const A = cosLat * (lonRad - lonOrigin);

  const m = a * (
    (1 - eSq / 4 - 3 * eSq * eSq / 64 - 5 * Math.pow(eSq, 3) / 256) * latRad -
    (3 * eSq / 8 + 3 * eSq * eSq / 32 + 45 * Math.pow(eSq, 3) / 1024) * Math.sin(2 * latRad) +
    (15 * eSq * eSq / 256 + 45 * Math.pow(eSq, 3) / 1024) * Math.sin(4 * latRad) -
    (35 * Math.pow(eSq, 3) / 3072) * Math.sin(6 * latRad)
  );

  const easting = k0 * n * (
    A +
    (1 - t + c) * Math.pow(A, 3) / 6 +
    (5 - 18 * t + t * t + 72 * c - 58 * ePrimeSq) * Math.pow(A, 5) / 120
  ) + 500000.0;

  let northing = k0 * (
    m + n * tanLat * (
      A * A / 2 +
      (5 - t + 9 * c + 4 * c * c) * Math.pow(A, 4) / 24 +
      (61 - 58 * t + t * t + 600 * c - 330 * ePrimeSq) * Math.pow(A, 6) / 720
    )
  );

  if (lat < 0) {
    northing += 10000000.0; // Southern hemisphere
  }

  return { easting, northing };
}

/**
 * Calculates tile coordinates for Web Mercator (XYZ)
 */
export function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

/**
 * Calculates geographic bounds of a specific tile
 */
export function tileToLatLonBounds(x: number, y: number, zoom: number): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  const n = Math.pow(2, zoom);
  const minLon = (x / n) * 360 - 180;
  const maxLon = ((x + 1) / n) * 360 - 180;

  const latRad1 = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const latRad2 = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));

  const maxLat = (latRad1 * 180) / Math.PI;
  const minLat = (latRad2 * 180) / Math.PI;

  return { minLat, maxLat, minLon, maxLon };
}
