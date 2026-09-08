import React, { useState, useEffect } from 'react';
import { useIptv } from '../../context/IptvContext';
import {
  Server,
  Link,
  FileText,
  Play,
  X,
  Trash2,
  CheckCircle2,
  Sparkles,
  Globe,
  Share2,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';

export const ConnectModal: React.FC = () => {
  const {
    isConnectModalOpen,
    setIsConnectModalOpen,
    connectXtream,
    connectM3UUrl,
    connectM3UFile,
    loadDemoData,
    savedPlaylists,
    activePlaylist,
    removeSavedPlaylist,
    isLoading,
    loadingMessage,
    errorMessage,
    setErrorMessage,
  } = useIptv();

  const [activeTab, setActiveTab] = useState<'xtream' | 'm3u' | 'saved' | 'share'>('xtream');

  // Xtream Form State
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [xtreamName, setXtreamName] = useState('');

  // M3U URL Form State
  const [m3uUrl, setM3uUrl] = useState('');
  const [m3uName, setM3uName] = useState('');

  // Share Form State
  const [shareMode, setShareMode] = useState<'xtream' | 'm3u'>('xtream');
  const [shareServer, setShareServer] = useState('');
  const [shareUser, setShareUser] = useState('');
  const [sharePass, setSharePass] = useState('');
  const [shareM3u, setShareM3u] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const savedServers = Array.from(
    new Set(
      savedPlaylists
        .filter(p => p.type === 'xtream' && p.credentials?.serverUrl)
        .map(p => p.credentials!.serverUrl)
    )
  );

  useEffect(() => {
    if (!shareServer) {
      if (activePlaylist?.type === 'xtream' && activePlaylist.credentials?.serverUrl) {
        setShareServer(activePlaylist.credentials.serverUrl);
      } else if (savedServers.length > 0) {
        setShareServer(savedServers[0]);
      }
    }
  }, [activePlaylist, savedServers, shareServer]);

  const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  let clientGeneratedLink = '';
  if (shareMode === 'xtream') {
    if (shareServer.trim() && shareUser.trim() && sharePass.trim()) {
      clientGeneratedLink = `${origin}?server=${encodeURIComponent(shareServer.trim())}&user=${encodeURIComponent(shareUser.trim())}&pass=${encodeURIComponent(sharePass.trim())}`;
    }
  } else {
    if (shareM3u.trim()) {
      clientGeneratedLink = `${origin}?m3u=${encodeURIComponent(shareM3u.trim())}`;
    }
  }

  const handleCopyLink = () => {
    if (!clientGeneratedLink) return;
    navigator.clipboard.writeText(clientGeneratedLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-tv-surface border border-tv-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-tv-border flex items-center justify-between bg-tv-card/50">
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
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-tv-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-tv-border bg-tv-bg/50">
          <button
            onClick={() => {
              setActiveTab('xtream');
              setErrorMessage(null);
            }}
            className={`py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'xtream'
                ? 'border-blue-500 text-blue-400 bg-tv-surface'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Xtream Codes
          </button>
          <button
            onClick={() => {
              setActiveTab('m3u');
              setErrorMessage(null);
            }}
            className={`py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'm3u'
                ? 'border-blue-500 text-blue-400 bg-tv-surface'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            Lista M3U / URL
          </button>
          <button
            onClick={() => {
              setActiveTab('saved');
              setErrorMessage(null);
            }}
            className={`py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'saved'
                ? 'border-blue-500 text-blue-400 bg-tv-surface'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Salvas ({savedPlaylists.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('share');
              setErrorMessage(null);
            }}
            className={`py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'share'
                ? 'border-blue-500 text-blue-400 bg-tv-surface'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Gerar Link
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs md:text-sm">
              {errorMessage}
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
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{loadingMessage || 'Conectando...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Entrar e Carregar Catálogo</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: M3U URL / FILE */}
          {activeTab === 'm3u' && (
            <div className="space-y-5">
              <form onSubmit={handleM3uUrlSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nome da Lista (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lista Canais e Filmes"
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
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{loadingMessage || 'Baixando...'}</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      <span>Carregar via Link URL</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-tv-border w-full" />
                <span className="bg-tv-surface px-3 text-xs text-slate-500 uppercase tracking-widest absolute">OU</span>
              </div>

              {/* Upload file */}
              <div>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-tv-border hover:border-blue-500/50 rounded-xl p-4 cursor-pointer bg-tv-card/30 hover:bg-tv-card transition-all">
                  <FileText className="w-8 h-8 text-blue-400 mb-2" />
                  <span className="text-sm font-semibold text-white">Carregar Arquivo .M3U / .M3U8</span>
                  <span className="text-xs text-slate-400 mt-0.5">Selecione o arquivo baixado no seu dispositivo</span>
                  <input type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED PLAYLISTS */}
          {activeTab === 'saved' && (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {savedPlaylists.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhuma lista salva ainda. Conecte-se via Xtream ou M3U acima.
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
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500 text-white' : 'bg-tv-surface text-slate-400'}`}>
                          {playlist.type === 'xtream' ? <Server className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{playlist.name}</span>
                            {isActive && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                          </div>
                          <span className="text-xs text-slate-400 capitalize">
                            Tipo: {playlist.type === 'xtream' ? 'Xtream Codes' : 'Lista M3U'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive && (
                          <button
                            onClick={() => {
                              if (playlist.type === 'xtream' && playlist.credentials) {
                                connectXtream(playlist.credentials, playlist.name);
                              } else if (playlist.type === 'm3u_url' && playlist.url) {
                                connectM3UUrl(playlist.url, playlist.name);
                              } else if (playlist.type === 'demo') {
                                loadDemoData();
                              }
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Ativar
                          </button>
                        )}
                        <button
                          onClick={() => removeSavedPlaylist(playlist.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
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

          {/* TAB 4: GERAR LINK PARA CLIENTE */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              {/* Sub-mode selection */}
              <div className="flex bg-tv-bg p-1 rounded-xl border border-tv-border">
                <button
                  type="button"
                  onClick={() => setShareMode('xtream')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    shareMode === 'xtream' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Dados Xtream Codes
                </button>
                <button
                  type="button"
                  onClick={() => setShareMode('m3u')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    shareMode === 'm3u' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Link M3U / URL Direto
                </button>
              </div>

              {shareMode === 'xtream' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Servidor / DNS *
                    </label>
                    <input
                      type="text"
                      list="saved-servers-list"
                      value={shareServer}
                      onChange={e => setShareServer(e.target.value)}
                      placeholder="http://servidor.com:80"
                      className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {savedServers.length > 0 && (
                      <datalist id="saved-servers-list">
                        {savedServers.map((s, idx) => (
                          <option key={idx} value={s} />
                        ))}
                      </datalist>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Usuário do Cliente *
                      </label>
                      <input
                        type="text"
                        value={shareUser}
                        onChange={e => setShareUser(e.target.value)}
                        placeholder="cliente10"
                        className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Senha do Cliente *
                      </label>
                      <input
                        type="text"
                        value={sharePass}
                        onChange={e => setSharePass(e.target.value)}
                        placeholder="123456"
                        className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Link M3U / M3U8 do Cliente *
                  </label>
                  <textarea
                    rows={3}
                    value={shareM3u}
                    onChange={e => setShareM3u(e.target.value)}
                    placeholder="http://servidor.com:80/get.php?username=...&password=...&type=m3u_plus&output=m3u8"
                    className="w-full bg-tv-card border border-tv-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-mono text-xs"
                  />
                </div>
              )}

              {/* Box de Resultado & Copiar */}
              {clientGeneratedLink ? (
                <div className="mt-4 p-3.5 bg-blue-600/10 border border-blue-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Link de Acesso Pronto:
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Conexão Automática</span>
                  </div>

                  <div className="p-2.5 bg-tv-card rounded-lg border border-tv-border text-xs font-mono text-slate-200 break-all select-all">
                    {clientGeneratedLink}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="w-4 h-4 text-green-300" />
                          Copiado com Sucesso!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Link
                        </>
                      )}
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Olá! Aqui está o seu acesso ao Play Live IPTV:\n\n${clientGeneratedLink}\n\nBasta clicar no link acima para abrir o player e começar a assistir!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 text-center"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Enviar no WhatsApp
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-tv-card/50 border border-tv-border/60 rounded-xl text-center text-xs text-slate-400">
                  Preencha os campos acima para gerar o link de acesso direto do cliente.
                </div>
              )}

              <p className="text-[11px] text-slate-500 text-center">
                Ao clicar no link, o player entrará diretamente na lista do cliente e salvará o acesso no navegador dele.
              </p>
            </div>
          )}

          {/* Demo Button Footer */}
          <div className="mt-6 pt-4 border-t border-tv-border flex items-center justify-between">
            <span className="text-xs text-slate-400">Quer apenas testar o player?</span>
            <button
              onClick={() => {
                loadDemoData();
                setIsConnectModalOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
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
