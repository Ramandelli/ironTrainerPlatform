import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.projeto.irontrainer',
  appName: 'Iron Trainer',
  webDir: 'dist',
  version: '1.0.3',
     
  plugins: {
    Preferences: {
      configure: {
        defaults: {
          group: 'IronTrainer'
        }
      }
    }
  }
};

export default config;
