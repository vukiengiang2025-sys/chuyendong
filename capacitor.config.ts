import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kineticshapes.app',
  appName: 'Mô phỏng Hình học Động',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
