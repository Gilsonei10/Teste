import React, { useEffect, useState } from 'react';
import { useIptv } from '../../context/IptvContext';
import { PairingService, PairingPayload } from '../../services/pairingService';
import { Tv, X, CheckCircle2, Loader2, QrCode } from 'lucide-react';

interface TvPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActivate: () => void;
}

export const TvPairingModal: React.FC<TvPairingModalProps> = ({ isOpen, onClose, onOpenActivate }) => {
  const { connectXtream, connectM3UUrl } = useIptv();

  const [code, setCode] = useState<string>('');
  const [status, setStatus] = useState<'waiting' | 'connecting' | 'success'>('waiting');
  const [receivedName, setReceivedName] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    // Gera um código de 6 dígitos para esta sessão da TV
    const newCode = PairingService.generateCode();
    setCode(newCode);
    setStatus('waiting');

    // Inicia a escuta em tempo real da TV
    const unsubscribe = PairingService.listenForPairing(newCode, async (payload: PairingPayload) => {
      setStatus('connecting');
      setReceivedName(payload.name || 'Lista IPTV');

      try {
        if (payload.type === 'xtream' && payload.credentials) {
          await connectXtream(payload.credentials, payload.name);
        } else if (payload.type === 'm3u_url' && payload.m3uUrl) {
          await connectM3UUrl(payload.m3uUrl, payload.name);
        }

        setStatus('success');
        setTimeout(() => {
          onClose();
        }, 1800);
      } catch (err) {
        console.error('[PAIRING] Erro ao conectar lista recebida:', err);
        setStatus('waiting');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, connectXtream, connectM3UUrl, onClose]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `${currentOrigin}?activate=${code}`
  )}&color=ffffff&bgcolor=0f172a`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-tv-surface border border-tv-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-tv-border flex items-center justify-between bg-tv-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Conectar Smart TV</h2>
              <p className="text-xs text-slate-400">Ative a lista remotamente sem precisar digitar no controle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-tv-border transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {status === 'waiting' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Lado Esquerdo: Código Numérico Gigante */}
              <div className="flex flex-col items-center justify-center bg-tv-card/60 border border-tv-border rounded-2xl p-6 text-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Código desta TV
                </span>

                <div className="flex items-center justify-center gap-2 my-2">
                  <div className="px-3.5 py-2.5 bg-blue-600/20 border-2 border-blue-500/50 rounded-xl font-mono text-3xl font-extrabold text-blue-400 tracking-wider">
                    {code.slice(0, 3)}
                  </div>
                  <span className="text-slate-500 text-2xl font-bold">-</span>
                  <div className="px-3.5 py-2.5 bg-blue-600/20 border-2 border-blue-500/50 rounded-xl font-mono text-3xl font-extrabold text-blue-400 tracking-wider">
                    {code.slice(3, 6)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Aguardando ativação...
                </div>
              </div>

              {/* Lado Direito: QR Code */}
              <div className="flex flex-col items-center justify-center bg-tv-card/60 border border-tv-border rounded-2xl p-6 text-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-400" /> Ou aponte a câmera
                </span>

                <div className="p-2.5 bg-slate-900 rounded-xl border border-tv-border shadow-inner">
                  <img
                    src={qrUrl}
                    alt="QR Code de Conexão"
                    className="w-36 h-36 rounded-lg object-contain"
                  />
                </div>

                <span className="text-[11px] text-slate-400 mt-2">
                  Abre o ativador no celular com o código preenchido
                </span>
              </div>
            </div>
          )}

          {status === 'connecting' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <div>
                <h3 className="text-lg font-bold text-white">Sinal de ativação recebido!</h3>
                <p className="text-sm text-slate-400">
                  Carregando canais de <strong className="text-blue-400">{receivedName}</strong>...
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Smart TV Conectada com Sucesso!</h3>
                <p className="text-sm text-slate-400">Abrindo a programação na tela...</p>
              </div>
            </div>
          )}

          {/* Instruções de Passo a Passo */}
          {status === 'waiting' && (
            <div className="p-4 bg-tv-card/30 border border-tv-border/80 rounded-2xl text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Como ativar:</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Aponte a câmera do celular para o QR Code (ou acesse este site no celular).</li>
                <li>Clique em <strong>"Ativar Smart TV"</strong> e confirme o código <strong>{code}</strong>.</li>
                <li>Insira o usuário e senha da sua lista e toque em <strong>"Ativar TV"</strong>.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-tv-border bg-tv-card/40 flex items-center justify-between text-xs">
          <span className="text-slate-400">Está usando o celular e quer ativar uma TV?</span>
          <button
            onClick={() => {
              onClose();
              onOpenActivate();
            }}
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
          >
            Abrir tela de envio →
          </button>
        </div>
      </div>
    </div>
  );
};
