import React, { useState } from 'react';
import type { RNBenchmark, RNDetectionResult } from '../../types/rnDetector';
import { Search, Plus, Trash2, Crosshair, MapPin, Landmark } from 'lucide-react';

interface RNBenchmarkListProps {
  detectionResults: RNDetectionResult[];
  selectedBenchmarkId: string | null;
  onSelectBenchmark: (id: string) => void;
  onAddBenchmark: (benchmark: RNBenchmark) => void;
  onDeleteBenchmark: (id: string) => void;
  onResetBenchmarks: () => void;
}

export const RNBenchmarkList: React.FC<RNBenchmarkListProps> = ({
  detectionResults,
  selectedBenchmarkId,
  onSelectBenchmark,
  onAddBenchmark,
  onDeleteBenchmark,
  onResetBenchmarks,
}) => {
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newX, setNewX] = useState<number | ''>('');
  const [newY, setNewY] = useState<number | ''>('');
  const [newZ, setNewZ] = useState<number | ''>('');
  const [newDesc, setNewDesc] = useState('');

  const filtered = detectionResults.filter(
    (item) =>
      item.benchmark.code.toLowerCase().includes(search.toLowerCase()) ||
      item.benchmark.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.benchmark.description && item.benchmark.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || newX === '' || newY === '' || newZ === '') {
      alert('Preencha Código, X, Y e Cota Z do novo RN.');
      return;
    }

    const created: RNBenchmark = {
      id: `rn_${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      name: newName.trim() || `Marco ${newCode}`,
      type: 'marco_concreto',
      x: Number(newX),
      y: Number(newY),
      z: Number(newZ),
      description: newDesc.trim() || 'Cadastrado em campo',
    };

    onAddBenchmark(created);
    setIsAdding(false);
    setNewCode('');
    setNewName('');
    setNewX('');
    setNewY('');
    setNewZ('');
    setNewDesc('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Banco de RNs e Marcos Geodésicos ({detectionResults.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-300 border border-emerald-600/50 cursor-pointer transition font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Novo RN
          </button>
          <button
            onClick={onResetBenchmarks}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition cursor-pointer underline"
          >
            Restaurar Padrões
          </button>
        </div>
      </div>

      {/* Add New Benchmark Form */}
      {isAdding && (
        <form onSubmit={handleSaveNew} className="bg-slate-950/80 border border-slate-700 p-3 rounded-lg space-y-3">
          <p className="text-xs font-semibold text-emerald-400">Cadastrar Novo Marco / RN</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Código RN (ex: RN-102)</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Nome / Identificação</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                placeholder="Ex: Marco P1 Estrada"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Cota Oficial (Z) [m]</label>
              <input
                type="number"
                step="0.001"
                required
                value={newZ}
                onChange={(e) => setNewZ(parseFloat(e.target.value) || '')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Este (X) [m]</label>
              <input
                type="number"
                step="0.001"
                required
                value={newX}
                onChange={(e) => setNewX(parseFloat(e.target.value) || '')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Norte (Y) [m]</label>
              <input
                type="number"
                step="0.001"
                required
                value={newY}
                onChange={(e) => setNewY(parseFloat(e.target.value) || '')}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Descrição</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                placeholder="Ex: Chapa de aço"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer transition shadow"
            >
              Salvar RN
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar marco por código, nome ou descrição..."
          className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Benchmarks List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filtered.map((item) => {
          const isSelected = item.benchmark.id === selectedBenchmarkId;
          const bm = item.benchmark;

          return (
            <div
              key={bm.id}
              onClick={() => onSelectBenchmark(bm.id)}
              className={`p-3 rounded-lg border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                  : item.isDetected
                  ? 'bg-emerald-950/20 border-emerald-800/60 hover:bg-emerald-950/40'
                  : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    item.isDetected
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.status === 'nearby'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100 text-xs font-mono">{bm.code}</span>
                    <span className="text-xs text-slate-300 truncate">{bm.name}</span>
                    {item.isDetected && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 animate-pulse">
                        🎯 DETECTADO SOB A BASE
                      </span>
                    )}
                    {item.status === 'nearby' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                        🟡 PRÓXIMO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{bm.description}</p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                    <span>E: {bm.x.toFixed(2)}m</span>
                    <span>N: {bm.y.toFixed(2)}m</span>
                    <span className="text-cyan-400 font-bold">Cota: {bm.z.toFixed(3)}m</span>
                  </div>
                </div>
              </div>

              {/* Proximity & Azimuth telemetry */}
              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                <div className="text-left md:text-right">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {item.distance < 1000 ? `${item.distance.toFixed(2)} m` : `${(item.distance / 1000).toFixed(2)} km`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.azimuth.toFixed(0)}° • {item.directionLabel.split(' ')[0]}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBenchmark(bm.id);
                    }}
                    className={`p-1.5 rounded border transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title="Focar no Radar"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Excluir o marco ${bm.code}?`)) {
                        onDeleteBenchmark(bm.id);
                      }
                    }}
                    className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                    title="Excluir marco"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-xs">
            Nenhum marco geodésico encontrado para esta busca.
          </div>
        )}
      </div>
    </div>
  );
};
