import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { WorkoutCard } from '../components/WorkoutCard';
import { ExerciseCard } from '../components/ExerciseCard';
import { Timer } from '../components/Timer';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { storage } from '../utils/storage';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { getTodayWorkoutId, calculateWorkoutTime, getNextExercise } from '../utils/workoutHelpers';
import { Clock, TrendingUp, Calendar, Dumbbell, BarChart3, X } from 'lucide-react';
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
    cancelWorkout
  } = useWorkoutSession();

  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'workout'>('home');

  useEffect(() => {
    loadStats();
  }, []);

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
  const todayWorkout = WORKOUT_PLAN.find(day => day.id === todayWorkoutId);
  const isRestDay = !todayWorkout;

  const handleStartWorkout = (workoutDayId: string) => {
    startWorkout(workoutDayId);
    setCurrentView('workout');
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
  };

  const handleCancelWorkout = () => {
    cancelWorkout();
    setCurrentView('home');
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

  // Workout View
  if (currentView === 'workout' && currentSession) {
    const workoutDay = WORKOUT_PLAN.find(day => day.id === currentSession.workoutDayId);
    const currentTime = calculateWorkoutTime(currentSession.startTime);
    const completedExercises = currentSession.exercises.filter(e => e.completed).length;
    const nextExercise = getNextExercise(currentSession.exercises);

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

        {/* Exercise List */}
        <div className="max-w-md mx-auto p-4 space-y-4 pb-24">
          {currentSession.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSetComplete={(setIndex, setData) => handleSetComplete(exercise.id, setIndex, setData)}
              onExerciseComplete={() => handleExerciseComplete(exercise.id)}
              onStartRest={(setIndex) => startRestTimer(90, 'rest-between-sets', exercise.id, setIndex)}
              isActive={nextExercise?.id === exercise.id}
            />
          ))}
        </div>

        {/* Finish Workout Button */}
        {completedExercises === currentSession.exercises.length && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border">
            <div className="max-w-md mx-auto">
              <Button variant="success" className="w-full" onClick={handleFinishWorkout}>
                Finalizar Treino 🎉
              </Button>
            </div>
          </div>
        )}
      </div>
    );
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Dia de Descanso</h3>
              <p className="text-muted-foreground">
                Aproveite para recuperar as energias!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-iron-orange" />
              Treino de Hoje
            </h2>
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
            {WORKOUT_PLAN.map((workoutDay) => (
              <WorkoutCard
                key={workoutDay.id}
                workoutDay={workoutDay}
                onStartWorkout={() => handleStartWorkout(workoutDay.id)}
                isToday={workoutDay.id === todayWorkoutId}
                averageTime={stats?.averageTime}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
