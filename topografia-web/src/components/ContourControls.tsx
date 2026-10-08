import React from 'react';
import type { ContourSettings } from '../types/topography';
import { Sliders, Layers, ArrowLeftRight } from 'lucide-react';

interface ContourControlsProps {
  settings: ContourSettings;
  onChange: (settings: ContourSettings) => void;
  contoursCount: number;
  trianglesCount: number;
  onSwapXY?: () => void;
}

export const ContourControls: React.FC<ContourControlsProps> = ({
  settings,
  onChange,
  contoursCount,
  trianglesCount,
  onSwapXY,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Parâmetros das Curvas de Nível
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {contoursCount} segmentos • {trianglesCount} triângulos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Equidistance Selector */}
        <div>
          <label className="text-xs text-slate-300 font-medium block mb-1.5">
            Equidistância Altimétrica: <span className="text-emerald-400 font-bold">{settings.equidistance} m</span>
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0.05, 0.1, 0.2, 0.5, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange({ ...settings, equidistance: val })}
                className={`px-2 py-1 text-xs rounded font-medium transition cursor-pointer ${
                  settings.equidistance === val
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {val}m
              </button>
            ))}
            <input
              type="number"
              step="0.1"
              min="0.05"
              value={settings.equidistance}
              onChange={(e) => onChange({ ...settings, equidistance: Math.max(0.01, parseFloat(e.target.value) || 1) })}
              className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Master Contour Interval */}
        <div>
          <label className="text-xs text-slate-300 font-medium block mb-1.5">
            Intervalo Curva Mestra (Grossa): <span className="text-rose-400 font-bold">a cada {settings.masterInterval} curvas</span>
          </label>
          <div className="flex items-center gap-1.5">
            {[2, 4, 5, 10].map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => onChange({ ...settings, masterInterval: interval })}
                className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                  settings.masterInterval === interval
                    ? 'bg-rose-700 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {interval}x ({(settings.equidistance * interval).toFixed(1)}m)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="pt-2 border-t border-slate-800">
        <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Camadas Visíveis no Mapa CAD
        </label>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 font-semibold select-none bg-slate-800/80 px-2 py-1 rounded border border-slate-700 hover:border-cyan-500 transition">
            <input
              type="checkbox"
              checked={settings.showMap}
              onChange={(e) => onChange({ ...settings, showMap: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            🗺️ Google Earth / Satélite
          </label>

          {settings.showMap && (
            <>
              <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                <span className="text-slate-400">Camada:</span>
                <select
                  value={settings.mapProvider || 'google_earth'}
                  onChange={(e) => onChange({ ...settings, mapProvider: e.target.value as any })}
                  className="bg-slate-900 text-cyan-400 font-bold border border-slate-700 rounded px-1 py-0.5 outline-none cursor-pointer"
                >
                  <option value="google_earth">Google Earth (Satélite)</option>
                  <option value="google_hybrid">Google Earth (Híbrido)</option>
                  <option value="esri">ESRI World Imagery</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                <span className="text-slate-400">Fuso:</span>
                <select
                  value={settings.utmZone}
                  onChange={(e) => onChange({ ...settings, utmZone: parseInt(e.target.value) || 23 })}
                  className="bg-slate-900 text-emerald-400 font-bold border border-slate-700 rounded px-1 py-0.5 outline-none cursor-pointer"
                >
                  {[18, 19, 20, 21, 22, 23, 24, 25].map((z) => (
                    <option key={z} value={z}>
                      {z}S
                    </option>
                  ))}
                </select>
              </div>

              {onSwapXY && (
                <button
                  type="button"
                  onClick={onSwapXY}
                  className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 text-[11px] font-semibold transition cursor-pointer"
                  title="Inverter colunas Este (X) e Norte (Y) caso o mapa não esteja alinhado"
                >
                  <ArrowLeftRight className="w-3 h-3 text-amber-400" />
                  Inverter X ⇄ Y
                </button>
              )}
            </>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={settings.showContours}
              onChange={(e) => onChange({ ...settings, showContours: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            Curvas de Nível
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={settings.showTriangles}
              onChange={(e) => onChange({ ...settings, showTriangles: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            Malha Triangulada (TIN)
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={settings.showPoints}
              onChange={(e) => onChange({ ...settings, showPoints: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            Pontos Irradiados
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={settings.showElevations}
              onChange={(e) => onChange({ ...settings, showElevations: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            Rótulos de Cotas (Z)
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={settings.showPointNames}
              onChange={(e) => onChange({ ...settings, showPointNames: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            Nome / Descrição
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
            <input
              type="checkbox"
              checked={settings.showBaseAndRN}
              onChange={(e) => onChange({ ...settings, showBaseAndRN: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            Base & RN
          </label>
        </div>
      </div>
    </div>
  );
};
