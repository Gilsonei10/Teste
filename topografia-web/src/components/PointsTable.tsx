import React, { useState } from 'react';
import type { TopographyPoint } from '../types/topography';
import { Plus, Trash2, Search, Table } from 'lucide-react';

interface PointsTableProps {
  points: TopographyPoint[];
  onUpdatePoint: (index: number, updated: TopographyPoint) => void;
  onDeletePoint: (index: number) => void;
  onAddPoint: (newPt: TopographyPoint) => void;
  onSwapXY?: () => void;
}

export const PointsTable: React.FC<PointsTableProps> = ({
  points,
  onUpdatePoint,
  onDeletePoint,
  onAddPoint,
  onSwapXY,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newPoint, setNewPoint] = useState<Partial<TopographyPoint>>({
    name: '',
    x: undefined,
    y: undefined,
    z: undefined,
    description: 'TN',
  });

  // Check if X seems to be North (UTM Southern Hemisphere typically has Y > 1,000,000 and X < 1,000,000)
  const isLikelyInverted = points.length > 0 && points[0].x > 1000000 && points[0].y < 1000000;

  const filteredPoints = points.map((p, idx) => ({ ...p, originalIndex: idx }))
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPoint.x === undefined || newPoint.y === undefined || newPoint.z === undefined) {
      alert('Preencha os valores de Este (X), Norte (Y) e Cota (Z).');
      return;
    }

    const nextId = points.length + 1;
    onAddPoint({
      id: `pt_${Date.now()}`,
      name: newPoint.name?.trim() || `P${nextId}`,
      x: Number(newPoint.x),
      y: Number(newPoint.y),
      z: Number(newPoint.z),
      description: newPoint.description?.trim() || 'TN',
    });

    setNewPoint({
      name: `P${nextId + 1}`,
      x: undefined,
      y: undefined,
      z: undefined,
      description: newPoint.description || 'TN',
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col h-full">
      {/* Header of Table */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            Planilha de Coordenadas & Cotas ({points.length} pontos)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onSwapXY && points.length > 0 && (
            <button
              type="button"
              onClick={onSwapXY}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border transition cursor-pointer ${
                isLikelyInverted 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
              }`}
              title="Trocar as colunas Este (X) e Norte (Y)"
            >
              Inverter X ⇄ Y
            </button>
          )}

          <div className="relative min-w-[160px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ponto ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Warning banner if X and Y appear swapped */}
      {isLikelyInverted && (
        <div className="bg-amber-950/70 border-b border-amber-800/50 px-3 py-1.5 text-[11px] text-amber-200 flex items-center justify-between">
          <span>
            💡 <strong>Dica UTM:</strong> O Este (X) está com ~8 milhões (geralmente é o Norte). Se suas coordenadas estiverem invertidas, clique em <strong>Inverter X ⇄ Y</strong>.
          </span>
          {onSwapXY && (
            <button
              onClick={onSwapXY}
              className="ml-2 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] cursor-pointer"
            >
              Inverter Agora
            </button>
          )}
        </div>
      )}


      {/* Add Point Inline Form */}
      <form onSubmit={handleCreate} className="p-2.5 bg-slate-950/70 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
        <input
          type="text"
          placeholder="Nome (P1)"
          value={newPoint.name || ''}
          onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-emerald-500 outline-none"
        />
        <input
          type="number"
          step="0.001"
          placeholder="Este X (m)"
          value={newPoint.x ?? ''}
          onChange={(e) => setNewPoint({ ...newPoint, x: e.target.value ? parseFloat(e.target.value) : undefined })}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-emerald-500 outline-none"
        />
        <input
          type="number"
          step="0.001"
          placeholder="Norte Y (m)"
          value={newPoint.y ?? ''}
          onChange={(e) => setNewPoint({ ...newPoint, y: e.target.value ? parseFloat(e.target.value) : undefined })}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-emerald-500 outline-none"
        />
        <input
          type="number"
          step="0.001"
          placeholder="Cota Z (m)"
          value={newPoint.z ?? ''}
          onChange={(e) => setNewPoint({ ...newPoint, z: e.target.value ? parseFloat(e.target.value) : undefined })}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-semibold focus:border-emerald-500 outline-none"
        />
        <input
          type="text"
          placeholder="Descrição (TN, CERCA...)"
          value={newPoint.description || ''}
          onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-emerald-500 outline-none"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1 font-semibold transition shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </form>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1 max-h-[380px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-800 text-slate-300 sticky top-0 z-10 select-none">
            <tr>
              <th className="py-2 px-3 font-semibold border-b border-slate-700 w-12">#</th>
              <th className="py-2 px-3 font-semibold border-b border-slate-700">Ponto</th>
              <th className="py-2 px-3 font-semibold border-b border-slate-700">Este (X) [m]</th>
              <th className="py-2 px-3 font-semibold border-b border-slate-700">Norte (Y) [m]</th>
              <th className="py-2 px-3 font-semibold border-b border-slate-700 text-emerald-400">Cota (Z) [m]</th>
              <th className="py-2 px-3 font-semibold border-b border-slate-700 text-cyan-400">dZ Ref [m]</th>
              <th className="py-2 px-3 font-semibold border-b border-slate-700">Descrição</th>
              <th className="py-2 px-3 font-semibold border-b border-slate-700 text-center w-14">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredPoints.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Nenhum ponto registrado. Importe um arquivo TXT/CSV ou adicione pontos acima.
                </td>
              </tr>
            ) : (
              filteredPoints.map((pt) => {
                const idx = pt.originalIndex;
                return (
                  <tr key={pt.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-1.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={pt.name}
                        onChange={(e) => onUpdatePoint(idx, { ...pt, name: e.target.value })}
                        className="bg-transparent hover:bg-slate-800 focus:bg-slate-900 border border-transparent focus:border-slate-600 rounded px-1.5 py-0.5 w-20 text-slate-200 outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="0.001"
                        value={pt.x}
                        onChange={(e) => onUpdatePoint(idx, { ...pt, x: parseFloat(e.target.value) || 0 })}
                        className="bg-transparent hover:bg-slate-800 focus:bg-slate-900 border border-transparent focus:border-slate-600 rounded px-1.5 py-0.5 w-28 text-slate-200 outline-none font-mono"
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="0.001"
                        value={pt.y}
                        onChange={(e) => onUpdatePoint(idx, { ...pt, y: parseFloat(e.target.value) || 0 })}
                        className="bg-transparent hover:bg-slate-800 focus:bg-slate-900 border border-transparent focus:border-slate-600 rounded px-1.5 py-0.5 w-28 text-slate-200 outline-none font-mono"
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="number"
                        step="0.001"
                        value={pt.z}
                        onChange={(e) => onUpdatePoint(idx, { ...pt, z: parseFloat(e.target.value) || 0 })}
                        className="bg-transparent hover:bg-slate-800 focus:bg-slate-900 border border-transparent focus:border-slate-600 rounded px-1.5 py-0.5 w-24 text-emerald-400 font-bold outline-none font-mono"
                      />
                    </td>
                    <td className="py-1.5 px-3 font-mono text-cyan-400">
                      {pt.deltaZ !== undefined ? (pt.deltaZ >= 0 ? `+${pt.deltaZ.toFixed(3)}` : pt.deltaZ.toFixed(3)) : '-'}
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={pt.description}
                        onChange={(e) => onUpdatePoint(idx, { ...pt, description: e.target.value })}
                        className="bg-transparent hover:bg-slate-800 focus:bg-slate-900 border border-transparent focus:border-slate-600 rounded px-1.5 py-0.5 w-28 text-slate-300 outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <button
                        onClick={() => onDeletePoint(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                        title="Excluir ponto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
