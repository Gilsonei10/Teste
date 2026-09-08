import React, { useState, useEffect } from 'react';
import { PairingService } from '../../services/pairingService';
import { useIptv } from '../../context/IptvContext';
import { Send, X, CheckCircle2, Loader2, Server, Link, Tv } from 'lucide-react';

interface ActivateTvModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const ActivateTvModal: React.FC<ActivateTvModalProps> = ({ isOpen, onClose, initialCode }) => {
  const { savedPlaylists, activePlaylist } = useIptv();

  const [code, setCode] = useState<string>('');
  const [mode, setMode] = useState<'xtream' | 'm3u'>('xtream');
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');
  const [name, setName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode.replace(/\D/g, ''));
    }
  }, [initialCode]);

  // Pré-preenche o servidor com listas já usadas
  const savedServers = Array.from(
    new Set(
      savedPlaylists
        .filter(p => p.type === 'xtream' && p.credentials?.serverUrl)
        .map(p => p.credentials!.serverUrl)
    )
  );

  useEffect(() => {
    if (!serverUrl) {
      if (activePlaylist?.type === 'xtream' && activePlaylist.credentials?.serverUrl) {
        setServerUrl(activePlaylist.credentials.serverUrl);
      } else if (savedServers.length > 0) {
        setServerUrl(savedServers[0]);
      }
    }
  }, [activePlaylist, savedServers, serverUrl]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMessage('Digite os 6 dígitos do código que está na tela da sua TV.');
      return;
    }

    if (mode === 'xtream') {
      if (!serverUrl.trim() || !username.trim() || !password.trim()) {
        setErrorMessage('Por favor, preencha o Servidor, Usuário e Senha.');
        return;
      }
    } else {
      if (!m3uUrl.trim()) {
        setErrorMessage('Por favor, informe a URL da lista M3U.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'xtream') {
        await PairingService.sendPairing(cleanCode, {
          type: 'xtream',
          name: name.trim() || username.trim(),
          credentials: {
            serverUrl: serverUrl.trim(),
            username: username.trim(),
            password: password.trim(),
          },
        });
      } else {
        await PairingService.sendPairing(cleanCode, {
          type: 'm3u_url',
          name: name.trim() || 'Lista M3U',
          m3uUrl: m3uUrl.trim(),
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar dados para a Smart TV.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-tv-surface border border-tv-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-tv-border flex items-center justify-between bg-tv-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ativar Smart TV</h2>
              <p className="text-xs text-slate-400">Envie os dados de acesso para a tela da TV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-tv-border transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-white">Sua Smart TV foi Ativada!</h3>
              <p className="text-xs text-slate-300 max-w-xs">
                Os dados foram transmitidos com sucesso. A programação já está abrindo na tela da TV!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Campo Código da TV */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-blue-400" /> Código que aparece na TV *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 482195"
                  className="w-full bg-tv-card border border-tv-border rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-widest text-blue-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome da Lista (Opcional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: TV da Sala"
                  className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Sub-mode selector */}
              <div className="flex bg-tv-bg p-1 rounded-xl border border-tv-border">
                <button
                  type="button"
                  onClick={() => setMode('xtream')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'xtream' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" /> Xtream Codes
                </button>
                <button
                  type="button"
                  onClick={() => setMode('m3u')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'm3u' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Link className="w-3.5 h-3.5" /> Link M3U / URL
                </button>
              </div>

              {mode === 'xtream' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Servidor / DNS *
                    </label>
                    <input
                      type="text"
                      list="saved-servers-activate"
                      value={serverUrl}
                      onChange={e => setServerUrl(e.target.value)}
                      placeholder="http://servidor.com:80"
                      className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {savedServers.length > 0 && (
                      <datalist id="saved-servers-activate">
                        {savedServers.map((s, idx) => (
                          <option key={idx} value={s} />
                        ))}
                      </datalist>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Usuário *
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="cliente10"
                        className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Senha *
                      </label>
                      <input
                        type="text"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    URL da Lista M3U *
                  </label>
                  <textarea
                    rows={3}
                    value={m3uUrl}
                    onChange={e => setM3uUrl(e.target.value)}
                    placeholder="http://servidor.com:80/get.php?username=...&password=..."
                    className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono resize-none"
                  />
                </div>
              )}

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando para a Smart TV...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Ativar Smart TV Agora
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
