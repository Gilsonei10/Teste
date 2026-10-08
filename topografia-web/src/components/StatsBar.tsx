import React from 'react';
import type { TopographyPoint } from '../types/topography';
import { TrendingUp, ArrowDown, ArrowUp, Activity, Ruler } from 'lucide-react';

interface StatsBarProps {
  points: TopographyPoint[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ points }) => {
  if (points.length === 0) return null;

  let minZ = Infinity;
  let maxZ = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;

    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const deltaZ = maxZ - minZ;
  const spanX = maxX - minX;
  const spanY = maxY - minY;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Total Levantado</span>
          <span className="text-slate-100 font-bold font-mono text-sm">{points.length} Pontos</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
          <ArrowDown className="w-4 h-4" />
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Cota Mínima (Z)</span>
          <span className="text-blue-400 font-bold font-mono text-sm">{minZ.toFixed(2)} m</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
          <ArrowUp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Cota Máxima (Z)</span>
          <span className="text-rose-400 font-bold font-mono text-sm">{maxZ.toFixed(2)} m</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Desnível Total (ΔZ)</span>
          <span className="text-amber-400 font-bold font-mono text-sm">{deltaZ.toFixed(2)} m</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
          <Ruler className="w-4 h-4" />
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Dimensões do Terreno</span>
          <span className="text-slate-200 font-semibold font-mono text-xs">
            {spanX.toFixed(1)}m × {spanY.toFixed(1)}m
          </span>
        </div>
      </div>
    </div>
  );
};
