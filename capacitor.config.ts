import type { CapacitorConfig } from '@capacitor/cli';
import appVersion from './app-version.json';

const config: CapacitorConfig = {
  appId: appVersion.applicationId,
  appName: 'MehrChain',
  webDir: 'dist/mehrchain-frontend/browser',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#008080',
      sound: 'beep.wav',
    },
  },
};

export default config;
