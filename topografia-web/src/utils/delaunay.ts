import type { TopographyPoint, Triangle } from '../types/topography';

interface InternalPoint {
  x: number; // normalized
  y: number; // normalized
  z: number;
  ref: TopographyPoint;
}

interface InternalTriangle {
  p1: InternalPoint;
  p2: InternalPoint;
  p3: InternalPoint;
  circumCenter: { x: number; y: number; rSq: number };
}

function calculateCircumcircle(p1: InternalPoint, p2: InternalPoint, p3: InternalPoint) {
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  if (Math.abs(d) < 1e-9) {
    return { x: 0, y: 0, rSq: Infinity };
  }

  const p1Sq = p1.x * p1.x + p1.y * p1.y;
  const p2Sq = p2.x * p2.x + p2.y * p2.y;
  const p3Sq = p3.x * p3.x + p3.y * p3.y;

  const cx = (p1Sq * (p2.y - p3.y) + p2Sq * (p3.y - p1.y) + p3Sq * (p1.y - p2.y)) / d;
  const cy = (p1Sq * (p3.x - p2.x) + p2Sq * (p1.x - p3.x) + p3Sq * (p2.x - p1.x)) / d;

  const dx = p1.x - cx;
  const dy = p1.y - cy;
  const rSq = dx * dx + dy * dy;

  return { x: cx, y: cy, rSq };
}

/**
 * Bowyer-Watson 2D Delaunay Triangulation with local coordinate normalization
 * (Crucial for large UTM coordinates like 8,000,000m to prevent floating point precision loss)
 */
export function computeDelaunayTriangulation(points: TopographyPoint[]): Triangle[] {
  if (points.length < 3) return [];

  // Filter out duplicate or very close points
  const rawUnique: TopographyPoint[] = [];
  const seen = new Set<string>();

  for (const pt of points) {
    const key = `${pt.x.toFixed(3)}_${pt.y.toFixed(3)}`;
    if (!seen.has(key)) {
      seen.add(key);
      rawUnique.push(pt);
    }
  }

  if (rawUnique.length < 3) return [];

  // Find bounding box for normalization
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const p of rawUnique) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const originX = minX;
  const originY = minY;

  // Normalize points (0 to spanX, 0 to spanY) for high numerical accuracy
  const uniquePoints: InternalPoint[] = rawUnique.map(pt => ({
    x: pt.x - originX,
    y: pt.y - originY,
    z: pt.z,
    ref: pt,
  }));

  const dx = maxX - minX || 10;
  const dy = maxY - minY || 10;
  const deltaMax = Math.max(dx, dy) * 10;
  const midX = dx / 2;
  const midY = dy / 2;

  // Super-triangle vertices
  const dummyPt: TopographyPoint = { id: '__dummy__', name: '', x: 0, y: 0, z: 0, description: '' };
  const st1: InternalPoint = { x: midX - 2 * deltaMax, y: midY - deltaMax, z: 0, ref: dummyPt };
  const st2: InternalPoint = { x: midX, y: midY + 2 * deltaMax, z: 0, ref: dummyPt };
  const st3: InternalPoint = { x: midX + 2 * deltaMax, y: midY - deltaMax, z: 0, ref: dummyPt };

  let triangles: InternalTriangle[] = [
    { p1: st1, p2: st2, p3: st3, circumCenter: calculateCircumcircle(st1, st2, st3) }
  ];

  // Insert points one by one
  for (const point of uniquePoints) {
    const polygonEdges: Array<{ p1: InternalPoint; p2: InternalPoint }> = [];

    // Find bad triangles
    const badTriangles: InternalTriangle[] = [];
    for (const tri of triangles) {
      const distSq = (point.x - tri.circumCenter.x) ** 2 + (point.y - tri.circumCenter.y) ** 2;
      if (distSq <= tri.circumCenter.rSq) {
        badTriangles.push(tri);
      }
    }

    // Find boundary of polygon formed by bad triangles
    for (const tri of badTriangles) {
      const edges = [
        { p1: tri.p1, p2: tri.p2 },
        { p1: tri.p2, p2: tri.p3 },
        { p1: tri.p3, p2: tri.p1 },
      ];

      for (const edge of edges) {
        let isShared = false;
        for (const otherTri of badTriangles) {
          if (otherTri === tri) continue;
          const otherEdges = [
            { p1: otherTri.p1, p2: otherTri.p2 },
            { p1: otherTri.p2, p2: otherTri.p3 },
            { p1: otherTri.p3, p2: otherTri.p1 },
          ];
          for (const otherEdge of otherEdges) {
            if (
              (edge.p1 === otherEdge.p1 && edge.p2 === otherEdge.p2) ||
              (edge.p1 === otherEdge.p2 && edge.p2 === otherEdge.p1)
            ) {
              isShared = true;
              break;
            }
          }
          if (isShared) break;
        }

        if (!isShared) {
          polygonEdges.push(edge);
        }
      }
    }

    // Remove bad triangles
    triangles = triangles.filter((t) => !badTriangles.includes(t));

    // Re-triangulate polygon hole with new point
    for (const edge of polygonEdges) {
      const newTri: InternalTriangle = {
        p1: edge.p1,
        p2: edge.p2,
        p3: point,
        circumCenter: calculateCircumcircle(edge.p1, edge.p2, point),
      };
      triangles.push(newTri);
    }
  }

  // Remove triangles that share vertices with super-triangle
  const result: Triangle[] = [];
  for (const tri of triangles) {
    if (
      tri.p1 === st1 || tri.p1 === st2 || tri.p1 === st3 ||
      tri.p2 === st1 || tri.p2 === st2 || tri.p2 === st3 ||
      tri.p3 === st1 || tri.p3 === st2 || tri.p3 === st3
    ) {
      continue;
    }
    result.push({
      p1: tri.p1.ref,
      p2: tri.p2.ref,
      p3: tri.p3.ref,
    });
  }

  return result;
}
