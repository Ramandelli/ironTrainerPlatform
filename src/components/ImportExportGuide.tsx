import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Download, Upload, Users, Zap } from 'lucide-react';

export const ImportExportGuide: React.FC = () => {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Users className="w-5 h-5" />
          Compartilhamento de Treinos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Para Treinadores</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Exportar" para gerar um arquivo JSON com todos os treinos personalizados. 
                Envie este arquivo para seus alunos.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Para Alunos</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Importar" e selecione o arquivo JSON recebido do seu treinador. 
                Os treinos serão automaticamente adicionados ao seu app.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Funciona Perfeitamente</h4>
              <p className="text-sm text-muted-foreground">
                Todos os exercícios, séries, pesos, tempos de descanso e configurações 
                serão preservados durante a transferência.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> O arquivo exportado contém apenas treinos personalizados/customizados. 
            Os treinos padrão do sistema não são incluídos na exportação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};