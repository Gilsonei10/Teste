import React, { useState } from 'react';
import type { RNDetectionResult } from '../../types/rnDetector';
import type { BaseStation, ReferenceLevelMark } from '../../types/topography';
import { Ruler, Check, AlertCircle, ArrowRightLeft } from 'lucide-react';

interface RNElevationCardProps {
  detectedTarget: RNDetectionResult | null;
  base: BaseStation;
  onApplyToBase: (updatedBase: Partial<BaseStation>, updatedRN: Partial<ReferenceLevelMark>) => void;
}

export const RNElevationCard: React.FC<RNElevationCardProps> = ({
  detectedTarget,
  base,
  onApplyToBase,
}) => {
  const [antennaHeight, setAntennaHeight] = useState<number>(base.antennaHeight || 1.80);
  const [setupMode, setSetupMode] = useState<'over_mark' | 'offset'>('over_mark');
  const [manualDeltaH, setManualDeltaH] = useState<number>(0);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!detectedTarget) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col items-center justify-center text-center text-slate-400 min-h-[220px]">
        <Ruler className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-300">Aguardando Detecção de RN</p>
        <p className="text-xs max-w-sm mt-1">
          Aproxime-se de um marco geodésico ou selecione um RN na lista abaixo para calcular a amarração e a cota oficial da Base RTK.
        </p>
      </div>
    );
  }

  const bm = detectedTarget.benchmark;
  const rnOfficialZ = bm.z;

  // Se a base está sobre o marco:
  // Cota da marca/pino = rnOfficialZ
  // Cota do centro de fase da antena (APC) = rnOfficialZ + antennaHeight
  // Se está deslocada com desnível (offset):
  // Cota do piquete da base = rnOfficialZ + manualDeltaH
  const baseGroundElevation = setupMode === 'over_mark' 
    ? rnOfficialZ 
    : rnOfficialZ + manualDeltaH;

  const baseAntennaElevation = baseGroundElevation + antennaHeight;

  // Erro altimétrico em relação à cota GNSS bruta atual da Base
  const currentGnssZ = base.z || baseAntennaElevation;
  const gnssDeltaError = Math.round((currentGnssZ - baseAntennaElevation) * 1000) / 1000;

  const handleApply = () => {
    onApplyToBase(
      {
        name: `BASE_${bm.code}`,
        x: bm.x,
        y: bm.y,
        z: Math.round(baseAntennaElevation * 1000) / 1000,
        antennaHeight: antennaHeight,
        description: `Amarrada ao RN ${bm.code} (${bm.name})`,
      },
      {
        name: bm.code,
        knownElevation: bm.z,
        measuredElevation: Math.round((currentGnssZ - antennaHeight) * 1000) / 1000,
        description: bm.description,
        error: gnssDeltaError,
      }
    );
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Ruler className="w-4 h-4 text-cyan-400" />
          Amarração Altimétrica da Base RTK
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60">
          Marco Ativo: {bm.code}
        </span>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={() => setSetupMode('over_mark')}
          className={`py-1.5 px-2.5 rounded-lg border font-medium transition cursor-pointer text-center ${
            setupMode === 'over_mark'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          📍 Base Sobre o Marco (RN)
        </button>
        <button
          onClick={() => setSetupMode('offset')}
          className={`py-1.5 px-2.5 rounded-lg border font-medium transition cursor-pointer text-center ${
            setupMode === 'offset'
              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
              : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          📏 Nivelamento Geométrico / Offset
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-800">
        <div>
          <label className="text-slate-400 block mb-1">Cota Oficial do RN ({bm.code})</label>
          <div className="font-mono text-cyan-400 font-bold text-sm bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
            {rnOfficialZ.toFixed(3)} m
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Altura da Antena (H.I.) [m]</label>
          <input
            type="number"
            step="0.001"
            value={antennaHeight}
            onChange={(e) => setAntennaHeight(parseFloat(e.target.value) || 0)}
            className="w-full font-mono text-sm bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {setupMode === 'offset' && (
          <div className="sm:col-span-2">
            <label className="text-slate-400 block mb-1">
              Desnível Lido com Nível / Ré (Δh até o piquete da Base) [m]
            </label>
            <input
              type="number"
              step="0.001"
              value={manualDeltaH}
              onChange={(e) => setManualDeltaH(parseFloat(e.target.value) || 0)}
              className="w-full font-mono text-sm bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
              placeholder="Ex: +0.435 ou -0.210"
            />
          </div>
        )}
      </div>

      {/* Calculations Breakdown */}
      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-300">
          <span>Cota do Terreno / Piquete da Base:</span>
          <span className="font-mono font-semibold text-slate-100">{baseGroundElevation.toFixed(3)} m</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Cota Oficial Antena RTK (APC):</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {baseAntennaElevation.toFixed(3)} m
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
          <span className="text-slate-400 flex items-center gap-1">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            Discrepância com GNSS Bruto:
          </span>
          <span className={`font-mono font-bold ${Math.abs(gnssDeltaError) < 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {gnssDeltaError >= 0 ? `+${gnssDeltaError.toFixed(3)} m` : `${gnssDeltaError.toFixed(3)} m`}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleApply}
        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
          copiedSuccess
            ? 'bg-emerald-600 text-white'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
        }`}
      >
        {copiedSuccess ? (
          <>
            <Check className="w-4 h-4" />
            Amarração Aplicada à Base do Projeto!
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            Aplicar Cota Oficial à Base RTK do Projeto
          </>
        )}
      </button>

      {Math.abs(gnssDeltaError) > 0.05 && (
        <div className="flex items-start gap-1.5 text-[11px] text-amber-400/90 bg-amber-950/20 border border-amber-800/40 p-2 rounded">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Atenção: A diferença entre a cota oficial do RN e a leitura GNSS é de {Math.abs(gnssDeltaError).toFixed(3)}m. Ao aplicar, a base será corrigida para a referência oficial do marco.
          </span>
        </div>
      )}
    </div>
  );
};
