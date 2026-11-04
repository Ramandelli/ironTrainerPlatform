import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './ui/button';
import { CheckCircle, Trophy, Flame, Zap } from 'lucide-react';

interface WorkoutCompletionScreenProps {
  onFinish: () => void;
  workoutDuration: number;
  exercisesCompleted: number;
}

const MOTIVATIONAL_MESSAGES = [
  "Você é imparável! 💪",
  "Mais um passo rumo ao seu objetivo!",
  "Disciplina vence talento!",
  "Cada treino conta. Você provou isso!",
  "Guerreiro(a) do ferro! 🔥",
  "Superação é o seu nome!",
  "Você escolheu ser forte hoje!",
  "Vitória sobre si mesmo!",
  "Consistência constrói campeões!",
  "Seu eu do futuro agradece!"
];

export const WorkoutCompletionScreen: React.FC<WorkoutCompletionScreenProps> = ({
  onFinish,
  workoutDuration,
  exercisesCompleted
}) => {
  const [message] = useState(() => 
    MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
  );
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        },
        colors: ['#F97316', '#22C55E', '#3B82F6', '#EAB308', '#EC4899'],
        disableForReducedMotion: true
      });
    }, 250);

    // Vibrate on success
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }

    // Show content with slight delay for dramatic effect
    setTimeout(() => setShowContent(true), 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center space-y-6 py-8 animate-fade-in">
      {/* Success Icon with animation */}
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
        <div className="relative bg-gradient-to-br from-success to-success/80 rounded-full p-6 shadow-lg">
          <CheckCircle className="w-16 h-16 text-white" />
        </div>
      </div>

      {/* Main Title */}
      <div className={`space-y-2 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h2 className="text-3xl font-bold text-foreground">
          Treino Concluído!
        </h2>
        <p className="text-xl text-iron-orange font-semibold">
          {message}
        </p>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 gap-4 transition-all duration-500 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-center gap-2 text-iron-orange">
            <Flame className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{workoutDuration}min</div>
          <div className="text-sm text-muted-foreground">Duração</div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-center gap-2 text-iron-orange">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{exercisesCompleted}</div>
          <div className="text-sm text-muted-foreground">Exercícios</div>
        </div>
      </div>

      {/* Finish Button */}
      <div className={`transition-all duration-500 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Button 
          variant="success" 
          className="w-full h-14 text-lg font-semibold shadow-lg"
          onClick={onFinish}
        >
          <Trophy className="w-5 h-5 mr-2" />
          Finalizar e Salvar
        </Button>
      </div>
    </div>
  );
};
