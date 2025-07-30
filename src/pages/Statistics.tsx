import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { ArrowLeft, TrendingUp, Award, Calendar, BarChart3, Activity, Clock, Target, Flame, RotateCcw, Trash2 } from 'lucide-react';
import { storage } from '../utils/storage';
import { WorkoutSession, WorkoutStats } from '../types/workout';
import { calculatePersonalRecords, calculateWeeklyStats } from '../utils/workoutHelpers';
import { useToast } from '../hooks/use-toast';

interface StatisticsProps {
  onBack: () => void;
}

export const Statistics: React.FC<StatisticsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { toast } = useToast();

  useEffect(() => {
     const loadData = async () => {
    try {
      // Limpar sessões inválidas antes de carregar
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

  const periodStats = React.useMemo(() => {
    if (selectedPeriod === 'all') {
      return calculateWeeklyStats(history);
    }
    
    const daysBack = selectedPeriod === 'week' ? 7 : 30;
    const periodStart = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    const periodHistory = history.filter(session => session.startTime >= periodStart);
    
    return calculateWeeklyStats(periodHistory);
  }, [history, selectedPeriod]);

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
              set.weight
            );
            exerciseData[exercise.name].totalVolume += set.weight * set.reps;
          }
        });
      });
    });
    
    return Object.entries(exerciseData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);
  }, [history]);

  // Cardio statistics
  const cardioStats = React.useMemo(() => {
    const calculateCardioTime = (sessions: WorkoutSession[]) => {
      let esteiraTotalTime = 0;
      let bicicletaTotalTime = 0;
      
      sessions.forEach(session => {
        if (session.aerobic && session.aerobic.completed) {
          // Por enquanto usa o tempo planejado, mas futuramente podemos adicionar
          // um campo "actualDuration" no aerobic para registrar o tempo real
          const timeSpent = session.aerobic.duration;
            
          if (session.aerobic.type === 'esteira') {
            esteiraTotalTime += timeSpent;
          } else if (session.aerobic.type === 'bicicleta') {
            bicicletaTotalTime += timeSpent;
          }
        }
      });
      
      return { esteiraTotalTime, bicicletaTotalTime };
    };
    
    if (selectedPeriod === 'all') {
      return calculateCardioTime(history);
    }
    
    const daysBack = selectedPeriod === 'week' ? 7 : 30;
    const periodStart = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    const periodHistory = history.filter(session => session.startTime >= periodStart);
    
    return calculateCardioTime(periodHistory);
  }, [history, selectedPeriod]);

  // Advanced statistics
  const advancedStats = React.useMemo(() => {
    if (history.length === 0) {
      return {
        averageWorkoutTime: 0,
        totalSets: 0,
        totalReps: 0,
        streak: 0,
        mostFrequentExercise: '',
        averageRestTime: 0,
        workoutDistribution: {}
      };
    }

    // Average workout time
    const completedWorkouts = history.filter(w => w.endTime);
    const averageWorkoutTime = completedWorkouts.length > 0 
      ? completedWorkouts.reduce((sum, w) => sum + (w.endTime! - w.startTime), 0) / completedWorkouts.length / 60000
      : 0;

    // Total sets and reps
    let totalSets = 0;
    let totalReps = 0;
    const exerciseFrequency: Record<string, number> = {};

    history.forEach(session => {
      session.exercises.forEach(exercise => {
        exerciseFrequency[exercise.name] = (exerciseFrequency[exercise.name] || 0) + 1;
        totalSets += exercise.setData.filter(set => set.completed).length;
        totalReps += exercise.setData.filter(set => set.completed).reduce((sum, set) => sum + set.reps, 0);
      });
    });

    // Most frequent exercise
    const mostFrequentExercise = Object.entries(exerciseFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // Current streak (consecutive days with workouts)
    const workoutDates = [...new Set(history.map(w => new Date(w.date).toDateString()))].sort();
    let streak = 0;
    const today = new Date();
    
    for (let i = workoutDates.length - 1; i >= 0; i--) {
      const workoutDate = new Date(workoutDates[i]);
      const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
        streak++;
      } else {
        break;
      }
    }

    // Workout type distribution
const workoutDistribution: Record<string, number> = {};
  history.forEach(session => {
    try {
      // Converter a data ISO para objeto Date
      const [year, month, day] = session.date.split('-');
      const sessionDate = new Date(
        parseInt(year),
        parseInt(month) - 1, // Mês começa em 0 no JavaScript
        parseInt(day)
      );
      
      // Obter o dia da semana (0=domingo, 1=segunda, etc)
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
      streak,
      mostFrequentExercise,
      workoutDistribution
    };
  }, [history]);

  const handleResetData = async () => {
    try {
      await storage.resetAllData();
      setStats(null);
      setHistory([]);
      toast({
        title: "Dados resetados",
        description: "Todo o histórico de treinos foi removido com sucesso.",
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
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            Última Semana
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            Último Mês
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
                {stats?.totalWorkouts || 0}
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
                {periodStats.weeklyVolume.toFixed(0)}kg
              </div>
              <div className="text-sm text-muted-foreground">
                Volume {selectedPeriod === 'week' ? 'semanal' : selectedPeriod === 'month' ? 'mensal' : 'total'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="w-5 h-5 text-iron-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {advancedStats.streak}
              </div>
              <div className="text-sm text-muted-foreground">
                Sequência (dias)
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
                {history.reduce((total, session) => total + session.totalVolume, 0).toFixed(0)}kg
              </div>
              <div className="text-xs text-muted-foreground">
                Total de peso
              </div>
            </CardContent>
          </Card>
        </div>

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
                  {cardioStats.esteiraTotalTime}min
                </div>
                <div className="text-sm text-muted-foreground">
                  Esteira {selectedPeriod === 'week' ? '(semana)' : selectedPeriod === 'month' ? '(mês)' : '(total)'}
                </div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold text-foreground">
                  {cardioStats.bicicletaTotalTime}min
                </div>
                <div className="text-sm text-muted-foreground">
                  Bicicleta {selectedPeriod === 'week' ? '(semana)' : selectedPeriod === 'month' ? '(mês)' : '(total)'}
                </div>
              </div>
            </div>
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-xl font-bold text-primary">
                {cardioStats.esteiraTotalTime + cardioStats.bicicletaTotalTime}min
              </div>
              <div className="text-sm text-muted-foreground">
                Total de Cardio {selectedPeriod === 'week' ? '(semana)' : selectedPeriod === 'month' ? '(mês)' : '(geral)'}
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
  {Object.entries(personalRecords)
  .sort((a, b) => b[1].weight - a[1].weight)
  .slice(0, 5)
  .map(([exercise, record]) => {
    // Corrigir a formatação da data
    const [day, month, year] = record.date.split('/');
    const formattedDate = `${day}/${month}/${year}`;
    
    return (
      <div key={exercise} className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">{exercise}</span>
        <div className="text-right">
          <div className="text-sm font-bold text-iron-orange">
            {record.weight}kg × {record.reps}
          </div>
          <div className="text-xs text-muted-foreground">
            {formattedDate}
          </div>
        </div>
      </div>
    );
  })
}
  ) : (
    <p className="text-center text-muted-foreground py-4">
      Complete alguns treinos para ver seus recordes!
    </p>
  )
</CardContent>
        </Card>

        {/* Exercise Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-iron-orange" />
              Top 5 Exercícios por Volume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exerciseProgress.length > 0 ? (
              exerciseProgress.map((exercise, index) => (
                <div key={exercise.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="w-6 h-6 p-0 text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{exercise.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-iron-orange">
                      {exercise.totalVolume.toFixed(0)}kg
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {exercise.sessions} sessões • {exercise.maxWeight}kg máx
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Complete alguns treinos para ver o progresso!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Workout Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-iron-orange" />
              Distribuição Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(advancedStats.workoutDistribution).length > 0 ? (
              Object.entries(advancedStats.workoutDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([day, count]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground capitalize">{day}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-muted rounded-full w-20 overflow-hidden">
                        <div 
                          className="h-full bg-iron-orange rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.max(10, (count / Math.max(...Object.values(advancedStats.workoutDistribution))) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-iron-orange w-6 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Complete alguns treinos para ver a distribuição!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-iron-orange" />
              Treinos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
  {history.slice(0, 5).map((session) => {
    // Corrigir a formatação da data
    const [day, month, year] = session.date.split('/');
    const formattedDate = new Date(`${year}-${month}-${day}`);
    
    const workoutDate = formattedDate.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
              const workoutTime = session.endTime 
      ? Math.round((session.endTime - session.startTime) / 60000)
      : 0;
              
              return (
      <div key={session.id} className="space-y-2 p-3 border border-border rounded-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">
              {workoutDate} - {/* Data formatada corretamente */}
              {session.exercises[0]?.name ? 
                `${session.exercises[0].name.split(' ')[0]} e mais ${session.exercises.length - 1}` : 
                `${session.exercises.length} exercícios`}
            </div>
            <div className="text-xs text-muted-foreground">
              Tempo: {workoutTime}min • Volume: {session.totalVolume.toFixed(0)}kg
            </div>
          </div>
        </div>
      </div>
    );
  })}
</CardContent>

        </Card>

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