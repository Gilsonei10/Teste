import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.webiptv.player',
  appName: 'Play Live',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  },
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: false
    }
  }
};

export default config;
