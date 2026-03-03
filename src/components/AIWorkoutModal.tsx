import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { gerarTreinoIA } from '../utils/aiWorkoutGenerator';
import { WorkoutDay } from '../types/workout';
import { useToast } from '../hooks/use-toast';

interface AIWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkoutsGenerated: (workouts: WorkoutDay[]) => void;
}

const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export const AIWorkoutModal: React.FC<AIWorkoutModalProps> = ({
  open,
  onOpenChange,
  onWorkoutsGenerated,
}) => {
  const [idade, setIdade] = useState<number>(25);
  const [peso, setPeso] = useState<number>(75);
  const [objetivo, setObjetivo] = useState<string>('hipertrofia');
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([
    'Segunda-feira',
    'Quarta-feira',
    'Sexta-feira',
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleDia = (dia: string) => {
    setDiasSelecionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const handleGenerate = async () => {
    if (diasSelecionados.length === 0) {
      toast({
        title: 'Selecione ao menos um dia',
        description: 'Escolha os dias da semana para gerar o treino.',
        variant: 'destructive',
      });
      return;
    }

    if (!idade || idade < 10 || idade > 100) {
      toast({ title: 'Idade inválida', variant: 'destructive' });
      return;
    }

    if (!peso || peso < 30 || peso > 300) {
      toast({ title: 'Peso inválido', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const workouts = await gerarTreinoIA({ idade, peso, objetivo, diasSelecionados });
      onWorkoutsGenerated(workouts);
      onOpenChange(false);
      toast({
        title: '🎉 Treinos gerados com sucesso!',
        description: `${workouts.length} treino(s) criado(s) pela IA.`,
      });
    } catch (error) {
      console.error('AI generation failed:', error);
      toast({
        title: 'Erro ao gerar treino',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary" />
            Gerar Treino com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Idade */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-idade">Idade</Label>
            <Input
              id="ai-idade"
              type="number"
              min={10}
              max={100}
              value={idade}
              onChange={(e) => setIdade(Number(e.target.value))}
            />
          </div>

          {/* Peso */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-peso">Peso (kg)</Label>
            <Input
              id="ai-peso"
              type="number"
              min={30}
              max={300}
              value={peso}
              onChange={(e) => setPeso(Number(e.target.value))}
            />
          </div>

          {/* Objetivo */}
          <div className="space-y-1.5">
            <Label>Objetivo</Label>
            <Select value={objetivo} onValueChange={setObjetivo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                <SelectItem value="forca">Força</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dias da semana */}
          <div className="space-y-2">
            <Label>Dias da semana</Label>
            <div className="grid grid-cols-2 gap-2">
              {DIAS_SEMANA.map((dia) => (
                <label
                  key={dia}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={diasSelecionados.includes(dia)}
                    onCheckedChange={() => toggleDia(dia)}
                  />
                  <span className="text-sm">{dia.replace('-feira', '')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || diasSelecionados.length === 0}
            className="w-full h-12 text-base gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando treino...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Treino
              </>
            )}
          </Button>

          {loading && (
            <p className="text-xs text-center text-muted-foreground animate-pulse">
              A IA está montando seu treino personalizado. Isso pode levar alguns segundos...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
