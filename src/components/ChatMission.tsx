import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Send, Loader2, Calendar, Check, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Mission, LabelType, MissionSource } from '@/types';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface MissionProposal {
  title: string;
  description: string;
  label: LabelType;
  duration_minutes: number;
  scheduled_at?: string;
  source: MissionSource;
  essential?: boolean;
  reward_amount?: number;
  penalty_amount?: number;
}

export const ChatMission = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [missionProposal, setMissionProposal] = useState<MissionProposal | null>(null);
  const [showMissionDialog, setShowMissionDialog] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { addMission, setActiveMission, updateMissionStatus } = useAppStore();

  useEffect(() => {
    // Ajouter un message de bienvenue au chargement
    setMessages([
      {
        content: "Bonjour ! Je suis votre assistant TDAH. Je peux vous aider à générer des missions adaptées à vos besoins. Que souhaitez-vous faire aujourd'hui ?",
        isUser: false,
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      content: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Récupérer l'API key OpenRouter depuis le local storage (ou autre méthode)
      const apiKey = localStorage.getItem('openrouter-api-key');
      
      if (!apiKey) {
        setMessages(prev => [...prev, {
          content: "Pour générer des missions personnalisées, vous devez configurer votre clé API OpenRouter dans les paramètres.",
          isUser: false,
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }

      // Appel à la fonction Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-mission', {
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        body: {
          userMessage: input,
          recentMissions: [],
          labelStats: [],
          preferences: {
            activeTimeStart: '09:00',
            activeTimeEnd: '18:00',
            dailyBudgetMinutes: 120
          }
        }
      });

      if (error) {
        throw error;
      }

      // Au lieu de créer immédiatement la mission, proposer au utilisateur
      if (data) {
        const proposal: MissionProposal = {
          ...data,
          source: 'custom' as MissionSource,
          essential: Math.random() > 0.7, // 30% chance pour une mission essentielle
          reward_amount: parseFloat((Math.random() * 10 + 1).toFixed(2)) // 1-11€ de récompense
        };
        
        // Si c'est une mission essentielle, ajouter une pénalité
        if (proposal.essential) {
          proposal.penalty_amount = parseFloat((Math.random() * 5 + 1).toFixed(2)); // 1-6€ de pénalité
        }
        
        setMissionProposal(proposal);
        
        setMessages(prev => [...prev, {
          content: `Voici une proposition de mission : "${proposal.title}". Cette mission durera ${proposal.duration_minutes} minutes. Voulez-vous l'ajouter à votre planning ?`,
          isUser: false,
          timestamp: new Date()
        }]);
        
        setShowMissionDialog(true);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de mission:', error);
      
      setMessages(prev => [...prev, {
        content: "Désolé, j'ai rencontré une erreur lors de la génération de la mission. Veuillez réessayer plus tard.",
        isUser: false,
        timestamp: new Date()
      }]);
      
      toast.error("Erreur lors de la génération de la mission");
    } finally {
      setIsLoading(false);
    }
  };

  const acceptMission = async () => {
    if (!missionProposal) return;
    
    try {
      const newMission = await addMission(missionProposal);
      
      setMessages(prev => [...prev, {
        content: `La mission "${missionProposal.title}" a été ajoutée avec succès à votre planning.`,
        isUser: false,
        timestamp: new Date()
      }]);
      
      toast.success("Mission ajoutée avec succès");
      setShowMissionDialog(false);
      setMissionProposal(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la mission:', error);
      toast.error("Erreur lors de l'ajout de la mission");
    }
  };

  const refuseMission = () => {
    setMessages(prev => [...prev, {
      content: `Vous avez refusé la mission. Puis-je vous proposer autre chose ?`,
      isUser: false,
      timestamp: new Date()
    }]);
    
    setShowMissionDialog(false);
    setMissionProposal(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col">
        <CardHeader>
          <CardTitle>Assistant TDAH</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-auto pb-0">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${message.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="mt-4">
          <div className="flex w-full items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showMissionDialog} onOpenChange={setShowMissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Mission</DialogTitle>
            <DialogDescription>
              Voulez-vous ajouter cette mission à votre planning ?
            </DialogDescription>
          </DialogHeader>
          
          {missionProposal && (
            <div className="py-4">
              <h3 className="text-lg font-medium">{missionProposal.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{missionProposal.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium">Durée: {missionProposal.duration_minutes} minutes</span>
                <span className="text-sm font-medium capitalize bg-gray-100 px-2 py-1 rounded-md">
                  {missionProposal.label.replace('_', ' ')}
                </span>
              </div>
              {missionProposal.reward_amount && (
                <div className="mt-2">
                  <span className="text-sm text-green-600">
                    Récompense: {missionProposal.reward_amount}€
                  </span>
                </div>
              )}
              {missionProposal.penalty_amount && (
                <div className="mt-1">
                  <span className="text-sm text-red-600">
                    Pénalité si non réalisée: {missionProposal.penalty_amount}€
                  </span>
                </div>
              )}
              {missionProposal.essential && (
                <div className="mt-2">
                  <span className="text-sm font-semibold text-orange-500">
                    Mission essentielle
                  </span>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={refuseMission}>
              <X className="mr-2 h-4 w-4" />
              Refuser
            </Button>
            <Button onClick={acceptMission}>
              <Check className="mr-2 h-4 w-4" />
              Accepter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
