import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yplan.app',
  appName: 'yPlan',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
