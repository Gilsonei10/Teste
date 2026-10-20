/**
 * Serviço responsável por gerar e persistir o Endereço MAC Virtual e a Chave do Dispositivo (Device Key).
 * Padrão da indústria para Smart TVs (LG webOS, Samsung Tizen, Android TV, Web).
 */

const STORAGE_KEYS = {
  MAC: 'playlive_device_mac',
  KEY: 'playlive_device_key',
};

export interface DeviceInfo {
  mac: string;
  key: string;
}

function generateHexByte(): string {
  return Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
}

/**
 * Gera um endereço MAC virtual no formato padrão de IPTV (00:1A:79:XX:XX:XX)
 */
function generateVirtualMac(): string {
  // Prefixo 00:1A:79 clássico de dispositivos IPTV/MAG
  return `00:1A:79:${generateHexByte()}:${generateHexByte()}:${generateHexByte()}`;
}

/**
 * Gera uma chave numérica de 6 dígitos
 */
function generateDeviceKey(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const DeviceService = {
  /**
   * Obtém o MAC e a Chave permanente deste dispositivo.
   * Se ainda não existirem, cria novos e armazena permanentemente.
   */
  getDeviceInfo(): DeviceInfo {
    try {
      let mac = localStorage.getItem(STORAGE_KEYS.MAC);
      let key = localStorage.getItem(STORAGE_KEYS.KEY);

      if (!mac || !key) {
        if (!mac) {
          mac = generateVirtualMac();
          localStorage.setItem(STORAGE_KEYS.MAC, mac);
        }
        if (!key) {
          key = generateDeviceKey();
          localStorage.setItem(STORAGE_KEYS.KEY, key);
        }
      }

      return { mac, key };
    } catch {
      // Fallback em caso de restrição de storage
      return {
        mac: '00:1A:79:B4:C2:10',
        key: '123456',
      };
    }
  },

  /**
   * Permite regenerar a Chave (Key) caso o usuário queira redefinir a segurança
   */
  regenerateKey(): string {
    const newKey = generateDeviceKey();
    localStorage.setItem(STORAGE_KEYS.KEY, newKey);
    return newKey;
  },
};
