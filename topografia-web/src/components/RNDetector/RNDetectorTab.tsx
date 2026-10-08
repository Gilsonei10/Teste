import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { BaseStation, ReferenceLevelMark } from '../../types/topography';
import type { RNBenchmark, GPSPositionData, GPSStatus } from '../../types/rnDetector';
import { SAMPLE_BENCHMARKS, detectNearbyRNs } from '../../utils/rnDetectorUtils';
import { latLonToUtm } from '../../utils/geodesy';
import { RNDetectorRadar } from './RNDetectorRadar';
import { RNElevationCard } from './RNElevationCard';
import { RNBenchmarkList } from './RNBenchmarkList';
import {
  Radio,
  Smartphone,
  Sliders,
  Compass,
  CheckCircle2,
  Play,
  Square,
  LocateFixed
} from 'lucide-react';

interface RNDetectorTabProps {
  base: BaseStation;
  rn: ReferenceLevelMark;
  utmZone: number;
  onUpdateBase: (base: BaseStation) => void;
  onUpdateRN: (rn: ReferenceLevelMark) => void;
}

export const RNDetectorTab: React.FC<RNDetectorTabProps> = ({
  base,
  rn,
  utmZone,
  onUpdateBase,
  onUpdateRN,
}) => {
  // Source Mode: 'base' | 'gps' | 'manual'
  const [sourceMode, setSourceMode] = useState<'base' | 'gps' | 'manual'>('base');

  // Manual Coordinates
  const [manualX, setManualX] = useState<number>(base.x || 250000);
  const [manualY, setManualY] = useState<number>(base.y || 7420000);
  const [manualZ, setManualZ] = useState<number>(base.z || 785.45);

  // Benchmarks Database (stored in state, starts with samples)
  const [benchmarks, setBenchmarks] = useState<RNBenchmark[]>(() => {
    const saved = localStorage.getItem('topoweb_rn_benchmarks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return SAMPLE_BENCHMARKS;
      }
    }
    return SAMPLE_BENCHMARKS;
  });

  // Settings
  const [toleranceMeters, setToleranceMeters] = useState<number>(2.0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mobile / Device GPS State
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('idle');
  const [gpsData, setGpsData] = useState<GPSPositionData | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Save benchmarks to localStorage
  useEffect(() => {
    localStorage.setItem('topoweb_rn_benchmarks', JSON.stringify(benchmarks));
  }, [benchmarks]);

  // Handle GPS start/stop
  const startGPS = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocalização não suportada neste dispositivo.');
      return;
    }
    setGpsStatus('searching');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, altitude, accuracy, altitudeAccuracy, heading, speed } = pos.coords;
        const { easting, northing } = latLonToUtm(latitude, longitude, utmZone);
        setGpsData({
          latitude,
          longitude,
          altitude: altitude ?? null,
          accuracy: accuracy ?? null,
          altitudeAccuracy: altitudeAccuracy ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
          timestamp: pos.timestamp,
          utmX: Math.round(easting * 1000) / 1000,
          utmY: Math.round(northing * 1000) / 1000,
        });
        setGpsStatus('active');
      },
      (err) => {
        console.error('GPS Error:', err);
        setGpsStatus(err.code === 1 ? 'denied' : 'error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  };

  const stopGPS = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsStatus('idle');
  };

  // Clean up GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Determine current active coordinates based on source mode
  const currentCoords = useMemo(() => {
    if (sourceMode === 'gps' && gpsData) {
      return {
        x: gpsData.utmX,
        y: gpsData.utmY,
        z: gpsData.altitude || base.z || 0,
        label: `GPS Android (±${gpsData.accuracy ? gpsData.accuracy.toFixed(1) : '?'}m)`,
      };
    }
    if (sourceMode === 'manual') {
      return {
        x: manualX,
        y: manualY,
        z: manualZ,
        label: 'Posição Manual',
      };
    }
    return {
      x: base.x || 0,
      y: base.y || 0,
      z: base.z || 0,
      label: `Base RTK: ${base.name || 'BASE'}`,
    };
  }, [sourceMode, gpsData, manualX, manualY, manualZ, base]);

  // Run detection against all benchmarks
  const detectionResults = useMemo(() => {
    return detectNearbyRNs(
      currentCoords.x,
      currentCoords.y,
      currentCoords.z,
      benchmarks,
      toleranceMeters
    );
  }, [currentCoords, benchmarks, toleranceMeters]);

  // Target for radar (either explicitly selected, or the closest one)
  const activeTarget = useMemo(() => {
    if (selectedId) {
      const found = detectionResults.find((r) => r.benchmark.id === selectedId);
      if (found) return found;
    }
    return detectionResults.length > 0 ? detectionResults[0] : null;
  }, [selectedId, detectionResults]);

  // Detection alerts
  const occupiedResult = detectionResults.find((r) => r.isDetected);

  const handleApplyToBase = (updatedBase: Partial<BaseStation>, updatedRN: Partial<ReferenceLevelMark>) => {
    onUpdateBase({ ...base, ...updatedBase });
    onUpdateRN({ ...rn, ...updatedRN });
  };

  const handleAddBenchmark = (newBm: RNBenchmark) => {
    setBenchmarks((prev) => [newBm, ...prev]);
    setSelectedId(newBm.id);
  };

  const handleDeleteBenchmark = (id: string) => {
    setBenchmarks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleResetBenchmarks = () => {
    if (confirm('Restaurar marcos padrão do sistema?')) {
      setBenchmarks(SAMPLE_BENCHMARKS);
      setSelectedId(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Banner Alert when RN is Occupied/Detected */}
      {occupiedResult ? (
        <div className="bg-emerald-950/70 border-2 border-emerald-500 rounded-xl p-4 shadow-xl flex items-center justify-between gap-4 text-emerald-100 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-500 text-slate-950">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-400 text-slate-950 uppercase tracking-wider">
                  RN Detectado sob a Base
                </span>
                <span className="text-sm font-mono font-bold">{occupiedResult.benchmark.code}</span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                {occupiedResult.benchmark.name} • Distância: <strong>{occupiedResult.distance.toFixed(2)} m</strong> (Tolerância: {toleranceMeters}m)
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-emerald-300">Cota Oficial do Marco:</p>
            <p className="text-base font-mono font-bold text-white">
              {occupiedResult.benchmark.z.toFixed(3)} m
            </p>
          </div>
        </div>
      ) : activeTarget && activeTarget.status === 'nearby' ? (
        <div className="bg-cyan-950/60 border border-cyan-500/70 rounded-xl p-3 shadow-md flex items-center justify-between gap-4 text-cyan-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Compass className="w-5 h-5 animate-spin duration-1000" />
            </div>
            <div>
              <span className="text-xs font-bold text-cyan-300">
                Aproximando-se do RN: {activeTarget.benchmark.code} ({activeTarget.distance.toFixed(2)} m)
              </span>
              <p className="text-[11px] text-cyan-200/80">
                Rumo: {activeTarget.azimuth.toFixed(0)}° ({activeTarget.directionLabel}) • Desnível est.: {activeTarget.deltaZ >= 0 ? `+${activeTarget.deltaZ.toFixed(2)}` : activeTarget.deltaZ.toFixed(2)} m
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Control Panel: Position Source & Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Detector Geodésico de RN para Base RTK
              </h2>
              <p className="text-xs text-slate-400">
                Detecção automática de marcos altimétricos, bússola de aproximação e amarração de cota da antena
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                setSourceMode('base');
                stopGPS();
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                sourceMode === 'base'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" /> Base RTK
            </button>
            <button
              onClick={() => {
                setSourceMode('gps');
                startGPS();
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                sourceMode === 'gps'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> GPS Dispositivo (Android)
            </button>
            <button
              onClick={() => {
                setSourceMode('manual');
                stopGPS();
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                sourceMode === 'manual'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Manual
            </button>
          </div>
        </div>

        {/* Dynamic Source Parameters */}
        {sourceMode === 'gps' && (
          <div className="bg-slate-950/70 border border-cyan-800/50 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                <LocateFixed className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">Sensor GPS do Navegador/Android:</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    gpsStatus === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300'
                  }`}>
                    {gpsStatus === 'active' ? 'Conectado (Alta Precisão)' : gpsStatus}
                  </span>
                </div>
                {gpsData ? (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Lat: {gpsData.latitude.toFixed(6)}° • Lon: {gpsData.longitude.toFixed(6)}° • Precisão: ±{gpsData.accuracy?.toFixed(1) || '?'}m
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">Aguardando sinal dos satélites GNSS...</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {gpsStatus === 'active' ? (
                <button
                  onClick={stopGPS}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" /> Parar GPS
                </button>
              ) : (
                <button
                  onClick={startGPS}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800/80 text-cyan-200 border border-cyan-700 text-xs cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" /> Iniciar GPS
                </button>
              )}
            </div>
          </div>
        )}

        {sourceMode === 'manual' && (
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Este (X) [m]</label>
              <input
                type="number"
                step="0.01"
                value={manualX}
                onChange={(e) => setManualX(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Norte (Y) [m]</label>
              <input
                type="number"
                step="0.01"
                value={manualY}
                onChange={(e) => setManualY(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Cota Medida (Z) [m]</label>
              <input
                type="number"
                step="0.01"
                value={manualZ}
                onChange={(e) => setManualZ(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono"
              />
            </div>
          </div>
        )}

        {/* Current Active Coordinates Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Origem:</span>
            <span className="font-bold text-slate-200">{currentCoords.label}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span>E: <strong className="text-emerald-400">{currentCoords.x.toFixed(2)}m</strong></span>
            <span>N: <strong className="text-emerald-400">{currentCoords.y.toFixed(2)}m</strong></span>
            <span>Z: <strong className="text-cyan-400">{currentCoords.z.toFixed(2)}m</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-sans">Raio Detecção:</span>
            <select
              value={toleranceMeters}
              onChange={(e) => setToleranceMeters(parseFloat(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-200 font-sans cursor-pointer"
            >
              <option value="0.5">0.5 m (Alta Precisão)</option>
              <option value="1.0">1.0 m</option>
              <option value="2.0">2.0 m (Recomendado)</option>
              <option value="5.0">5.0 m</option>
              <option value="10.0">10.0 m (Busca em Campo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar/Calculator on Left, Benchmark Database on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Radar + Altimetric Elevation Calculator */}
        <div className="lg:col-span-6 space-y-5">
          <RNDetectorRadar
            target={activeTarget}
            toleranceMeters={toleranceMeters}
          />

          <RNElevationCard
            detectedTarget={activeTarget}
            base={base}
            onApplyToBase={handleApplyToBase}
          />
        </div>

        {/* Right Column: Benchmark Database & Manager */}
        <div className="lg:col-span-6">
          <RNBenchmarkList
            detectionResults={detectionResults}
            selectedBenchmarkId={selectedId}
            onSelectBenchmark={(id) => setSelectedId(id)}
            onAddBenchmark={handleAddBenchmark}
            onDeleteBenchmark={handleDeleteBenchmark}
            onResetBenchmarks={handleResetBenchmarks}
          />
        </div>
      </div>
    </div>
  );
};
