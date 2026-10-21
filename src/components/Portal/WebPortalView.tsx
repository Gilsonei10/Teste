import React, { useState, useEffect } from 'react';
import { Tv, User, Link2, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { CloudPlaylistService } from '../../services/cloudPlaylistService';

type PortalTab = 'url' | 'xtream' | 'code' | 'check';

export const WebPortalView: React.FC<{ onBackToApp?: () => void }> = ({ onBackToApp }) => {
  const [activeTab, setActiveTab] = useState<PortalTab>('url');

  // Form Fields
  const [mac, setMac] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [m3uUrl, setM3uUrl] = useState('');

  // Xtream Form Fields
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-fill from URL parameters (ex: ?mac=00:1A:79:XX:XX:XX&key=123456)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMac = params.get('mac');
      const urlKey = params.get('key');
      if (urlMac) setMac(urlMac.toUpperCase());
      if (urlKey) setDeviceKey(urlKey);
    }
  }, []);

  const handleFormatMac = (val: string) => {
    // Permite digitar e formata automaticamente com dois pontos (XX:XX:XX:XX:XX:XX)
    const cleaned = val.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 12);
    const parts = cleaned.match(/.{1,2}/g);
    setMac(parts ? parts.join(':') : cleaned);
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
    <div className="min-h-screen w-full bg-[#080d1a] text-slate-100 flex flex-col justify-between p-4 sm:p-8 md:p-12 selection:bg-blue-600 selection:text-white font-sans">
      {/* Top Bar with brand and back button */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-8">
        <div className="flex items-center gap-3">
          <img
            src="./icon.png"
            alt="Play Live IPTV"
            className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/20 border border-blue-500/30"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">
              Play Live <span className="text-blue-500">IPTV</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Portal de Ativação</p>
          </div>
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-tv-card hover:bg-tv-border border border-tv-border text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Player</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left Tabs & Right Form Card */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
        {/* LEFT COLUMN: Options list */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Como deseja carregar sua playlist?
          </h2>

          <div className="space-y-3">
            {/* Option 1: Login com MAC e KEY */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('check');
                setFeedback(null);
              }}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer relative ${
                activeTab === 'check'
                  ? 'bg-[#121c35] border-blue-500 shadow-lg shadow-blue-600/10'
                  : 'bg-[#0f172a]/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${activeTab === 'check' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Login com MAC e KEY</div>
                  <div className="text-xs text-slate-400">Acesse e consulte o status do seu dispositivo</div>
                </div>
              </div>
              {activeTab === 'check' && (
                <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[10px] border-l-blue-500 absolute -right-2.5 top-1/2 -translate-y-1/2 hidden lg:block" />
              )}
            </button>

            {/* Option 2: Carregar playlist com Xtream */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('xtream');
                setFeedback(null);
              }}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer relative ${
                activeTab === 'xtream'
                  ? 'bg-[#121c35] border-blue-500 shadow-lg shadow-blue-600/10'
                  : 'bg-[#0f172a]/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${activeTab === 'xtream' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Carregar playlist com Xtream</div>
                  <div className="text-xs text-slate-400">Adicione sua playlist via conta Xtream Codes</div>
                </div>
              </div>
              {activeTab === 'xtream' && (
                <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[10px] border-l-blue-500 absolute -right-2.5 top-1/2 -translate-y-1/2 hidden lg:block" />
              )}
            </button>

            {/* Option 3: Carregar playlist com URL */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('url');
                setFeedback(null);
              }}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer relative ${
                activeTab === 'url'
                  ? 'bg-[#121c35] border-blue-500 shadow-lg shadow-blue-600/10'
                  : 'bg-[#0f172a]/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${activeTab === 'url' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">Carregar playlist com URL</div>
                  <div className="text-xs text-slate-400">Adicione sua playlist via URL M3U da Playlist</div>
                </div>
              </div>
              {activeTab === 'url' && (
                <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[10px] border-l-blue-500 absolute -right-2.5 top-1/2 -translate-y-1/2 hidden lg:block" />
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Action Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-[#0f172a]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl relative backdrop-blur-xl">
            {/* Header info */}
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                Carregue sua lista de reprodução no aplicativo e desfrute dos benefícios do Play Live
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Insira o Endereço MAC e a Chave exibidos na tela da sua Smart TV para vincular instantaneamente sua lista.
              </p>
            </div>

            {/* Alert / Feedback message */}
            {feedback && (
              <div
                className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in ${
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field: Endereço MAC */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Endereço MAC</label>
                <input
                  type="text"
                  value={mac}
                  onChange={e => handleFormatMac(e.target.value)}
                  placeholder="00:1A:79:XX:XX:XX"
                  maxLength={17}
                  className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tracking-wider transition-all"
                  required
                />
              </div>

              {/* Field: Chave do Dispositivo (KEY) */}
              {activeTab !== 'url' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Chave do Dispositivo (KEY)</label>
                  <input
                    type="text"
                    value={deviceKey}
                    onChange={e => setDeviceKey(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Chave de 6 dígitos"
                    maxLength={6}
                    className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono tracking-wider transition-all"
                    required
                  />
                </div>
              )}

              {/* TAB URL SPECIFIC FIELDS */}
              {activeTab === 'url' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome da lista de reprodução</label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={e => setPlaylistName(e.target.value)}
                      placeholder="Ex: Minha TV Sala"
                      className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">URL da Playlist (M3U)</label>
                    <input
                      type="url"
                      value={m3uUrl}
                      onChange={e => setM3uUrl(e.target.value)}
                      placeholder="http://exemplo.com/get.php?username=...&password=...&type=m3u_plus"
                      className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>
                </>
              )}

              {/* TAB XTREAM SPECIFIC FIELDS */}
              {activeTab === 'xtream' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome da lista de reprodução</label>
                    <input
                      type="text"
                      value={playlistName}
                      onChange={e => setPlaylistName(e.target.value)}
                      placeholder="Ex: Minha TV Sala"
                      className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">URL do Servidor (Host e Porta)</label>
                    <input
                      type="text"
                      value={serverUrl}
                      onChange={e => setServerUrl(e.target.value)}
                      placeholder="http://servidor.com:80"
                      className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Usuário</label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Seu usuário"
                        className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        className="w-full bg-[#162038] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TAB CHECK SPECIFIC */}
              {activeTab === 'check' && (
                <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300 space-y-2">
                  <p className="font-semibold text-white">Status da Conexão com a TV</p>
                  <p>
                    Com o MAC e a Chave preenchidos acima, você pode verificar se a sua TV já está pronta para receber listas.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processando playlist...</span>
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
      <div className="max-w-6xl w-full mx-auto pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        Play Live IPTV Universal Player &copy; 2026. Todos os direitos reservados.
      </div>
    </div>
  );
};
