import type { TopographyPoint, BaseStation, ReferenceLevelMark, Triangle, ContourSegment } from '../types/topography';

/**
 * Generates an AutoCAD compatible ASCII DXF file
 */
export function generateDXF(
  points: TopographyPoint[],
  base: BaseStation,
  rn: ReferenceLevelMark,
  triangles: Triangle[],
  contours: ContourSegment[],
  includeTriangles: boolean = true
): string {
  let dxf = '';

  // HEADER SECTION
  dxf += '0\nSECTION\n2\nHEADER\n';
  dxf += '9\n$ACADVER\n1\nAC1009\n'; // AutoCAD R12 compatible DXF
  dxf += '0\nENDSEC\n';

  // TABLES SECTION (Layers setup)
  dxf += '0\nSECTION\n2\nTABLES\n';
  dxf += '0\nTABLE\n2\nLAYER\n';

  const layers = [
    { name: 'TOP_BASE_RN', color: 4 }, // Cyan
    { name: 'TOP_PONTOS', color: 2 }, // Yellow
    { name: 'TOP_TEXTO_COTAS', color: 3 }, // Green
    { name: 'TOP_TEXTO_NOMES', color: 7 }, // White
    { name: 'TOP_CURVAS_MESTRAS', color: 1 }, // Red
    { name: 'TOP_CURVAS_INTERM', color: 8 }, // Gray
    { name: 'TOP_TRIANGULACAO', color: 9 }, // Light Gray
  ];

  for (const lay of layers) {
    dxf += '0\nLAYER\n';
    dxf += `2\n${lay.name}\n`;
    dxf += '70\n0\n';
    dxf += `62\n${lay.color}\n`;
    dxf += '6\nCONTINUOUS\n';
  }

  dxf += '0\nENDTAB\n';
  dxf += '0\nENDSEC\n';

  // ENTITIES SECTION
  dxf += '0\nSECTION\n2\nENTITIES\n';

  // 1. Export Base Station
  if (base.x && base.y) {
    dxf += '0\nPOINT\n';
    dxf += '8\nTOP_BASE_RN\n';
    dxf += `10\n${base.x.toFixed(4)}\n20\n${base.y.toFixed(4)}\n30\n${base.z.toFixed(4)}\n`;

    dxf += '0\nTEXT\n';
    dxf += '8\nTOP_BASE_RN\n';
    dxf += `10\n${(base.x + 0.5).toFixed(4)}\n20\n${(base.y + 0.5).toFixed(4)}\n30\n${base.z.toFixed(4)}\n`;
    dxf += '40\n0.8\n'; // Text height
    dxf += `1\nBASE: ${base.name} (Z=${base.z.toFixed(2)}m)\n`;
  }

  // 2. Export Reference Level Mark (RN) note
  if (rn.name && rn.knownElevation) {
    const rx = base.x ? base.x - 2 : (points[0]?.x || 0);
    const ry = base.y ? base.y - 2 : (points[0]?.y || 0);
    dxf += '0\nTEXT\n';
    dxf += '8\nTOP_BASE_RN\n';
    dxf += `10\n${rx.toFixed(4)}\n20\n${ry.toFixed(4)}\n30\n${rn.knownElevation.toFixed(4)}\n`;
    dxf += '40\n0.7\n';
    dxf += `1\nRN: ${rn.name} (Cota Ofic: ${rn.knownElevation.toFixed(3)}m)\n`;
  }

  // 3. Export Points & Labels
  for (const pt of points) {
    // Point Entity
    dxf += '0\nPOINT\n';
    dxf += '8\nTOP_PONTOS\n';
    dxf += `10\n${pt.x.toFixed(4)}\n20\n${pt.y.toFixed(4)}\n30\n${pt.z.toFixed(4)}\n`;

    // Point Name Text
    dxf += '0\nTEXT\n';
    dxf += '8\nTOP_TEXTO_NOMES\n';
    dxf += `10\n${(pt.x + 0.3).toFixed(4)}\n20\n${(pt.y + 0.3).toFixed(4)}\n30\n${pt.z.toFixed(4)}\n`;
    dxf += '40\n0.5\n';
    dxf += `1\n${pt.name} - ${pt.description || ''}\n`;

    // Point Elevation Text
    dxf += '0\nTEXT\n';
    dxf += '8\nTOP_TEXTO_COTAS\n';
    dxf += `10\n${(pt.x + 0.3).toFixed(4)}\n20\n${(pt.y - 0.4).toFixed(4)}\n30\n${pt.z.toFixed(4)}\n`;
    dxf += '40\n0.4\n';
    dxf += `1\nZ=${pt.z.toFixed(2)}\n`;
  }

  // 4. Export Triangles (TIN)
  if (includeTriangles) {
    for (const tri of triangles) {
      dxf += '0\n3DFACE\n';
      dxf += '8\nTOP_TRIANGULACAO\n';
      dxf += `10\n${tri.p1.x.toFixed(4)}\n20\n${tri.p1.y.toFixed(4)}\n30\n${tri.p1.z.toFixed(4)}\n`;
      dxf += `11\n${tri.p2.x.toFixed(4)}\n21\n${tri.p2.y.toFixed(4)}\n31\n${tri.p2.z.toFixed(4)}\n`;
      dxf += `12\n${tri.p3.x.toFixed(4)}\n22\n${tri.p3.y.toFixed(4)}\n32\n${tri.p3.z.toFixed(4)}\n`;
      dxf += `13\n${tri.p3.x.toFixed(4)}\n23\n${tri.p3.y.toFixed(4)}\n33\n${tri.p3.z.toFixed(4)}\n`;
    }
  }

  // 5. Export Contours (Curvas de Nível)
  for (const seg of contours) {
    const layer = seg.isMaster ? 'TOP_CURVAS_MESTRAS' : 'TOP_CURVAS_INTERM';
    dxf += '0\nLINE\n';
    dxf += `8\n${layer}\n`;
    dxf += `10\n${seg.p1.x.toFixed(4)}\n20\n${seg.p1.y.toFixed(4)}\n30\n${seg.p1.z.toFixed(4)}\n`;
    dxf += `11\n${seg.p2.x.toFixed(4)}\n21\n${seg.p2.y.toFixed(4)}\n31\n${seg.p2.z.toFixed(4)}\n`;
  }

  dxf += '0\nENDSEC\n';
  dxf += '0\nEOF\n';

  return dxf;
}

/**
 * Triggers a browser download of a text/file blob
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/octet-stream') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
