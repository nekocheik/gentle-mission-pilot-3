import { supabase } from "@/integrations/supabase/client";
import { Mission, MissionFeedback, LabelType, Transaction } from "@/types";

export const fetchMissionTemplates = async () => {
  const { data, error } = await supabase
    .from('mission_templates')
    .select('*');
  
  if (error) {
    console.error('Erreur lors de la récupération des templates:', error);
    throw error;
  }
  
  return data;
};

export const fetchMissions = async () => {
  const { data, error } = await supabase
    .from('missions')
    .select('*, feedback:mission_feedback(*)');
  
  if (error) {
    console.error('Erreur lors de la récupération des missions:', error);
    throw error;
  }
  
  // Transformer les données pour correspondre à notre type Mission
  return data.map((mission: any) => ({
    ...mission,
    feedback: mission.feedback && mission.feedback.length > 0 ? mission.feedback[0] : null
  }));
};

export const createMission = async (mission: Omit<Mission, 'id' | 'created_at' | 'feedback'>) => {
  const { data, error } = await supabase
    .from('missions')
    .insert(mission)
    .select('*')
    .single();
  
  if (error) {
    console.error('Erreur lors de la création de la mission:', error);
    throw error;
  }
  
  return data;
};

export const updateMissionStatus = async (id: string, status: string, completedAt?: string) => {
  const { data, error } = await supabase
    .from('missions')
    .update({ 
      status, 
      completed_at: completedAt || (status === 'completed' ? new Date().toISOString() : null) 
    })
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
  
  return data;
};

export const addMissionFeedback = async (missionId: string, rating: number, comment?: string) => {
  const { data, error } = await supabase
    .from('mission_feedback')
    .insert({
      mission_id: missionId,
      rating,
      comment
    })
    .select('*')
    .single();
  
  if (error) {
    console.error('Erreur lors de l\'ajout du feedback:', error);
    throw error;
  }
  
  return data;
};

export const fetchMissionsByLabel = async (label: LabelType) => {
  const { data, error } = await supabase
    .from('missions')
    .select('*, feedback:mission_feedback(*)')
    .eq('label', label);
  
  if (error) {
    console.error(`Erreur lors de la récupération des missions avec le label ${label}:`, error);
    throw error;
  }
  
  return data.map((mission: any) => ({
    ...mission,
    feedback: mission.feedback && mission.feedback.length > 0 ? mission.feedback[0] : null
  }));
};

export const fetchCompletedMissions = async () => {
  const { data, error } = await supabase
    .from('missions')
    .select('*, feedback:mission_feedback(*)')
    .eq('status', 'completed');
  
  if (error) {
    console.error('Erreur lors de la récupération des missions complétées:', error);
    throw error;
  }
  
  return data.map((mission: any) => ({
    ...mission,
    feedback: mission.feedback && mission.feedback.length > 0 ? mission.feedback[0] : null
  }));
};

export const deleteAllMissions = async () => {
  const { error } = await supabase
    .from('missions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer toutes les missions
  
  if (error) {
    console.error('Erreur lors de la suppression des missions:', error);
    throw error;
  }
  
  return true;
};

// Nouvelles fonctions pour la gestion des missions futures et visibilité
export const scheduleMission = async (id: string, scheduledAt: string, visible: boolean = false) => {
  const { data, error } = await supabase
    .from('missions')
    .update({ 
      scheduled_at: scheduledAt,
      status: 'scheduled',
      visible
    })
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    console.error('Erreur lors de la programmation de la mission:', error);
    throw error;
  }
  
  return data;
};

export const updateMissionVisibility = async (id: string, visible: boolean) => {
  const { data, error } = await supabase
    .from('missions')
    .update({ visible })
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    console.error('Erreur lors de la mise à jour de la visibilité:', error);
    throw error;
  }
  
  return data;
};

export const fetchScheduledMissions = async () => {
  const { data, error } = await supabase
    .from('missions')
    .select('*, feedback:mission_feedback(*)')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });
  
  if (error) {
    console.error('Erreur lors de la récupération des missions programmées:', error);
    throw error;
  }
  
  return data.map((mission: any) => ({
    ...mission,
    feedback: mission.feedback && mission.feedback.length > 0 ? mission.feedback[0] : null
  }));
};

// Nouvelles fonctions pour la gestion des transactions
export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select('*')
    .single();
  
  if (error) {
    console.error('Erreur lors de l\'ajout de la transaction:', error);
    throw error;
  }
  
  return data;
};

export const fetchTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    throw error;
  }
  
  return data;
};
