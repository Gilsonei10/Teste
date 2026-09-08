export interface PairingPayload {
  type: 'xtream' | 'm3u_url';
  name?: string;
  credentials?: {
    serverUrl: string;
    username: string;
    password: string;
  };
  m3uUrl?: string;
}

const RELAY_BASE = 'https://ntfy.sh';

export const PairingService = {
  /**
   * Gera um código numérico de 6 dígitos aleatório
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Conecta a TV ao canal de escuta em tempo real usando Server-Sent Events (SSE)
   */
  listenForPairing(code: string, onReceived: (payload: PairingPayload) => void): () => void {
    const cleanCode = code.replace(/\D/g, '');
    const topic = `playlive_pair_${cleanCode}`;
    const url = `${RELAY_BASE}/${topic}/sse`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(url);

      eventSource.onmessage = event => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === 'message' && parsed.message) {
            const payload: PairingPayload = JSON.parse(parsed.message);
            onReceived(payload);
          }
        } catch {
          // Ignorar mensagens de ping ou inválidas
        }
      };

      eventSource.onerror = () => {
        // EventSource reconecta automaticamente
      };
    } catch (e) {
      console.error('[PAIRING] Erro ao iniciar EventSource:', e);
    }

    // Retorna função de limpeza
    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },

  /**
   * Envia as credenciais de IPTV do celular/computador para a Smart TV
   */
  async sendPairing(code: string, payload: PairingPayload): Promise<boolean> {
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      throw new Error('O código de pareamento deve conter exatamente 6 dígitos.');
    }

    const topic = `playlive_pair_${cleanCode}`;
    const url = `${RELAY_BASE}/${topic}`;

    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Title': 'PlayLive TV Activation',
        'Priority': 'urgent',
      },
    });

    if (!res.ok) {
      throw new Error('Falha ao enviar dados para a Smart TV. Tente novamente.');
    }

    return true;
  },
};
