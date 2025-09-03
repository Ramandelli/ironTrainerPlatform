import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.projeto.irontrainer',
  appName: 'Iron Trainer',
  webDir: 'dist',
  version: '2.0.0',
   ios: {
    path: 'ios',
  },
  
  plugins: {
    Preferences: {
      configure: {
        defaults: {
          group: 'IronTracker'
        }
      }
    }
  }
};

export default config;
