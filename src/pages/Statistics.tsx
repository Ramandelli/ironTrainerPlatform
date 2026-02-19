import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, TrendingUp, TrendingDown, Award, Calendar, BarChart3, Activity, Clock, Target, RotateCcw, Trash2, Trophy, AlertTriangle, Minus, Bike, Footprints, Lock } from 'lucide-react';
import { storage } from '../utils/storage';
import { WorkoutSession, WorkoutStats } from '../types/workout';
import { calculatePersonalRecords, calculateWeeklyStats } from '../utils/workoutHelpers';
import { useToast } from '../hooks/use-toast';
import { restDayManager } from '../utils/restDays';
import { missedWorkoutManager, MissedWorkout } from '../utils/missedWorkouts';
import { achievementManager } from '../utils/achievements';
import { UnlockedAchievement } from '../types/achievement';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { customWorkoutManager } from '../utils/customWorkouts';
import { WorkoutDay } from '../types/workout';
import { formatWeightCompact } from '../utils/formatters';
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area';
import { usePremium } from '../contexts/PremiumContext';
import { PremiumBanner } from '../components/PremiumBadge';

interface StatisticsProps {
  onBack: () => void;
  onDataReset?: () => void;
}

// Stat Card Component for horizontal scroll
const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
}> = ({ icon, value, label, sublabel, highlight }) => (
  <div className={`flex-shrink-0 w-32 p-4 rounded-xl border transition-all ${
    highlight 
      ? 'bg-primary/10 border-primary/30' 
      : 'bg-card border-border'
  }`}>
    <div className="flex items-center justify-center mb-2 text-primary">
      {icon}
    </div>
    <div className={`text-xl font-bold text-center ${highlight ? 'text-primary' : 'text-foreground'}`}>
      {value}
    </div>
    <div className="text-xs text-muted-foreground text-center leading-tight">
      {label}
    </div>
    {sublabel && (
      <div className="text-xs text-muted-foreground/70 text-center mt-0.5">
        {sublabel}
      </div>
    )}
  </div>
);

// Section Header Component
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; className?: string }> = ({ 
  icon, 
  title,
  className = ''
}) => (
  <div className={`flex items-center gap-2 mb-4 ${className}`}>
    <div className="p-2 rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
  </div>
);

// Trend Icon Component
const TrendIcon: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  if (value > 0) {
    return <TrendingUp className={`w-4 h-4 text-accent ${className}`} />;
  } else if (value < 0) {
    return <TrendingDown className={`w-4 h-4 text-destructive ${className}`} />;
  }
  return <Minus className={`w-4 h-4 text-muted-foreground ${className}`} />;
};

export const Statistics: React.FC<StatisticsProps> = ({ onBack, onDataReset }) => {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'lastMonth' | 'currentMonth' | 'all'>('week');
  const { toast } = useToast();
  const [customRestDays, setCustomRestDays] = useState<string[]>([]);
  const [installDate, setInstallDate] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);
  const [missedWorkouts, setMissedWorkouts] = useState<MissedWorkout[]>([]);
  const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<{ day: string; workouts: Array<{ date: string; volume: number; startTime: number }> } | null>(null);
  const [selectedWorkoutDetails, setSelectedWorkoutDetails] = useState<WorkoutSession | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>(WORKOUT_PLAN);
  const { isPremium, openPremiumModal } = usePremium();
  
  // Free users: force 'week' period
  const effectivePeriod = isPremium ? selectedPeriod : 'week';
  
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
     const loadData = async () => {
    try {
      await storage.cleanInvalidSessions();
      
      const [loadedStats, workoutHistory] = await Promise.all([
        storage.loadStats(),
        storage.loadWorkoutHistory()
      ]);
      setStats(loadedStats);
      setHistory(workoutHistory);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  loadData();
  loadAchievements();
  loadMissedWorkouts();
}, []);

const loadMissedWorkouts = async () => {
  try {
    await missedWorkoutManager.checkMissedWorkouts();
    const missed = await missedWorkoutManager.getMissedWorkouts();
    setMissedWorkouts(missed);
  } catch (error) {
    console.error('Failed to load missed workouts:', error);
  }
};

const loadAchievements = async () => {
  try {
    const unlocked = await achievementManager.getUnlockedAchievements();
    setAchievements(unlocked);
  } catch (error) {
    console.error('Failed to load achievements:', error);
  }
};


useEffect(() => {
  const loadRestDays = async () => {
    try {
      const days = await restDayManager.getCustomRestDays();
      setCustomRestDays(days);
    } catch (e) {
      console.error('Falha ao carregar dias de descanso:', e);
    }
  };
  loadRestDays();

  const handleRestDaysUpdated = () => {
    loadRestDays();
  };
  window.addEventListener('rest_days_updated', handleRestDaysUpdated);
  return () => {
    window.removeEventListener('rest_days_updated', handleRestDaysUpdated);
  };
}, []);

useEffect(() => {
  const handleMissedWorkoutsUpdated = () => {
    loadMissedWorkouts();
  };
  window.addEventListener('missed_workouts_updated', handleMissedWorkoutsUpdated);
  return () => {
    window.removeEventListener('missed_workouts_updated', handleMissedWorkoutsUpdated);
  };
}, []);


useEffect(() => {
  const loadInstallDate = async () => {
    try {
      const date = await storage.getItem('app_install_date');
      setInstallDate(date);
    } catch (e) {
      console.error('Falha ao carregar data de instalação:', e);
    }
  };
  loadInstallDate();
}, []);

useEffect(() => {
  let isMounted = true;
  const loadWorkouts = async () => {
    try {
      const all = await customWorkoutManager.getAllWorkouts(WORKOUT_PLAN);
      if (isMounted) setWorkoutPlan(all);
    } catch (e) {
      console.error('Falha ao carregar plano de treinos:', e);
    }
  };
  loadWorkouts();
  const handleUpdated = () => {
    loadWorkouts();
  };
  window.addEventListener('custom_workouts_updated', handleUpdated);
  return () => {
    isMounted = false;
    window.removeEventListener('custom_workouts_updated', handleUpdated);
  };
}, []);

  const loadData = async () => {
    try {
      const [loadedStats, workoutHistory] = await Promise.all([
        storage.loadStats(),
        storage.loadWorkoutHistory()
      ]);
      setStats(loadedStats);
      setHistory(workoutHistory);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const getPeriodRange = React.useCallback(() => {
    const now = new Date();
    
    if (effectivePeriod === 'week') {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      return { start: startDate.getTime(), end: endDate.getTime() };
    } else if (effectivePeriod === 'lastMonth') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startOfLastMonth.setHours(0, 0, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: startOfLastMonth.getTime(), end: endOfLastMonth.getTime() };
    } else if (effectivePeriod === 'currentMonth') {
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfCurrentMonth.setHours(0, 0, 0, 0);
      
      const currentMonthWorkouts = history.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
      });
      
      let endDate: Date;
      if (currentMonthWorkouts.length > 0) {
        const lastWorkoutTime = Math.max(...currentMonthWorkouts.map(w => w.startTime));
        endDate = new Date(lastWorkoutTime);
      } else {
        endDate = new Date(now);
      }
      endDate.setHours(23, 59, 59, 999);
      
      return { start: startOfCurrentMonth.getTime(), end: endDate.getTime() };
    } else {
      return { start: null, end: null };
    }
  }, [effectivePeriod, history]);

  const filteredHistory = React.useMemo(() => {
    const range = getPeriodRange();
    if (range.start === null || range.end === null) return history;
    
    return history.filter(session => 
      session.startTime >= range.start! && session.startTime <= range.end!
    );
  }, [history, getPeriodRange]);

  const periodStats = React.useMemo(() => {
    let totalVolume = 0;
    let totalWeight = 0;

    filteredHistory.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.setData.forEach(set => {
          if (set.completed) {
            const weight = set.weight || 0;
            const reps = set.reps || 0;
            
            totalVolume += weight * reps;
            totalWeight += weight;

            if (set.dropsetData && set.dropsetData.length > 0) {
              set.dropsetData.forEach(dropset => {
                totalVolume += dropset.weight * dropset.reps;
                totalWeight += dropset.weight;
              });
            }
          }
        });
      });
    });

    return { totalVolume, totalWeight };
  }, [filteredHistory]);

  const personalRecords = React.useMemo(() => {
    return calculatePersonalRecords(history);
  }, [history]);

  const exerciseProgress = React.useMemo(() => {
    const exerciseData: Record<string, { sessions: number; maxWeight: number; totalVolume: number }> = {};
    
    history.forEach(session => {
      session.exercises.forEach(exercise => {
        if (!exerciseData[exercise.name]) {
          exerciseData[exercise.name] = { sessions: 0, maxWeight: 0, totalVolume: 0 };
        }
        
        exerciseData[exercise.name].sessions++;
        
        exercise.setData.forEach(set => {
          if (set.completed) {
            exerciseData[exercise.name].maxWeight = Math.max(
              exerciseData[exercise.name].maxWeight,
              set.weight || 0
            );
            
            if (set.weight && set.reps) {
              exerciseData[exercise.name].totalVolume += set.weight * set.reps;
            }
            
            if (set.dropsetData && set.dropsetData.length > 0) {
              set.dropsetData.forEach(dropset => {
                exerciseData[exercise.name].totalVolume += dropset.weight * dropset.reps;
                exerciseData[exercise.name].maxWeight = Math.max(
                  exerciseData[exercise.name].maxWeight,
                  dropset.weight
                );
              });
            }
          }
        });
      });
    });
    
    return Object.entries(exerciseData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);
  }, [history]);

  
  const cardioStats = React.useMemo(() => {
    const calculateCardioTime = (sessions: WorkoutSession[]) => {
      let esteiraTotalSeconds = 0;
      let bicicletaTotalSeconds = 0;
      let esteiraTotalDistance = 0;
      let bicicletaTotalDistance = 0;
      
      sessions.forEach(session => {
        if (session.aerobic && session.aerobic.completed && session.aerobic.actualDuration !== undefined) {
          const timeSpentSeconds = Math.round(session.aerobic.actualDuration * 60);
          const distance = session.aerobic.distance || 0;
            
          if (session.aerobic.type === 'esteira') {
            esteiraTotalSeconds += timeSpentSeconds;
            esteiraTotalDistance += distance;
          } else if (session.aerobic.type === 'bicicleta') {
            bicicletaTotalSeconds += timeSpentSeconds;
            bicicletaTotalDistance += distance;
          }
        }
      });
      
      return { esteiraTotalSeconds, bicicletaTotalSeconds, esteiraTotalDistance, bicicletaTotalDistance };
    };
    
    return calculateCardioTime(filteredHistory);
}, [filteredHistory]);


const restDaysCount = React.useMemo(() => {
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const oneDay = 24 * 60 * 60 * 1000;
  const range = getPeriodRange();

  let baseStart: number;

  if (range.start === null) {
    if (history.length > 0) {
      baseStart = Math.min(...history.map(h => h.startTime));
    } else {
      baseStart = Date.now() - 30 * oneDay;
    }
  } else {
    baseStart = range.start;
  }

  if (installDate) {
    const installTime = new Date(`${installDate}T00:00:00`).getTime();
    if (Number.isFinite(installTime)) {
      baseStart = Math.max(baseStart, installTime);
    }
  }

  const startDate = new Date(baseStart);
  startDate.setHours(0, 0, 0, 0);

  let endDate: Date;
  if (range.end === null) {
    endDate = new Date();
  } else {
    endDate = new Date(range.end);
  }
  endDate.setHours(0, 0, 0, 0);

  const customSet = new Set(customRestDays);

  const toIndex = (label: string): number | null => {
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
  };

  let count = 0;
  for (let t = startDate.getTime(); t <= endDate.getTime(); t += oneDay) {
    const d = new Date(t);
    const ymd = toYMD(d);

    if (customSet.has(ymd)) {
      count++;
      continue;
    }

    const dow = d.getDay();
    const hasScheduledWorkout = workoutPlan.some(w => toIndex(w.day) === dow);

    if (!hasScheduledWorkout) {
      count++;
    }
  }

  return count;
}, [customRestDays, getPeriodRange, installDate, workoutPlan, history]);

  
  const abdominalStats = React.useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        totalAbdominalSets: 0,
        totalAbdominalReps: 0,
        totalAbdominalTimeSeconds: 0
      };
    }

    let totalAbdominalSets = 0;
    let totalAbdominalReps = 0;
    let totalAbdominalTimeSeconds = 0;

    filteredHistory.forEach(session => {
      if (session.abdominal) {
        session.abdominal.forEach(exercise => {
          const completedSets = exercise.setData.filter(set => set.completed);
          totalAbdominalSets += completedSets.length;
          
          completedSets.forEach(set => {
            if (set.reps) {
              totalAbdominalReps += set.reps;
            }
            if (set.timeCompleted) {
              totalAbdominalTimeSeconds += set.timeCompleted;
            }
          });
        });
      }
    });

    return {
      totalAbdominalSets,
      totalAbdominalReps,
      totalAbdominalTimeSeconds
    };
  }, [filteredHistory]);

  
  const advancedStats = React.useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        averageWorkoutTime: 0,
        totalSets: 0,
        totalReps: 0,
        mostFrequentExercise: '',
        averageRestTime: 0,
        workoutDistribution: {}
      };
    }

    const completedWorkouts = filteredHistory.filter(w => w.endTime);
    const averageWorkoutTime = completedWorkouts.length > 0 
      ? completedWorkouts.reduce((sum, w) => sum + (w.endTime! - w.startTime), 0) / completedWorkouts.length / 60000
      : 0;

    let totalSets = 0;
    let totalReps = 0;
    const exerciseFrequency: Record<string, number> = {};

    filteredHistory.forEach(session => {
      session.exercises.forEach(exercise => {
        exerciseFrequency[exercise.name] = (exerciseFrequency[exercise.name] || 0) + 1;
        totalSets += exercise.setData.filter(set => set.completed).length;
        totalReps += exercise.setData.filter(set => set.completed).reduce((sum, set) => sum + set.reps, 0);
      });
    });

    const mostFrequentExercise = Object.entries(exerciseFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const workoutDistribution: Record<string, number> = {};
    history.forEach(session => {
      try {
        let sessionDate: Date;
        
        if (session.date.includes('/')) {
          const [day, month, year] = session.date.split('/');
          sessionDate = new Date(
            parseInt(year),
            parseInt(month) - 1, 
            parseInt(day)
          );
        } else {
          const [year, month, day] = session.date.split('-');
          sessionDate = new Date(
            parseInt(year),
            parseInt(month) - 1, 
            parseInt(day)
          );
        }
        
        const dayIndex = sessionDate.getDay();
        const days = [
          'domingo', 
          'segunda-feira', 
          'terça-feira', 
          'quarta-feira', 
          'quinta-feira', 
          'sexta-feira', 
          'sábado'
        ];
        
        if (dayIndex >= 0 && dayIndex < days.length) {
          const dayName = days[dayIndex];
          workoutDistribution[dayName] = (workoutDistribution[dayName] || 0) + 1;
        }
      } catch (e) {
        console.error('Erro ao processar data:', session.date, e);
      }
    });

    return {
        averageWorkoutTime,
        totalSets,
        totalReps,
        mostFrequentExercise,
        workoutDistribution
      };
    }, [filteredHistory, history]);

  // Volume comparison by day of the week
  const volumeByDayOfWeek = React.useMemo(() => {
    const dayData: Record<string, { volumes: number[]; dates: string[]; workouts: Array<{ date: string; volume: number; startTime: number }> }> = {};
    
    history.forEach(session => {
      if (!session.completed || session.totalVolume === 0) return;
      
      try {
        let sessionDate: Date;
        
        if (session.date.includes('/')) {
          const [day, month, year] = session.date.split('/');
          sessionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          const [year, month, day] = session.date.split('-');
          sessionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        
        const dayIndex = sessionDate.getDay();
        const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        
        if (dayIndex >= 0 && dayIndex < days.length) {
          const dayName = days[dayIndex];
          if (!dayData[dayName]) {
            dayData[dayName] = { volumes: [], dates: [], workouts: [] };
          }
          dayData[dayName].volumes.push(session.totalVolume);
          dayData[dayName].dates.push(session.date);
          dayData[dayName].workouts.push({
            date: session.date,
            volume: session.totalVolume,
            startTime: session.startTime
          });
        }
      } catch (e) {
        console.error('Erro ao processar data:', session.date, e);
      }
    });

    return Object.entries(dayData)
      .map(([day, data]) => {
        const volumes = data.volumes;
        const average = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
        const min = Math.min(...volumes);
        const max = Math.max(...volumes);
        const lastVolume = volumes[volumes.length - 1];
        const firstVolume = volumes[0];
        const evolution = volumes.length > 1 ? lastVolume - firstVolume : 0;
        const evolutionPercent = volumes.length > 1 ? ((evolution / firstVolume) * 100) : 0;
        
        return {
          day,
          average,
          min,
          max,
          lastVolume,
          firstVolume,
          evolution,
          evolutionPercent,
          count: volumes.length,
          workouts: data.workouts.sort((a, b) => b.startTime - a.startTime)
        };
      })
      .filter(d => d.count > 0)
      .sort((a, b) => {
        const dayOrder = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      });
  }, [history]);

  // Chart data with percentages and best day highlight
  const distributionChartData = React.useMemo(() => {
    const entries = Object.entries(advancedStats.workoutDistribution);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const maxCount = Math.max(...entries.map(([, count]) => count), 0);
    
    const dayOrder = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const dayAbbrev: Record<string, string> = {
      'domingo': 'Dom',
      'segunda-feira': 'Seg',
      'terça-feira': 'Ter',
      'quarta-feira': 'Qua',
      'quinta-feira': 'Qui',
      'sexta-feira': 'Sex',
      'sábado': 'Sáb'
    };
    
    return entries
      .map(([day, count]) => ({
        day: dayAbbrev[day.toLowerCase()] || day.charAt(0).toUpperCase() + day.slice(1),
        fullDay: day,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        isBest: count === maxCount && count > 0
      }))
      .sort((a, b) => dayOrder.indexOf(a.fullDay.toLowerCase()) - dayOrder.indexOf(b.fullDay.toLowerCase()));
  }, [advancedStats.workoutDistribution]);

  const handleResetData = async () => {
    try {
      await storage.resetAllData();
      await achievementManager.resetAchievements();
      await restDayManager.resetRestDays();
      await missedWorkoutManager.resetMissedWorkouts();
      setStats(null);
      setHistory([]);
      setAchievements([]);
      setCustomRestDays([]);
      setMissedWorkouts([]);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rest_days_updated'));
        window.dispatchEvent(new CustomEvent('missed_workouts_updated'));
        window.dispatchEvent(new CustomEvent('custom_workouts_updated'));
      }
      
      await loadData();
      await loadAchievements();
      
      if (onDataReset) {
        onDataReset();
      }
      
      toast({
        title: "Dados resetados",
        description: "Todo o histórico de treinos, conquistas e dias de descanso foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao resetar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getPeriodLabel = () => {
    switch (effectivePeriod) {
      case 'week': return 'últimos 7 dias';
      case 'lastMonth': return 'último mês';
      case 'currentMonth': return 'mês atual';
      default: return 'geral';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Estatísticas</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-8">
        {/* Period Selector */}
        {isPremium ? (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { key: 'week', label: 'Semana' },
              { key: 'lastMonth', label: 'Mês Anterior' },
              { key: 'currentMonth', label: 'Mês Atual' },
              { key: 'all', label: 'Geral' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant={selectedPeriod === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(key as typeof selectedPeriod)}
                className="flex-shrink-0"
              >
                {label}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="flex-shrink-0">
                Semana
              </Button>
              {['Mês Anterior', 'Mês Atual', 'Geral'].map((label) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => openPremiumModal('Filtros por Período')}
                  className="flex-shrink-0 opacity-50"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* ========== VISÃO GERAL ========== */}
        <section>
          <SectionHeader icon={<BarChart3 className="w-5 h-5" />} title="Visão Geral" />
          
          {/* Horizontal Scrollable Stats */}
          <ScrollArea className="w-full -mx-4 px-4">
            <div className="flex gap-3 pb-4">
              <StatCard
                icon={<BarChart3 className="w-5 h-5" />}
                value={String(filteredHistory.length)}
                label="Treinos"
              />
              {isPremium && (
                <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  value={`${formatWeightCompact(periodStats.totalVolume)}kg`}
                  label="Volume"
                  highlight
                />
              )}
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                value={`${advancedStats.averageWorkoutTime.toFixed(0)}min`}
                label="Tempo médio"
              />
              {isPremium && (
                <>
                  <StatCard
                    icon={<Activity className="w-5 h-5" />}
                    value={String(advancedStats.totalSets)}
                    label="Séries"
                  />
                  <StatCard
                    icon={<Target className="w-5 h-5" />}
                    value={String(advancedStats.totalReps)}
                    label="Repetições"
                  />
                  <StatCard
                    icon={<Calendar className="w-5 h-5" />}
                    value={String(restDaysCount)}
                    label="Descanso"
                    sublabel={getPeriodLabel()}
                  />
                </>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* Premium banner for free users */}
        {!isPremium && (
          <PremiumBanner 
            feature="Estatísticas Completas" 
            message="🔒 Estatísticas completas disponíveis no Iron Trainer Premium"
          />
        )}

        {/* ========== SECTIONS ONLY FOR PREMIUM ========== */}
        {isPremium && (
          <>
            {/* ========== CARDIO ========== */}
            <section>
              <SectionHeader icon={<Activity className="w-5 h-5" />} title="Cardio" />
              
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Footprints className="w-4 h-4" />
                        <span className="text-xs">Esteira</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {formatTime(cardioStats.esteiraTotalSeconds)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cardioStats.esteiraTotalDistance.toFixed(1)} km
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Bike className="w-4 h-4" />
                        <span className="text-xs">Bicicleta</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {formatTime(cardioStats.bicicletaTotalSeconds)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cardioStats.bicicletaTotalDistance.toFixed(1)} km
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg text-center">
                      <div className="text-lg font-bold text-primary">
                        {formatTime(cardioStats.esteiraTotalSeconds + cardioStats.bicicletaTotalSeconds)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Tempo</div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg text-center">
                      <div className="text-lg font-bold text-primary">
                        {(cardioStats.esteiraTotalDistance + cardioStats.bicicletaTotalDistance).toFixed(1)} km
                      </div>
                      <div className="text-xs text-muted-foreground">Total Distância</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ========== ABDOMINAIS ========== */}
            <section>
              <SectionHeader icon={<Target className="w-5 h-5" />} title="Abdominais" />
              
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-foreground">
                        {abdominalStats.totalAbdominalSets}
                      </div>
                      <div className="text-xs text-muted-foreground">Séries</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-foreground">
                        {abdominalStats.totalAbdominalReps}
                      </div>
                      <div className="text-xs text-muted-foreground">Reps</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-foreground">
                        {formatTime(abdominalStats.totalAbdominalTimeSeconds)}
                      </div>
                      <div className="text-xs text-muted-foreground">Tempo</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ========== RECORDES ========== */}
            <section>
              <SectionHeader icon={<Award className="w-5 h-5" />} title="Recordes Pessoais" />
              
              <Card>
                <CardContent className="p-4 space-y-3">
                  {Object.entries(personalRecords).length > 0 ? (
                    Object.entries(personalRecords)
                      .sort((a, b) => b[1].weight - a[1].weight)
                      .slice(0, 5)
                      .map(([exercise, record], index) => (
                        <div key={exercise} className={`flex justify-between items-center p-3 rounded-lg ${
                          index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                        }`}>
                          <div className="flex items-center gap-2">
                            {index === 0 && <Trophy className="w-4 h-4 text-primary" />}
                            <span className="text-sm font-medium text-foreground">{exercise}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">
                              {formatWeightCompact(record.weight)}kg × {record.reps}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {record.date}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Complete alguns treinos para ver seus recordes!
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* ========== GRÁFICOS ========== */}
            <section>
              <SectionHeader icon={<BarChart3 className="w-5 h-5" />} title="Distribuição Semanal" />
              
              <Card>
                <CardContent className="p-4">
                  {distributionChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={distributionChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="day" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '11px' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          axisLine={false}
                          tickLine={false}
                          width={30}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                          formatter={(value: number, name: string, props: any) => [
                            <span key="value">
                              <strong>{value}</strong> treino{value > 1 ? 's' : ''} ({props.payload.percentage}%)
                            </span>,
                            null
                          ]}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          <LabelList 
                            dataKey="percentage" 
                            position="top" 
                            formatter={(value: number) => `${value}%`}
                            style={{ fill: 'hsl(var(--muted-foreground))', fontSize: '10px' }}
                          />
                          {distributionChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.isBest ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Complete alguns treinos para ver a distribuição!
                    </p>
                  )}
                  
                  {distributionChartData.some(d => d.isBest) && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span>
                        Melhor dia: <strong className="text-foreground">
                          {distributionChartData.find(d => d.isBest)?.fullDay}
                        </strong>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Top 5 Exercícios */}
            <section>
              <SectionHeader icon={<TrendingUp className="w-5 h-5" />} title="Top 5 Exercícios" />
              
              <Card>
                <CardContent className="p-4">
                  {exerciseProgress.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={exerciseProgress} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={90}
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '11px' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                          formatter={(value: number, name: string, props: any) => [
                            <span key="value">
                              Volume: <strong>{formatWeightCompact(value)}kg</strong><br />
                              Sessões: <strong>{props.payload.sessions}</strong><br />
                              Carga máx: <strong>{formatWeightCompact(props.payload.maxWeight)}kg</strong>
                            </span>,
                            null
                          ]}
                        />
                        <Bar dataKey="totalVolume" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Complete alguns treinos para ver o progresso!
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* ========== EVOLUÇÃO SEMANAL ========== */}
            <section>
              <SectionHeader icon={<TrendingUp className="w-5 h-5" />} title="Evolução por Dia" />
              
              <div className="space-y-3">
                {volumeByDayOfWeek.length > 0 ? (
                  volumeByDayOfWeek.map((dayStats) => (
                    <Card 
                      key={dayStats.day} 
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedDayWorkouts({ day: dayStats.day, workouts: dayStats.workouts })}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">{dayStats.day}</span>
                          <div className="flex items-center gap-2">
                            <TrendIcon value={dayStats.evolution} />
                            <Badge 
                              variant={dayStats.evolutionPercent >= 0 ? "default" : "destructive"}
                              className="font-mono"
                            >
                              {dayStats.evolution >= 0 ? '+' : ''}{formatWeightCompact(dayStats.evolution)}kg
                              <span className="ml-1 opacity-75">
                                ({dayStats.evolutionPercent >= 0 ? '+' : ''}{dayStats.evolutionPercent.toFixed(0)}%)
                              </span>
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <div className="font-medium text-foreground">{formatWeightCompact(dayStats.min)}kg</div>
                            <div className="text-muted-foreground">Mín</div>
                          </div>
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <div className="font-medium text-foreground">{formatWeightCompact(dayStats.average)}kg</div>
                            <div className="text-muted-foreground">Média</div>
                          </div>
                          <div className="text-center p-2 bg-muted/30 rounded">
                            <div className="font-medium text-foreground">{formatWeightCompact(dayStats.max)}kg</div>
                            <div className="text-muted-foreground">Máx</div>
                          </div>
                          <div className="text-center p-2 bg-primary/10 rounded">
                            <div className="font-medium text-primary">{formatWeightCompact(dayStats.lastVolume)}kg</div>
                            <div className="text-muted-foreground">Último</div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground text-center pt-1 border-t border-border">
                          {dayStats.count} treino{dayStats.count > 1 ? 's' : ''} • Toque para detalhes
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-center text-muted-foreground py-4">
                        Complete alguns treinos para ver a evolução!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            {/* ========== HISTÓRICO ========== */}
            <section>
              <SectionHeader icon={<Calendar className="w-5 h-5" />} title="Treinos Recentes" />
              
              <Card>
                <CardContent className="p-4 space-y-3">
                  {[...history].sort((a, b) => b.startTime - a.startTime).slice(0, 5).map((session) => {
                    const [year, month, day] = session.date.split('-');
                    const workoutDate = `${day}/${month}/${year}`;
                    const workoutTime = session.endTime 
                      ? Math.round((session.endTime - session.startTime) / 60000)
                      : 0;
                    
                    return (
                      <div 
                        key={session.id} 
                        className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-colors"
                        onClick={() => setSelectedWorkoutDetails(session)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">
                              {workoutDate}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {session.exercises[0]?.name ? 
                                `${session.exercises[0].name.split(' ')[0]} e mais ${session.exercises.length - 1}` : 
                                `${session.exercises.length} exercícios`}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="font-mono">
                              {formatWeightCompact(session.totalVolume)}kg
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {workoutTime}min
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {history.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum treino registrado ainda.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Treinos Não Realizados */}
            {(() => {
              const { start, end } = getPeriodRange();
              const filteredMissedWorkouts = missedWorkouts.filter(missed => {
                const missedDate = new Date(missed.date + 'T12:00:00').getTime();
                if (start === null || end === null) return true;
                return missedDate >= start && missedDate <= end;
              });
              
              if (filteredMissedWorkouts.length === 0) return null;
              
              return (
                <section>
                  <SectionHeader 
                    icon={<Calendar className="w-5 h-5" />} 
                    title="Treinos Não Realizados" 
                  />
                  
                  <Card className="border-warning-amber/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {filteredMissedWorkouts
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((missed, idx) => {
                            const [year, month, day] = missed.date.split('-');
                            const formattedDate = `${day}/${month}/${year}`;
                            return (
                              <div key={idx} className="flex justify-between items-center p-3 bg-warning-amber/10 rounded-lg border border-warning-amber/20">
                                <div>
                                  <div className="text-sm font-medium text-foreground">{formattedDate}</div>
                                  <div className="text-xs text-muted-foreground">{missed.dayOfWeek}</div>
                                </div>
                                <Badge variant="outline" className="border-warning-amber/50 text-warning-amber">
                                  Não realizado
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                      <div className="text-center pt-2 border-t border-border">
                        <span className="text-sm font-medium text-warning-amber">
                          Total: {filteredMissedWorkouts.length} treino{filteredMissedWorkouts.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              );
            })()}

            {/* ========== DANGER ZONE ========== */}
            <section className="mt-12 pt-8 border-t-2 border-destructive/20">
              <div className="bg-destructive/5 -mx-4 px-4 py-6 rounded-xl border border-destructive/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-destructive">Zona de Perigo</h2>
                    <p className="text-xs text-muted-foreground">Ações irreversíveis</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Resetar todos os dados irá apagar <strong>permanentemente</strong> todo o histórico de treinos, estatísticas, conquistas e progresso.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Resetar Todos os Dados
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Confirmar Reset de Dados
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação <strong>não pode ser desfeita</strong>. Todos os seus treinos, estatísticas e progresso serão permanentemente removidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleResetData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Resetar Dados
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </section>
          </>
        )}

        {/* Dialog for Day Workouts */}
        <Dialog open={!!selectedDayWorkouts} onOpenChange={() => setSelectedDayWorkouts(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Treinos - {selectedDayWorkouts?.day}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedDayWorkouts?.workouts.map((workout, index) => {
                const [year, month, day] = workout.date.split('-');
                const formattedDate = `${day}/${month}/${year}`;
                
                return (
                  <div key={index} className="p-3 border border-border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-foreground">
                        {formattedDate}
                      </div>
                      <Badge variant="outline" className="font-bold font-mono">
                        {formatWeightCompact(workout.volume)}kg
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for Workout Details */}
        <Dialog open={!!selectedWorkoutDetails} onOpenChange={() => setSelectedWorkoutDetails(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Detalhes do Treino
              </DialogTitle>
            </DialogHeader>
            {selectedWorkoutDetails && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  <div className="text-sm font-medium text-foreground">
                    {(() => {
                      const [year, month, day] = selectedWorkoutDetails.date.split('-');
                      return `${day}/${month}/${year}`;
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tempo: {selectedWorkoutDetails.endTime 
                      ? Math.round((selectedWorkoutDetails.endTime - selectedWorkoutDetails.startTime) / 60000)
                      : 0}min • Volume Total: {formatWeightCompact(selectedWorkoutDetails.totalVolume)}kg
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Exercícios</h3>
                  {selectedWorkoutDetails.exercises.map((exercise, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="font-medium text-sm text-foreground">{exercise.name}</div>
                      <div className="space-y-1">
                        {exercise.setData.filter(set => set.completed).map((set, setIdx) => (
                          <div key={setIdx} className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Série {setIdx + 1}</span>
                            <div className="space-x-2">
                              <span className="font-medium text-foreground">
                                {formatWeightCompact(set.weight)}kg × {set.reps} reps
                              </span>
                              {set.dropsetData && set.dropsetData.length > 0 && (
                                <span className="text-primary">
                                  + Drop: {set.dropsetData.map(d => `${formatWeightCompact(d.weight)}kg×${d.reps}`).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedWorkoutDetails.abdominal && selectedWorkoutDetails.abdominal.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Abdominais</h3>
                    {selectedWorkoutDetails.abdominal.map((exercise, idx) => (
                      <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                        <div className="font-medium text-sm text-foreground">{exercise.name}</div>
                        <div className="space-y-1">
                          {exercise.setData.filter(set => set.completed).map((set, setIdx) => (
                            <div key={setIdx} className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Série {setIdx + 1}</span>
                              <span className="font-medium text-foreground">
                                {set.timeCompleted ? `${set.timeCompleted}s` : `${set.reps} reps`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedWorkoutDetails.aerobic && selectedWorkoutDetails.aerobic.completed && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Aeróbico</h3>
                    <div className="border border-border rounded-lg p-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground capitalize">{selectedWorkoutDetails.aerobic.type}</span>
                        <span className="font-medium text-foreground">
                          {selectedWorkoutDetails.aerobic.actualDuration?.toFixed(1)}min
                          {selectedWorkoutDetails.aerobic.distance && ` • ${selectedWorkoutDetails.aerobic.distance}km`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedWorkoutDetails.notes && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Notas</h3>
                    <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                      {selectedWorkoutDetails.notes}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
