import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { WorkoutForm } from '../components/WorkoutForm';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { ImportExportGuide } from '../components/ImportExportGuide';
import { WorkoutListCard } from '../components/WorkoutListCard';
import { ActionConfirmation } from '../components/ActionConfirmation';
import { useToast } from '../hooks/use-toast';
import { customWorkoutManager } from '../utils/customWorkouts';
import { WORKOUT_PLAN } from '../data/workoutPlan';
import { WorkoutDay } from '../types/workout';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { 
  ArrowLeft, 
  Plus, 
  Download, 
  Upload,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';

interface ManagementProps {
  onBack: () => void;
}

// Day order for grouping
const DAY_ORDER = [
  'Segunda-feira',
  'Terça-feira', 
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

export const Management: React.FC<ManagementProps> = ({ onBack }) => {
  const [allWorkouts, setAllWorkouts] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDay | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WorkoutDay | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByDay, setGroupByDay] = useState(true);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [actionConfirmation, setActionConfirmation] = useState<{
    type: 'duplicate' | 'import' | 'export';
    show: boolean;
  } | null>(null);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      
     
      if (!customWorkoutManager.isCustomWorkout(workout.id)) {
        workoutToEdit = await customWorkoutManager.convertToCustomWorkout(workout);
        await loadWorkouts(); 
        
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
      id: workoutData.id || getWorkoutId(workoutData.day) 
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

// Função auxiliar para gerar ID
const getWorkoutId = (day: string) => {
  const dayMap: Record<string, string> = {
    'Segunda-feira': 'monday',
    'Terça-feira': 'tuesday',
    'Quarta-feira': 'wednesday',
    'Quinta-feira': 'thursday',
    'Sexta-feira': 'friday',
    'Sábado': 'saturday',
    'Domingo': 'sunday'
  };
  
  const baseId = dayMap[day] || day.toLowerCase();
  return `custom_${baseId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      
      setActionConfirmation({ type: 'duplicate', show: true });
      
      toast({
        title: "Treino duplicado!",
        description: `${duplicatedWorkout.name} foi criado com sucesso.`,
      });
    } catch (error) {
      console.error('Failed to duplicate workout:', error);
    }
  };

  
  const handleExportWorkouts = async () => {
    try {
      const jsonData = await customWorkoutManager.exportWorkouts();
      const fileName = `treinos_${new Date().toISOString().split('T')[0]}.json`;
      
      // Check if running on native mobile platform
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Filesystem API for mobile
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonData,
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        
        // Share the file
        await Share.share({
          title: 'Exportar Treinos',
          text: 'Arquivo de treinos exportado',
          url: result.uri,
          dialogTitle: 'Compartilhar arquivo de treinos'
        });
        
        toast({
          title: "Sucesso",
          description: "Treinos exportados! Escolha onde salvar o arquivo.",
        });
        
        setActionConfirmation({ type: 'export', show: true });
      } else {
        // Web platform - use traditional blob download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Sucesso",
          description: "Treinos exportados com sucesso!",
        });
        
        setActionConfirmation({ type: 'export', show: true });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Erro",
        description: "Falha ao exportar treinos. Detalhes: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  
  const handleImportWorkouts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        await customWorkoutManager.importWorkouts(jsonData);
        await loadWorkouts(); 
        
        toast({
          title: "Sucesso",
          description: "Treinos importados com sucesso!",
        });
        
        setActionConfirmation({ type: 'import', show: true });
      } catch (error) {
        console.error('Import failed:', error);
        toast({
          title: "Erro",
          description: "Falha ao importar treinos. Verifique se o arquivo está correto.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleDayCollapse = useCallback((day: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }, []);

  const clearActionConfirmation = useCallback(() => {
    setActionConfirmation(null);
  }, []);

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

          {/* Search bar with icon */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar treinos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Action buttons - stacked on mobile for better touch */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button 
                onClick={handleExportWorkouts} 
                size="sm" 
                variant="outline"
                className="flex-1 sm:flex-none h-10 active:scale-95 transition-transform"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                size="sm" 
                variant="outline"
                className="flex-1 sm:flex-none h-10 active:scale-95 transition-transform"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
            </div>
            <Button 
              onClick={handleCreateWorkout} 
              size="sm"
              className="h-10 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Treino
            </Button>
          </div>

          {/* Group by day toggle */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="group-by-day" className="text-sm text-muted-foreground">
                Agrupar por dia
              </Label>
            </div>
            <Switch
              id="group-by-day"
              checked={groupByDay}
              onCheckedChange={setGroupByDay}
            />
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportWorkouts}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Import/Export Guide */}
        <ImportExportGuide />

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando treinos...</p>
          </div>
        ) : groupByDay ? (
          // Grouped by day view
          <div className="space-y-4">
            {DAY_ORDER.map(day => {
              const dayWorkouts = filteredWorkouts.filter(w => w.day === day);
              if (dayWorkouts.length === 0) return null;
              
              const isCollapsed = collapsedDays.has(day);
              
              return (
                <div key={day} className="space-y-2">
                  {/* Day header */}
                  <button
                    onClick={() => toggleDayCollapse(day)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{day}</span>
                      <span className="text-xs text-muted-foreground">
                        ({dayWorkouts.length} {dayWorkouts.length === 1 ? 'treino' : 'treinos'})
                      </span>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {/* Day workouts */}
                  {!isCollapsed && (
                    <div className="space-y-2 pl-2">
                      {dayWorkouts.map((workout) => (
                        <WorkoutListCard
                          key={workout.id}
                          workout={workout}
                          isCustom={customWorkoutManager.isCustomWorkout(workout.id)}
                          isPersonalized={!!customWorkoutManager.getBaseWorkoutId(workout.id)}
                          onEdit={() => handleEditWorkout(workout)}
                          onDuplicate={() => handleDuplicateWorkout(workout)}
                          onDelete={() => setDeleteConfirm(workout)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Workouts without standard day */}
            {(() => {
              const otherWorkouts = filteredWorkouts.filter(w => !DAY_ORDER.includes(w.day));
              if (otherWorkouts.length === 0) return null;
              
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Outros</span>
                    <span className="text-xs text-muted-foreground">
                      ({otherWorkouts.length})
                    </span>
                  </div>
                  <div className="space-y-2 pl-2">
                    {otherWorkouts.map((workout) => (
                      <WorkoutListCard
                        key={workout.id}
                        workout={workout}
                        isCustom={customWorkoutManager.isCustomWorkout(workout.id)}
                        isPersonalized={!!customWorkoutManager.getBaseWorkoutId(workout.id)}
                        onEdit={() => handleEditWorkout(workout)}
                        onDuplicate={() => handleDuplicateWorkout(workout)}
                        onDelete={() => setDeleteConfirm(workout)}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          // Flat list view
          <div className="space-y-2">
            {filteredWorkouts.map((workout) => (
              <WorkoutListCard
                key={workout.id}
                workout={workout}
                isCustom={customWorkoutManager.isCustomWorkout(workout.id)}
                isPersonalized={!!customWorkoutManager.getBaseWorkoutId(workout.id)}
                onEdit={() => handleEditWorkout(workout)}
                onDuplicate={() => handleDuplicateWorkout(workout)}
                onDelete={() => setDeleteConfirm(workout)}
              />
            ))}
          </div>
        )}

        {filteredWorkouts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum treino encontrado</p>
          </div>
        )}
      </div>

      {/* Action Confirmation */}
      {actionConfirmation && (
        <ActionConfirmation
          type={actionConfirmation.type}
          show={actionConfirmation.show}
          onComplete={clearActionConfirmation}
        />
      )}

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