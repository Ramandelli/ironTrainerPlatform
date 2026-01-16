import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { WorkoutDay } from '@/types/workout';
import { 
  Edit, 
  Trash2, 
  Copy, 
  Dumbbell,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkoutListCardProps {
  workout: WorkoutDay;
  isCustom: boolean;
  isPersonalized: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const WorkoutListCard: React.FC<WorkoutListCardProps> = ({
  workout,
  isCustom,
  isPersonalized,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  return (
    <Card 
      className={cn(
        "p-3 transition-all duration-200 active:scale-[0.98]",
        isCustom 
          ? "border-primary/40 bg-gradient-to-r from-card to-primary/5" 
          : "border-border bg-card"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Icon indicator */}
        <div 
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isCustom 
              ? "bg-primary/20" 
              : "bg-muted"
          )}
        >
          {isCustom ? (
            <Sparkles className="w-5 h-5 text-primary" />
          ) : (
            <FileText className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate text-sm">
              {workout.name}
            </h3>
            {isCustom && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 flex-shrink-0",
                  isPersonalized 
                    ? "bg-primary/20 text-primary border-primary/30" 
                    : "bg-accent/20 text-accent border-accent/30"
                )}
              >
                {isPersonalized ? 'Editado' : 'Novo'}
              </Badge>
            )}
          </div>
          
          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              {workout.exercises.length}
            </span>
            {workout.aerobic && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {workout.aerobic.duration}min
              </span>
            )}
            {workout.abdominal && workout.abdominal.length > 0 && (
              <span className="text-muted-foreground/70">
                +{workout.abdominal.length} abd
              </span>
            )}
          </div>

          {/* Exercise tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {workout.exercises.slice(0, 2).map((exercise) => (
              <Badge 
                key={exercise.id} 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 h-4 bg-muted/50 border-border/50"
              >
                {exercise.name.length > 15 ? exercise.name.slice(0, 15) + '...' : exercise.name}
              </Badge>
            ))}
            {workout.exercises.length > 2 && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 h-4 bg-muted/50 border-border/50"
              >
                +{workout.exercises.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons - more prominent for touch */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          className="flex-1 h-9 text-xs gap-1.5 bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-95 transition-all"
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex-1 h-9 text-xs gap-1.5 bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-95 transition-all"
        >
          <Edit className="w-3.5 h-3.5" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="h-9 px-3 text-xs gap-1.5 bg-muted/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 active:scale-95 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
};
