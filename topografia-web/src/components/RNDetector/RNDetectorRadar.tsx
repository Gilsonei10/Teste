import React from 'react';
import type { RNDetectionResult } from '../../types/rnDetector';
import { Compass, Navigation, Crosshair } from 'lucide-react';

interface RNDetectorRadarProps {
  target: RNDetectionResult | null;
  toleranceMeters: number;
}

export const RNDetectorRadar: React.FC<RNDetectorRadarProps> = ({
  target,
  toleranceMeters,
}) => {
  const distance = target ? target.distance : 0;
  const azimuth = target ? target.azimuth : 0;
  const isDetected = target ? target.isDetected : false;

  // Escala adaptativa do radar:
  // Se a distância for menor que 30m, radar fixo em 30m (zoom fino de aproximação)
  // Se for maior, expande para mostrar a seta verde se movendo dentro do raio
  const maxRadius = distance <= 30 ? 30 : Math.min(distance * 1.15, 1000);
  const normDist = Math.min(distance / maxRadius, 1.0);
  const radarRadius = 85;

  // A BASE / RN É O MARCO FIXO NO CENTRO (100, 100)
  // A SETA VERDE É VOCÊ (CELULAR / OPERADOR) QUE SE MOVE EM DIREÇÃO À BASE
  // Como o azimute de você até a Base é "azimuth":
  // A sua posição no radar fica na direção oposta (ao Sul se a base está ao Norte)
  const screenDist = normDist * radarRadius;
  const azRad = (azimuth * Math.PI) / 180;
  const arrowX = 100 - Math.sin(azRad) * screenDist;
  const arrowY = 100 + Math.cos(azRad) * screenDist;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-between shadow-lg relative overflow-hidden">
      {/* Background glow when detected */}
      {isDetected && (
        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none animate-pulse" />
      )}

      {/* Header Info */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <Compass className="w-4 h-4 text-emerald-400" />
          Navegação até a Base / RN
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
          🎯 Base: Centro • 🔺 Você: Seta Verde
        </span>
      </div>

      {/* Radar SVG Circle */}
      <div className="relative my-4 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-56 h-56 md:w-64 md:h-64 select-none drop-shadow-md"
        >
          {/* Radar background circles */}
          <circle cx="100" cy="100" r="85" fill="#020617" stroke="#1e293b" strokeWidth="2" />
          <circle cx="100" cy="100" r="56" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="28" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

          {/* Crosshair grid lines */}
          <line x1="100" y1="15" x2="100" y2="185" stroke="#334155" strokeWidth="1" />
          <line x1="15" y1="100" x2="185" y2="100" stroke="#334155" strokeWidth="1" />

          {/* Cardinal Directions */}
          <text x="100" y="24" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">N</text>
          <text x="182" y="104" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">L</text>
          <text x="100" y="184" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">S</text>
          <text x="18" y="104" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">O</text>

          {/* Guide Line from Green Arrow to Center Base */}
          {target && distance > 0.5 && (
            <line
              x1={arrowX}
              y1={arrowY}
              x2="100"
              y2="100"
              stroke={isDetected ? '#10b981' : '#38bdf8'}
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity="0.8"
            />
          )}

          {/* FIXED CENTER: Base RTK / RN Benchmark (Marco Alvo) */}
          <g>
            {/* Tolerance circle around Base (Zone of Detection) */}
            <circle
              cx="100"
              cy="100"
              r={Math.max((toleranceMeters / maxRadius) * radarRadius, 10)}
              fill={isDetected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.12)'}
              stroke={isDetected ? '#10b981' : '#38bdf8'}
              strokeWidth="1.5"
              strokeDasharray={isDetected ? 'none' : '2 2'}
              className={isDetected ? 'animate-ping' : ''}
            />
            {/* Base Target Pin */}
            <circle
              cx="100"
              cy="100"
              r="7"
              fill={isDetected ? '#10b981' : '#0284c7'}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx="100" cy="100" r="2.5" fill="#ffffff" />
            <text
              x="100"
              y="115"
              textAnchor="middle"
              fill={isDetected ? '#34d399' : '#38bdf8'}
              fontSize="7.5"
              fontWeight="bold"
            >
              BASE
            </text>
          </g>

          {/* MOVING OPERATOR: Green Navigation Arrow (Seta Verde Móvel) */}
          {target && (
            <g
              transform={`rotate(${azimuth}, ${arrowX}, ${arrowY})`}
              className="transition-all duration-300"
            >
              {/* Pulsing halo */}
              <circle
                cx={arrowX}
                cy={arrowY}
                r="12"
                fill="rgba(16, 185, 129, 0.25)"
                className="animate-pulse"
              />
              {/* Seta Verde Apontando em Direção à Base */}
              <polygon
                points={`${arrowX},${arrowY - 14} ${arrowX - 8},${arrowY + 8} ${arrowX},${arrowY + 3} ${arrowX + 8},${arrowY + 8}`}
                fill="#10b981"
                stroke="#047857"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="drop-shadow-lg"
              />
              {/* Ponto pivô */}
              <circle cx={arrowX} cy={arrowY} r="2" fill="#ffffff" />
            </g>
          )}
        </svg>

        {/* Floating live distance label in center of target pointer */}
        {target && (
          <div className="absolute -bottom-2 bg-slate-950/90 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
            <Navigation
              className="w-3.5 h-3.5 text-emerald-400"
              style={{ transform: `rotate(${azimuth}deg)` }}
            />
            <span className="text-xs font-mono font-bold text-slate-100">
              {target.distance < 1000 ? `${target.distance.toFixed(2)} m` : `${(target.distance / 1000).toFixed(2)} km`}
            </span>
            <span className="text-[10px] text-slate-400">
              ({target.azimuth.toFixed(0)}°)
            </span>
          </div>
        )}
      </div>

      {/* Target status details footer */}
      <div className="w-full mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {target ? (
          <>
            <div>
              <p className="text-slate-400 text-[11px]">Marco Alvo (Fixo no Centro):</p>
              <p className="font-semibold text-slate-200">{target.benchmark.name}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[11px]">Rumo de Caminhada:</p>
              <p className="font-bold text-emerald-400">{target.directionLabel}</p>
            </div>
          </>
        ) : (
          <div className="w-full text-center text-slate-400 py-1 flex items-center justify-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-slate-500" />
            Nenhum marco geodésico selecionado.
          </div>
        )}
      </div>
    </div>
  );
};
