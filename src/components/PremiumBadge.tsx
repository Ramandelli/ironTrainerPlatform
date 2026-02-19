import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { usePremium } from '../contexts/PremiumContext';
import { Badge } from './ui/badge';

interface PremiumBadgeProps {
  feature: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ feature, size = 'sm', className = '' }) => {
  const { openPremiumModal } = usePremium();

  return (
    <Badge 
      variant="outline" 
      className={`cursor-pointer border-primary/40 text-primary hover:bg-primary/10 transition-colors ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        openPremiumModal(feature);
      }}
    >
      <Lock className={size === 'sm' ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1'} />
      Premium
    </Badge>
  );
};

interface PremiumBannerProps {
  feature: string;
  message?: string;
}

export const PremiumBanner: React.FC<PremiumBannerProps> = ({ feature, message }) => {
  const { openPremiumModal } = usePremium();

  return (
    <div 
      className="flex items-center justify-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
      onClick={() => openPremiumModal(feature)}
    >
      <Lock className="w-4 h-4 text-primary" />
      <span className="text-sm text-primary font-medium">
        {message || `${feature} disponível no Iron Trainer Premium`}
      </span>
    </div>
  );
};
