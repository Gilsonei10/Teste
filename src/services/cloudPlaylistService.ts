/**
 * Serviço de Nuvem para sincronização de listas remotas via MAC e KEY.
 * Utiliza Relay Global em tempo real (ntfy.sh) com suporte a Supabase para persistência dedicada.
 */

export interface RemotePlaylistData {
  mac: string;
  device_key?: string;
  name: string;
  type: 'm3u_url' | 'xtream';
  url?: string;
  server_url?: string;
  username?: string;
  password?: string;
  updated_at?: string;
}

const STORAGE_KEYS = {
  SUPABASE_URL: 'playlive_supabase_url',
  SUPABASE_KEY: 'playlive_supabase_anon_key',
  LOCAL_MACS: 'playlive_cloud_mock_db',
};

const RELAY_BASE = 'https://ntfy.sh';

const DEFAULT_SUPABASE_URL = 'https://demo-iptv-project.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

function getTopicForMac(mac: string): string {
  const clean = mac.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `playlive_mac_${clean}`;
}

function getDeviceTopicForMac(mac: string): string {
  const clean = mac.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `playlive_device_${clean}`;
}

export const CloudPlaylistService = {
  /**
   * Valida se a string é um endereço MAC estrito de 12 hexadecimais (ex: 00:1A:79:B4:C2:10).
   */
  isValidMacFormat(mac: string): boolean {
    const clean = (mac || '').trim();
    return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(clean);
  },

  /**
   * Registra a presença do aplicativo neste dispositivo na nuvem para permitir validação no portal web.
   */
  async registerDevicePresence(mac: string, key?: string): Promise<void> {
    const cleanMac = (mac || '').trim().toUpperCase();
    if (!this.isValidMacFormat(cleanMac)) return;

    // Salva localmente
    try {
      const registered = JSON.parse(localStorage.getItem('playlive_registered_devices') || '{}');
      registered[cleanMac] = {
        mac: cleanMac,
        key: key || '',
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('playlive_registered_devices', JSON.stringify(registered));
    } catch {}

    // Publica no Relay Global (ntfy.sh) com retenção/cache
    try {
      const topic = getDeviceTopicForMac(cleanMac);
      await fetch(`${RELAY_BASE}/${topic}`, {
        method: 'POST',
        headers: {
          'Title': 'Device Registered',
          'Tags': 'tv,playlive',
        },
        body: JSON.stringify({
          mac: cleanMac,
          device_key: key || '',
          registered_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn('[CloudService] Falha ao registrar dispositivo no relay:', e);
    }
  },

  /**
   * Verifica se o dispositivo foi previamente registrado pelo aplicativo Play Live.
   */
  async verifyDeviceExists(mac: string): Promise<{ exists: boolean; message?: string }> {
    const cleanMac = (mac || '').trim().toUpperCase();

    // 1. Validação estrita de formato
    if (!this.isValidMacFormat(cleanMac)) {
      return {
        exists: false,
        message: 'Formato de MAC inválido. O formato deve ser XX:XX:XX:XX:XX:XX (apenas números de 0 a 9 e letras de A a F).',
      };
    }

    // 2. Verifica se o próprio navegador / dispositivo local possui este MAC
    try {
      const registered = JSON.parse(localStorage.getItem('playlive_registered_devices') || '{}');
      if (registered[cleanMac]) {
        return { exists: true };
      }
      const myDevice = localStorage.getItem('playlive_device_mac');
      if (myDevice && myDevice.trim().toUpperCase() === cleanMac) {
        return { exists: true };
      }
    } catch {}

    // 3. Consulta no Relay Global se o aplicativo já foi aberto nesta TV ou celular
    try {
      const topic = getDeviceTopicForMac(cleanMac);
      const res = await fetch(`${RELAY_BASE}/${topic}/json?poll=1`, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text.includes('"event":"message"')) {
          return { exists: true };
        }
      }
    } catch (e) {
      console.warn('[CloudService] Erro ao consultar presença do dispositivo:', e);
    }

    // 4. Fallback: consulta se já há alguma playlist cadastrada para este MAC
    try {
      const playlistTopic = getTopicForMac(cleanMac);
      const res = await fetch(`${RELAY_BASE}/${playlistTopic}/json?poll=1`, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text.includes('"event":"message"')) {
          return { exists: true };
        }
      }
    } catch {}

    // 5. Consulta no Supabase se estiver configurado
    const config = this.getSupabaseConfig();
    if (config.isConfigured) {
      try {
        const queryUrl = `${config.url}/rest/v1/playlists?mac=eq.${encodeURIComponent(cleanMac)}&select=mac`;
        const res = await fetch(queryUrl, {
          method: 'GET',
          headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
          },
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows.length > 0) {
            return { exists: true };
          }
        }
      } catch {}
    }

    return {
      exists: false,
      message: 'Dispositivo / MAC não encontrado! Abra o aplicativo Play Live na sua TV para ativar o seu MAC antes de enviar.',
    };
  },
  getSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
    try {
      const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
      const key = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_ANON_KEY;
      const isConfigured = !url.includes('demo-iptv-project') && key.length > 20;
      return { url, key, isConfigured };
    } catch {
      return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY, isConfigured: false };
    }
  },

  setSupabaseConfig(url: string, key: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim().replace(/\/+$/, ''));
      localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key.trim());
    } catch (e) {
      console.error('Erro ao salvar credenciais do Supabase:', e);
    }
  },

  /**
   * Busca a lista cadastrada na nuvem para o MAC informado.
   */
  async getRemotePlaylist(mac: string, key?: string): Promise<RemotePlaylistData | null> {
    const cleanMac = mac.trim().toUpperCase();
    const cleanKey = (key || '').trim();

    // 1. Tenta buscar no Relay Global em tempo real (funciona entre celular e TV instantaneamente)
    try {
      const topic = getTopicForMac(cleanMac);
      const res = await fetch(`${RELAY_BASE}/${topic}/json?poll=1`, {
        cache: 'no-store',
      });

      if (res.ok) {
        const text = await res.text();
        const lines = text.trim().split('\n').filter(Boolean);
        // Percorre as mensagens da mais recente para a mais antiga
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const parsedEvent = JSON.parse(lines[i]);
            if (parsedEvent.event === 'message' && parsedEvent.message) {
              const data: RemotePlaylistData = JSON.parse(parsedEvent.message);
              // Valida chave caso tenha sido cadastrada com chave
              if (!data.device_key || !cleanKey || data.device_key === cleanKey) {
                return data;
              }
            }
          } catch {}
        }
      }
    } catch (relayErr) {
      console.warn('[CloudService] Falha ao consultar relay:', relayErr);
    }

    // 2. Consulta no Supabase se estiver configurado
    const config = this.getSupabaseConfig();
    if (config.isConfigured) {
      try {
        const queryUrl = `${config.url}/rest/v1/playlists?mac=eq.${encodeURIComponent(cleanMac)}&select=*`;
        const res = await fetch(queryUrl, {
          method: 'GET',
          headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const rows: RemotePlaylistData[] = await res.json();
          if (rows && rows.length > 0) {
            const item = rows[0];
            if (!item.device_key || !cleanKey || item.device_key === cleanKey) {
              return item;
            }
          }
        }
      } catch (err) {
        console.warn('[CloudService] Falha ao consultar Supabase:', err);
      }
    }

    // 3. Fallback local no mesmo navegador
    try {
      const mockDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_MACS) || '{}');
      const item = mockDb[cleanMac];
      if (item && (!item.device_key || !cleanKey || item.device_key === cleanKey)) {
        return item;
      }
    } catch {}

    return null;
  },

  /**
   * Cadastra ou atualiza uma lista na nuvem vinculada ao MAC.
   */
  async saveRemotePlaylist(data: RemotePlaylistData): Promise<{ success: boolean; message: string }> {
    const cleanMac = data.mac.trim().toUpperCase();
    const cleanKey = (data.device_key || '').trim();

    // 1. Validação prévia de existência e formato do MAC
    const verification = await this.verifyDeviceExists(cleanMac);
    if (!verification.exists) {
      return {
        success: false,
        message: verification.message || 'Endereço MAC não encontrado ou incorreto.',
      };
    }

    const payload: RemotePlaylistData = {
      ...data,
      mac: cleanMac,
      device_key: cleanKey,
      updated_at: new Date().toISOString(),
    };

    
    // 1. Envia para o Relay Global (ntfy.sh) para sincronização imediata com a TV
    try {
      const topic = getTopicForMac(cleanMac);
      const res = await fetch(`${RELAY_BASE}/${topic}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Title': 'PlayLive Playlist Sync',
          'Priority': 'urgent',
        },
      });
      if (res.ok) {
        
      }
    } catch (e) {
      console.warn('[CloudService] Erro ao enviar para relay:', e);
    }

    // 2. Se o Supabase estiver configurado, salva no banco
    const config = this.getSupabaseConfig();
    if (config.isConfigured) {
      try {
        const endpoint = `${config.url}/rest/v1/playlists`;
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        console.warn('[CloudService] Erro ao sincronizar com Supabase:', err);
      }
    }

    // 3. Fallback no storage local
    try {
      const mockDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_MACS) || '{}');
      mockDb[cleanMac] = payload;
      localStorage.setItem(STORAGE_KEYS.LOCAL_MACS, JSON.stringify(mockDb));
    } catch {}

    return {
      success: true,
      message: 'Lista enviada com sucesso! Seu aplicativo Play Live na TV já pode sincronizar.',
    };
  },

  /**
   * Conecta a TV para escutar em tempo real (Server-Sent Events) quando uma nova lista for enviada.
   */
  listenForRemotePlaylist(mac: string, onReceived: (data: RemotePlaylistData) => void): () => void {
    const cleanMac = mac.trim().toUpperCase();
    const topic = getTopicForMac(cleanMac);
    const url = `${RELAY_BASE}/${topic}/sse`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(url);

      eventSource.onmessage = event => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === 'message' && parsed.message) {
            const data: RemotePlaylistData = JSON.parse(parsed.message);
            onReceived(data);
          }
        } catch {
          // Ignorar pings
        }
      };
    } catch (e) {
      console.error('[CloudService] Erro no EventSource:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },
};
