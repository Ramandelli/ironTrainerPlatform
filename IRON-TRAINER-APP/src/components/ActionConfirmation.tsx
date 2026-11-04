import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionConfirmationProps {
  type: 'duplicate' | 'import' | 'export';
  show: boolean;
  onComplete: () => void;
}

const iconMap = {
  duplicate: Copy,
  import: Upload,
  export: Download,
};

const labelMap = {
  duplicate: 'Duplicado!',
  import: 'Importado!',
  export: 'Exportado!',
};

const colorMap = {
  duplicate: 'bg-primary',
  import: 'bg-accent',
  export: 'bg-primary',
};

export const ActionConfirmation: React.FC<ActionConfirmationProps> = ({
  type,
  show,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const Icon = iconMap[type];

  useEffect(() => {
    if (show) {
      setVisible(true);
      setAnimating(true);
      
      const timer = setTimeout(() => {
        setAnimating(false);
        setTimeout(() => {
          setVisible(false);
          onComplete();
        }, 300);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={cn(
          "flex flex-col items-center gap-3 p-6 rounded-2xl shadow-2xl transition-all duration-300",
          colorMap[type],
          animating 
            ? "opacity-100 scale-100" 
            : "opacity-0 scale-90"
        )}
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center">
            <Check className="w-4 h-4 text-primary" />
          </div>
        </div>
        <span className="text-white font-semibold text-lg">{labelMap[type]}</span>
      </div>
    </div>
  );
};
