import { storage } from './storage';

export class RestDayManager {
  private static readonly REST_DAYS_KEY = 'custom_rest_days';
  private static readonly REST_DAYS_COUNT_KEY = 'rest_days_count';

  
  async getCustomRestDays(): Promise<string[]> {
    try {
      const restDaysStr = await storage.getItem(RestDayManager.REST_DAYS_KEY);
      return restDaysStr ? JSON.parse(restDaysStr) : [];
    } catch (error) {
      console.error('Failed to load custom rest days:', error);
      return [];
    }
  }

  
  async getRestDaysCount(): Promise<number> {
    try {
      const countStr = await storage.getItem(RestDayManager.REST_DAYS_COUNT_KEY);
      return countStr ? parseInt(countStr) : 0;
    } catch (error) {
      console.error('Failed to load rest days count:', error);
      return 0;
    }
  }

  
  async updateRestDaysCount(): Promise<void> {
    // Este método agora é deprecado - a contagem de descanso é feita nas estatísticas
    // com base em dias sem treino agendado
    console.log('updateRestDaysCount is deprecated - rest days are now calculated based on scheduled workouts');
  }

  
  async setRestDay(date: string): Promise<void> {
    try {
      const restDays = await this.getCustomRestDays();
      if (!restDays.includes(date)) {
        restDays.push(date);
        await storage.setItem(RestDayManager.REST_DAYS_KEY, JSON.stringify(restDays));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('rest_days_updated'));
        }
      }
    } catch (error) {
      console.error('Failed to set rest day:', error);
    }
  }

  
  async removeRestDay(date: string): Promise<void> {
    try {
      const restDays = await this.getCustomRestDays();
      const filteredDays = restDays.filter(day => day !== date);
      await storage.setItem(RestDayManager.REST_DAYS_KEY, JSON.stringify(filteredDays));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rest_days_updated'));
      }
    } catch (error) {
      console.error('Failed to remove rest day:', error);
    }
  }

  
  async isRestDay(date: string): Promise<boolean> {
    try {
      const restDays = await this.getCustomRestDays();
      return restDays.includes(date);
    } catch (error) {
      console.error('Failed to check rest day:', error);
      return false;
    }
  }

  
  async isTodayRestDay(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return this.isRestDay(today);
  }

  
  isWeekend(): boolean {
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  }

  
  async shouldShowRestDay(): Promise<boolean> {
    return this.isWeekend() || await this.isTodayRestDay();
  }

  
  async resetRestDays(): Promise<void> {
    try {
      await Promise.all([
        storage.removeItem(RestDayManager.REST_DAYS_KEY),
        storage.removeItem(RestDayManager.REST_DAYS_COUNT_KEY)
      ]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rest_days_updated'));
      }
    } catch (error) {
      console.error('Failed to reset rest days:', error);
    }
  }
}

export const restDayManager = new RestDayManager();