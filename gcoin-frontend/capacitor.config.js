/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
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

module.exports = config;