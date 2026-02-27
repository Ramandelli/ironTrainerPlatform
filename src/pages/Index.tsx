import React, { useState, useEffect } from 'react';
import { WorkoutDay, WorkoutSession } from '../types/workout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { WorkoutCard } from '../components/WorkoutCard';
import { ExerciseCard } from '../components/ExerciseCard';
import { AbdominalTimer } from '../components/AbdominalTimer';
import { Timer } from '../components/Timer';
import { AerobicTimer } from '../components/AerobicTimer';
import { Statistics } from './Statistics';
import { Management } from './Management';
import { Achievements } from './Achievements';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useToast } from '../hooks/use-toast';
import { storage } from '../utils/storage';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { customWorkoutManager } from '../utils/customWorkouts';
import { restDayManager } from '../utils/restDays';
import { missedWorkoutManager } from '../utils/missedWorkouts';
import { getTodayWorkoutId, calculateWorkoutTime, getNextExercise, calculateTotalVolume } from '../utils/workoutHelpers';
import { WarmupCard } from '../components/WarmupCard';
import { WorkoutProgressBar } from '../components/WorkoutProgressBar';
import { WorkoutCompletionScreen } from '../components/WorkoutCompletionScreen';
import { Clock, TrendingUp, Calendar, Dumbbell, BarChart3, X, Settings, Home, Flame, Trophy, Lock, CheckCircle, Zap, Crown } from 'lucide-react';
import { WorkoutStats } from '../types/workout';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { AchievementModal } from '../components/AchievementModal';
import { ApplyChangesDialog } from '../components/ApplyChangesDialog';
import { AddExerciseDuringWorkout } from '../components/AddExerciseDuringWorkout';
import { usePremium } from '../contexts/PremiumContext';
import { PremiumBanner } from '../components/PremiumBadge';

const Index = () => {
  const { toast } = useToast();
  const { isPremium, openPremiumModal } = usePremium();
  const {
    currentSession,
    timerState,
    isLoading,
    startWorkout,
    completeSet,
    completeExercise,
    skipExercise,
    startRestTimer,
    stopTimer,
    finishWorkout,
    cancelWorkout,
    completeAerobic,
    skipAerobic, 
    completeAbdominalSet,
    completeAbdominalExercise,
    skipAbdominalExercise,
    updateExercise,
    updateAbdominalExercise,
    updateAerobic,
    addExercise,
    applyPermanentChanges,
    modifiedExercises,
    clearModifications,
    newAchievements,
    clearAchievements,
    setWarmupCompleted,
    setAbdominalCompleted
  } = useWorkoutSession();

  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>(WORKOUT_PLAN);
  const [workoutAverages, setWorkoutAverages] = useState<Record<string, number>>({});
  const [isRestDay, setIsRestDay] = useState(false);
  const [isManualRestDay, setIsManualRestDay] = useState(false); // true = manual rest (can cancel), false = automatic (no workout scheduled)
  const [currentView, setCurrentView] = useState<'home' | 'workout' | 'workout-view' | 'statistics' | 'management' | 'achievements'>('home');
  const [viewingWorkoutId, setViewingWorkoutId] = useState<string | null>(null);
  const [showAerobicTimer, setShowAerobicTimer] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [aerobicContext, setAerobicContext] = useState<'before' | 'after' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showApplyChangesDialog, setShowApplyChangesDialog] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  
  // Valores derivados da sessão (persistidos)
  const warmupCompleted = currentSession?.warmupCompleted ?? false;
  const abdominalCompleted = currentSession?.abdominalCompleted ?? false;

  const getLastWorkoutTime = () => {
    if (history.length === 0) return 0;
    
    
    const completedSessions = history
      .filter(session => session.completed && session.endTime)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (completedSessions.length === 0) return 0;
    
    const lastSession = completedSessions[0];
    return Math.round((lastSession.endTime - lastSession.startTime) / 60000);
  };

  
  useEffect(() => {
    if (currentView === 'workout' && currentSession) {
      const interval = setInterval(() => {
        setCurrentTime(calculateWorkoutTime(currentSession.startTime));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentView, currentSession]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedStats, workoutHistoryData, averages] = await Promise.all([
          storage.loadStats(),
          storage.loadWorkoutHistory(),
          storage.getWorkoutAverages()
        ]);
        setStats(loadedStats);
        setHistory(workoutHistoryData);
        setWorkoutHistory(workoutHistoryData);
        setWorkoutAverages(averages || {});
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    const initializeData = async () => {
      await loadData();
      await loadWorkouts();
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (currentView === 'home') {
      const refreshHome = async () => {
        await loadWorkouts();
        await checkRestDay();
      };
      refreshHome();
    }
  }, [currentView]);

  // Check rest day whenever workoutPlan changes
  useEffect(() => {
    checkRestDay();
  }, [workoutPlan]);

  // Escutar evento de atualização de dias de descanso (ex: após reset)
  useEffect(() => {
    const handleRestDaysUpdated = () => {
      checkRestDay();
    };
    window.addEventListener('rest_days_updated', handleRestDaysUpdated);
    return () => {
      window.removeEventListener('rest_days_updated', handleRestDaysUpdated);
    };
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = await storage.loadWorkoutHistory();
      setHistory(historyData);
      setWorkoutHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const findTodaysWorkouts = (): WorkoutDay[] => {
    const todayLabel = getTodayLabel();
    
    return workoutPlan.filter(day => 
      day.day.toLowerCase() === todayLabel.toLowerCase()
    );
  };

  // Manter compatibilidade - retorna o primeiro treino do dia
  const findTodaysWorkout = () => {
    const workouts = findTodaysWorkouts();
    return workouts.length > 0 ? workouts[0] : undefined;
  };

  const getTodayLabel = () => {
    const todayId = getTodayWorkoutId();
    const dayMap: Record<string, string> = {
      'monday': 'Segunda-feira',
      'tuesday': 'Terça-feira',
      'wednesday': 'Quarta-feira',
      'thursday': 'Quinta-feira',
      'friday': 'Sexta-feira',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return dayMap[todayId] || todayId;
  };

  const isTodayWorkoutCompleted = (workoutDayId: string) => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${year}-${month}-${day}`;
    
    return workoutHistory.some(session => 
      session.workoutDayId === workoutDayId && 
      session.completed && 
      session.date === todayFormatted
    );
  };

  const checkRestDay = async () => {
    const todaysWorkouts = findTodaysWorkouts();
    
    // Verificar treinos não realizados de dias anteriores
    await missedWorkoutManager.checkMissedWorkouts();
    
    // Se há treino(s) agendado(s) para hoje, verificar descanso manual
    if (todaysWorkouts.length > 0) {
      const isManualRest = await restDayManager.isTodayRestDay();
      if (isManualRest) {
        setIsRestDay(true);
        setIsManualRestDay(true);
        return;
      }
      // Tem treino agendado e não é descanso manual - mostrar treino
      setIsRestDay(false);
      setIsManualRestDay(false);
      return;
    }

    // Não há treino agendado para hoje - descanso automático
    setIsRestDay(true);
    setIsManualRestDay(false);
  };

  const loadWorkouts = async () => {
    try {
      const allWorkouts = await customWorkoutManager.getAllWorkouts(WORKOUT_PLAN);
      setWorkoutPlan(allWorkouts);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  useEffect(() => {
    if (currentSession && currentView === 'home') {
      setCurrentView('workout');
      
      // Restaurar estado do timer aeróbico se existir
      const workoutDay = workoutPlan.find(day => day.id === currentSession.workoutDayId);
      if (workoutDay?.aerobic) {
        try {
          const savedTimer = localStorage.getItem(`aerobic_timer_${workoutDay.aerobic.type}`);
          if (savedTimer) {
            const { savedStartTime } = JSON.parse(savedTimer);
            if (savedStartTime) {
              setShowAerobicTimer(true);
              const isBeforeTiming = workoutDay.aerobic.timing === 'antes';
              setAerobicContext(isBeforeTiming ? 'before' : 'after');
            }
          }
        } catch (error) {
          console.error('Error restoring aerobic timer:', error);
        }
      }
    }
  }, [currentSession, currentView, workoutPlan]);

  const loadStats = async () => {
    try {
      await storage.cleanInvalidSessions();
      const loadedStats = await storage.loadStats();
      setStats(loadedStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const todayWorkoutId = getTodayWorkoutId();
  const todayWorkout = findTodaysWorkout();
  const allTodayWorkouts = findTodaysWorkouts();
  // Free users: only 1 workout per day
  const todayWorkouts = isPremium ? allTodayWorkouts : allTodayWorkouts.slice(0, 1);

  const handleStartWorkout = (workoutDayId: string) => {
    const workoutDay = workoutPlan.find(day => day.id === workoutDayId);
    if (!workoutDay) return;
    
    // Verificar se este treino é de hoje
    const isToday = todayWorkouts.some(w => w.id === workoutDayId);
    
    if (isToday) {
      // Check if today is a rest day
      if (isRestDay) {
        toast({
          title: "Dia de descanso",
          description: "Cancele o descanso para treinar hoje.",
          variant: "destructive"
        });
        return;
      }
      
      // Reset workout-specific states
      setWarmupCompleted(false);
      setAbdominalCompleted(false);
      setAerobicContext(null);
      
      startWorkout(workoutDayId);
      setCurrentView('workout');
    } else {
      setViewingWorkoutId(workoutDayId);
      setCurrentView('workout-view');
    }
  };

  const handleViewWorkout = (workoutDayId: string) => {
    setViewingWorkoutId(workoutDayId);
    setCurrentView('workout-view');
  };

  const handleSetComplete = (exerciseId: string, setIndex: number, setData: any) => {
    completeSet(exerciseId, setIndex, setData);
    
    // Não iniciar timer de descanso se for apenas edição de série já completada
    if (setData.isEdit) return;
    
    const exercise = currentSession?.exercises.find(e => e.id === exerciseId);
    if (setIndex < (exercise?.sets || 0) - 1) {
      const restTime = exercise?.restTime || 90;
      startRestTimer(restTime, 'rest-between-sets', exerciseId, setIndex);
    }
  };

  const handleExerciseComplete = (exerciseId: string) => {
    completeExercise(exerciseId);
    
    const nextExercise = getNextExercise(currentSession?.exercises || []);
    if (nextExercise) {
      startRestTimer(120, 'rest-between-exercises');
    }
  };

  const handleFinishWorkout = async () => {
    if (!currentSession) return;
    
    // Check if there are modified exercises
    if (modifiedExercises.size > 0) {
      setShowApplyChangesDialog(true);
      return;
    }
    
    // Finish workout normally
    await finishWorkoutInternal();
  };

  const finishWorkoutInternal = async () => {
    if (!currentSession) return;
    
    
    const workoutDuration = Math.round((Date.now() - currentSession.startTime) / 60000);
    await storage.updateWorkoutAverage(currentSession.workoutDayId, workoutDuration);
    
    
    const updatedAverages = await storage.getWorkoutAverages();
    setWorkoutAverages(updatedAverages || {});
    
    await finishWorkout();
    clearModifications();
    setCurrentView('home');
    setShowAerobicTimer(false);
    await loadStats();
    await loadWorkouts();
    await loadHistory();
  };

  const handleApplyChangesConfirm = async () => {
    try {
      setShowApplyChangesDialog(false);
      const success = await applyPermanentChanges();
      await finishWorkoutInternal();
      
      if (success) {
        toast({
          title: "Treino finalizado! ✅",
          description: "As alterações foram salvas no treino base.",
        });
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      toast({
        title: "Erro ao aplicar alterações",
        description: "O treino foi finalizado, mas houve um problema ao salvar as alterações no treino padrão.",
        variant: "destructive"
      });
      await finishWorkoutInternal();
    }
  };

  const handleApplyChangesCancel = async () => {
    setShowApplyChangesDialog(false);
    await finishWorkoutInternal();
  };

  const handleCompleteAerobic = (actualMinutes?: number, distance?: number) => {
    completeAerobic(actualMinutes, distance);
    setShowAerobicTimer(false);
  };

  
  const handleCompleteAbdominals = () => {
    setAbdominalCompleted(true);
  };

  const handleCancelWorkout = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancelWorkout = () => {
    cancelWorkout();
    setCurrentView('home');
    setShowCancelConfirm(false);
  };

  const handleNavigateToStatistics = () => {
    setCurrentView('statistics');
  };

  const handleDataReset = async () => {
    await restDayManager.resetRestDays();
    setIsRestDay(false);
    setIsManualRestDay(false);
    await loadStats();
    await loadWorkouts();
    await loadHistory();
    await checkRestDay();
  };

  const handleNavigateToManagement = () => {
    setCurrentView('management');
  };

  const handleNavigateToAchievements = () => {
    setCurrentView('achievements');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    checkRestDay();
  };

  const handleToggleRestDay = async () => {
    const today = new Date().toISOString().split('T')[0];
    const isCurrentlyRest = await restDayManager.isTodayRestDay();
    
    if (isCurrentlyRest) {
      await restDayManager.removeRestDay(today);
      toast({
        title: "Descanso removido",
        description: "Você pode treinar hoje!",
      });
    } else {
      await restDayManager.setRestDay(today);
      toast({
        title: "Descanso marcado",
        description: "Aproveite para recuperar as energias!",
      });
    }
    
    await checkRestDay();
    await loadWorkouts();
  };

  const getWorkoutPhase = () => {
    if (!currentSession) return 'none';
    
    const workoutDay = workoutPlan.find(day => day.id === currentSession.workoutDayId);
    if (!workoutDay) return 'none';

    // Primeira fase: Aquecimento (se existir, tiver conteúdo e não estiver completo)
    if (workoutDay.warmup && workoutDay.warmup.trim() !== '' && !warmupCompleted) {
      return 'warmup';
    }

    // Segunda fase: Aeróbico antes dos exercícios
    const isAerobicBeforePending = 
      workoutDay.aerobic?.timing === 'antes' && 
      currentSession.aerobic && 
      !currentSession.aerobic.completed &&
      !currentSession.aerobic.skipped; 

    if (isAerobicBeforePending) {
      return 'aerobic-before';
    }

    // Terceira fase: Exercícios principais
    const allExercisesCompleted = currentSession.exercises.every(ex => ex.completed);
    
    if (!allExercisesCompleted) {
      return 'exercises';
    }

    // Quarta fase: Exercícios abdominais (somente Premium e se existem exercícios)
    const hasAbdominalExercises = workoutDay.abdominal && workoutDay.abdominal.length > 0;
    const sessionHasAbdominal = currentSession.abdominal && currentSession.abdominal.length > 0;
    
    if (isPremium && hasAbdominalExercises && sessionHasAbdominal && !abdominalCompleted) {
      return 'abdominal';
    }

    // Quinta fase: Aeróbico depois dos exercícios
    const isAerobicAfterPending = 
      workoutDay.aerobic?.timing === 'depois' && 
      currentSession.aerobic && 
      !currentSession.aerobic.completed &&
      !currentSession.aerobic.skipped; 

    if (isAerobicAfterPending) {
      return 'aerobic-after';
    }

    return 'finished';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (currentView === 'workout-view' && viewingWorkoutId) {
    const workoutDay = workoutPlan.find(day => day.id === viewingWorkoutId);
    
    if (!workoutDay) {
      setCurrentView('home');
      return null;
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground uppercase">{workoutDay.name}</h1>
                <p className="text-sm text-muted-foreground">{workoutDay.day} (Modo Visualização)</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleBackToHome}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
          {/* Warmup Section */}
          {workoutDay.warmup && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Aquecimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                  {workoutDay.warmup}
                </div>
              </CardContent>
            </Card>
          )}

          {workoutDay.aerobic && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-iron-orange" />
                  Exercício Aeróbico ({workoutDay.aerobic.timing})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="capitalize">{workoutDay.aerobic.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duração:</span>
                    <span>{workoutDay.aerobic.duration} minutos</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Intensidade:</span>
                    <span className="capitalize">{workoutDay.aerobic.intensity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {workoutDay.exercises.map((exercise) => (
            <Card key={exercise.id} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 uppercase">
                  <Dumbbell className="w-4 h-4 text-iron-orange" />
                  {exercise.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Séries:</span>
                    <span>{exercise.sets}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Repetições alvo:</span>
                    <span>{exercise.targetReps}</span>
                  </div>
                  {exercise.suggestedWeight && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Carga sugerida:</span>
                      <span>{exercise.suggestedWeight}kg</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {workoutDay.abdominal && workoutDay.abdominal.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Exercícios Abdominais</h2>
              {workoutDay.abdominal.map((exercise) => (
                <Card key={exercise.id} className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 uppercase">
                      <Dumbbell className="w-4 h-4 text-iron-orange" />
                      {exercise.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Séries:</span>
                        <span>{exercise.sets}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Repetições/Tempo:</span>
                        <span>{exercise.targetReps}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border">
          <div className="max-w-md mx-auto p-4">
            <div className="flex justify-around">
              <Button
                variant="default"
                size="sm"
                onClick={handleBackToHome}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Home className="w-5 h-5" />
                <span className="text-xs">Início</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavigateToStatistics}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Estatísticas</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavigateToManagement}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Settings className="w-5 h-5" />
                <span className="text-xs">Gerenciar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'workout' && currentSession) {
    const workoutDay = workoutPlan.find(day => day.id === currentSession.workoutDayId);
    const completedExercises = currentSession.exercises.filter(e => e.completed).length;
    const nextExercise = getNextExercise(currentSession.exercises);
    const workoutPhase = getWorkoutPhase();

    if (!workoutDay) {
      setCurrentView('home');
      return null;
    }

    return (
      <div className="min-h-screen bg-background">
        <DeleteConfirmDialog
          open={showCancelConfirm}
          onOpenChange={setShowCancelConfirm}
          title="Cancelar Treino?"
          description="Tem certeza que deseja cancelar o treino? Todo o progresso atual será perdido."
          onConfirm={confirmCancelWorkout}
        />

        <ApplyChangesDialog
          open={showApplyChangesDialog}
          onOpenChange={setShowApplyChangesDialog}
          onConfirm={handleApplyChangesConfirm}
          onCancel={handleApplyChangesCancel}
        />

        {isPremium && (
          <AddExerciseDuringWorkout
            open={showAddExercise}
            onOpenChange={setShowAddExercise}
            onAdd={(exercise) => {
              addExercise(exercise);
              setShowAddExercise(false);
            }}
          />
        )}

        {timerState && (
          <Timer
            initialTime={timerState.timeLeft}
            type={timerState.type}
            exerciseId={timerState.exerciseId}
            setIndex={timerState.setIndex}
            onComplete={stopTimer}
            onCancel={stopTimer}
          />
        )}

        <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
          <div className="max-w-md mx-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground uppercase">{workoutDay.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentTime}min
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    {completedExercises}/{currentSession.exercises.length}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCancelWorkout}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <WorkoutProgressBar
              currentPhase={workoutPhase}
              exercisesCompleted={completedExercises}
              totalExercises={currentSession.exercises.length}
              warmupCompleted={warmupCompleted}
              hasWarmup={!!workoutDay.warmup && workoutDay.warmup.trim() !== ''}
              hasAbdominal={!!workoutDay.abdominal && workoutDay.abdominal.length > 0}
              abdominalCompleted={abdominalCompleted}
              hasAerobic={!!workoutDay.aerobic}
              aerobicTiming={workoutDay.aerobic?.timing}
              aerobicCompleted={!!currentSession.aerobic?.completed || !!currentSession.aerobic?.skipped}
            />
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
          {workoutPhase === 'warmup' && workoutDay.warmup && workoutDay.warmup.trim() !== '' && (
            <WarmupCard
              warmupDescription={workoutDay.warmup}
              onComplete={() => setWarmupCompleted(true)}
            />
          )}

          {workoutPhase === 'aerobic-before' && workoutDay.aerobic && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 uppercase">Cardio - {workoutDay.aerobic.type}</h2>
                <p className="text-muted-foreground uppercase">
                  {workoutDay.aerobic.duration} minutos • {workoutDay.aerobic.intensity}
                </p>
              </div>
              
              <div className="flex gap-3">
  <Button 
    variant="workout" 
    className="flex-1" 
    onClick={() => {
      setAerobicContext('before');
      setShowAerobicTimer(true);
    }}
  >
    Iniciar Cardio
  </Button>
                
                <Button 
    variant="outline" 
    className="flex-1" 
    onClick={async () => {
      await skipAerobic();
      setAerobicContext(null);
    }}
  >
    Pular Cardio
  </Button>
              </div>
            </div>
          )}

          {workoutPhase === 'exercises' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground uppercase">Exercícios</h2>
                {isPremium ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddExercise(true)}
                  >
                    + Adicionar
                  </Button>
                ) : null}
              </div>
              {currentSession.exercises.map((exercise, index) => {
                const isExerciseActive = nextExercise?.id === exercise.id;
                const isFutureExercise = !exercise.completed && !isExerciseActive;
                
                return (
                  <div 
                    key={exercise.id} 
                    className={`transition-all duration-300 ${isExerciseActive ? 'animate-fade-in' : ''}`}
                  >
                    <ExerciseCard
                      exercise={exercise}
                      onSetComplete={(setIndex, setData) => handleSetComplete(exercise.id, setIndex, setData)}
                      onExerciseComplete={() => handleExerciseComplete(exercise.id)}
                      onExerciseSkip={() => skipExercise(exercise.id)}
                      onExerciseUpdate={isPremium ? (updates) => updateExercise(exercise.id, updates) : undefined}
                      isActive={isExerciseActive}
                      isFuture={isFutureExercise}
                      showSuggestion={isPremium}
                    />
                  </div>
                );
              })}
            </>
          )}

          {workoutPhase === 'abdominal' && currentSession.abdominal && currentSession.abdominal.length > 0 && isPremium && (
            <div className="space-y-4 mt-8">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground mb-2 uppercase">Exercícios Abdominais</h2>
                <p className="text-sm text-muted-foreground mb-4">Complete os exercícios abdominais para finalizar</p>
                <Button variant="outline" className="w-full" onClick={() => setAbdominalCompleted(true)}>
                  Pular Abdominais
                </Button>
              </div>
              
              {currentSession.abdominal.map((exercise) => (
                exercise.isTimeBased ? (
                  <AbdominalTimer
                    key={exercise.id}
                    exercise={exercise}
                    onSetComplete={(setIndex, setData) => {
                      completeAbdominalSet(exercise.id, setIndex, setData);
                      if (!setData.isEdit && setIndex < (exercise.sets - 1)) {
                        const restTime = exercise.restTime || 60;
                        startRestTimer(restTime, 'rest-between-sets', exercise.id, setIndex);
                      }
                    }}
                    onExerciseComplete={() => completeAbdominalExercise(exercise.id)}
                    onExerciseSkip={() => skipAbdominalExercise(exercise.id)}
                    onExerciseUpdate={(updates) => updateAbdominalExercise(exercise.id, updates)}
                    isActive={!exercise.completed}
                  />
                ) : (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onSetComplete={(setIndex, setData) => {
                      completeAbdominalSet(exercise.id, setIndex, setData);
                      if (!setData.isEdit && setIndex < (exercise.sets - 1)) {
                        const restTime = exercise.restTime || 60;
                        startRestTimer(restTime, 'rest-between-sets', exercise.id, setIndex);
                      }
                    }}
                    onExerciseComplete={() => completeAbdominalExercise(exercise.id)}
                    onExerciseSkip={() => skipAbdominalExercise(exercise.id)}
                    onExerciseUpdate={(updates) => updateAbdominalExercise(exercise.id, updates)}
                    isActive={!exercise.completed}
                    hideWeightInputs
                  />
                )
              ))}
              
              {currentSession.abdominal.every(ex => ex.completed) && (
                <Button 
                  variant="success" 
                  className="w-full" 
                  onClick={handleCompleteAbdominals}
                >
                  Concluir Abdominais ✅
                </Button>
              )}
            </div>
          )}

          {workoutPhase === 'aerobic-after' && workoutDay.aerobic && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 uppercase">Finalize com Cardio - {workoutDay.aerobic.type}</h2>
                <p className="text-muted-foreground uppercase">
                  {workoutDay.aerobic.duration} minutos • {workoutDay.aerobic.intensity}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="workout" 
                  className="flex-1" 
                  onClick={() => {
                    setAerobicContext('after');
                    setShowAerobicTimer(true);
                  }}
                >
                  Iniciar Cardio 🏃
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={async () => {
                    await skipAerobic();
                  }}
                >
                  Pular Cardio
                </Button>
              </div>
            </div>
          )}

          {showAerobicTimer && workoutDay.aerobic && (
            <AerobicTimer
              duration={workoutDay.aerobic.duration}
              type={workoutDay.aerobic.type}
              onComplete={(actualMinutes, distance) => {
                handleCompleteAerobic(actualMinutes, distance);
                setShowAerobicTimer(false);
                setAerobicContext(null);
              }}
              onCancel={() => {
                setShowAerobicTimer(false);
              }}
            />
          )}

          {workoutPhase === 'finished' && (
            isPremium ? (
              <WorkoutCompletionScreen
                onFinish={handleFinishWorkout}
                workoutDuration={currentTime}
                exercisesCompleted={completedExercises}
              />
            ) : (
              <div className="text-center space-y-6 py-8 animate-fade-in">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
                  <div className="relative bg-gradient-to-br from-success to-success/80 rounded-full p-6 shadow-lg">
                    <CheckCircle className="w-16 h-16 text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">Treino Concluído!</h2>
                  <p className="text-xl text-iron-orange font-semibold">Bom trabalho! 💪</p>
                </div>

                {/* Stats com teaser premium */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                    <Flame className="w-5 h-5 text-iron-orange mx-auto" />
                    <div className="text-xl font-bold text-foreground">{currentTime}min</div>
                    <div className="text-xs text-muted-foreground">Duração</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                    <Zap className="w-5 h-5 text-iron-orange mx-auto" />
                    <div className="text-xl font-bold text-foreground">{completedExercises}</div>
                    <div className="text-xs text-muted-foreground">Exercícios</div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3 space-y-1">
                    <TrendingUp className="w-5 h-5 text-iron-orange mx-auto" />
                    <div className="text-xl font-bold text-foreground">
                      {calculateTotalVolume(currentSession.exercises).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Volume (kg)</div>
                  </div>
                </div>

                {/* Premium teaser */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-semibold">Versão Premium</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe sua evolução completa com <strong className="text-foreground">gráficos, recordes pessoais, tendências</strong> e muito mais na aba de Estatísticas.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => openPremiumModal('Estatísticas Completas')}
                  >
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    Desbloquear Estatísticas
                  </Button>
                </div>

                <Button variant="success" className="w-full h-14 text-lg font-semibold shadow-lg" onClick={handleFinishWorkout}>
                  <Trophy className="w-5 h-5 mr-2" />
                  Finalizar e Salvar
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'statistics') {
    return <Statistics onBack={handleBackToHome} onDataReset={handleDataReset} />;
  }

  if (currentView === 'management') {
    return <Management onBack={() => { 
      handleBackToHome(); 
      loadWorkouts();
      checkRestDay();
    }} />;
  }

  if (currentView === 'achievements') {
    if (!isPremium) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-md mx-auto text-center py-16 space-y-6">
            <div className="p-6 rounded-full bg-primary/10 inline-block">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Conquistas Premium</h2>
            <p className="text-muted-foreground">
              A aba de conquistas é exclusiva do Iron Trainer Premium. 
              Desbloqueie para acompanhar suas medalhas e progresso!
            </p>
            <Button onClick={() => openPremiumModal('Aba de Conquistas')}>
              Saiba mais sobre o Premium
            </Button>
            <Button variant="ghost" onClick={handleBackToHome}>
              Voltar
            </Button>
          </div>
        </div>
      );
    }
    return <Achievements onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AchievementModal 
        achievements={newAchievements}
        onClose={clearAchievements}
      />
      
      <div className="max-w-md mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Iron Trainer 💪
          </h1>
          <p className="text-muted-foreground text-sm">
            Seu progresso de treino nunca se perde
          </p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isPremium ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted text-muted-foreground border border-border'}`}>
              {isPremium ? '⭐ Premium' : 'Freeware'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-iron-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {getLastWorkoutTime()}min
              </div>
              <div className="text-sm text-muted-foreground">
                Último treino
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-5 h-5 text-iron-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalWorkouts || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Treinos concluídos
              </div>
            </CardContent>
          </Card>
        </div>

        {isRestDay ? (
          <Card className="mb-6 border-border">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">🏖️</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {getTodayWorkoutId() === 'saturday' || getTodayWorkoutId() === 'sunday' 
                  ? 'Fim de Semana' 
                  : isManualRestDay 
                    ? 'Dia de Descanso' 
                    : 'Sem Treino Agendado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isManualRestDay 
                  ? 'Aproveite para recuperar as energias!' 
                  : 'Nenhum treino configurado para hoje.'}
              </p>
              {isManualRestDay && (
                <Button 
                  variant="outline" 
                  onClick={handleToggleRestDay}
                  className="mt-2"
                >
                  Cancelar Descanso
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 uppercase">
                <Calendar className="w-5 h-5 text-iron-orange" />
                {todayWorkouts.length > 1 ? 'Treinos de Hoje' : 'Treino de Hoje'}
              </h2>
              {!todayWorkouts.some(w => isTodayWorkoutCompleted(w.id)) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleToggleRestDay}
                  className="text-muted-foreground hover:text-foreground uppercase"
                >
                  Marcar Descanso
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {todayWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workoutDay={workout}
                  onStartWorkout={() => handleStartWorkout(workout.id)}
                  isToday={true}
                  averageTime={workoutAverages[workout.id] || 0}
                  isCompleted={isTodayWorkoutCompleted(workout.id)}
                />
              ))}
              {!isPremium && allTodayWorkouts.length > 1 && (
                <PremiumBanner 
                  feature="Múltiplos Treinos por Dia"
                  message={`🔒 +${allTodayWorkouts.length - 1} treino(s) disponível(is) no Premium`}
                />
              )}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-iron-orange" />
            Todos os Treinos
          </h2>
          <div className="space-y-4">
            {workoutPlan.map((workoutDay) => (
              <WorkoutCard
                key={workoutDay.id}
                workoutDay={workoutDay}
                onStartWorkout={() => handleViewWorkout(workoutDay.id)}
                isToday={false}
                averageTime={workoutAverages[workoutDay.id] || 0}
              />
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border">
          <div className="max-w-md mx-auto p-4">
            <div className="flex justify-around">
              <Button
                variant="default"
                size="sm"
                onClick={handleBackToHome}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Home className="w-5 h-5" />
                <span className="text-xs">Início</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavigateToStatistics}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Estatísticas</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavigateToAchievements}
                className="flex flex-col items-center gap-1 h-auto py-2 relative"
              >
                <Trophy className="w-5 h-5" />
                <span className="text-xs">Conquistas</span>
                {!isPremium && <Lock className="w-3 h-3 absolute top-1 right-1 text-primary" />}
              </Button>
              
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNavigateToManagement}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Settings className="w-5 h-5" />
                <span className="text-xs">Gerenciar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
