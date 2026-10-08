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
  // If target is detected or nearby, compute normalized position on radar circle
  // Max radar radius visually represents 30 meters
  const maxRadius = 30;
  const distance = target ? target.distance : 0;
  const azimuth = target ? target.azimuth : 0;

  // Normalized distance 0 to 1
  const normDist = Math.min(distance / maxRadius, 1.0);
  // Convert azimuth (0 = North/Up, 90 = East/Right) to SVG radians
  const angleRad = ((azimuth - 90) * Math.PI) / 180;
  
  // Center is at 100, 100, radius is 85
  const radarRadius = 85;
  const blipX = 100 + Math.cos(angleRad) * (normDist * radarRadius);
  const blipY = 100 + Math.sin(angleRad) * (normDist * radarRadius);

  const isDetected = target ? target.isDetected : false;

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
          Radar de Proximidade & Azimute
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
          Alcance: 30m • Tol: {toleranceMeters}m
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
          
          {/* Tolerance circle (Zone of Detection) */}
          <circle 
            cx="100" 
            cy="100" 
            r={Math.max((toleranceMeters / maxRadius) * radarRadius, 8)} 
            fill={isDetected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.08)'} 
            stroke={isDetected ? '#10b981' : '#38bdf8'} 
            strokeWidth="1.5" 
            strokeDasharray={isDetected ? 'none' : '2 2'}
          />

          {/* Crosshair grid lines */}
          <line x1="100" y1="15" x2="100" y2="185" stroke="#334155" strokeWidth="1" />
          <line x1="15" y1="100" x2="185" y2="100" stroke="#334155" strokeWidth="1" />

          {/* Cardinal Directions */}
          <text x="100" y="24" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">N</text>
          <text x="182" y="104" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">L</text>
          <text x="100" y="184" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">S</text>
          <text x="18" y="104" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">O</text>

          {/* Center Observer / Navigation Arrow (Setazinha Verde) */}
          <g
            transform={`rotate(${azimuth}, 100, 100)`}
            className="transition-transform duration-300"
          >
            {/* Halo pulsante */}
            <circle
              cx="100"
              cy="100"
              r="13"
              fill="rgba(16, 185, 129, 0.2)"
              className="animate-pulse"
            />
            {/* Setazinha Verde de Navegação (mesma cor #10b981) */}
            <polygon
              points="100,84 91,108 100,102 109,108"
              fill="#10b981"
              stroke="#047857"
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="drop-shadow"
            />
            {/* Ponto central pivô */}
            <circle cx="100" cy="100" r="2.5" fill="#ffffff" />
          </g>

          {/* Target RN Blip */}
          {target && (
            <g>
              {/* Direction line from center to blip */}
              <line
                x1="100"
                y1="100"
                x2={blipX}
                y2={blipY}
                stroke={isDetected ? '#10b981' : '#38bdf8'}
                strokeWidth="2"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              {/* Pulsing circle on blip */}
              <circle
                cx={blipX}
                cy={blipY}
                r="6"
                fill={isDetected ? '#10b981' : '#38bdf8'}
                className="transition-all duration-300"
              />
              <circle
                cx={blipX}
                cy={blipY}
                r="11"
                fill="none"
                stroke={isDetected ? '#10b981' : '#38bdf8'}
                strokeWidth="1.5"
                opacity="0.6"
              />
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
              {target.distance.toFixed(2)} m
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
              <p className="text-slate-400 text-[11px]">Alvo Selecionado:</p>
              <p className="font-semibold text-slate-200">{target.benchmark.name}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[11px]">Rumo / Direção:</p>
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
