export type LabelType = 
  | 'lecture' 
  | 'mouvement' 
  | 'focus' 
  | 'pause_mentale' 
  | 'créativité'
  | 'routine' 
  | 'social' 
  | 'admin';

export type AiModelType = 'low' | 'medium' | 'high';

export type MissionStatus = 
  | 'pending' 
  | 'active' 
  | 'completed' 
  | 'refused' 
  | 'failed'
  | 'scheduled';

export type MissionSource = 'auto' | 'custom';

export type SoundType = 'notification' | 'completion' | 'start';

export interface Mission {
  id: string;
  label: LabelType;
  title: string;
  description?: string;
  duration_minutes: number;
  status: MissionStatus;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
  feedback?: MissionFeedback;
  source: MissionSource;
  visible?: boolean;
  essential?: boolean;
  reward_amount?: number;
  penalty_amount?: number;
}

export interface MissionFeedback {
  id: string;
  mission_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
}

export interface LabelStat {
  label: LabelType;
  count: number;
  completionRate: number;
  averageRating: number;
  totalDuration: number;
}

export interface UserSettings {
  activeTimeStart: string; // format: "09:00"
  activeTimeEnd: string; // format: "18:00"
  dailyBudgetMinutes: number;
  soundEnabled: boolean;
  selectedAiModel: AiModelType;
  selectedSounds: {
    notification: string;
    completion: string;
    start: string;
  };
  restTimeShort: number; // in minutes
  restTimeLong: number; // in minutes
}

export interface Transaction {
  id: string;
  amount: number; // Positive for earnings, negative for penalties
  description: string;
  mission_id?: string;
  created_at: string;
  type: 'reward' | 'penalty' | 'purchase';
}
