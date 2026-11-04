import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Flame } from 'lucide-react';

interface WarmupCardProps {
  warmupDescription: string;
  onComplete: () => void;
}

export const WarmupCard: React.FC<WarmupCardProps> = ({
  warmupDescription,
  onComplete
}) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = () => {
    setIsCompleted(true);
    onComplete();
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Aquecimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {warmupDescription}
          </div>
          
          <Button
            onClick={handleComplete}
            disabled={isCompleted}
            className="w-full"
            variant={isCompleted ? "secondary" : "default"}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Aquecimento Concluído
              </>
            ) : (
              "Marcar Aquecimento como Concluído"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};