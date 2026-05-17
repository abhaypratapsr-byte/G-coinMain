import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gcoin.app',
  appName: 'GCoin',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://g-coin-main-7lh2.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0a0a0a',
  },
};

export default config;