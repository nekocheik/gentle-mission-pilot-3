import { LabelType, Mission, MissionFeedback, AiModelType } from '@/types';

interface AiServiceProps {
  apiKey: string;
  model: AiModelType;
}

class AiService {
  private apiKey: string;
  private model: AiModelType;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private modelMapping: Record<AiModelType, string> = {
    low: 'google/gemini-flash-1.5',
    medium: 'deepseek/deepseek-chat-v3-0324',
    high: 'google/gemini-2.5-pro-exp-03-25:free',
  };

  constructor({ apiKey, model }: AiServiceProps) {
    this.apiKey = apiKey;
    this.model = model;
  }

  setModel(model: AiModelType) {
    this.model = model;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getSelectedModel(): string {
    return this.modelMapping[this.model];
  }

  async generateNextMission(
    recentMissions: Mission[],
    missionsByLabel: Record<LabelType, Mission[]>,
    preferences: {
      activeTimeStart: string;
      activeTimeEnd: string;
      dailyBudgetMinutes: number;
    }
  ): Promise<Omit<Mission, 'id' | 'created_at' | 'status'> | null> {
    if (!this.apiKey) {
      console.error('API key not set');
      return null;
    }

    try {
      const systemMessage = `
        Tu es un assistant IA spécialisé pour personnes TDAH qui génère des micro-missions adaptatives.
        Ton rôle est de proposer des missions courtes et engageantes qui aident l'utilisateur à maintenir sa concentration,
        prendre des pauses, et développer des habitudes saines.
        
        Génère une nouvelle mission en fonction du contexte et de l'historique des missions récentes.
        
        Plage horaire active: ${preferences.activeTimeStart} - ${preferences.activeTimeEnd}
        Budget temps quotidien: ${preferences.dailyBudgetMinutes} minutes
        
        Les missions doivent être:
        - Courtes (2-30 minutes)
        - Claires et concrètes
        - Adaptées au contexte TDAH (faciles à initier, motivantes)
        - Variées (ne pas répéter le même type trop souvent)
        
        Réponds UNIQUEMENT avec un objet JSON valide contenant:
        {
          "label": Une des catégories suivantes: "lecture", "mouvement", "focus", "pause_mentale", "créativité", "routine", "social", "admin",
          "title": Titre court et clair de la mission,
          "description": Description optionnelle plus détaillée,
          "duration_minutes": Durée en minutes (entier),
          "scheduled_at": ISO datetime suggéré pour cette mission,
          "source": "auto"
        }
      `;

      // Formatage des données sur les missions récentes pour l'IA
      const recentMissionsData = recentMissions.map(m => ({
        label: m.label,
        title: m.title,
        duration_minutes: m.duration_minutes,
        status: m.status,
        created_at: m.created_at,
        feedback: m.feedback ? {
          rating: m.feedback.rating,
          comment: m.feedback.comment
        } : null
      }));

      // Statistiques par label pour l'IA
      const labelStats = Object.entries(missionsByLabel).map(([label, missions]) => {
        const completed = missions.filter(m => m.status === 'completed');
        const ratings = completed
          .filter(m => m.feedback)
          .map(m => m.feedback!.rating);
        
        return {
          label,
          totalCount: missions.length,
          completedCount: completed.length,
          completionRate: missions.length ? completed.length / missions.length : 0,
          averageRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        };
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://tdah-companion.app',
          'X-Title': 'TDAH Companion'
        },
        body: JSON.stringify({
          model: this.getSelectedModel(),
          messages: [
            { role: 'system', content: systemMessage },
            { 
              role: 'user', 
              content: JSON.stringify({
                recentMissions: recentMissionsData.slice(-5),
                labelStats,
                currentTime: new Date().toISOString()
              })
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extraction du JSON depuis la réponse
      try {
        // Tentative de parsing direct
        const missionData = JSON.parse(content);
        return missionData;
      } catch (e) {
        // Si le parsing direct échoue, on essaie d'extraire le JSON avec une regex
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/```([\s\S]*?)```/) ||
                         content.match(/{[\s\S]*?}/);
                         
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }
        
        throw new Error("Could not parse AI response");
      }
    } catch (error) {
      console.error('Error generating mission:', error);
      return null;
    }
  }

  async analyzeFeedback(
    mission: Mission,
    feedback: MissionFeedback
  ): Promise<{ 
    insights: string; 
    nextLabelSuggestion: LabelType;
    nextDurationSuggestion: number;
  } | null> {
    if (!this.apiKey) {
      console.error('API key not set');
      return null;
    }

    try {
      const systemMessage = `
        Tu es un assistant IA spécialisé dans l'analyse des préférences et comportements des personnes TDAH.
        Analyse le feedback de l'utilisateur sur une mission récemment complétée pour en tirer des enseignements.
        
        Réponds UNIQUEMENT avec un objet JSON valide contenant:
        {
          "insights": Un court paragraphe d'insights sur ce feedback et comment l'utiliser pour améliorer l'expérience,
          "nextLabelSuggestion": Suggestion du prochain label à proposer (parmi "lecture", "mouvement", "focus", "pause_mentale", "créativité", "routine", "social", "admin"),
          "nextDurationSuggestion": Suggestion de durée en minutes pour la prochaine mission (entier)
        }
      `;

      const missionData = {
        label: mission.label,
        title: mission.title,
        description: mission.description,
        duration_minutes: mission.duration_minutes,
        status: mission.status,
        feedback: {
          rating: feedback.rating,
          comment: feedback.comment
        }
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://tdah-companion.app',
          'X-Title': 'TDAH Companion'
        },
        body: JSON.stringify({
          model: this.getSelectedModel(),
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: JSON.stringify(missionData) }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        // Tentative de parsing direct
        const analysisData = JSON.parse(content);
        return analysisData;
      } catch (e) {
        // Si le parsing direct échoue, on essaie d'extraire le JSON avec une regex
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/```([\s\S]*?)```/) ||
                         content.match(/{[\s\S]*?}/);
                         
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1] || jsonMatch[0]);
        }
        
        throw new Error("Could not parse AI response");
      }
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      return null;
    }
  }
}

export default AiService;
