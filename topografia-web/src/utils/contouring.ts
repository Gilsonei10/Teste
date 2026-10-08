import type { Triangle, ContourSegment, ContourSettings } from '../types/topography';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculates intersection of elevation plane H with triangle edge (p1, p2)
 */
function interpolateEdge(p1: Point3D, p2: Point3D, targetZ: number): Point3D | null {
  const minZ = Math.min(p1.z, p2.z);
  const maxZ = Math.max(p1.z, p2.z);

  // If targetZ is strictly outside the edge elevation range, no intersection
  if (targetZ < minZ || targetZ > maxZ) return null;
  if (Math.abs(p1.z - p2.z) < 1e-7) return null; // Horizontal edge

  const t = (targetZ - p1.z) / (p2.z - p1.z);
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
    z: targetZ,
  };
}

/**
 * Generates contour lines (Curvas de Nível) from Delaunay Triangulation
 */
export function generateContours(
  triangles: Triangle[],
  settings: ContourSettings
): ContourSegment[] {
  if (triangles.length === 0 || settings.equidistance <= 0) return [];

  // Find global min and max elevation
  let minElevation = Infinity;
  let maxElevation = -Infinity;

  for (const tri of triangles) {
    minElevation = Math.min(minElevation, tri.p1.z, tri.p2.z, tri.p3.z);
    maxElevation = Math.max(maxElevation, tri.p1.z, tri.p2.z, tri.p3.z);
  }

  if (!isFinite(minElevation) || !isFinite(maxElevation) || minElevation >= maxElevation) {
    return [];
  }

  const { equidistance, masterInterval } = settings;
  const startZ = Math.ceil(minElevation / equidistance) * equidistance;
  const endZ = Math.floor(maxElevation / equidistance) * equidistance;

  const segments: ContourSegment[] = [];

  for (let z = startZ; z <= endZ + 1e-5; z += equidistance) {
    const currentZ = Math.round(z * 1000) / 1000; // Round to 3 decimal places
    
    // Determine if it is a master contour (Curva Mestra)
    // Ex: if equidistance is 1m and masterInterval is 5, then multiples of 5 are master
    const stepCount = Math.round(currentZ / equidistance);
    const isMaster = stepCount % masterInterval === 0;

    for (const tri of triangles) {
      const p1: Point3D = { x: tri.p1.x, y: tri.p1.y, z: tri.p1.z };
      const p2: Point3D = { x: tri.p2.x, y: tri.p2.y, z: tri.p2.z };
      const p3: Point3D = { x: tri.p3.x, y: tri.p3.y, z: tri.p3.z };

      const intersections: Point3D[] = [];

      const i1 = interpolateEdge(p1, p2, currentZ);
      if (i1) intersections.push(i1);

      const i2 = interpolateEdge(p2, p3, currentZ);
      if (i2) intersections.push(i2);

      const i3 = interpolateEdge(p3, p1, currentZ);
      if (i3) intersections.push(i3);

      // If we have 2 distinct intersections in this triangle, create a segment
      if (intersections.length >= 2) {
        // Take unique pair
        const ptA = intersections[0];
        let ptB = intersections[1];

        // Ensure distinct points
        const distSq = (ptA.x - ptB.x) ** 2 + (ptA.y - ptB.y) ** 2;
        if (distSq < 1e-8 && intersections.length > 2) {
          ptB = intersections[2];
        }

        if ((ptA.x - ptB.x) ** 2 + (ptA.y - ptB.y) ** 2 > 1e-8) {
          segments.push({
            p1: ptA,
            p2: ptB,
            elevation: currentZ,
            isMaster,
          });
        }
      }
    }
  }

  return segments;
}
