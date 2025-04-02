import { Button } from '@/components/ui/button';
import { Brain, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';

interface EmptyStateProps {
  onGenerateMission: () => void;
}

export function EmptyState({ onGenerateMission }: EmptyStateProps) {
  const { settings } = useAppStore();
  
  const handleGenerateMission = () => {
    const apiKey = localStorage.getItem('openrouter-api-key');
    
    if (!apiKey) {
      toast.error('Veuillez configurer votre clé API dans les paramètres');
      return;
    }
    
    onGenerateMission();
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="relative mb-8">
        <Brain size={64} className="text-primary animate-pulse-gentle" />
        <Sparkles size={24} className="absolute -top-2 -right-2 text-accent animate-float" />
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Prêt pour une mission ?</h2>
      
      <p className="text-center text-muted-foreground mb-8 max-w-md">
        Votre compagnon TDAH vous proposera des micro-missions adaptées à votre rythme et vos préférences.
      </p>
      
      <Button onClick={handleGenerateMission} size="lg" className="group">
        <Sparkles size={18} className="mr-2 group-hover:animate-float" />
        Générer une mission
      </Button>
      
      <p className="text-xs text-muted-foreground mt-8 max-w-xs text-center">
        Plage active : {settings.activeTimeStart} - {settings.activeTimeEnd}
        <br />
        Budget quotidien : {settings.dailyBudgetMinutes} minutes
      </p>
    </div>
  );
}
