import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mission, MissionFeedback, MissionStatus, UserSettings, LabelType, AiModelType, Transaction } from '@/types';
import * as supabaseService from '@/services/supabaseService';

interface AppState {
  missions: Mission[];
  activeMission: Mission | null;
  settings: UserSettings;
  isHistoryView: boolean;
  isSettingsOpen: boolean;
  isChatOpen: boolean;
  userPoints: number;
  transactions: Transaction[];
  
  // Actions
  addMission: (mission: Omit<Mission, 'id' | 'created_at' | 'status'>) => Promise<Mission>;
  updateMissionStatus: (id: string, status: MissionStatus, completedAt?: string) => Promise<void>;
  addFeedback: (missionId: string, rating: number, comment?: string) => Promise<void>;
  setActiveMission: (mission: Mission | null) => void;
  toggleHistoryView: (value?: boolean) => void;
  toggleSettingsView: (value?: boolean) => void;
  toggleChatView: (value?: boolean) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  getMissionsByLabel: (label: LabelType) => Promise<Mission[]>;
  getCompletedMissions: () => Promise<Mission[]>;
  clearAllMissions: () => Promise<void>;
  fetchMissions: () => Promise<void>;
  scheduleMission: (id: string, scheduledAt: string, visible?: boolean) => Promise<void>;
  toggleMissionVisibility: (id: string, visible: boolean) => Promise<void>;
  addUserPoints: (points: number, description: string, missionId?: string) => Promise<void>;
  spendUserPoints: (points: number, description: string) => Promise<boolean>;
  fetchTransactions: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  activeTimeStart: '09:00',
  activeTimeEnd: '18:00',
  dailyBudgetMinutes: 120,
  soundEnabled: true,
  selectedAiModel: 'medium',
  selectedSounds: {
    notification: '/notification.mp3',
    completion: '/success.mp3',
    start: '/bell.mp3'
  },
  restTimeShort: 5,
  restTimeLong: 30
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      missions: [],
      activeMission: null,
      settings: defaultSettings,
      isHistoryView: false,
      isSettingsOpen: false,
      isChatOpen: false,
      userPoints: 10, // Points initiaux
      transactions: [],
      
      fetchMissions: async () => {
        try {
          const missions = await supabaseService.fetchMissions();
          set({ missions });
        } catch (error) {
          console.error('Erreur lors de la récupération des missions:', error);
        }
      },
      
      addMission: async (missionData) => {
        try {
          const newMission: Mission = await supabaseService.createMission({
            ...missionData,
            status: 'pending'
          }) as Mission;
          
          set((state) => ({
            missions: [...state.missions, newMission]
          }));
          
          return newMission;
        } catch (error) {
          console.error('Erreur lors de l\'ajout de la mission:', error);
          throw error;
        }
      },
      
      updateMissionStatus: async (id, status, completedAt) => {
        try {
          const updatedMission = await supabaseService.updateMissionStatus(id, status, completedAt);
          
          set((state) => {
            // Prepare updated missions
            const updatedMissions = state.missions.map((mission) => 
              mission.id === id ? { ...mission, ...updatedMission } as Mission : mission
            );
            
            // Handle completion rewards
            if (status === 'completed') {
              const mission = state.missions.find(m => m.id === id);
              if (mission && mission.reward_amount) {
                get().addUserPoints(
                  mission.reward_amount,
                  `Récompense pour la mission: ${mission.title}`,
                  mission.id
                );
              }
            }
            
            // Handle refusal penalties for essential missions
            if (status === 'refused') {
              const mission = state.missions.find(m => m.id === id);
              if (mission?.essential && mission.penalty_amount) {
                get().addUserPoints(
                  -mission.penalty_amount,
                  `Pénalité pour refus de mission essentielle: ${mission.title}`,
                  mission.id
                );
              }
            }
            
            return {
              missions: updatedMissions,
              activeMission: state.activeMission?.id === id 
                ? (status === 'active' 
                  ? { ...state.activeMission, status } as Mission
                  : null)
                : state.activeMission
            };
          });
        } catch (error) {
          console.error('Erreur lors de la mise à jour du statut:', error);
        }
      },
      
      addFeedback: async (missionId, rating, comment) => {
        try {
          const feedback = await supabaseService.addMissionFeedback(missionId, rating, comment);
          
          set((state) => ({
            missions: state.missions.map((mission) => 
              mission.id === missionId 
                ? { ...mission, feedback } as Mission
                : mission
            )
          }));
        } catch (error) {
          console.error('Erreur lors de l\'ajout du feedback:', error);
        }
      },
      
      setActiveMission: (mission) => set({ activeMission: mission }),
      
      toggleHistoryView: (value) => set((state) => ({ 
        isHistoryView: value !== undefined ? value : !state.isHistoryView,
        isSettingsOpen: false,
        isChatOpen: false 
      })),
      
      toggleSettingsView: (value) => set((state) => ({ 
        isSettingsOpen: value !== undefined ? value : !state.isSettingsOpen,
        isHistoryView: false,
        isChatOpen: false 
      })),
      
      toggleChatView: (value) => set((state) => ({ 
        isChatOpen: value !== undefined ? value : !state.isChatOpen,
        isHistoryView: false,
        isSettingsOpen: false 
      })),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      getMissionsByLabel: async (label) => {
        try {
          return await supabaseService.fetchMissionsByLabel(label);
        } catch (error) {
          console.error(`Erreur lors de la récupération des missions avec le label ${label}:`, error);
          return [];
        }
      },
      
      getCompletedMissions: async () => {
        try {
          return await supabaseService.fetchCompletedMissions();
        } catch (error) {
          console.error('Erreur lors de la récupération des missions complétées:', error);
          return [];
        }
      },
      
      clearAllMissions: async () => {
        try {
          await supabaseService.deleteAllMissions();
          set({ missions: [] });
        } catch (error) {
          console.error('Erreur lors de la suppression des missions:', error);
        }
      },
      
      scheduleMission: async (id, scheduledAt, visible = false) => {
        try {
          const updatedMission = await supabaseService.scheduleMission(id, scheduledAt, visible);
          
          set((state) => ({
            missions: state.missions.map((mission) => 
              mission.id === id ? { ...mission, ...updatedMission } as Mission : mission
            )
          }));
        } catch (error) {
          console.error('Erreur lors de la programmation de la mission:', error);
        }
      },
      
      toggleMissionVisibility: async (id, visible) => {
        try {
          const updatedMission = await supabaseService.updateMissionVisibility(id, visible);
          
          set((state) => ({
            missions: state.missions.map((mission) => 
              mission.id === id ? { ...mission, ...updatedMission } as Mission : mission
            )
          }));
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la visibilité:', error);
        }
      },
      
      addUserPoints: async (points, description, missionId) => {
        try {
          const transaction = {
            amount: points,
            description,
            mission_id: missionId,
            type: points >= 0 ? 'reward' as const : 'penalty' as const
          };
          
          await supabaseService.addTransaction(transaction);
          
          set((state) => ({
            userPoints: state.userPoints + points
          }));
          
          await get().fetchTransactions();
        } catch (error) {
          console.error('Erreur lors de l\'ajout des points:', error);
        }
      },
      
      spendUserPoints: async (points, description) => {
        const { userPoints } = get();
        
        if (userPoints >= points) {
          try {
            const transaction = {
              amount: -points,
              description,
              type: 'purchase' as const
            };
            
            await supabaseService.addTransaction(transaction);
            
            set((state) => ({
              userPoints: state.userPoints - points
            }));
            
            await get().fetchTransactions();
            return true;
          } catch (error) {
            console.error('Erreur lors de la dépense des points:', error);
            return false;
          }
        }
        
        return false;
      },
      
      fetchTransactions: async () => {
        try {
          const transactions = await supabaseService.fetchTransactions();
          set({ transactions: transactions as Transaction[] });
        } catch (error) {
          console.error('Erreur lors de la récupération des transactions:', error);
        }
      },
    }),
    {
      name: 'tdah-companion-storage',
    }
  )
);
