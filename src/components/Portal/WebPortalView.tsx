import React, { useState, useEffect, useRef } from 'react';
import { Tv, User, Link2, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles, Search, ArrowDown } from 'lucide-react';
import { CloudPlaylistService } from '../../services/cloudPlaylistService';

type PortalTab = 'url' | 'xtream' | 'code' | 'check';

export const WebPortalView: React.FC<{
  initialMac?: string;
  initialKey?: string;
  onBackToApp?: () => void;
}> = ({ initialMac = '', initialKey = '', onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<PortalTab>('url');
  const formCardRef = useRef<HTMLDivElement>(null);

  // Form Fields
  const [mac, setMac] = useState(initialMac);
  const [deviceKey, setDeviceKey] = useState(initialKey);
  const [playlistName, setPlaylistName] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');

  // Xtream Form Fields
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-fill from props or URL parameters (ex: ?mac=00:1A:79:XX:XX:XX&key=123456)
  useEffect(() => {
    if (initialMac) setMac(initialMac.toUpperCase());
    if (initialKey) setDeviceKey(initialKey);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMac = params.get('mac');
      const urlKey = params.get('key');
      if (urlMac) setMac(urlMac.toUpperCase());
      if (urlKey) setDeviceKey(urlKey);
    }
  }, [initialMac, initialKey]);

  // Garante rolagem completa e seleção de texto desimpedida na página do portal em qualquer dispositivo (incluindo Android)
  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalBodyUserSelect = document.body.style.userSelect;
    const rootEl = document.getElementById('root');
    const originalRootOverflow = rootEl?.style.overflow;
    const originalRootHeight = rootEl?.style.height;

    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.minHeight = '100%';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.minHeight = '100%';
    document.body.style.userSelect = 'auto';
    if (rootEl) {
      rootEl.style.overflow = 'auto';
      rootEl.style.height = 'auto';
      rootEl.style.minHeight = '100%';
    }

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.body.style.userSelect = originalBodyUserSelect;
      if (rootEl) {
        rootEl.style.overflow = originalRootOverflow || '';
        rootEl.style.height = originalRootHeight || '';
        rootEl.style.minHeight = '';
      }
    };
  }, []);

  const handleFormatMac = (val: string) => {
    // Permite digitar e formata automaticamente com dois pontos (XX:XX:XX:XX:XX:XX)
    const cleaned = val.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 12);
    const parts = cleaned.match(/.{1,2}/g);
    setMac(parts ? parts.join(':') : cleaned);
  };

  const handleSelectTab = (tab: PortalTab) => {
    setActiveTab(tab);
    setFeedback(null);
    // Em telas menores, rola suavemente para o formulário para o usuário ver os campos imediatamente
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // No celular Android, quando o teclado virtual abre, rola suavemente para o centro visível
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!mac || !macRegex.test(mac.trim())) {
      setFeedback({
        type: 'error',
        message: 'Formato de MAC inválido. O formato deve ser XX:XX:XX:XX:XX:XX (ex: 00:1A:79:B4:C2:10).',
      });
      return;
    }
    if (activeTab !== 'url' && !deviceKey) {
      setFeedback({ type: 'error', message: 'A chave do dispositivo (Key) de 6 dígitos é obrigatória.' });
      return;
    }

    if (activeTab === 'check') {
      setIsSubmitting(true);
      const verifyRes = await CloudPlaylistService.verifyDeviceExists(mac);
      if (!verifyRes.exists) {
        setFeedback({
          type: 'error',
          message: verifyRes.message || 'Dispositivo não encontrado. Certifique-se de que o aplicativo Play Live está aberto na sua Smart TV com este MAC.',
        });
      } else {
        const existing = await CloudPlaylistService.getRemotePlaylist(mac, deviceKey);
        if (existing) {
          setFeedback({
            type: 'success',
            message: `Dispositivo conectado com sucesso! Playlist ativa vinculada: "${existing.name}" (${existing.type === 'xtream' ? 'Xtream Codes' : 'Link M3U'}).`,
          });
        } else {
          setFeedback({
            type: 'success',
            message: 'Dispositivo validado e online! Nenhuma lista enviada ainda. Selecione "Lista M3U" ou "Xtream" acima para enviar sua lista.',
          });
        }
      }
      setIsSubmitting(false);
      return;
    }

    if (activeTab === 'url') {
      if (!m3uUrl || !m3uUrl.trim().startsWith('http')) {
        setFeedback({ type: 'error', message: 'Insira um link de playlist M3U válido (iniciando com http:// ou https://).' });
        return;
      }

      setIsSubmitting(true);
      const result = await CloudPlaylistService.saveRemotePlaylist({
        mac,
        device_key: deviceKey || '',
        name: playlistName.trim() || 'Minha Lista Web',
        type: 'm3u_url',
        url: m3uUrl.trim(),
      });
      setIsSubmitting(false);

      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
    } else if (activeTab === 'xtream') {
      if (!serverUrl || !username || !password) {
        setFeedback({ type: 'error', message: 'Preencha a URL do servidor, o usuário e a senha da conta Xtream.' });
        return;
      }

      setIsSubmitting(true);
      const result = await CloudPlaylistService.saveRemotePlaylist({
        mac,
        device_key: deviceKey,
        name: playlistName.trim() || username.trim() || 'Lista Xtream',
        type: 'xtream',
        server_url: serverUrl.trim(),
        username: username.trim(),
        password: password.trim(),
      });
      setIsSubmitting(false);

      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#080d1a] text-slate-100 overflow-y-auto overflow-x-hidden selection:bg-blue-600 selection:text-white font-sans select-text z-50 overscroll-y-contain touch-pan-y">
      <div className="min-h-full flex flex-col p-3 sm:p-6 lg:p-8 pb-36 sm:pb-16">
        {/* Top Bar with brand and back button */}
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-3 sm:pb-6">
          <div className="flex items-center gap-3">
            <img
              src="./icon.png"
              alt="Play Live IPTV"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shadow-lg shadow-blue-500/20 border border-blue-500/30"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-none">
                Play Live <span className="text-blue-500">IPTV</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Portal de Ativação</p>
            </div>
          </div>

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-tv-card hover:bg-tv-border border border-tv-border text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Player</span>
            </button>
          )}
        </div>

        {/* Main Grid: Left Tabs & Right Form Card */}
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-8 items-start flex-1 my-1 sm:my-4">
          {/* LEFT COLUMN: Options list */}
          <div className="md:col-span-5 space-y-2.5 sm:space-y-4">
            <div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Como deseja carregar sua playlist?
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 sm:mt-1">
                Selecione o método abaixo para enviar a lista para o seu aparelho:
              </p>
            </div>

            {/* Mobile Tab Selector (Compact, side-by-side tabs < md) */}
            <div className="grid grid-cols-3 gap-2 md:hidden">
              {/* Tab 1: Lista M3U (Padrão para quem quer colocar MAC, Nome e Link da Lista) */}
              <button
                type="button"
                onClick={() => handleSelectTab('url')}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-[#121c35] border-blue-500 shadow-md shadow-blue-600/20 text-white'
                    : 'bg-[#0f172a]/80 border-slate-800 text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeTab === 'url' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Link2 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Lista M3U</span>
              </button>

              {/* Tab 2: Xtream */}
              <button
                type="button"
                onClick={() => handleSelectTab('xtream')}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'xtream'
                    ? 'bg-[#121c35] border-blue-500 shadow-md shadow-blue-600/20 text-white'
                    : 'bg-[#0f172a]/80 border-slate-800 text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeTab === 'xtream' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Xtream</span>
              </button>

              {/* Tab 3: Consultar Status MAC/KEY */}
              <button
                type="button"
                onClick={() => handleSelectTab('check')}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'check'
                    ? 'bg-[#121c35] border-blue-500 shadow-md shadow-blue-600/20 text-white'
                    : 'bg-[#0f172a]/80 border-slate-800 text-slate-400'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeTab === 'check' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Tv className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold leading-tight">Checar TV</span>
              </button>
            </div>

            {/* Mobile quick scroll hint button */}
            <div className="md:hidden flex justify-center pt-0.5">
              <button
                type="button"
                onClick={() => formCardRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 py-1 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20 transition-all cursor-pointer"
              >
                <span>Preencher MAC, Nome e Lista abaixo</span>
                <ArrowDown className="w-3 h-3 animate-bounce" />
              </button>
            </div>

            {/* Desktop & Tablet Vertical Cards (>= md) */}
            <div className="hidden md:block space-y-3">
              {/* Option 1: Carregar playlist com URL (M3U) */}
              <button
                type="button"
                onClick={() => handleSelectTab('url')}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer relative ${
                  activeTab === 'url'
                    ? 'bg-[#121c35] border-blue-500 shadow-lg shadow-blue-600/10'
                    : 'bg-[#0f172a]/80 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 sm:p-3 rounded-xl ${activeTab === 'url' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Carregar playlist com URL (M3U)</div>
                    <div className="text-xs text-slate-400">Adicione via MAC, Nome e URL M3U da Playlist</div>
                  </div>
                </div>
                {activeTab === 'url' && (
                  <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[10px] border-l-blue-500 absolute -right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </button>

              {/* Option 2: Carregar playlist com Xtream */}
              <button
                type="button"
                onClick={() => handleSelectTab('xtream')}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer relative ${
                  activeTab === 'xtream'
                    ? 'bg-[#121c35] border-blue-500 shadow-lg shadow-blue-600/10'
                    : 'bg-[#0f172a]/80 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 sm:p-3 rounded-xl ${activeTab === 'xtream' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Carregar playlist com Xtream</div>
                    <div className="text-xs text-slate-400">Adicione sua playlist via conta Xtream Codes</div>
                  </div>
                </div>
                {activeTab === 'xtream' && (
                  <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[10px] border-l-blue-500 absolute -right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </button>

              {/* Option 3: Login com MAC e KEY */}
              <button
                type="button"
                onClick={() => handleSelectTab('check')}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer relative ${
                  activeTab === 'check'
                    ? 'bg-[#121c35] border-blue-500 shadow-lg shadow-blue-600/10'
                    : 'bg-[#0f172a]/80 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 sm:p-3 rounded-xl ${activeTab === 'check' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">Consultar Status da TV</div>
                    <div className="text-xs text-slate-400">Consulte o status do seu aparelho via MAC e KEY</div>
                  </div>
                </div>
                {activeTab === 'check' && (
                  <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[10px] border-l-blue-500 absolute -right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Action Form Card */}
          <div ref={formCardRef} className="md:col-span-7 scroll-mt-6">
            <div className="bg-[#0f172a]/95 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-8 shadow-2xl relative backdrop-blur-xl">
              {/* Header info */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider">
                    {activeTab === 'url' && 'Modo: Playlist M3U'}
                    {activeTab === 'xtream' && 'Modo: Xtream Codes'}
                    {activeTab === 'check' && 'Modo: Consulta TV'}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-white leading-snug">
                  {activeTab === 'check'
                    ? 'Consulte o status do seu dispositivo e listas ativas'
                    : 'Carregue sua lista de reprodução no aplicativo Play Live'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeTab === 'check'
                    ? 'Insira o Endereço MAC e a Chave para consultar a conexão do seu aparelho.'
                    : 'Insira o Endereço MAC exibido na tela da sua Smart TV para vincular sua lista.'}
                </p>
              </div>

              {/* Alert / Feedback message */}
              {feedback && (
                <div
                  className={`mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 animate-in fade-in ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs sm:text-sm font-medium">{feedback.message}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                {/* Field: Endereço MAC */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Endereço MAC</label>
                  <input
                    type="text"
                    value={mac}
                    onChange={e => handleFormatMac(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="00:1A:79:XX:XX:XX"
                    maxLength={17}
                    className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tracking-wider transition-all"
                    required
                  />
                </div>

                {/* Field: Chave do Dispositivo (KEY) */}
                {activeTab !== 'url' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Chave do Dispositivo (KEY)</label>
                    <input
                      type="text"
                      value={deviceKey}
                      onChange={e => setDeviceKey(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onFocus={handleInputFocus}
                      placeholder="Chave de 6 dígitos"
                      maxLength={6}
                      className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tracking-wider transition-all"
                      required
                    />
                  </div>
                )}

                {/* TAB URL SPECIFIC FIELDS */}
                {activeTab === 'url' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da lista de reprodução</label>
                      <input
                        type="text"
                        value={playlistName}
                        onChange={e => setPlaylistName(e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="Ex: Minha TV Sala"
                        className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">URL da Playlist (M3U - Lista de Canais)</label>
                      <input
                        type="url"
                        value={m3uUrl}
                        onChange={e => setM3uUrl(e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="http://exemplo.com/get.php?username=...&password=...&type=m3u_plus"
                        className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  </>
                )}

                {/* TAB XTREAM SPECIFIC FIELDS */}
                {activeTab === 'xtream' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da lista de reprodução</label>
                      <input
                        type="text"
                        value={playlistName}
                        onChange={e => setPlaylistName(e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="Ex: Minha TV Sala"
                        className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">URL do Servidor (Host e Porta)</label>
                      <input
                        type="text"
                        value={serverUrl}
                        onChange={e => setServerUrl(e.target.value)}
                        onFocus={handleInputFocus}
                        placeholder="http://servidor.com:80"
                        className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Usuário</label>
                        <input
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          onFocus={handleInputFocus}
                          placeholder="Seu usuário"
                          className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Senha</label>
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onFocus={handleInputFocus}
                          placeholder="Sua senha"
                          className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB CHECK SPECIFIC */}
                {activeTab === 'check' && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300 space-y-2">
                    <p className="font-semibold text-white">Status da Conexão com o Dispositivo</p>
                    <p>
                      Insira o MAC e a Chave e clique em <strong>Consultar Dispositivo</strong> para verificar se a sua TV está online e se já possui uma playlist vinculada.
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleSelectTab('url')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Para colocar MAC, Nome e Lista de Canais, clique aqui na aba Lista M3U →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2 sm:pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{activeTab === 'check' ? 'Consultando dispositivo...' : 'Processando playlist...'}</span>
                      </>
                    ) : activeTab === 'check' ? (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Consultar Dispositivo</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Carregar playlist</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-6xl w-full mx-auto mt-auto pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 pb-8">
          Play Live IPTV Universal Player &copy; 2026. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};
