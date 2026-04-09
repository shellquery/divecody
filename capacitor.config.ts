import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shellquery.divecody',
  appName: '神曲',
  webDir: 'www',
  server: {
    url: 'https://divecody.vercel.app',
    cleartext: false,
    allowNavigation: ['*.vercel.app'],
  },
  ios: {
    backgroundColor: '#0f0e0d',
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
