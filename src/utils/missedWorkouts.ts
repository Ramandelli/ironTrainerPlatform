import { storage } from './storage';
import { customWorkoutManager } from './customWorkouts';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { WorkoutDay } from '../types/workout';

export interface MissedWorkout {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "segunda-feira", "terça-feira", etc.
  workoutDayId: string;
}

export class MissedWorkoutManager {
  private static readonly MISSED_WORKOUTS_KEY = 'missed_workouts';
  private static readonly LAST_CHECK_KEY = 'missed_workouts_last_check';

  async getMissedWorkouts(): Promise<MissedWorkout[]> {
    try {
      const missedStr = await storage.getItem(MissedWorkoutManager.MISSED_WORKOUTS_KEY);
      return missedStr ? JSON.parse(missedStr) : [];
    } catch (error) {
      console.error('Failed to load missed workouts:', error);
      return [];
    }
  }

  async addMissedWorkout(missed: MissedWorkout): Promise<void> {
    try {
      const missedWorkouts = await this.getMissedWorkouts();
      // Evitar duplicatas
      const exists = missedWorkouts.some(m => m.date === missed.date);
      if (!exists) {
        missedWorkouts.push(missed);
        await storage.setItem(MissedWorkoutManager.MISSED_WORKOUTS_KEY, JSON.stringify(missedWorkouts));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('missed_workouts_updated'));
        }
      }
    } catch (error) {
      console.error('Failed to add missed workout:', error);
    }
  }

  async resetMissedWorkouts(): Promise<void> {
    try {
      await Promise.all([
        storage.removeItem(MissedWorkoutManager.MISSED_WORKOUTS_KEY),
        storage.removeItem(MissedWorkoutManager.LAST_CHECK_KEY)
      ]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('missed_workouts_updated'));
      }
    } catch (error) {
      console.error('Failed to reset missed workouts:', error);
    }
  }

  // Helper: map day label to weekday index (0=Domingo..6=Sábado)
  private toIndex(label: string): number | null {
    if (!label) return null;
    const s = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace('-feira', '')
      .trim();
    const map: Record<string, number> = {
      domingo: 0, sun: 0, sunday: 0,
      segunda: 1, mon: 1, monday: 1,
      terca: 2, tue: 2, tuesday: 2,
      quarta: 3, wed: 3, wednesday: 3,
      quinta: 4, thu: 4, thursday: 4,
      sexta: 5, fri: 5, friday: 5,
      sabado: 6, saturday: 6, sat: 6,
    };
    return map[s] ?? null;
  }

  // IMPORTANT: nunca use new Date('YYYY-MM-DD') aqui.
  // Esse formato é interpretado como UTC em alguns ambientes e pode “voltar um dia”
  // em timezones negativos (ex.: Brasil), causando 06/01 aparecer como 07/01.
  private parseYMDLocal(ymd: string): Date {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  private toYMDLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getDayOfWeekName(dayIndex: number): string {
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];
    return days[dayIndex] || '';
  }

  // Verificar dias anteriores (até ontem) e registrar treinos não realizados
  async checkMissedWorkouts(): Promise<void> {
    try {
      const installDateStr = await storage.getInstallDate();
      if (!installDateStr) return;

      const lastCheckStr = await storage.getItem(MissedWorkoutManager.LAST_CHECK_KEY);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Carregar todos os treinos do plano
      const workoutPlan = await customWorkoutManager.getAllWorkouts(WORKOUT_PLAN);

      // Carregar histórico de treinos finalizados
      const workoutHistory = await storage.loadWorkoutHistory();

      // Data inicial: último check ou data de instalação (SEMPRE em horário local)
      let startDate: Date;
      if (lastCheckStr) {
        startDate = this.parseYMDLocal(lastCheckStr);
        startDate.setDate(startDate.getDate() + 1); // Dia seguinte ao último check
      } else {
        startDate = this.parseYMDLocal(installDateStr);
      }
      startDate.setHours(0, 0, 0, 0);

      // Verificar cada dia desde startDate até ontem
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Se o app foi instalado hoje, não há dias a checar.
      if (startDate > yesterday) {
        await storage.setItem(MissedWorkoutManager.LAST_CHECK_KEY, this.toYMDLocal(today));
        return;
      }

      for (let d = new Date(startDate); d <= yesterday; d.setDate(d.getDate() + 1)) {
        const dateStr = this.toYMDLocal(d);
        const dayOfWeek = d.getDay();

        // Verificar se havia treino agendado para esse dia
        const scheduledWorkout = workoutPlan.find(w => this.toIndex(w.day) === dayOfWeek);

        if (scheduledWorkout) {
          // Pode haver múltiplos treinos agendados para o mesmo dia
          const scheduledWorkouts = workoutPlan.filter(w => this.toIndex(w.day) === dayOfWeek);
          
          for (const scheduled of scheduledWorkouts) {
            // Verificar se o treino específico foi finalizado nesse dia
            const wasCompleted = workoutHistory.some(session =>
              session.date === dateStr &&
              session.workoutDayId === scheduled.id &&
              session.completed
            );

            if (!wasCompleted) {
              await this.addMissedWorkout({
                date: dateStr,
                dayOfWeek: this.getDayOfWeekName(dayOfWeek),
                workoutDayId: scheduled.id
              });
            }
          }
        }
      }

      // Atualizar último check para ontem (formato local)
      await storage.setItem(MissedWorkoutManager.LAST_CHECK_KEY, this.toYMDLocal(yesterday));
    } catch (error) {
      console.error('Failed to check missed workouts:', error);
    }
  }

  // Verificar se um dia específico tem treino agendado
  async hasScheduledWorkout(date: Date): Promise<boolean> {
    try {
      const workoutPlan = await customWorkoutManager.getAllWorkouts(WORKOUT_PLAN);
      const dayOfWeek = date.getDay();
      return workoutPlan.some(w => this.toIndex(w.day) === dayOfWeek);
    } catch (error) {
      console.error('Failed to check scheduled workout:', error);
      return false;
    }
  }

  // Verificar se hoje tem treino agendado
  async todayHasScheduledWorkout(): Promise<boolean> {
    return this.hasScheduledWorkout(new Date());
  }
}

export const missedWorkoutManager = new MissedWorkoutManager();
