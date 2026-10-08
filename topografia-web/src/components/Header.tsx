import React from 'react';
import { Mountain, Download, Upload, RefreshCw, FileSpreadsheet, Radio } from 'lucide-react';

export type AppTab = 'survey' | 'detector';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onImportClick: () => void;
  onExportDXF: () => void;
  onExportCSV: () => void;
  onLoadSample: () => void;
  onClear: () => void;
  pointsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onImportClick,
  onExportDXF,
  onExportCSV,
  onLoadSample,
  onClear,
  pointsCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-emerald-900/50 shadow-lg">
          <Mountain className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            TopoWeb <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">v1.1.0</span>
          </h1>
          <p className="text-xs text-slate-400">
            Topografia de Precisão • Curvas de Nível • Detector de RN RTK • Planilha de Cotas
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shadow-inner">
        <button
          onClick={() => onTabChange('survey')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
            activeTab === 'survey'
              ? 'bg-slate-800 text-emerald-400 shadow border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          Levantamento & Curvas
        </button>
        <button
          onClick={() => onTabChange('detector')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
            activeTab === 'detector'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-white" />
          Detector de RN (RTK)
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        <button
          onClick={onImportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          title="Importar arquivo de pontos TXT ou CSV"
        >
          <Upload className="w-4 h-4 text-emerald-400" />
          Importar TXT/CSV
        </button>

        <button
          onClick={onLoadSample}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          title="Carregar terreno de demonstração"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          Exemplo com Relevo
        </button>

        <button
          onClick={onExportCSV}
          disabled={pointsCount === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Exportar planilha de coordenadas"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          Planilha (.CSV)
        </button>

        <button
          onClick={onExportDXF}
          disabled={pointsCount < 3}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Exportar para AutoCAD DXF com camadas"
        >
          <Download className="w-4 h-4" />
          Exportar DXF (AutoCAD)
        </button>

        {pointsCount > 0 && (
          <button
            onClick={onClear}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition cursor-pointer"
            title="Limpar todos os pontos"
          >
            Limpar
          </button>
        )}
      </div>
    </header>
  );
};
