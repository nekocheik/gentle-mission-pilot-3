import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Sidebar } from '@/components/Sidebar';
import { MissionCard } from '@/components/MissionCard';
import { FeedbackForm } from '@/components/FeedbackForm';
import { EmptyState } from '@/components/EmptyState';
import { HistoryView } from '@/components/HistoryView';
import { SettingsForm } from '@/components/SettingsForm';
import { ChatMission } from '@/components/ChatMission';
import { CalendarView } from '@/components/CalendarView';
import { TransactionHistory } from '@/components/TransactionHistory';
import { Mission, LabelType } from '@/types';
import AiService from '@/services/aiService';
import { Loader2, MessageSquare, Calendar, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    missions,
    activeMission,
    setActiveMission,
    updateMissionStatus,
    addMission,
    isHistoryView,
    isSettingsOpen,
    isChatOpen,
    toggleChatView,
    toggleHistoryView,
    toggleSettingsView,
    settings,
    getMissionsByLabel,
    fetchMissions,
    userPoints
  } = useAppStore();
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiService, setAiService] = useState<AiService | null>(null);
  const [completedMission, setCompletedMission] = useState<Mission | null>(null);
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [isWalletView, setIsWalletView] = useState(false);
  const [nextMissionTime, setNextMissionTime] = useState<Date | null>(null);
  
  useEffect(() => {
    const apiKey = localStorage.getItem('openrouter-api-key') || '';
    const service = new AiService({
      apiKey,
      model: settings.selectedAiModel
    });
    setAiService(service);
  }, [settings.selectedAiModel]);
  
  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);
  
  useEffect(() => {
    if (aiService) {
      aiService.setModel(settings.selectedAiModel);
    }
  }, [settings.selectedAiModel, aiService]);
  
  const playSound = (type: 'notification' | 'completion' | 'start') => {
    if (settings.soundEnabled) {
      const soundMap = {
        notification: settings.selectedSounds?.notification || '/notification.mp3',
        completion: settings.selectedSounds?.completion || '/notification.mp3',
        start: settings.selectedSounds?.start || '/notification.mp3'
      };
      
      const sound = new Audio(soundMap[type]);
      sound.volume = 0.5;
      sound.play().catch(e => console.error('Error playing sound:', e));
    }
  };
  
  const generateMission = async () => {
    if (!aiService) {
      toast.error('Service IA non disponible');
      return;
    }
    
    const apiKey = localStorage.getItem('openrouter-api-key');
    if (!apiKey) {
      toast.error('Veuillez configurer votre clé API dans les paramètres');
      return;
    }
    
    // Vérifier s'il est temps de générer une nouvelle mission
    if (nextMissionTime && new Date() < nextMissionTime) {
      const timeLeft = Math.ceil((nextMissionTime.getTime() - new Date().getTime()) / 60000);
      
      if (timeLeft <= settings.restTimeShort) {
        toast.info(`Courte pause: temps de repos de ${timeLeft} minutes avant la prochaine mission`);
      } else {
        toast.info(`Temps de repos: ${timeLeft} minutes avant la prochaine mission`);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      const labelCategories: LabelType[] = [
        'lecture', 'mouvement', 'focus', 'pause_mentale', 
        'créativité', 'routine', 'social', 'admin'
      ];
      
      const missionsByLabel: Record<LabelType, Mission[]> = {} as any;
      
      for (const label of labelCategories) {
        missionsByLabel[label] = await getMissionsByLabel(label);
      }
      
      const missionData = await aiService.generateNextMission(
        missions.slice(-5),
        missionsByLabel,
        {
          activeTimeStart: settings.activeTimeStart,
          activeTimeEnd: settings.activeTimeEnd,
          dailyBudgetMinutes: settings.dailyBudgetMinutes
        }
      );
      
      if (!missionData) {
        throw new Error('Échec de la génération de mission');
      }
      
      const newMission = await addMission(missionData);
      
      if (newMission) {
        setActiveMission(newMission);
        await updateMissionStatus(newMission.id, 'active');
        
        playSound('notification');
      }
      
    } catch (error) {
      console.error('Error generating mission:', error);
      toast.error('Erreur lors de la génération de la mission');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMissionComplete = async () => {
    if (activeMission) {
      await updateMissionStatus(activeMission.id, 'completed', new Date().toISOString());
      setCompletedMission(activeMission);
      setActiveMission(null);
      setShowFeedback(true);
      playSound('completion');
      
      // Calculer le temps pour la prochaine mission
      const restTime = Math.random() > 0.5 ? settings.restTimeLong : settings.restTimeShort;
      const nextTime = new Date();
      nextTime.setMinutes(nextTime.getMinutes() + restTime);
      setNextMissionTime(nextTime);
      
      // Notifier l'utilisateur du temps de repos
      if (restTime <= settings.restTimeShort) {
        toast.info(`Courte pause de ${restTime} minutes avant la prochaine mission`);
      } else {
        toast.info(`Longue pause de ${restTime} minutes avant la prochaine mission`);
      }
    }
  };
  
  const handleMissionStart = () => {
    playSound('start');
  };
  
  const handleMissionRefuse = async () => {
    if (activeMission) {
      await updateMissionStatus(activeMission.id, 'refused');
      setActiveMission(null);
    }
  };
  
  const handleFeedbackSubmit = () => {
    setShowFeedback(false);
    setCompletedMission(null);
    toast.success('Feedback enregistré, merci !');
  };
  
  const toggleCalendarView = () => {
    setIsCalendarView(!isCalendarView);
    setIsWalletView(false);
    toggleHistoryView(false);
    toggleSettingsView(false);
    toggleChatView(false);
  };
  
  const toggleWalletView = () => {
    setIsWalletView(!isWalletView);
    setIsCalendarView(false);
    toggleHistoryView(false);
    toggleSettingsView(false);
    toggleChatView(false);
  };
  
  const renderMainContent = () => {
    if (isSettingsOpen) {
      return <SettingsForm />;
    }
    
    if (isHistoryView) {
      return <HistoryView />;
    }
    
    if (isChatOpen) {
      return <ChatMission />;
    }
    
    if (isCalendarView) {
      return <CalendarView />;
    }
    
    if (isWalletView) {
      return <TransactionHistory />;
    }
    
    if (isLoading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Génération d'une mission adaptée...</p>
        </div>
      );
    }
    
    if (showFeedback && completedMission) {
      return <FeedbackForm mission={completedMission} onFeedbackSubmit={handleFeedbackSubmit} />;
    }
    
    if (activeMission) {
      return (
        <MissionCard 
          mission={activeMission} 
          onComplete={handleMissionComplete} 
          onRefuse={handleMissionRefuse}
          onStart={handleMissionStart}
        />
      );
    }
    
    return <EmptyState onGenerateMission={generateMission} />;
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-1/5 min-w-[240px] max-w-[300px] border-r">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="p-4 flex justify-between items-center">
          <div className="text-lg font-semibold flex items-center">
            <Wallet className="mr-2 w-5 h-5" />
            <span>{userPoints.toFixed(2)}€</span>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={toggleWalletView}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${isWalletView ? 'bg-muted' : ''}`}
            >
              <Wallet className="w-4 h-4" />
              {isWalletView ? 'Fermer le portefeuille' : 'Portefeuille'}
            </Button>
            
            <Button
              onClick={toggleCalendarView}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${isCalendarView ? 'bg-muted' : ''}`}
            >
              <Calendar className="w-4 h-4" />
              {isCalendarView ? 'Fermer le calendrier' : 'Calendrier'}
            </Button>
            
            <Button
              onClick={toggleChatView}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${isChatOpen ? 'bg-muted' : ''}`}
            >
              <MessageSquare className="w-4 h-4" />
              {isChatOpen ? 'Fermer le chat' : 'Chat'}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div className="w-full max-w-2xl h-full">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
