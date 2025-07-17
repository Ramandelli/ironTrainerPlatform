import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5e6f770c7ed14412afc876151da22317',
  appName: 'Iron Tracker',
  webDir: 'dist',
  server: {
    url: 'https://5e6f770c-7ed1-4412-afc8-76151da22317.lovableproject.com?forceHideBadge=true',
    cleartext: true
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