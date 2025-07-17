import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, TrendingUp, Award, Calendar, BarChart3 } from 'lucide-react';
import { storage } from '../utils/storage';
import { WorkoutSession, WorkoutStats } from '../types/workout';
import { calculatePersonalRecords, calculateWeeklyStats } from '../utils/workoutHelpers';

interface StatisticsProps {
  onBack: () => void;
}

export const Statistics: React.FC<StatisticsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
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
                Volume {selectedPeriod === 'week' ? 'semanal' : 'mensal'}
              </div>
            </CardContent>
          </Card>
        </div>

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
              Object.entries(personalRecords).slice(0, 5).map(([exercise, record]) => (
                <div key={exercise} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{exercise}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-iron-orange">
                      {record.weight}kg × {record.reps}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.date).toLocaleDateString('pt-BR')}
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

        {/* Recent Workouts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-iron-orange" />
              Treinos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.slice(0, 5).map((session) => (
              <div key={session.id} className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {new Date(session.date).toLocaleDateString('pt-BR', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.exercises.length} exercícios
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-iron-orange">
                    {session.totalVolume.toFixed(0)}kg
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {session.endTime ? Math.round((session.endTime - session.startTime) / 60000) : 0}min
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum treino realizado ainda.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};