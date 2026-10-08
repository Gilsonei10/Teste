import React, { useState } from 'react';
import { parseSurveyFile } from '../utils/fileParser';
import type { TopographyPoint } from '../types/topography';
import { Upload, X, Check, FileText, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (points: TopographyPoint[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [content, setContent] = useState('');
  const [isNorthFirst, setIsNorthFirst] = useState(false);
  const [previewPoints, setPreviewPoints] = useState<TopographyPoint[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      updatePreview(text, isNorthFirst);
    };
    reader.readAsText(file);
  };

  const updatePreview = (text: string, northFirst: boolean) => {
    if (!text.trim()) {
      setPreviewPoints([]);
      setErrors([]);
      return;
    }
    const result = parseSurveyFile(text, northFirst);
    setPreviewPoints(result.points);
    setErrors(result.errors);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    updatePreview(text, isNorthFirst);
  };

  const handleOrderChange = (northFirst: boolean) => {
    setIsNorthFirst(northFirst);
    updatePreview(content, northFirst);
  };

  const handleConfirm = () => {
    if (previewPoints.length === 0) {
      alert('Nenhum ponto válido detectado.');
      return;
    }
    onImport(previewPoints);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">Importar Pontos Topográficos (TXT / CSV)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* File picker & Format options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                1. Selecionar Arquivo do Computador
              </label>
              <input
                type="file"
                accept=".txt,.csv,.dat"
                onChange={handleFileUpload}
                className="w-full text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Formatos aceitos: .csv, .txt, .dat separados por vírgula, ponto-e-vírgula ou espaço.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                2. Ordem das Coordenadas
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOrderChange(false)}
                  className={`flex-1 py-1.5 px-2 rounded border font-medium transition ${
                    !isNorthFirst
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  P, Este (X), Norte (Y), Z
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderChange(true)}
                  className={`flex-1 py-1.5 px-2 rounded border font-medium transition ${
                    isNorthFirst
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  P, Norte (Y), Este (X), Z
                </button>
              </div>
            </div>
          </div>

          {/* Paste area */}
          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Ou Cole as Linhas de Texto Aqui:
            </label>
            <textarea
              rows={5}
              placeholder={`Exemplo:\nP1, 500000.00, 7500000.00, 100.50, TN\nP2, 500020.00, 7500010.00, 102.30, TN\nP3, 500040.00, 7500025.00, 105.10, TN`}
              value={content}
              onChange={handleTextChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Preview summary */}
          {previewPoints.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> {previewPoints.length} pontos identificados com sucesso
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Visualizando os primeiros 5:
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] text-slate-300">
                  <thead className="text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="py-1">Nome</th>
                      <th className="py-1">Este (X)</th>
                      <th className="py-1">Norte (Y)</th>
                      <th className="py-1 text-emerald-400">Cota (Z)</th>
                      <th className="py-1">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewPoints.slice(0, 5).map((pt, i) => (
                      <tr key={i} className="border-b border-slate-900">
                        <td className="py-1">{pt.name}</td>
                        <td className="py-1">{pt.x.toFixed(2)}</td>
                        <td className="py-1">{pt.y.toFixed(2)}</td>
                        <td className="py-1 text-emerald-400 font-bold">{pt.z.toFixed(2)}m</td>
                        <td className="py-1">{pt.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5 text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{errors.length} linha(s) ignorada(s) ou com formato não reconhecido.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={previewPoints.length === 0}
            className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Importar {previewPoints.length} Pontos
          </button>
        </div>
      </div>
    </div>
  );
};
