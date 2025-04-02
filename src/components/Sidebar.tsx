import { useState } from 'react';
import { LabelType } from '@/types';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Activity, Focus, Coffee, Paintbrush, 
  Calendar, Users, FileText, Clock, BarChart, Settings, Plus
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

const labelIcons: Record<LabelType, React.ReactNode> = {
  'lecture': <BookOpen size={18} />,
  'mouvement': <Activity size={18} />,
  'focus': <Focus size={18} />,
  'pause_mentale': <Coffee size={18} />,
  'créativité': <Paintbrush size={18} />,
  'routine': <Calendar size={18} />,
  'social': <Users size={18} />,
  'admin': <FileText size={18} />
};

const getLabelDisplayName = (label: LabelType): string => {
  const displayNames: Record<LabelType, string> = {
    'lecture': 'Lecture',
    'mouvement': 'Mouvement',
    'focus': 'Focus',
    'pause_mentale': 'Pause mentale',
    'créativité': 'Créativité',
    'routine': 'Routine',
    'social': 'Social',
    'admin': 'Admin'
  };
  return displayNames[label];
};

export function Sidebar() {
  const { 
    isHistoryView, 
    toggleHistoryView, 
    isSettingsOpen, 
    toggleSettingsView, 
    settings,
    updateSettings
  } = useAppStore();

  const labels: LabelType[] = [
    'lecture',
    'mouvement',
    'focus',
    'pause_mentale',
    'créativité',
    'routine',
    'social',
    'admin'
  ];

  const handleModelChange = (model: 'low' | 'medium' | 'high') => {
    updateSettings({ selectedAiModel: model });
  };

  return (
    <div className="w-full h-full flex flex-col bg-sidebar p-4 rounded-l-xl border-r">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">TDAH Companion</h2>
      </div>

      <div className="space-y-1 mb-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isHistoryView ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={toggleHistoryView}
              >
                {isHistoryView ? <Clock size={18} /> : <BarChart size={18} />}
                <span className="ml-2">{isHistoryView ? "Missions" : "Historique"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isHistoryView ? "Revenir aux missions" : "Voir l'historique et statistiques"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isSettingsOpen ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={toggleSettingsView}
              >
                <Settings size={18} />
                <span className="ml-2">Paramètres</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Configurer vos préférences</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground px-2">Catégories</h3>
        {labels.map((label) => (
          <Button
            key={label}
            variant="ghost"
            size="sm"
            className="justify-start"
          >
            {labelIcons[label]}
            <span className="ml-2">{getLabelDisplayName(label)}</span>
          </Button>
        ))}
      </div>

      <div className="mt-auto">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium text-muted-foreground px-2">Modèle IA</h3>
          <div className="grid grid-cols-3 gap-1">
            <Button 
              size="sm" 
              variant={settings.selectedAiModel === 'low' ? "default" : "outline"}
              className={cn(
                "text-xs",
                settings.selectedAiModel === 'low' ? "bg-primary" : "bg-background"
              )}
              onClick={() => handleModelChange('low')}
            >
              Léger
            </Button>
            <Button 
              size="sm" 
              variant={settings.selectedAiModel === 'medium' ? "default" : "outline"}
              className={cn(
                "text-xs",
                settings.selectedAiModel === 'medium' ? "bg-primary" : "bg-background"
              )}
              onClick={() => handleModelChange('medium')}
            >
              Moyen
            </Button>
            <Button 
              size="sm" 
              variant={settings.selectedAiModel === 'high' ? "default" : "outline"}
              className={cn(
                "text-xs",
                settings.selectedAiModel === 'high' ? "bg-primary" : "bg-background"
              )}
              onClick={() => handleModelChange('high')}
            >
              Avancé
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
