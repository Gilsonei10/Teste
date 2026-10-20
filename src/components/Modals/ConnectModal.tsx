import React, { useState } from 'react';
import { useIptv } from '../../context/IptvContext';
import { Server, Link, FileText, Play, X, Trash2, CheckCircle2, Sparkles, Globe, Tv, RefreshCw, ExternalLink } from 'lucide-react';
import { DeviceService } from '../../services/deviceService';

export const ConnectModal: React.FC = () => {
  const {
    isConnectModalOpen,
    setIsConnectModalOpen,
    setIsTvPairingModalOpen,
    setIsActivateTvModalOpen,
    connectXtream,
    connectM3UUrl,
    connectM3UFile,
    loadDemoData,
    activateSavedPlaylist,
    refreshActivePlaylist,
    checkRemotePlaylist,
    savedPlaylists,
    activePlaylist,
    removeSavedPlaylist,
    isLoading,
    loadingMessage,
    errorMessage,
    setErrorMessage,
  } = useIptv();

  const [activeTab, setActiveTab] = useState<'mac' | 'xtream' | 'm3u' | 'saved'>('mac');
  const [deviceInfo] = useState(() => DeviceService.getDeviceInfo());
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<string | null>(null);
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const copyToClipboard = (text: string, type: 'mac' | 'key') => {
    try {
      navigator.clipboard?.writeText(text);
      if (type === 'mac') {
        setCopiedMac(true);
        setTimeout(() => setCopiedMac(false), 2000);
      } else {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    } catch {}
  };

  const handleCheckCloud = async () => {
    setIsCheckingCloud(true);
    setCloudStatus(null);
    const found = await checkRemotePlaylist();
    setIsCheckingCloud(false);
    if (found) {
      setCloudStatus('Lista encontrada e sincronizada com sucesso!');
    } else {
      setCloudStatus('Nenhuma lista foi enviada pelo portal ainda para este MAC.');
    }
  };

  // Xtream Form State
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [xtreamName, setXtreamName] = useState('');

  // M3U URL Form State
  const [m3uUrl, setM3uUrl] = useState('');
  const [m3uName, setM3uName] = useState('');

  if (!isConnectModalOpen) return null;

  const handleXtreamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl || !username || !password) {
      setErrorMessage('Por favor, preencha o Servidor/DNS, Usuário e Senha.');
      return;
    }
    await connectXtream({ serverUrl, username, password }, xtreamName || undefined);
  };

  const handleM3uUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uUrl) {
      setErrorMessage('Por favor, insira o link da lista M3U.');
      return;
    }
    await connectM3UUrl(m3uUrl, m3uName || undefined);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      if (content) {
        await connectM3UFile(content, file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-tv-surface border border-tv-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh] max-h-[94dvh] my-auto">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-tv-border flex items-center justify-between bg-tv-card/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Conectar IPTV</h2>
              <p className="text-xs text-slate-400">Escolha o método de conexão ou use sua lista salva</p>
            </div>
          </div>
          <button
            onClick={() => setIsConnectModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-tv-border transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b border-tv-border bg-tv-bg/50 shrink-0">
          <button
            onClick={() => {
              setActiveTab('mac');
              setErrorMessage(null);
            }}
            className={`py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'mac'
                ? 'border-blue-500 text-blue-400 bg-tv-surface'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="hidden xs:inline">Ativar</span> MAC
          </button>
          <button
            onClick={() => {
              setActiveTab('xtream');
              setErrorMessage(null);
            }}
            className={`py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'xtream'
                ? 'border-blue-500 text-blue-400 bg-tv-surface'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Xtream
          </button>
          <button
            onClick={() => {
              setActiveTab('m3u');
              setErrorMessage(null);
            }}
            className={`py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'm3u'
                ? 'border-blue-500 text-blue-400 bg-tv-surface'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            M3U URL
          </button>
          <button
            onClick={() => {
              setActiveTab('saved');
              setErrorMessage(null);
            }}
            className={`py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'border-blue-500 text-blue-400 bg-tv-surface'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Salvas ({savedPlaylists.length})
          </button>
        </div>

        {/* Body Form */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 select-text overscroll-contain touch-pan-y">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs md:text-sm">
              {errorMessage}
            </div>
          )}

          {/* TAB 0: ATIVAÇÃO POR MAC E SITE */}
          {activeTab === 'mac' && (
            <div className="space-y-4">
              <div className="bg-tv-surface/80 border border-tv-border rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">Carregamento Remoto por Site</h3>
                    <p className="text-xs text-slate-400">
                      Adicione sua lista pelo celular ou computador sem digitar links no controle
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Endereço MAC */}
                  <div className="bg-tv-card border border-tv-border p-3.5 rounded-xl">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Endereço MAC
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm sm:text-base font-bold text-white tracking-widest">
                        {deviceInfo.mac}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(deviceInfo.mac, 'mac')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 bg-tv-surface rounded cursor-pointer"
                      >
                        {copiedMac ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* Chave (KEY) */}
                  <div className="bg-tv-card border border-tv-border p-3.5 rounded-xl">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Chave do Dispositivo (KEY)
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 tracking-widest">
                        {deviceInfo.key}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(deviceInfo.key, 'key')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 bg-tv-surface rounded cursor-pointer"
                      >
                        {copiedKey ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>

                {cloudStatus && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      cloudStatus.includes('sucesso')
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {cloudStatus}
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className="text-xs text-slate-300 leading-relaxed bg-tv-card/60 p-3 rounded-xl border border-tv-border/50">
                    <span className="font-semibold text-white block mb-1">Como adicionar sua lista:</span>
                    1. Acesse o portal pelo seu navegador: <br />
                    <code className="text-blue-400 font-mono text-[11px] block my-1">
                      {typeof window !== 'undefined' ? `${window.location.origin}/?portal=true` : 'seusite.com/?portal=true'}
                    </code>
                    2. Insira o <strong className="text-white">MAC</strong> e a <strong className="text-emerald-400">KEY</strong> acima e cole a URL da sua playlist.
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCheckCloud}
                      disabled={isCheckingCloud}
                      className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingCloud ? 'animate-spin' : ''}`} />
                      <span>{isCheckingCloud ? 'Verificando nuvem...' : 'Sincronizar Lista da Nuvem'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const url = `?portal=true&mac=${encodeURIComponent(deviceInfo.mac)}&key=${encodeURIComponent(deviceInfo.key)}`;
                        window.open(url, '_blank');
                      }}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-tv-card hover:bg-tv-border border border-tv-border text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Portal Web</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: XTREAM CODES */}
          {activeTab === 'xtream' && (
            <form onSubmit={handleXtreamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome da Conexão (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Meu Servidor IPTV"
                  value={xtreamName}
                  onChange={e => setXtreamName(e.target.value)}
                  className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Servidor / DNS / URL <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="http://servidor.xyz:8080"
                    value={serverUrl}
                    onChange={e => setServerUrl(e.target.value)}
                    className="w-full bg-tv-card border border-tv-border rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Usuário <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu usuário"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Senha <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{loadingMessage || 'Conectando...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Conectar e Carregar Conteúdo</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: M3U URL & ARQUIVO */}
          {activeTab === 'm3u' && (
            <div className="space-y-5">
              <form onSubmit={handleM3uUrlSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome da Lista (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Minha Lista M3U"
                    value={m3uName}
                    onChange={e => setM3uName(e.target.value)}
                    className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    URL da Lista M3U / M3U8 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://exemplo.com/lista.m3u"
                    value={m3uUrl}
                    onChange={e => setM3uUrl(e.target.value)}
                    className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{loadingMessage || 'Baixando lista...'}</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      <span>Carregar via Link URL</span>
                    </>
                  )}
                </button>
              </form>

              {/* Separador OU */}
              <div className="relative flex py-1 items-center justify-center">
                <div className="flex-grow border-t border-tv-border"></div>
                <span className="bg-tv-surface px-3 text-xs text-slate-500 uppercase tracking-widest absolute">
                  OU
                </span>
                <div className="flex-grow border-t border-tv-border"></div>
              </div>

              {/* Upload de Arquivo .m3u local */}
              <div>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-tv-border hover:border-blue-500/50 rounded-xl p-4 cursor-pointer bg-tv-card/30 hover:bg-tv-card transition-all">
                  <FileText className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm font-semibold text-white">Carregar Arquivo .M3U / .M3U8</span>
                  <span className="text-xs text-slate-500 mt-0.5">Selecione o arquivo baixado no seu dispositivo</span>
                  <input type="file" accept=".m3u,.m3u8" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: LISTAS SALVAS */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedPlaylists.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Nenhuma lista salva ainda. Conecte-se usando Xtream Codes ou M3U para salvar aqui.
                </div>
              ) : (
                savedPlaylists.map(playlist => {
                  const isActive = activePlaylist?.id === playlist.id;
                  return (
                    <div
                      key={playlist.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-blue-600/15 border-blue-500/40 text-white'
                          : 'bg-tv-card border-tv-border hover:border-slate-500 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isActive ? 'bg-blue-500 text-white' : 'bg-tv-surface text-slate-400'
                          }`}
                        >
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {playlist.name}
                            {isActive && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                          </div>
                          <span className="text-xs text-slate-400 capitalize">
                            Tipo: {playlist.type === 'xtream' ? 'Xtream Codes' : 'Lista M3U'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive && playlist.type !== 'demo' && (
                          <button
                            onClick={() => refreshActivePlaylist()}
                            disabled={isLoading}
                            className="px-2.5 py-1.5 bg-tv-surface hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            title="Recarregar lista do servidor e atualizar cache"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
                            <span>Atualizar</span>
                          </button>
                        )}
                        {!isActive && (
                          <button
                            onClick={() => activateSavedPlaylist(playlist)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Ativar
                          </button>
                        )}
                        <button
                          onClick={() => removeSavedPlaylist(playlist.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Excluir lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Atalho Especial: Pareamento Smart TV */}
          <div className="mt-5 p-3.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-left">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Assistindo em uma Smart TV?</h4>
                <p className="text-[11px] text-slate-400">Conecte por código sem precisar digitar no controle</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsConnectModalOpen(false);
                  setIsTvPairingModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              >
                Ver Código da TV
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConnectModalOpen(false);
                  setIsActivateTvModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-tv-card hover:bg-tv-border border border-tv-border text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Ativar uma TV
              </button>
            </div>
          </div>

          {/* Demo Button Footer */}
          <div className="mt-4 pt-3 border-t border-tv-border flex items-center justify-between">
            <span className="text-xs text-slate-400">Quer apenas testar o player?</span>
            <button
              onClick={() => {
                loadDemoData();
                setIsConnectModalOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Carregar Demonstração Gratuita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
