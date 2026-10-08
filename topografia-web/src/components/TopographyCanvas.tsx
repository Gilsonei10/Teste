import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { TopographyPoint, BaseStation, ReferenceLevelMark, Triangle, ContourSegment, ContourSettings } from '../types/topography';
import { ZoomIn, ZoomOut, Maximize2, Box, Globe, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { utmToLatLon, latLonToUtm, latLonToTile, tileToLatLonBounds } from '../utils/geodesy';

interface TopographyCanvasProps {
  points: TopographyPoint[];
  base: BaseStation;
  rn: ReferenceLevelMark;
  triangles: Triangle[];
  contours: ContourSegment[];
  settings: ContourSettings;
  onToggleMap?: () => void;
  onSwapXY?: () => void;
}

export const TopographyCanvas: React.FC<TopographyCanvasProps> = ({
  points,
  base,
  rn,
  triangles,
  contours,
  settings,
  onToggleMap,
  onSwapXY,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tileCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, setTileRedraw] = useState<number>(0);

  // View state: Pan & Zoom
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const [view3D, setView3D] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(30); // 3D rotation
  const [tiltAngle, setTiltAngle] = useState<number>(45); // 3D tilt

  // Elevation hypsometric color helper
  const getElevationColor = (z: number, minZ: number, maxZ: number) => {
    if (maxZ === minZ) return '#10b981';
    const t = Math.max(0, Math.min(1, (z - minZ) / (maxZ - minZ)));
    // Green (low) -> Yellow -> Orange -> Brown -> White (high)
    if (t < 0.25) return '#059669'; // Emerald
    if (t < 0.5) return '#84cc16'; // Lime
    if (t < 0.75) return '#eab308'; // Amber
    if (t < 0.9) return '#f97316'; // Orange
    return '#f43f5e'; // Rose
  };

  // Calculate bounding box
  const getBounds = useCallback(() => {
    if (points.length === 0) {
      if (base.x && base.y) {
        return {
          minX: base.x - 50,
          maxX: base.x + 50,
          minY: base.y - 50,
          maxY: base.y + 50,
          minZ: base.z - 5,
          maxZ: base.z + 5,
        };
      }
      return { minX: 0, maxX: 100, minY: 0, maxY: 100, minZ: 0, maxZ: 10 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }

    // Only include base in bounds if it is in the same geographic region (within 3x span or 2km)
    if (base.x && base.y) {
      const spanX = maxX - minX || 100;
      const spanY = maxY - minY || 100;
      const maxDistance = Math.max(spanX, spanY) * 3 + 2000;
      const distToBase = Math.hypot(base.x - (minX + maxX) / 2, base.y - (minY + maxY) / 2);
      if (distToBase < maxDistance) {
        if (base.x < minX) minX = base.x;
        if (base.x > maxX) maxX = base.x;
        if (base.y < minY) minY = base.y;
        if (base.y > maxY) maxY = base.y;
        if (base.z < minZ) minZ = base.z;
        if (base.z > maxZ) maxZ = base.z;
      }
    }

    // Safety margins
    const padX = (maxX - minX) * 0.1 || 10;
    const padY = (maxY - minY) * 0.1 || 10;

    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
      minZ,
      maxZ,
    };
  }, [points, base]);

  // Center & Fit to screen
  const fitToExtents = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = getBounds();
    const w = canvas.width;
    const h = canvas.height;

    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;

    if (rangeX <= 0 || rangeY <= 0) return;

    const scaleX = (w * 0.85) / rangeX;
    const scaleY = (h * 0.85) / rangeY;
    const newScale = Math.min(scaleX, scaleY);

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    setScale(newScale);
    setOffset({
      x: w / 2 - centerX * newScale,
      y: h / 2 + centerY * newScale, // inverted Y for topography
    });
  }, [getBounds]);

  // Check if X seems to be North (UTM Southern Hemisphere typically has Y > 1,000,000 and X < 1,000,000)
  const isLikelyInverted = points.length > 0 && points[0].x > 1000000 && points[0].y < 1000000;

  const pointsSignature = points.length > 0 ? `${points.length}_${points[0].x}_${points[0].y}` : '';

  // Auto-fit on points change (including coordinate swap / re-centering)
  useEffect(() => {
    if (points.length > 0) {
      fitToExtents();
    }
  }, [pointsSignature, fitToExtents]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        fitToExtents();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToExtents]);

  // Mouse wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newScale = Math.max(0.001, Math.min(1000, scale * zoomFactor));

    // Zoom centered around cursor
    setOffset({
      x: mouseX - (mouseX - offset.x) * (newScale / scale),
      y: mouseY - (mouseY - offset.y) * (newScale / scale),
    });
    setScale(newScale);
  };

  // Mouse Down (Drag start)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  // Mouse Move (Drag & Coordinate tracking)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseScreenX = e.clientX - rect.left;
    const mouseScreenY = e.clientY - rect.top;

    // Convert screen coordinates to topography coordinates
    const worldX = (mouseScreenX - offset.x) / scale;
    const worldY = (offset.y - mouseScreenY) / scale;
    setMouseCoord({ x: worldX, y: worldY });

    if (isDragging) {
      if (view3D && e.shiftKey) {
        // Rotate in 3D
        setRotationAngle((prev) => (prev + (e.clientX - dragStart.x) * 0.05) % 360);
      } else {
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bounds = getBounds();

    // Clear background (Dark CAD Slate theme)
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Coordinate conversion functions
    const worldToScreen = (x: number, y: number, z: number = 0) => {
      if (!view3D) {
        return {
          sx: offset.x + x * scale,
          sy: offset.y - y * scale, // Y goes upwards in topography
        };
      } else {
        // 3D Isometric projection
        const rad = (rotationAngle * Math.PI) / 180;
        const tilt = (tiltAngle * Math.PI) / 180;

        // Relative to center
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        const cz = (bounds.minZ + bounds.maxZ) / 2;

        const rx = x - cx;
        const ry = y - cy;
        const rz = (z - cz) * 2.5; // Exaggerate Z for visual clarity

        // Rotate around Z axis
        const xRot = rx * Math.cos(rad) - ry * Math.sin(rad);
        const yRot = rx * Math.sin(rad) + ry * Math.cos(rad);

        // Project with tilt
        const projX = xRot;
        const projY = yRot * Math.cos(tilt) - rz * Math.sin(tilt);

        return {
          sx: width / 2 + projX * scale,
          sy: height / 2 - projY * scale,
        };
      }
    };

    // 0. Draw Satellite Imagery (if enabled)
    if (settings.showMap && !view3D) {
      const topLeftWorldX = (0 - offset.x) / scale;
      const topLeftWorldY = (offset.y - 0) / scale;
      const botRightWorldX = (width - offset.x) / scale;
      const botRightWorldY = (offset.y - height) / scale;

      const minW_X = Math.min(topLeftWorldX, botRightWorldX);
      const maxW_X = Math.max(topLeftWorldX, botRightWorldX);
      const minW_Y = Math.min(topLeftWorldY, botRightWorldY);
      const maxW_Y = Math.max(topLeftWorldY, botRightWorldY);

      if (maxW_X > 50000 && maxW_Y > 50000) {
        const zone = settings.utmZone || 23;
        const geoMin = utmToLatLon(minW_X, minW_Y, zone, true);
        const geoMax = utmToLatLon(maxW_X, maxW_Y, zone, true);

        const latMin = Math.min(geoMin.lat, geoMax.lat);
        const latMax = Math.max(geoMin.lat, geoMax.lat);
        const lonMin = Math.min(geoMin.lon, geoMax.lon);
        const lonMax = Math.max(geoMin.lon, geoMax.lon);

        // Se as coordenadas UTM estiverem invertidas ou fora do globo terrestre, aborta o desenho dos blocos
        if (
          isNaN(latMin) || isNaN(latMax) || isNaN(lonMin) || isNaN(lonMax) ||
          latMin < -85 || latMax > 85 || lonMin < -180 || lonMax > 180
        ) {
          return;
        }

        const provider = settings.mapProvider || 'google_earth';
        const maxZ = provider === 'esri' ? 18 : 21;
        const minZ = 12;

        const metersPerPixel = 1 / scale;
        const cosLat = Math.cos((latMin * Math.PI) / 180);
        let targetZoom = Math.round(Math.log2((40075016 * Math.abs(cosLat)) / (256 * metersPerPixel)));
        targetZoom = Math.max(minZ, Math.min(maxZ, targetZoom));

        let tMin = latLonToTile(latMax, lonMin, targetZoom);
        let tMax = latLonToTile(latMin, lonMax, targetZoom);

        let minTileX = Math.min(tMin.x, tMax.x);
        let maxTileX = Math.max(tMin.x, tMax.x);
        let minTileY = Math.min(tMin.y, tMax.y);
        let maxTileY = Math.max(tMin.y, tMax.y);

        let totalTiles = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);

        // Ajusta automaticamente o zoom se houver muitos ladrilhos para manter alta performance
        while (totalTiles > 80 && targetZoom > minZ) {
          targetZoom--;
          tMin = latLonToTile(latMax, lonMin, targetZoom);
          tMax = latLonToTile(latMin, lonMax, targetZoom);
          minTileX = Math.min(tMin.x, tMax.x);
          maxTileX = Math.max(tMin.x, tMax.x);
          minTileY = Math.min(tMin.y, tMax.y);
          maxTileY = Math.max(tMin.y, tMax.y);
          totalTiles = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);
        }

        if (totalTiles <= 80) {
          for (let tx = minTileX; tx <= maxTileX; tx++) {
            for (let ty = minTileY; ty <= maxTileY; ty++) {
              const tileKey = `${provider}_${targetZoom}_${tx}_${ty}`;
              let img = tileCacheRef.current.get(tileKey);

              if (!img) {
                img = new Image();
                img.crossOrigin = 'anonymous';

                let url = '';
                if (provider === 'google_earth') {
                  const sub = Math.abs(tx + ty) % 4;
                  url = `https://mt${sub}.google.com/vt/lyrs=s&x=${tx}&y=${ty}&z=${targetZoom}`;
                } else if (provider === 'google_hybrid') {
                  const sub = Math.abs(tx + ty) % 4;
                  url = `https://mt${sub}.google.com/vt/lyrs=y&x=${tx}&y=${ty}&z=${targetZoom}`;
                } else {
                  url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${targetZoom}/${ty}/${tx}`;
                }

                img.src = url;
                img.onload = () => {
                  setTileRedraw((prev) => prev + 1);
                };
                img.onerror = () => {
                  // Falha silenciosa sem bloquear
                };
                tileCacheRef.current.set(tileKey, img);
              }

              if (img.complete && img.naturalWidth !== 0) {
                const b = tileToLatLonBounds(tx, ty, targetZoom);
                const cTopLeft = latLonToUtm(b.maxLat, b.minLon, zone);
                const cBotRight = latLonToUtm(b.minLat, b.maxLon, zone);

                const s1 = worldToScreen(cTopLeft.easting, cTopLeft.northing);
                const s2 = worldToScreen(cBotRight.easting, cBotRight.northing);

                ctx.drawImage(img, s1.sx, s1.sy, s2.sx - s1.sx, s2.sy - s1.sy);
              }
            }
          }
        }
      }
    }

    // Draw Subtle Grid (only when satellite is off)
    if (!view3D && !settings.showMap) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = Math.pow(10, Math.floor(Math.log10(100 / scale))) * 10 || 10;
      const startX = Math.floor(bounds.minX / gridSize) * gridSize;
      const endX = Math.ceil(bounds.maxX / gridSize) * gridSize;
      const startY = Math.floor(bounds.minY / gridSize) * gridSize;
      const endY = Math.ceil(bounds.maxY / gridSize) * gridSize;

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        const { sx } = worldToScreen(x, 0);
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        const { sy } = worldToScreen(0, y);
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
      }
      ctx.stroke();
    }

    // 1. Draw TIN Triangles (Malha Triangulada)
    if (settings.showTriangles && triangles.length > 0) {
      for (const tri of triangles) {
        const p1 = worldToScreen(tri.p1.x, tri.p1.y, tri.p1.z);
        const p2 = worldToScreen(tri.p2.x, tri.p2.y, tri.p2.z);
        const p3 = worldToScreen(tri.p3.x, tri.p3.y, tri.p3.z);

        const avgZ = (tri.p1.z + tri.p2.z + tri.p3.z) / 3;
        ctx.fillStyle = `${getElevationColor(avgZ, bounds.minZ, bounds.maxZ)}12`;
        ctx.strokeStyle = settings.showMap ? 'rgba(255, 255, 255, 0.4)' : '#334155';
        ctx.lineWidth = 0.6;

        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.lineTo(p3.sx, p3.sy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 2. Draw Contour Lines (Curvas de Nível)
    if (settings.showContours !== false && contours.length > 0) {
      for (const seg of contours) {
        const p1 = worldToScreen(seg.p1.x, seg.p1.y, seg.p1.z);
        const p2 = worldToScreen(seg.p2.x, seg.p2.y, seg.p2.z);

        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);

        if (seg.isMaster) {
          // Master contour (Curva Mestra)
          ctx.strokeStyle = '#f59e0b'; // Amber / Reddish
          ctx.lineWidth = 2.2;
        } else {
          // Intermediate contour (Curva Secundária)
          ctx.strokeStyle = '#64748b'; // Subtle Slate
          ctx.lineWidth = 1.0;
        }
        ctx.stroke();
      }

      // Draw elevation labels along Master Contours
      if (settings.showElevations && !view3D) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#fbbf24';
        const labeled = new Set<number>();

        for (const seg of contours) {
          if (seg.isMaster && !labeled.has(seg.elevation)) {
            const midX = (seg.p1.x + seg.p2.x) / 2;
            const midY = (seg.p1.y + seg.p2.y) / 2;
            const screen = worldToScreen(midX, midY);

            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            const text = `${seg.elevation.toFixed(1)}m`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(screen.sx - textWidth / 2 - 2, screen.sy - 6, textWidth + 4, 12);
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(text, screen.sx - textWidth / 2, screen.sy + 3);
            ctx.restore();

            labeled.add(seg.elevation);
          }
        }
      }
    }

    // 3. Draw Points
    if (settings.showPoints) {
      for (const pt of points) {
        const screen = worldToScreen(pt.x, pt.y, pt.z);

        // Point Marker: circle with crosshair
        ctx.fillStyle = '#10b981'; // Emerald
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(screen.sx, screen.sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crosshair
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(screen.sx - 6, screen.sy);
        ctx.lineTo(screen.sx + 6, screen.sy);
        ctx.moveTo(screen.sx, screen.sy - 6);
        ctx.lineTo(screen.sx + 6, screen.sy);
        ctx.stroke();

        // Labels
        if (settings.showPointNames || settings.showElevations) {
          ctx.font = '10px Inter, sans-serif';
          let labelY = screen.sy - 7;

          if (settings.showPointNames) {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(`${pt.name} (${pt.description})`, screen.sx + 6, labelY);
            labelY += 11;
          }

          if (settings.showElevations) {
            ctx.fillStyle = '#34d399';
            ctx.font = '9px monospace';
            ctx.fillText(`Z: ${pt.z.toFixed(2)}m`, screen.sx + 6, labelY);
          }
        }
      }
    }

    // 4. Draw Base Station
    if (settings.showBaseAndRN && base.x && base.y) {
      const bScreen = worldToScreen(base.x, base.y, base.z);

      // Triangle Radio Station icon
      ctx.fillStyle = '#06b6d4'; // Cyan
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(bScreen.sx, bScreen.sy - 10);
      ctx.lineTo(bScreen.sx + 8, bScreen.sy + 6);
      ctx.lineTo(bScreen.sx - 8, bScreen.sy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Label
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(`[BASE] ${base.name}`, bScreen.sx + 10, bScreen.sy - 2);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#a5f3fc';
      ctx.fillText(`Z=${base.z.toFixed(2)}m (Ant: ${base.antennaHeight}m)`, bScreen.sx + 10, bScreen.sy + 10);
    }

    // 5. Draw Reference Level Mark (RN)
    if (settings.showBaseAndRN && rn.name && rn.knownElevation) {
      // Draw info box in corner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.fillRect(10, height - 70, 220, 55);
      ctx.strokeRect(10, height - 70, 220, 55);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`RN: ${rn.name}`, 20, height - 52);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.fillText(`Cota Oficial: ${rn.knownElevation.toFixed(3)} m`, 20, height - 38);
      if (rn.measuredElevation) {
        const err = rn.measuredElevation - rn.knownElevation;
        ctx.fillStyle = Math.abs(err) < 0.02 ? '#4ade80' : '#f87171';
        ctx.fillText(`Erro Fechamento: ${err >= 0 ? '+' : ''}${err.toFixed(3)} m`, 20, height - 24);
      }
    }
  }, [
    scale,
    offset,
    points,
    base,
    rn,
    triangles,
    contours,
    settings,
    view3D,
    rotationAngle,
    tiltAngle,
    getBounds,
  ]);

  return (
    <div className="relative w-full h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1.5 shadow-lg">
        <button
          onClick={() => setScale((s) => s * 1.25)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setScale((s) => s * 0.8)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={fitToExtents}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          title="Ajustar à Tela (Zoom Extents)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-1" />

        <button
          onClick={() => setView3D(!view3D)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
            view3D ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Alternar entre visualização 2D (Planta Baixa) e 3D (Perspectiva)"
        >
          <Box className="w-3.5 h-3.5" />
          {view3D ? 'Modo 3D' : 'Modo 2D'}
        </button>

        {onToggleMap && !view3D && (
          <button
            onClick={onToggleMap}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
              settings.showMap ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Ativar/Desativar Imagem de Satélite Google Earth de Fundo"
          >
            <Globe className="w-3.5 h-3.5" />
            {settings.showMap ? 'Earth ON' : 'Earth OFF'}
          </button>
        )}

        {onSwapXY && (
          <button
            onClick={onSwapXY}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition cursor-pointer ${
              isLikelyInverted 
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse shadow' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Inverter colunas Este (X) e Norte (Y) para alinhar o mapa e coordenadas"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-300" />
            Inverter X ⇄ Y
          </button>
        )}
      </div>

      {/* Warning banner if X and Y are inverted */}
      {isLikelyInverted && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-xl flex items-center gap-2.5 text-xs font-bold border border-amber-300 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-slate-950 flex-shrink-0" />
          <span>Coordenadas invertidas detectadas (X está com ~8M e Y com ~513k).</span>
          {onSwapXY && (
            <button
              onClick={onSwapXY}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow"
            >
              <ArrowLeftRight className="w-3 h-3 text-amber-400" />
              Inverter X ⇄ Y
            </button>
          )}
        </div>
      )}

      {/* 3D Angle Sliders (when 3D is active) */}
      {view3D && (
        <div className="absolute top-16 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300 space-y-2 shadow-lg">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Rotação: {rotationAngle}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotationAngle}
              onChange={(e) => setRotationAngle(parseInt(e.target.value))}
              className="w-32 accent-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Inclinação: {tiltAngle}°</label>
            <input
              type="range"
              min="10"
              max="80"
              value={tiltAngle}
              onChange={(e) => setTiltAngle(parseInt(e.target.value))}
              className="w-32 accent-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Bottom Floating Legend / Coordinates Bar */}
      <div className="absolute bottom-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 flex items-center gap-4 shadow-lg">
        {mouseCoord && !view3D && (
          <div className="flex items-center gap-3">
            <span>
              E: <strong className="text-emerald-400">{mouseCoord.x.toFixed(2)}m</strong>
            </span>
            <span>
              N: <strong className="text-emerald-400">{mouseCoord.y.toFixed(2)}m</strong>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-700 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block" /> Mestra
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-slate-500 inline-block" /> Secundária
          </span>
        </div>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
};
