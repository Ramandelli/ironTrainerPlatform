import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.projeto.irontrainer',
  appName: 'Iron Trainer',
  webDir: 'dist',
  version: '2.5',
     
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
