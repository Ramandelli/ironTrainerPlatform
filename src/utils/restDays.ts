import { storage } from './storage';

export class RestDayManager {
  private static readonly REST_DAYS_KEY = 'custom_rest_days';

  // Get custom rest days
  async getCustomRestDays(): Promise<string[]> {
    try {
      const restDaysStr = await storage.getItem(RestDayManager.REST_DAYS_KEY);
      return restDaysStr ? JSON.parse(restDaysStr) : [];
    } catch (error) {
      console.error('Failed to load custom rest days:', error);
      return [];
    }
  }

  // Set a day as rest day (format: YYYY-MM-DD)
  async setRestDay(date: string): Promise<void> {
    try {
      const restDays = await this.getCustomRestDays();
      if (!restDays.includes(date)) {
        restDays.push(date);
        await storage.setItem(RestDayManager.REST_DAYS_KEY, JSON.stringify(restDays));
      }
    } catch (error) {
      console.error('Failed to set rest day:', error);
    }
  }

  // Remove a day from rest days
  async removeRestDay(date: string): Promise<void> {
    try {
      const restDays = await this.getCustomRestDays();
      const filteredDays = restDays.filter(day => day !== date);
      await storage.setItem(RestDayManager.REST_DAYS_KEY, JSON.stringify(filteredDays));
    } catch (error) {
      console.error('Failed to remove rest day:', error);
    }
  }

  // Check if a specific date is a rest day
  async isRestDay(date: string): Promise<boolean> {
    try {
      const restDays = await this.getCustomRestDays();
      return restDays.includes(date);
    } catch (error) {
      console.error('Failed to check rest day:', error);
      return false;
    }
  }

  // Check if today is a rest day
  async isTodayRestDay(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return this.isRestDay(today);
  }

  // Check if today is a weekend (Saturday or Sunday)
  isWeekend(): boolean {
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  }

  // Check if today is a natural rest day (weekend OR custom rest day)
  async shouldShowRestDay(): Promise<boolean> {
    return this.isWeekend() || await this.isTodayRestDay();
  }
}

export const restDayManager = new RestDayManager();