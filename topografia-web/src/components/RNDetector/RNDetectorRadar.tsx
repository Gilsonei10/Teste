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

  // Escala adaptativa do campo de busca:
  // Se a distância for menor que 30m, escala fixa em 30m (zoom fino de aproximação)
  // Se for maior, expande para mostrar o alvo se movendo dentro dos limites
  const maxRadius = distance <= 30 ? 30 : Math.min(distance * 1.15, 1000);
  const normDist = Math.min(distance / maxRadius, 1.0);

  // Centro do campo de busca (VOCÊ É A SETA FIXA NO CENTRO)
  const cx = 250;
  const cy = 130;

  // Limites do campo retangular (largura 470, altura 230)
  const maxReachX = 205;
  const maxReachY = 95;

  // Posição da BOLINHA AZUL DA BASE (se move em relação a você no centro)
  const azRad = (azimuth * Math.PI) / 180;
  const dxNorm = Math.sin(azRad);
  const dyNorm = -Math.cos(azRad); // Y cresce para baixo no SVG, Norte é para cima

  const targetX = target ? Math.max(35, Math.min(465, cx + dxNorm * normDist * maxReachX)) : cx;
  const targetY = target ? Math.max(32, Math.min(228, cy + dyNorm * normDist * maxReachY)) : cy;

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
        <span className={`text-[11px] px-2.5 py-0.5 rounded font-mono border ${
          isDetected
            ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-bold animate-pulse'
            : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}>
          {isDetected ? '🎯 Alvo Encontrado!' : '🔺 Você: Centro • 🔵 Base: Alvo Azul'}
        </span>
      </div>

      {/* Campo de Busca Quadrado / Retangular que cobre toda a área */}
      <div className="relative my-3 w-full flex items-center justify-center">
        <svg
          viewBox="0 0 500 260"
          className="w-full h-64 md:h-72 select-none drop-shadow-md"
        >
          {/* Fundo do Campo de Busca (Retangular/Quadrado) */}
          <rect x="15" y="15" width="470" height="230" rx="14" fill="#020617" stroke="#1e293b" strokeWidth="2" />

          {/* Malha de Busca Quadriculada (Grid de Alta Visibilidade) */}
          <line x1="80" y1="15" x2="80" y2="245" stroke="#0f172a" strokeWidth="1" />
          <line x1="165" y1="15" x2="165" y2="245" stroke="#0f172a" strokeWidth="1" />
          <line x1="335" y1="15" x2="335" y2="245" stroke="#0f172a" strokeWidth="1" />
          <line x1="420" y1="15" x2="420" y2="245" stroke="#0f172a" strokeWidth="1" />

          <line x1="15" y1="55" x2="485" y2="55" stroke="#0f172a" strokeWidth="1" />
          <line x1="15" y1="92" x2="485" y2="92" stroke="#0f172a" strokeWidth="1" />
          <line x1="15" y1="168" x2="485" y2="168" stroke="#0f172a" strokeWidth="1" />
          <line x1="15" y1="205" x2="485" y2="205" stroke="#0f172a" strokeWidth="1" />

          {/* Anéis de Distância / Alcance do Radar */}
          <ellipse cx="250" cy="130" rx="65" ry="35" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="250" cy="130" rx="130" ry="70" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="250" cy="130" rx="195" ry="100" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 2" />

          {/* Linhas da Mira Central (Crosshairs) */}
          <line x1="250" y1="15" x2="250" y2="245" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="15" y1="130" x2="485" y2="130" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

          {/* Pontos Cardeais */}
          <text x="250" y="30" textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">N</text>
          <text x="475" y="134" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">L</text>
          <text x="250" y="240" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">S</text>
          <text x="25" y="134" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">O</text>

          {/* Linha Guia Tracejada conectando Você (Centro) até a Base (Bolinha Azul) */}
          {target && distance > 0.4 && (
            <line
              x1={cx}
              y1={cy}
              x2={targetX}
              y2={targetY}
              stroke={isDetected ? '#10b981' : '#38bdf8'}
              strokeWidth="2"
              strokeDasharray="5 3"
              opacity="0.85"
            />
          )}

          {/* VOCÊ NO MEIO (SETA VERDE GIRANDO NA DIREÇÃO DO ALVO) */}
          <g>
            <g
              transform={`rotate(${azimuth}, ${cx}, ${cy})`}
              className="transition-transform duration-300"
            >
              {/* Halo pulsante ao redor de você */}
              <circle
                cx={cx}
                cy={cy}
                r="18"
                fill="rgba(16, 185, 129, 0.15)"
                className="animate-pulse"
              />
              <circle
                cx={cx}
                cy={cy}
                r="10"
                fill="rgba(16, 185, 129, 0.3)"
              />
              {/* Seta Verde Central representando Você apontando para a Base */}
              <polygon
                points={`${cx},${cy - 16} ${cx - 9},${cy + 9} ${cx},${cy + 4} ${cx + 9},${cy + 9}`}
                fill="#10b981"
                stroke="#047857"
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="drop-shadow-lg"
              />
              {/* Ponto central */}
              <circle cx={cx} cy={cy} r="2.5" fill="#ffffff" />
            </g>
            <text
              x={cx}
              y={cy + 24}
              textAnchor="middle"
              fill="#34d399"
              fontSize="9"
              fontWeight="bold"
              letterSpacing="0.05em"
            >
              VOCÊ
            </text>
          </g>

          {/* BOLINHA AZUL NO CANTO/ÁREA: PONTO DA BASE QUE DEVE SER ENCONTRADO */}
          {target && (
            <g className="transition-all duration-300">
              {/* Halo de detecção */}
              <circle
                cx={targetX}
                cy={targetY}
                r={isDetected ? 20 : 15}
                fill={isDetected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.25)'}
                className="animate-pulse"
              />

              {/* Raio de tolerância ao redor da base */}
              <circle
                cx={targetX}
                cy={targetY}
                r={Math.max((toleranceMeters / maxRadius) * 80, 10)}
                fill={isDetected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.1)'}
                stroke={isDetected ? '#10b981' : '#38bdf8'}
                strokeWidth="1.5"
                strokeDasharray={isDetected ? 'none' : '2 2'}
                className={isDetected ? 'animate-ping' : ''}
              />

              {/* Bolinha Azul da Base */}
              <circle
                cx={targetX}
                cy={targetY}
                r="9"
                fill={isDetected ? '#10b981' : '#0284c7'}
                stroke="#ffffff"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
              {/* Brilho 3D na bolinha azul */}
              <circle
                cx={targetX - 2.5}
                cy={targetY - 2.5}
                r="3"
                fill="#bae6fd"
              />

              {/* Nome do Marco / Base */}
              <text
                x={targetX}
                y={targetY > cy ? targetY + 18 : targetY - 12}
                textAnchor="middle"
                fill={isDetected ? '#34d399' : '#38bdf8'}
                fontSize="9"
                fontWeight="bold"
              >
                {target.benchmark.name || 'BASE'}
              </text>
            </g>
          )}
        </svg>

        {/* Floating live distance label in center of target pointer */}
        {target && (
          <div className="absolute -bottom-2 bg-slate-950/90 border border-slate-700 px-3.5 py-1 rounded-full flex items-center gap-2 shadow-lg">
            <Navigation
              className="w-3.5 h-3.5 text-emerald-400"
              style={{ transform: `rotate(${azimuth}deg)` }}
            />
            <span className="text-xs font-mono font-bold text-slate-100">
              {target.distance < 1000 ? `${target.distance.toFixed(2)} m` : `${(target.distance / 1000).toFixed(2)} km`}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              ({target.azimuth.toFixed(0)}° • {target.directionLabel})
            </span>
          </div>
        )}
      </div>

      {/* Target status details footer */}
      <div className="w-full mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {target ? (
          <>
            <div>
              <p className="text-slate-400 text-[11px]">Marco Alvo (Bolinha Azul):</p>
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
