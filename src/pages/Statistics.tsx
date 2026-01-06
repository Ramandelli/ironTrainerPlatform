import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ArrowLeft, TrendingUp, Award, Calendar, BarChart3, Activity, Clock, Target, Flame, RotateCcw, Trash2, Trophy } from 'lucide-react';
import { storage } from '../utils/storage';
import { WorkoutSession, WorkoutStats } from '../types/workout';
import { calculatePersonalRecords, calculateWeeklyStats } from '../utils/workoutHelpers';
import { useToast } from '../hooks/use-toast';
import { restDayManager } from '../utils/restDays';
import { missedWorkoutManager, MissedWorkout } from '../utils/missedWorkouts';
import { achievementManager } from '../utils/achievements';
import { UnlockedAchievement } from '../types/achievement';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { customWorkoutManager } from '../utils/customWorkouts';
import { WorkoutDay } from '../types/workout';
import { formatWeightCompact } from '../utils/formatters';
interface StatisticsProps {
  onBack: () => void;
  onDataReset?: () => void;
}

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
    // Verificar e atualizar treinos não realizados
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

// Listener para treinos não realizados
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

// Carregar plano de treinos para avaliar descanso por agendamento
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

  // Função auxiliar para calcular o início e fim do período
  const getPeriodRange = React.useCallback(() => {
    const now = new Date();
    
    if (selectedPeriod === 'week') {
      // Últimos 7 dias (incluindo hoje)
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      return { start: startDate.getTime(), end: endDate.getTime() };
    } else if (selectedPeriod === 'lastMonth') {
      // Primeiro ao último dia do mês ANTERIOR
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startOfLastMonth.setHours(0, 0, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: startOfLastMonth.getTime(), end: endOfLastMonth.getTime() };
    } else if (selectedPeriod === 'currentMonth') {
      // Primeiro dia do mês atual até o último treino registrado no mês atual (ou hoje se não houver)
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfCurrentMonth.setHours(0, 0, 0, 0);
      
      // Encontrar o último treino registrado no mês atual
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
      // Geral: todos os treinos registrados
      return { start: null, end: null };
    }
  }, [selectedPeriod, history]);

  // Histórico filtrado pelo período
  const filteredHistory = React.useMemo(() => {
    const range = getPeriodRange();
    if (range.start === null || range.end === null) return history;
    
    return history.filter(session => 
      session.startTime >= range.start! && session.startTime <= range.end!
    );
  }, [history, getPeriodRange]);

  // Calcula Volume Total e Peso Total
  const periodStats = React.useMemo(() => {
    let totalVolume = 0;
    let totalWeight = 0;

    filteredHistory.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.setData.forEach(set => {
          if (set.completed) {
            const weight = set.weight || 0;
            const reps = set.reps || 0;
            
            // Volume Total = peso × reps
            totalVolume += weight * reps;
            
            // Peso Total = soma dos pesos (sem reps)
            totalWeight += weight;

            // Dropsets
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

  // Determinar início do período
  let baseStart: number;

  if (range.start === null) {
    // Se período é "Geral", usar a data de instalação (se existir) ou primeiro treino
    if (history.length > 0) {
      baseStart = Math.min(...history.map(h => h.startTime));
    } else {
      baseStart = Date.now() - 30 * oneDay;
    }
  } else {
    baseStart = range.start;
  }

  // Considerar data de instalação para não contar antes do app existir
  if (installDate) {
    const installTime = new Date(`${installDate}T00:00:00`).getTime();
    if (Number.isFinite(installTime)) {
      baseStart = Math.max(baseStart, installTime);
    }
  }

  const startDate = new Date(baseStart);
  startDate.setHours(0, 0, 0, 0);

  // Determinar fim do período
  let endDate: Date;
  if (range.end === null) {
    endDate = new Date(); // hoje
  } else {
    endDate = new Date(range.end);
  }
  endDate.setHours(0, 0, 0, 0);

  const customSet = new Set(customRestDays);

  // Helper: map various day labels to weekday index (0=Domingo..6=Sábado)
  const toIndex = (label: string): number | null => {
    if (!label) return null;
    const s = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
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

    // Regra 1: descanso manual sempre conta
    if (customSet.has(ymd)) {
      count++;
      continue;
    }

    // Regra 2: se não há treino agendado para o dia -> descanso
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

    
    // Distribuição semanal sempre usa todo o histórico (não filtra por período)
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
      await loadData();
      await loadAchievements();
      await loadMissedWorkouts();
      
      
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

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            Última Semana
          </Button>
          <Button
            variant={selectedPeriod === 'lastMonth' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('lastMonth')}
          >
            Último Mês
          </Button>
          <Button
            variant={selectedPeriod === 'currentMonth' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('currentMonth')}
          >
            Mês Atual
          </Button>
          <Button
            variant={selectedPeriod === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('all')}
          >
            Geral
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5 text-iron-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {filteredHistory.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total de treinos
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-iron-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatWeightCompact(periodStats.totalVolume)}kg
              </div>
              <div className="text-sm text-muted-foreground">
                Volume {selectedPeriod === 'week' ? '(últimos 7 dias)' : selectedPeriod === 'lastMonth' ? '(último mês)' : selectedPeriod === 'currentMonth' ? '(mês atual)' : 'total'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-iron-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {abdominalStats.totalAbdominalSets}
              </div>
              <div className="text-sm text-muted-foreground">
                Séries abdominais
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-iron-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {advancedStats.averageWorkoutTime.toFixed(0)}min
              </div>
              <div className="text-sm text-muted-foreground">
                Tempo médio
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-4 h-4 text-iron-orange" />
              </div>
              <div className="text-lg font-bold text-foreground">
                {advancedStats.totalSets}
              </div>
              <div className="text-xs text-muted-foreground">
                Total séries
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-4 h-4 text-iron-orange" />
              </div>
              <div className="text-lg font-bold text-foreground">
                {advancedStats.totalReps}
              </div>
              <div className="text-xs text-muted-foreground">
                Total reps
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-iron-orange" />
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatWeightCompact(periodStats.totalWeight)}kg
              </div>
              <div className="text-xs text-muted-foreground">
                Total de peso
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4 text-iron-orange" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {restDaysCount}
            </div>
              <div className="text-xs text-muted-foreground">
                Dias de descanso ({selectedPeriod === 'week' ? 'últimos 7 dias' : selectedPeriod === 'lastMonth' ? 'último mês' : selectedPeriod === 'currentMonth' ? 'mês atual' : 'geral'})
              </div>
          </CardContent>
        </Card>

        {/* Treinos Não Realizados */}
        {missedWorkouts.length > 0 && (
          <Card className="border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Calendar className="w-5 h-5" />
                Treinos Não Realizados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Treinos agendados que não foram finalizados até 23:59 do dia.
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {missedWorkouts
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((missed, idx) => {
                    const [year, month, day] = missed.date.split('-');
                    const formattedDate = `${day}/${month}/${year}`;
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <div>
                          <div className="text-sm font-medium text-foreground">{formattedDate}</div>
                          <div className="text-xs text-muted-foreground">{missed.dayOfWeek}</div>
                        </div>
                        <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                          Não realizado
                        </Badge>
                      </div>
                    );
                  })}
              </div>
              <div className="text-center pt-2 border-t border-border">
                <span className="text-sm font-medium text-amber-600">
                  Total: {missedWorkouts.length} treino{missedWorkouts.length > 1 ? 's' : ''} não realizado{missedWorkouts.length > 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Abdominal Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-iron-orange" />
              Estatísticas Abdominais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-foreground">
                  {abdominalStats.totalAbdominalSets}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total séries
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-foreground">
                  {abdominalStats.totalAbdominalReps}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total reps
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-foreground">
                  {formatTime(abdominalStats.totalAbdominalTimeSeconds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total tempo
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cardio Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-iron-orange" />
              Estatísticas de Cardio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-foreground">
                  {formatTime(cardioStats.esteiraTotalSeconds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Esteira - Tempo {selectedPeriod === 'week' ? '(semana)' : (selectedPeriod === 'lastMonth' || selectedPeriod === 'currentMonth') ? '(mês)' : '(total)'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {cardioStats.esteiraTotalDistance.toFixed(1)} km
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-foreground">
                  {formatTime(cardioStats.bicicletaTotalSeconds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Bicicleta - Tempo {selectedPeriod === 'week' ? '(semana)' : (selectedPeriod === 'lastMonth' || selectedPeriod === 'currentMonth') ? '(mês)' : '(total)'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {cardioStats.bicicletaTotalDistance.toFixed(1)} km
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <div className="text-xl font-bold text-primary">
                  {formatTime(cardioStats.esteiraTotalSeconds + cardioStats.bicicletaTotalSeconds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Tempo
                </div>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <div className="text-xl font-bold text-primary">
                  {(cardioStats.esteiraTotalDistance + cardioStats.bicicletaTotalDistance).toFixed(1)} km
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de Distância
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-iron-orange" />
              Recordes Pessoais
            </CardTitle>
          </CardHeader>
<CardContent className="space-y-3">
  {Object.entries(personalRecords).length > 0 ? (
    Object.entries(personalRecords)
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 5)
      .map(([exercise, record]) => {
        const formattedDate = record.date;
        return (
          <div key={exercise} className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">{exercise}</span>
            <div className="text-right">
              <div className="text-sm font-bold text-iron-orange">
                {formatWeightCompact(record.weight)}kg × {record.reps}
              </div>
              <div className="text-xs text-muted-foreground">
                {formattedDate}
              </div>
            </div>
          </div>
        );
      })
  ) : (
    <p className="text-center text-muted-foreground py-4">
      Complete alguns treinos para ver seus recordes!
    </p>
  )}
</CardContent>
        </Card>

        {/* Exercise Progress with Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-iron-orange" />
              Top 5 Exercícios por Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {exerciseProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exerciseProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${formatWeightCompact(value)}kg`, 'Volume Total']}
                  />
                  <Bar dataKey="totalVolume" fill="hsl(var(--iron-orange))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Complete alguns treinos para ver o progresso!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Workout Distribution with Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-iron-orange" />
              Distribuição Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(advancedStats.workoutDistribution).length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={Object.entries(advancedStats.workoutDistribution)
                    .map(([day, count]) => ({ day: day.charAt(0).toUpperCase() + day.slice(1), count }))
                    .sort((a, b) => {
                      const dayOrder = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
                      return dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase());
                    })
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value}`, 'Treinos']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--iron-orange))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Complete alguns treinos para ver a distribuição!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Volume Evolution by Day of Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-iron-orange" />
              Evolução de Volume por Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {volumeByDayOfWeek.length > 0 ? (
              <>
                {volumeByDayOfWeek.map((dayStats) => (
                  <div 
                    key={dayStats.day} 
                    className="p-4 border border-border rounded-lg space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedDayWorkouts({ day: dayStats.day, workouts: dayStats.workouts })}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">{dayStats.day}</span>
                      <Badge variant={dayStats.evolutionPercent >= 0 ? "default" : "destructive"}>
                        {dayStats.evolution >= 0 ? '+' : ''}{formatWeightCompact(dayStats.evolution)}kg 
                        ({dayStats.evolutionPercent >= 0 ? '+' : ''}{dayStats.evolutionPercent.toFixed(1)}%)
                      </Badge>
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
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-medium text-foreground">{formatWeightCompact(dayStats.lastVolume)}kg</div>
                        <div className="text-muted-foreground">Último</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {dayStats.count} treino{dayStats.count > 1 ? 's' : ''} realizado{dayStats.count > 1 ? 's' : ''} • Clique para detalhes
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Complete alguns treinos para ver a evolução!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dialog for Day Workouts */}
        <Dialog open={!!selectedDayWorkouts} onOpenChange={() => setSelectedDayWorkouts(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-iron-orange" />
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
                      <Badge variant="outline" className="font-bold">
                        {formatWeightCompact(workout.volume)}kg
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Volume do treino
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-iron-orange" />
              Treinos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
  {[...history].sort((a, b) => b.startTime - a.startTime).slice(0, 5).map((session) => {
    // Converter data do formato yyyy-MM-dd para dd/MM/yyyy
    const [year, month, day] = session.date.split('-');
    const workoutDate = `${day}/${month}/${year}`;
              const workoutTime = session.endTime 
      ? Math.round((session.endTime - session.startTime) / 60000)
      : 0;
              
              return (
      <div 
        key={session.id} 
        className="space-y-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setSelectedWorkoutDetails(session)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">
              {workoutDate} - {/* Data formatada corretamente */}
              {session.exercises[0]?.name ? 
                `${session.exercises[0].name.split(' ')[0]} e mais ${session.exercises.length - 1}` : 
                `${session.exercises.length} exercícios`}
            </div>
            <div className="text-xs text-muted-foreground">
              Tempo: {workoutTime}min • Volume: {formatWeightCompact(session.totalVolume)}kg • Clique para detalhes
            </div>
          </div>
        </div>
      </div>
    );
  })}
</CardContent>

        </Card>

        {/* Dialog for Workout Details */}
        <Dialog open={!!selectedWorkoutDetails} onOpenChange={() => setSelectedWorkoutDetails(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-iron-orange" />
                Detalhes do Treino
              </DialogTitle>
            </DialogHeader>
            {selectedWorkoutDetails && (
              <div className="space-y-4">
                {/* Data e informações gerais */}
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

                {/* Exercícios */}
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
                                <span className="text-iron-orange">
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

                {/* Abdominais */}
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

                {/* Aeróbico */}
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

                {/* Notas */}
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

        {/* Reset Data Section */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Resetar todos os dados irá apagar permanentemente todo o histórico de treinos, estatísticas e progresso.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar Todos os Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Reset de Dados</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os seus treinos, estatísticas e progresso serão permanentemente removidos.
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};