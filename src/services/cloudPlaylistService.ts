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

export const CloudPlaylistService = {
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

    if (!cleanMac || cleanMac.length < 10) {
      return { success: false, message: 'Endereço MAC inválido.' };
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
