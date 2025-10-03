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
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { storage } from '../utils/storage';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { customWorkoutManager } from '../utils/customWorkouts';
import { restDayManager } from '../utils/restDays';
import { getTodayWorkoutId, calculateWorkoutTime, getNextExercise } from '../utils/workoutHelpers';
import { WarmupCard } from '../components/WarmupCard';
import { Clock, TrendingUp, Calendar, Dumbbell, BarChart3, X, Settings, Home, Flame } from 'lucide-react';
import { WorkoutStats } from '../types/workout';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

const Index = () => {
  const {
    currentSession,
    timerState,
    isLoading,
    startWorkout,
    completeSet,
    completeExercise,
    startRestTimer,
    stopTimer,
    finishWorkout,
    cancelWorkout,
    completeAerobic,
    skipAerobic, 
    completeAbdominalSet,
    completeAbdominalExercise
  } = useWorkoutSession(); 

  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>(WORKOUT_PLAN);
  const [workoutAverages, setWorkoutAverages] = useState<Record<string, number>>({});
  const [isRestDay, setIsRestDay] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'workout' | 'workout-view' | 'statistics' | 'management'>('home');
  const [viewingWorkoutId, setViewingWorkoutId] = useState<string | null>(null);
  const [showAerobicTimer, setShowAerobicTimer] = useState(false);
  const [abdominalCompleted, setAbdominalCompleted] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [aerobicContext, setAerobicContext] = useState<'before' | 'after' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [warmupCompleted, setWarmupCompleted] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
      } finally {
        
      }
    };

    loadData();
    loadWorkouts();
    checkRestDay();
  }, []);

  useEffect(() => {
    if (currentView === 'home') {
      loadWorkouts();
    }
  }, [currentView]);

  const loadHistory = async () => {
    try {
      const historyData = await storage.loadWorkoutHistory();
      setHistory(historyData);
      setWorkoutHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const findTodaysWorkout = () => {
    const todayId = getTodayWorkoutId();
    const todayLabel = getTodayLabel();
    
    const exactMatch = workoutPlan.find(day => day.id === todayId);
    if (exactMatch) return exactMatch;
    
    return workoutPlan.find(day => 
      day.day.toLowerCase() === todayLabel.toLowerCase() && 
      customWorkoutManager.isCustomWorkout(day.id)
    );
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
    const todayWorkoutId = getTodayWorkoutId();
    const todaysWorkout = findTodaysWorkout();

    
    const isManualRest = await restDayManager.isTodayRestDay();
    if (isManualRest) {
      setIsRestDay(true);
      return;
    }

    
    if (!todaysWorkout && (todayWorkoutId === 'saturday' || todayWorkoutId === 'sunday')) {
      setIsRestDay(true);
      return;
    }

   
    setIsRestDay(false);
  };

  const loadWorkouts = async () => {
    try {
      const allWorkouts = await customWorkoutManager.getAllWorkouts(WORKOUT_PLAN);
      setWorkoutPlan(allWorkouts);
      await checkRestDay();
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

  const handleStartWorkout = (workoutDayId: string) => {
    const workoutDay = workoutPlan.find(day => day.id === workoutDayId);
    if (!workoutDay) return;
    
    const todayLabel = getTodayLabel();
    const isToday = workoutDay.day.toLowerCase() === todayLabel.toLowerCase();
    
    if (isToday) {
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
    
    
    const workoutDuration = Math.round((Date.now() - currentSession.startTime) / 60000);
    await storage.updateWorkoutAverage(currentSession.workoutDayId, workoutDuration);
    
    
    const updatedAverages = await storage.getWorkoutAverages();
    setWorkoutAverages(updatedAverages || {});
    
    await finishWorkout();
    setCurrentView('home');
    setShowAerobicTimer(false);
    setAbdominalCompleted(false);
    await loadStats();
    await loadWorkouts();
    await loadHistory();
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
    await loadStats();
    await loadWorkouts();
    await loadHistory();
    await checkRestDay();
  };

  const handleNavigateToManagement = () => {
    setCurrentView('management');
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
    } else {
      await restDayManager.setRestDay(today);
    }
    
    await checkRestDay();
  };

  const getWorkoutPhase = () => {
    if (!currentSession) return 'none';
    
    const workoutDay = workoutPlan.find(day => day.id === currentSession.workoutDayId);
    if (!workoutDay) return 'none';

    // Primeira fase: Aquecimento (se existir e não estiver completo)
    if (workoutDay.warmup && !warmupCompleted) {
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

    // Quarta fase: Exercícios abdominais
    if (workoutDay.abdominal && !abdominalCompleted) {
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
                <h1 className="text-lg font-bold text-foreground">{workoutDay.name}</h1>
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
                <CardTitle className="text-base flex items-center gap-2">
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
                    <CardTitle className="text-base flex items-center gap-2">
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
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">{workoutDay.name}</h1>
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
          </div>
        </div>

        <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
          {workoutPhase === 'warmup' && workoutDay.warmup && (
            <WarmupCard
              warmupDescription={workoutDay.warmup}
              onComplete={() => setWarmupCompleted(true)}
            />
          )}

          {workoutPhase === 'aerobic-before' && workoutDay.aerobic && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Cardio - {workoutDay.aerobic.type}</h2>
                <p className="text-muted-foreground">
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

          {workoutPhase === 'exercises' && currentSession.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSetComplete={(setIndex, setData) => handleSetComplete(exercise.id, setIndex, setData)}
              onExerciseComplete={() => handleExerciseComplete(exercise.id)}
              isActive={nextExercise?.id === exercise.id}
            />
          ))}

          {workoutPhase === 'abdominal' && workoutDay.abdominal && workoutDay.abdominal.length > 0 && (
            <div className="space-y-4 mt-8">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground mb-2">Exercícios Abdominais</h2>
                <p className="text-sm text-muted-foreground mb-4">Complete os exercícios abdominais para finalizar</p>
                <Button variant="outline" className="w-full" onClick={() => setAbdominalCompleted(true)}>
                  Pular Abdominais
                </Button>
              </div>
              
              {currentSession.abdominal?.map((exercise) => (
                exercise.isTimeBased ? (
                  <AbdominalTimer
                    key={exercise.id}
                    exercise={exercise}
                    onSetComplete={(setIndex, setData) => {
                      completeAbdominalSet(exercise.id, setIndex, setData);
                      if (setIndex < (exercise.sets - 1)) {
                        const restTime = exercise.restTime || 60;
                        startRestTimer(restTime, 'rest-between-sets', exercise.id, setIndex);
                      }
                    }}
                    onExerciseComplete={() => completeAbdominalExercise(exercise.id)}
                    isActive={!exercise.completed}
                  />
                ) : (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onSetComplete={(setIndex, setData) => {
                      completeAbdominalSet(exercise.id, setIndex, setData);
                      if (setIndex < (exercise.sets - 1)) {
                        const restTime = exercise.restTime || 60;
                        startRestTimer(restTime, 'rest-between-sets', exercise.id, setIndex);
                      }
                    }}
                    onExerciseComplete={() => completeAbdominalExercise(exercise.id)}
                    isActive={!exercise.completed}
                    hideWeightInputs
                  />
                )
              )) || []}
              
              {currentSession.abdominal?.every(ex => ex.completed) && (
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
                <h2 className="text-2xl font-bold mb-2">Finalize com Cardio</h2>
                <p className="text-muted-foreground">
                  {workoutDay.aerobic.type} - {workoutDay.aerobic.duration} minutos
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
            <div className="text-center space-y-4">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-foreground">Treino Concluído!</h2>
              <p className="text-muted-foreground">Parabéns pelo seu desempenho!</p>
              <Button variant="success" className="w-full" onClick={handleFinishWorkout}>
                Finalizar Treino
              </Button>
            </div>
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
    }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Iron Trainer 💪
          </h1>
          <p className="text-muted-foreground">
            Seu progresso de treino nunca se perde
          </p>
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
                {getTodayWorkoutId() === 'saturday' || getTodayWorkoutId() === 'sunday' ? 'Fim de Semana' : 'Dia de Descanso'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Aproveite para recuperar as energias!
              </p>
              {getTodayWorkoutId() !== 'saturday' && getTodayWorkoutId() !== 'sunday' && (
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
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-iron-orange" />
                Treino de Hoje
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleToggleRestDay}
                className="text-muted-foreground hover:text-foreground"
              >
                Marcar Descanso
              </Button>
            </div>
            {todayWorkout && (
              <WorkoutCard
                workoutDay={todayWorkout}
                onStartWorkout={() => handleStartWorkout(todayWorkout.id)}
                isToday={true}
                averageTime={workoutAverages[todayWorkout.id] || 0}
                isCompleted={isTodayWorkoutCompleted(todayWorkout.id)}
              />
            )}
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