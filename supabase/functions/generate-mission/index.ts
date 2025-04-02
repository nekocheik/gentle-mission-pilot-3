import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MissionRequestBody {
  recentMissions: any[];
  labelStats: any[];
  preferences: {
    activeTimeStart: string;
    activeTimeEnd: string;
    dailyBudgetMinutes: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key est requis' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer un client Supabase pour accéder à la base de données
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les données de la requête
    const { recentMissions, labelStats, preferences }: MissionRequestBody = await req.json();

    // Récupérer des templates aléatoires pour inspirer la génération
    const { data: templates } = await supabase
      .from('mission_templates')
      .select('*')
      .limit(3);

    // Déterminer la prochaine mission en fonction des statistiques et des préférences
    let nextLabel = 'focus';
    let nextDuration = 15;

    // Analyse simple basée sur les statistiques des labels
    if (labelStats && labelStats.length > 0) {
      // Trouver le label le moins utilisé récemment
      const sortedByCount = [...labelStats].sort((a, b) => a.totalCount - b.totalCount);
      if (sortedByCount.length > 0) {
        nextLabel = sortedByCount[0].label;
      }
      
      // Si focus est peu utilisé, le prioriser
      const focusStat = labelStats.find(s => s.label === 'focus');
      if (focusStat && focusStat.totalCount < 3) {
        nextLabel = 'focus';
      }
      
      // Si la dernière mission était "focus", suggérer une pause
      if (recentMissions && recentMissions.length > 0 && recentMissions[0].label === 'focus') {
        nextLabel = Math.random() > 0.5 ? 'pause_mentale' : 'mouvement';
      }
    }

    // Déterminer la durée en fonction des préférences et du type de mission
    if (nextLabel === 'focus') {
      nextDuration = 25;
    } else if (['mouvement', 'pause_mentale'].includes(nextLabel)) {
      nextDuration = 5;
    } else {
      nextDuration = 15;
    }

    // Trouver un template correspondant au label choisi
    let title = '';
    let description = '';
    
    if (templates) {
      const matchingTemplate = templates.find(t => t.label === nextLabel);
      if (matchingTemplate) {
        title = matchingTemplate.title;
        description = matchingTemplate.description;
      }
    }
    
    // Si aucun template n'a été trouvé, créer un titre et une description par défaut
    if (!title) {
      switch (nextLabel) {
        case 'focus':
          title = 'Session de travail concentré';
          description = 'Concentrez-vous sur une tâche importante pendant 25 minutes sans distraction.';
          break;
        case 'pause_mentale':
          title = 'Pause de respiration';
          description = 'Prenez 5 minutes pour respirer profondément et vous recentrer.';
          break;
        case 'mouvement':
          title = 'Mini-exercice physique';
          description = 'Faites quelques mouvements pour réveiller votre corps.';
          break;
        case 'lecture':
          title = 'Lecture rapide';
          description = 'Lisez quelques pages d\'un livre ou un article intéressant.';
          break;
        case 'créativité':
          title = 'Moment créatif';
          description = 'Prenez un moment pour dessiner, écrire ou créer quelque chose.';
          break;
        default:
          title = 'Nouvelle mission';
          description = 'Une mission adaptée à votre journée.';
      }
    }

    // Calculer l'heure de planification (maintenant)
    const scheduledAt = new Date().toISOString();

    // Créer l'objet mission à retourner
    const missionData = {
      label: nextLabel,
      title,
      description,
      duration_minutes: nextDuration,
      scheduled_at: scheduledAt,
      source: 'auto'
    };

    return new Response(
      JSON.stringify(missionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erreur dans generate-mission:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
