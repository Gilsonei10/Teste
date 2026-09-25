/**
 * Detecção de ambiente de execução (webOS, Smart TV, Native ou Web)
 */

export function isWebOSEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  const isWebOSUa = ua.includes('web0s') || ua.includes('webos');
  const hasWebOSObj = typeof (window as any).webOS !== 'undefined';
  const isFileProtocol = window.location.protocol === 'file:' || window.location.protocol === 'webos:';
  return isWebOSUa || hasWebOSObj || isFileProtocol;
}

export function isTvOrNativeEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  if (isWebOSEnvironment()) return true;
  const ua = (navigator.userAgent || '').toLowerCase();
  const isTvUa =
    ua.includes('smart-tv') ||
    ua.includes('smarttv') ||
    ua.includes('tizen') ||
    ua.includes('crkey') ||
    ua.includes('appletv') ||
    ua.includes('android tv');
  const isNative = window.location.protocol === 'file:' || window.location.protocol === 'capacitor:';
  return isTvUa || isNative;
}
