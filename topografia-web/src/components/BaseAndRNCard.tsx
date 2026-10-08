import React, { useState } from 'react';
import type { BaseStation, ReferenceLevelMark } from '../types/topography';
import { Radio, Compass, Ruler, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface BaseAndRNCardProps {
  base: BaseStation;
  rn: ReferenceLevelMark;
  onUpdateBase: (base: BaseStation) => void;
  onUpdateRN: (rn: ReferenceLevelMark) => void;
  onApplyElevationAdjustment: () => void;
}

export const BaseAndRNCard: React.FC<BaseAndRNCardProps> = ({
  base,
  rn,
  onUpdateBase,
  onUpdateRN,
  onApplyElevationAdjustment,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Calculate closure difference if measured elevation is provided
  const deltaRN = rn.measuredElevation !== undefined && rn.knownElevation 
    ? (rn.measuredElevation - rn.knownElevation) 
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-slate-800/60 hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Amarração Topográfica: Base RTK & RN (Referência de Nível)
            </h2>
            <p className="text-xs text-slate-400">
              {base.name ? `Base: ${base.name} (Z: ${base.z}m)` : 'Sem base configurada'} • {rn.name ? `RN: ${rn.name} (${rn.knownElevation}m)` : 'Sem RN'}
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-200">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50">
          {/* Base GNSS Configuration */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" /> Informações da Base GNSS
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                RTK / Estação
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nome da Base</label>
                <input
                  type="text"
                  value={base.name}
                  onChange={(e) => onUpdateBase({ ...base, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Sistema Coord.</label>
                <input
                  type="text"
                  value={base.coordinateSystem}
                  onChange={(e) => onUpdateBase({ ...base, coordinateSystem: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: SIRGAS 2000 UTM 23S"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Este (X) [m]</label>
                <input
                  type="number"
                  step="0.001"
                  value={base.x || ''}
                  onChange={(e) => onUpdateBase({ ...base, x: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Norte (Y) [m]</label>
                <input
                  type="number"
                  step="0.001"
                  value={base.y || ''}
                  onChange={(e) => onUpdateBase({ ...base, y: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cota Base (Z) [m]</label>
                <input
                  type="number"
                  step="0.001"
                  value={base.z || ''}
                  onChange={(e) => onUpdateBase({ ...base, z: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Altura Antena (H.I.) [m]</label>
                <input
                  type="number"
                  step="0.001"
                  value={base.antennaHeight || ''}
                  onChange={(e) => onUpdateBase({ ...base, antennaHeight: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Reference Level Mark (RN) Configuration */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Ruler className="w-3.5 h-3.5" /> Referência de Nível (RN)
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                Altimetria Oficial
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Identificação do RN</label>
                <input
                  type="text"
                  value={rn.name}
                  onChange={(e) => onUpdateRN({ ...rn, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cota Oficial (Z) [m]</label>
                <input
                  type="number"
                  step="0.001"
                  value={rn.knownElevation || ''}
                  onChange={(e) => onUpdateRN({ ...rn, knownElevation: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-400 font-semibold focus:outline-none focus:border-cyan-500"
                  placeholder="Ex: 852.450"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cota Medida no Campo [m]</label>
                <input
                  type="number"
                  step="0.001"
                  value={rn.measuredElevation ?? ''}
                  onChange={(e) => onUpdateRN({ ...rn, measuredElevation: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Opcional p/ erro"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Visada a Ré [m]</label>
                <input
                  type="number"
                  step="0.001"
                  value={rn.backSight ?? ''}
                  onChange={(e) => onUpdateRN({ ...rn, backSight: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Leitura de mira"
                />
              </div>
            </div>

            {rn.measuredElevation !== undefined && rn.knownElevation > 0 && (
              <div className="pt-2 flex items-center justify-between text-xs bg-slate-900/80 p-2 rounded border border-slate-800">
                <span className="text-slate-400">Erro de Fechamento Altimétrico:</span>
                <span className={`font-mono font-bold ${Math.abs(deltaRN) < 0.02 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {deltaRN >= 0 ? `+${deltaRN.toFixed(3)} m` : `${deltaRN.toFixed(3)} m`}
                </span>
              </div>
            )}

            <button
              onClick={onApplyElevationAdjustment}
              className="w-full flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-700/50 transition font-medium"
              title="Calcular e atualizar o desnível de todos os pontos em relação a esta cota"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recalcular Desníveis (dZ) pelo RN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
