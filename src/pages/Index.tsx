import React, { useState, useEffect } from 'react';
import { WorkoutDay } from '../types/workout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { WorkoutCard } from '../components/WorkoutCard';
import { ExerciseCard } from '../components/ExerciseCard';
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
import { Clock, TrendingUp, Calendar, Dumbbell, BarChart3, X, Settings, Home } from 'lucide-react';
import { WorkoutStats } from '../types/workout';

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
    completeAerobic
  } = useWorkoutSession();

  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutDay[]>(WORKOUT_PLAN);
  const [isRestDay, setIsRestDay] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'workout' | 'workout-view' | 'statistics' | 'management'>('home');
  const [viewingWorkoutId, setViewingWorkoutId] = useState<string | null>(null);
  const [showAerobicTimer, setShowAerobicTimer] = useState(false);
  const [abdominalCompleted, setAbdominalCompleted] = useState(false);

  useEffect(() => {
    loadStats();
    loadWorkouts();
    checkRestDay();
  }, []);

  const checkRestDay = async () => {
    const todayWorkoutId = getTodayWorkoutId();
    
    // Só é dia de descanso se:
    // 1. For fim de semana (sábado/domingo) OU
    // 2. For marcado manualmente como descanso E não for fim de semana
    if (todayWorkoutId === 'saturday' || todayWorkoutId === 'sunday') {
      setIsRestDay(true);
    } else {
      const isManualRest = await restDayManager.isTodayRestDay();
      setIsRestDay(isManualRest);
    }
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
    // Switch to workout view if there's an active session
    if (currentSession && currentView === 'home') {
      setCurrentView('workout');
    }
  }, [currentSession, currentView]);

  const loadStats = async () => {
    try {
      const loadedStats = await storage.loadStats();
      setStats(loadedStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const todayWorkoutId = getTodayWorkoutId();
  const todayWorkout = workoutPlan.find(day => day.id === todayWorkoutId);

  const handleStartWorkout = (workoutDayId: string) => {
    const isToday = workoutDayId === todayWorkoutId;
    
    if (isToday) {
      startWorkout(workoutDayId);
      setCurrentView('workout');
    } else {
      // Modo visualização para treinos de outros dias
      setViewingWorkoutId(workoutDayId);
      setCurrentView('workout-view');
    }
  };

  const handleViewWorkout = (workoutDayId: string) => {
    // Sempre vai para modo visualização, independente se é hoje ou não
    setViewingWorkoutId(workoutDayId);
    setCurrentView('workout-view');
  };

  const handleSetComplete = (exerciseId: string, setIndex: number, setData: any) => {
    completeSet(exerciseId, setIndex, setData);
    
    // Start rest timer between sets (90 seconds)
    if (setIndex < (currentSession?.exercises.find(e => e.id === exerciseId)?.sets || 0) - 1) {
      startRestTimer(90, 'rest-between-sets', exerciseId, setIndex);
    }
  };

  const handleExerciseComplete = (exerciseId: string) => {
    completeExercise(exerciseId);
    
    // Start rest timer between exercises (2 minutes)
    const nextExercise = getNextExercise(currentSession?.exercises || []);
    if (nextExercise) {
      startRestTimer(120, 'rest-between-exercises');
    }
  };

  const handleFinishWorkout = () => {
    finishWorkout();
    setCurrentView('home');
    setShowAerobicTimer(false);
    setAbdominalCompleted(false);
  };

  const handleCompleteAerobic = () => {
    completeAerobic();
    setShowAerobicTimer(false);
    handleFinishWorkout();
  };

  const handleSkipAerobic = () => {
    setShowAerobicTimer(false);
    handleFinishWorkout();
  };

  const handleCompleteAbdominals = () => {
    setAbdominalCompleted(true);
  };

  const handleCancelWorkout = () => {
    cancelWorkout();
    setCurrentView('home');
  };

  // Navigation handlers
  const handleNavigateToStatistics = () => {
    setCurrentView('statistics');
  };

  const handleNavigateToManagement = () => {
    setCurrentView('management');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    checkRestDay(); // Recheck rest day when returning home
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

  // Workout View Mode (apenas visualização)
  if (currentView === 'workout-view' && viewingWorkoutId) {
    const workoutDay = workoutPlan.find(day => day.id === viewingWorkoutId);
    
    if (!workoutDay) {
      setCurrentView('home');
      return null;
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
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

        {/* Exercise List - Read Only */}
        <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
          {/* Aerobic Exercise */}
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

          {/* Main Exercises */}
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

          {/* Abdominal Exercises */}
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

        {/* Bottom Navigation - Always visible in view mode */}
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

  // Get current workout phase
  const getWorkoutPhase = () => {
    if (!currentSession) return 'none';
    
    const workoutDay = workoutPlan.find(day => day.id === currentSession.workoutDayId);
    if (!workoutDay) return 'none';

    // Check if we should show aerobic first (before exercises)
    if (workoutDay.aerobic?.timing === 'antes' && !currentSession.aerobic?.completed) {
      return 'aerobic-before';
    }

    // Check if all main exercises are completed
    const allExercisesCompleted = currentSession.exercises.every(ex => ex.completed);
    
    if (!allExercisesCompleted) {
      return 'exercises';
    }

    // Check if there are abdominals and they're not completed
    if (workoutDay.abdominal && !abdominalCompleted) {
      return 'abdominal';
    }

    // Check if we should show aerobic after
    if (workoutDay.aerobic?.timing === 'depois' && !currentSession.aerobic?.completed) {
      return 'aerobic-after';
    }

    return 'finished';
  };

  // Active Workout View
  if (currentView === 'workout' && currentSession) {
    const workoutDay = workoutPlan.find(day => day.id === currentSession.workoutDayId);
    const currentTime = calculateWorkoutTime(currentSession.startTime);
    const completedExercises = currentSession.exercises.filter(e => e.completed).length;
    const nextExercise = getNextExercise(currentSession.exercises);
    const allMainExercisesCompleted = completedExercises === currentSession.exercises.length;
    const hasAbdominals = workoutDay?.abdominal && workoutDay.abdominal.length > 0;
    const hasAerobic = workoutDay?.aerobic;
    const shouldShowAerobicOption = allMainExercisesCompleted && (!hasAbdominals || abdominalCompleted) && hasAerobic && hasAerobic.timing === 'depois';
    const workoutPhase = getWorkoutPhase();

    // Show Aerobic Timer
    if (showAerobicTimer && hasAerobic) {
      return (
        <AerobicTimer
          duration={hasAerobic.duration}
          type={hasAerobic.type}
          onComplete={handleCompleteAerobic}
          onCancel={handleSkipAerobic}
        />
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Timer Overlay */}
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

        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">{workoutDay?.name}</h1>
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

        {/* Content based on workout phase */}
        <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
          {/* Aerobic Before Phase */}
          {workoutPhase === 'aerobic-before' && workoutDay?.aerobic && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Cardio - {workoutDay.aerobic.type}</h2>
                <p className="text-muted-foreground">
                  {workoutDay.aerobic.duration} minutos • {workoutDay.aerobic.intensity}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comece com o cardio antes dos exercícios
                </p>
              </div>
              <AerobicTimer 
                duration={workoutDay.aerobic.duration}
                type={workoutDay.aerobic.type}
                onComplete={() => completeAerobic()}
                onCancel={() => completeAerobic()}
              />
            </div>
          )}

          {/* Main Exercises Phase */}
          {workoutPhase === 'exercises' && currentSession.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSetComplete={(setIndex, setData) => handleSetComplete(exercise.id, setIndex, setData)}
              onExerciseComplete={() => handleExerciseComplete(exercise.id)}
              onStartRest={(setIndex) => startRestTimer(90, 'rest-between-sets', exercise.id, setIndex)}
              isActive={nextExercise?.id === exercise.id}
            />
          ))}

          {/* Abdominal Exercises Phase */}
          {workoutPhase === 'abdominal' && hasAbdominals && workoutDay?.abdominal && (
            <div className="space-y-4 mt-8">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground mb-2">Exercícios Abdominais</h2>
                <p className="text-sm text-muted-foreground mb-4">Complete os exercícios abdominais para finalizar</p>
              </div>
              
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
              
              <Button 
                variant="success" 
                className="w-full" 
                onClick={handleCompleteAbdominals}
              >
                Concluir Abdominais ✅
              </Button>
            </div>
          )}

          {/* Aerobic After Phase */}
          {workoutPhase === 'aerobic-after' && workoutDay?.aerobic && (
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
                  onClick={() => setShowAerobicTimer(true)}
                >
                  Iniciar Cardio 🏃
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleSkipAerobic}
                >
                  Pular Cardio
                </Button>
              </div>
            </div>
          )}

          {/* Workout Finished */}
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

  // Statistics View
  if (currentView === 'statistics') {
    return <Statistics onBack={handleBackToHome} />;
  }

  // Management View
  if (currentView === 'management') {
    return <Management onBack={() => { 
      handleBackToHome(); 
      loadWorkouts(); // Recarrega os treinos quando volta da tela de gerenciamento
    }} />;
  }

  // Home View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-md mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Iron Tracker 💪
          </h1>
          <p className="text-muted-foreground">
            Seu progresso de treino nunca se perde
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-iron-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats?.averageTime || 0}min
              </div>
              <div className="text-sm text-muted-foreground">
                Média semanal
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

        {/* Today's Workout */}
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
                averageTime={stats?.averageTime}
              />
            )}
          </div>
        )}

        {/* Other Workouts */}
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
                onStartWorkout={() => handleViewWorkout(workoutDay.id)} // Usar handleViewWorkout aqui
                isToday={false} // Sempre false aqui para mostrar "Visualizar Treino"
                averageTime={stats?.averageTime}
              />
            ))}
          </div>
        </div>

        {/* Bottom Navigation - Always visible on home */}
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
