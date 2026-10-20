import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.webiptv.player',
  appName: 'Play Live',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  },
  server: {
    url: 'https://playlive-rust.vercel.app',
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: false
    }
  }
};

export default config;
