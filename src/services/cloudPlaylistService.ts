/**
 * Serviço de Nuvem para sincronização de listas remotas via MAC e KEY com Supabase.
 * Utiliza chamadas HTTP REST nativas (PostgREST) leves sem dependências pesadas.
 */

export interface RemotePlaylistData {
  mac: string;
  device_key: string;
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
  LOCAL_MACS: 'playlive_cloud_mock_db', // Fallback em tempo de desenvolvimento/offline
};

// Configuração padrão do Supabase (Pode ser alterada via localStorage ou configurações)
const DEFAULT_SUPABASE_URL = 'https://demo-iptv-project.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

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
   * Busca a lista cadastrada na nuvem para o MAC e KEY informados.
   */
  async getRemotePlaylist(mac: string, key?: string): Promise<RemotePlaylistData | null> {
    const cleanMac = mac.trim().toUpperCase();
    const cleanKey = (key || '').trim();
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
        console.warn('[CloudService] Falha ao consultar Supabase, verificando fallback local...', err);
      }
    }

    // Fallback local caso ainda não tenha configurado as chaves do Supabase
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
   * Cadastra ou atualiza uma lista na nuvem vinculada ao MAC e KEY.
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

    const config = this.getSupabaseConfig();
    let supabaseSuccess = false;

    if (config.isConfigured) {
      try {
        const endpoint = `${config.url}/rest/v1/playlists`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          supabaseSuccess = true;
        } else {
          const errText = await res.text();
          console.error('[CloudService] Erro ao gravar no Supabase:', errText);
        }
      } catch (err: any) {
        console.error('[CloudService] Erro de rede ao conectar no Supabase:', err);
      }
    }

    // Sempre armazena no fallback local para garantir funcionamento imediato em ambiente de testes/local
    try {
      const mockDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_MACS) || '{}');
      mockDb[cleanMac] = payload;
      localStorage.setItem(STORAGE_KEYS.LOCAL_MACS, JSON.stringify(mockDb));
    } catch {}

    if (config.isConfigured && !supabaseSuccess) {
      return {
        success: false,
        message: 'Não foi possível salvar na nuvem do Supabase. Verifique a URL e Anon Key.',
      };
    }

    return {
      success: true,
      message: 'Lista salva com sucesso! Abra seu aplicativo Play Live na TV para assistir.',
    };
  },
};
