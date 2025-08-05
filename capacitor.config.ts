import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.projeto.irontrainer',
  appName: 'Iron Trainer',
  webDir: 'dist',
  
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