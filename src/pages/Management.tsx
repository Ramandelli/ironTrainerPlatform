import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { WorkoutForm } from '../components/WorkoutForm';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { useToast } from '../hooks/use-toast';
import { customWorkoutManager } from '../utils/customWorkouts';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { WorkoutDay } from '../types/workout';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Upload,
  Dumbbell,
  Clock,
  Calendar
} from 'lucide-react';

interface ManagementProps {
  onBack: () => void;
}

export const Management: React.FC<ManagementProps> = ({ onBack }) => {
  const [allWorkouts, setAllWorkouts] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDay | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkoutDay | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const workouts = await customWorkoutManager.getAllWorkouts(WORKOUT_PLAN);
      setAllWorkouts(workouts);
    } catch (error) {
      console.error('Failed to load workouts:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os treinos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkout = () => {
    setEditingWorkout(null);
    setShowWorkoutForm(true);
  };

  const handleEditWorkout = async (workout: WorkoutDay) => {
    try {
      let workoutToEdit = workout;
      
      // If it's a default workout, convert it to custom first
      if (!customWorkoutManager.isCustomWorkout(workout.id)) {
        workoutToEdit = await customWorkoutManager.convertToCustomWorkout(workout);
        await loadWorkouts(); // Refresh the list
        
        toast({
          title: "Treino convertido",
          description: "O treino foi convertido para personalizado e agora pode ser editado.",
        });
      }
      
      setEditingWorkout(workoutToEdit);
      setShowWorkoutForm(true);
    } catch (error) {
      console.error('Failed to prepare workout for editing:', error);
      toast({
        title: "Erro",
        description: "Não foi possível preparar o treino para edição.",
        variant: "destructive"
      });
    }
  };

  const handleSaveWorkout = async (workoutData: Omit<WorkoutDay, 'id'> & { id?: string }) => {
    try {
      const workout: WorkoutDay = {
        ...workoutData,
        id: workoutData.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await customWorkoutManager.saveWorkout(workout);
      await loadWorkouts();
      setShowWorkoutForm(false);
      setEditingWorkout(null);
      
      toast({
        title: editingWorkout ? "Treino atualizado!" : "Treino criado!",
        description: `${workout.name} foi ${editingWorkout ? 'atualizado' : 'criado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Failed to save workout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o treino.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteWorkout = async (workout: WorkoutDay) => {
    try {
      await customWorkoutManager.deleteWorkout(workout.id);
      await loadWorkouts();
      setDeleteConfirm(null);
      
      toast({
        title: "Treino excluído!",
        description: `${workout.name} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treino.",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateWorkout = async (workout: WorkoutDay) => {
    try {
      const duplicatedWorkout = await customWorkoutManager.duplicateWorkout(workout);
      await loadWorkouts();
      
      toast({
        title: "Treino duplicado!",
        description: `${duplicatedWorkout.name} foi criado com sucesso.`,
      });
    } catch (error) {
      console.error('Failed to duplicate workout:', error);
    }
  };

  if (showWorkoutForm) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <WorkoutForm
            workout={editingWorkout || undefined}
            onSave={handleSaveWorkout}
            onCancel={() => {
              setShowWorkoutForm(false);
              setEditingWorkout(null);
            }}
          />
        </div>
      </div>
    );
  }

  const filteredWorkouts = allWorkouts.filter(workout =>
    workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workout.day.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Gerenciar Treinos</h1>
              <p className="text-sm text-muted-foreground">
                Crie, edite e organize seus treinos
              </p>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Buscar treinos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreateWorkout} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando treinos...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorkouts.map((workout) => (
              <Card key={workout.id} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2 mb-1">
                        {workout.name}
                        {customWorkoutManager.isCustomWorkout(workout.id) && (
                          <Badge variant="secondary" className="text-xs">
                            {customWorkoutManager.getBaseWorkoutId(workout.id) ? 'Personalizado' : 'Customizado'}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {workout.day}
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          {workout.exercises.length} exercícios
                        </span>
                        {workout.aerobic && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {workout.aerobic.duration}min cardio
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateWorkout(workout)}
                        title="Duplicar treino"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditWorkout(workout)}
                        title="Editar treino"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(workout)}
                        title="Excluir treino"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {workout.exercises.slice(0, 3).map((exercise) => (
                      <Badge key={exercise.id} variant="outline" className="text-xs">
                        {exercise.name}
                      </Badge>
                    ))}
                    {workout.exercises.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{workout.exercises.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          open={true}
          onOpenChange={() => setDeleteConfirm(null)}
          title="Excluir Treino"
          description={`Tem certeza que deseja excluir "${deleteConfirm.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => handleDeleteWorkout(deleteConfirm)}
        />
      )}
    </div>
  );
};