import { useState, useEffect } from 'react';
import { Mission, LabelType } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { 
  BookOpen, Activity, Focus, Coffee, Paintbrush, 
  Calendar, Users, FileText, Play, Pause, X, Check, Wallet
} from 'lucide-react';

interface MissionCardProps {
  mission: Mission;
  onComplete: () => void;
  onRefuse: () => void;
  onStart: () => void;
}

export function MissionCard({ mission, onComplete, onRefuse, onStart }: MissionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(mission.duration_minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Réinitialiser le timer si la mission change
  useEffect(() => {
    setTimeRemaining(mission.duration_minutes * 60);
    setProgress(0);
    setIsRunning(false);
  }, [mission.id]);

  // Gérer le timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          setProgress(100 - (newTime / (mission.duration_minutes * 60) * 100));
          return newTime;
        });
      }, 1000);
    } else if (timeRemaining === 0) {
      onComplete();
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeRemaining]);

  const toggleTimer = () => {
    if (!isRunning) {
      onStart(); // Call onStart only when starting, not when pausing
    }
    setIsRunning(!isRunning);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getLabelIcon = (label: LabelType) => {
    const icons: Record<LabelType, React.ReactNode> = {
      'lecture': <BookOpen size={16} />,
      'mouvement': <Activity size={16} />,
      'focus': <Focus size={16} />,
      'pause_mentale': <Coffee size={16} />,
      'créativité': <Paintbrush size={16} />,
      'routine': <Calendar size={16} />,
      'social': <Users size={16} />,
      'admin': <FileText size={16} />
    };
    return icons[label];
  };

  const getLabelClass = (label: LabelType) => {
    const classes: Record<LabelType, string> = {
      'lecture': 'label-badge-lecture',
      'mouvement': 'label-badge-mouvement',
      'focus': 'label-badge-focus',
      'pause_mentale': 'label-badge-pause_mentale',
      'créativité': 'bg-tdah-lilac text-purple-700',
      'routine': 'bg-blue-100 text-blue-700',
      'social': 'bg-pink-100 text-pink-700',
      'admin': 'bg-gray-100 text-gray-700'
    };
    return classes[label] || 'label-badge-default';
  };

  return (
    <div className="mission-card animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("label-badge", getLabelClass(mission.label))}>
          {getLabelIcon(mission.label)}
          <span className="ml-1 capitalize">
            {mission.label.replace('_', ' ')}
          </span>
        </div>
        <div className="text-sm font-medium">
          {mission.duration_minutes} min
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{mission.title}</h3>
      
      {mission.description && (
        <p className="text-muted-foreground mb-4">{mission.description}</p>
      )}
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Progrès</span>
          <span className="text-sm">{formatTime(timeRemaining)}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {mission.reward_amount && (
        <div className="flex items-center gap-1 mb-3 text-green-600">
          <Wallet size={14} />
          <span className="text-sm">Récompense: +{mission.reward_amount.toFixed(2)}€</span>
        </div>
      )}
      
      {mission.essential && (
        <div className="mb-3 text-sm font-medium text-orange-500">
          Mission essentielle
          {mission.penalty_amount && (
            <span className="ml-2 text-red-500">
              (Pénalité si non accomplie: -{mission.penalty_amount.toFixed(2)}€)
            </span>
          )}
        </div>
      )}
      
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
          onClick={onRefuse}
        >
          <X size={16} className="mr-1" />
          Refuser
        </Button>
        
        <Button
          variant={isRunning ? "secondary" : "default"}
          size="sm" 
          className="flex-1"
          onClick={toggleTimer}
        >
          {isRunning ? (
            <>
              <Pause size={16} className="mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play size={16} className="mr-1" />
              {timeRemaining < mission.duration_minutes * 60 ? 'Reprendre' : 'Démarrer'}
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
          onClick={onComplete}
        >
          <Check size={16} className="mr-1" />
          Terminé
        </Button>
      </div>
    </div>
  );
}
