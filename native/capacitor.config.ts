import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'se.linri.runout',
  appName: 'RunOut for Discogs',
  // Capacitor rejects parent paths, so we mirror the PWA into ./www via
  // `npm run copy:web` (automatically called before cap:sync).
  webDir: 'www',
  server: {
    // During development, you can point to a local server instead:
    // url: 'http://192.168.x.x:8080',
    // cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
