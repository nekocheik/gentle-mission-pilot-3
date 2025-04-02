import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mission } from '@/types';
import { updateMissionVisibility, scheduleMission } from '@/services/supabaseService';
import { toast } from 'sonner';

export const CalendarView = () => {
  const { missions, fetchMissions, userPoints, spendUserPoints } = useAppStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [missionsForDate, setMissionsForDate] = useState<Mission[]>([]);
  
  // Pour les jours avec des missions
  const [daysWithMissions, setDaysWithMissions] = useState<Date[]>([]);
  
  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);
  
  useEffect(() => {
    if (missions.length > 0) {
      // Trouver les jours qui ont des missions
      const days = missions
        .filter(m => m.scheduled_at)
        .map(m => new Date(m.scheduled_at as string));
      
      setDaysWithMissions(days);
    }
  }, [missions]);
  
  useEffect(() => {
    if (selectedDate) {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const missionsList = missions.filter(mission => {
        if (!mission.scheduled_at) return false;
        const missionDate = new Date(mission.scheduled_at);
        return missionDate >= startDate && missionDate <= endDate;
      });
      
      setMissionsForDate(missionsList);
    }
  }, [selectedDate, missions]);
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const toggleVisibility = async (mission: Mission) => {
    try {
      if (!mission.visible && userPoints < 2) {
        toast.error("Pas assez de points pour rendre cette mission visible");
        return;
      }
      
      await updateMissionVisibility(mission.id, !mission.visible);
      
      // Mettre à jour les points
      if (!mission.visible) {
        await spendUserPoints(2, `Déverrouillage de la mission: ${mission.title}`);
        toast.success(`Mission "${mission.title}" rendue visible (-2€)`);
      } else {
        toast.success(`Mission "${mission.title}" cachée`);
      }
      
      await fetchMissions();
    } catch (error) {
      console.error('Erreur lors de la modification de la visibilité:', error);
      toast.error("Erreur lors de la modification de la visibilité");
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Calendrier des missions</h2>
        <Badge variant="outline" className="ml-auto">
          {userPoints.toFixed(2)}€
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
        <Card>
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
              locale={fr}
              modifiers={{
                hasMission: daysWithMissions
              }}
              modifiersClassNames={{
                hasMission: "bg-blue-100 font-bold text-blue-600"
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : 'Sélectionnez une date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missionsForDate.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Aucune mission programmée pour cette date
              </div>
            ) : (
              <div className="space-y-4">
                {missionsForDate.map(mission => (
                  <div 
                    key={mission.id} 
                    className={cn(
                      "p-4 rounded-lg border",
                      mission.visible 
                        ? "border-green-200 bg-green-50" 
                        : "border-gray-200 bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{mission.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {mission.description}
                        </p>
                        <div className="flex items-center mt-2 text-sm">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          <span>
                            {mission.scheduled_at ? 
                              format(new Date(mission.scheduled_at), 'HH:mm', { locale: fr }) : 
                              'Non programmée'}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{mission.duration_minutes} min</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleVisibility(mission)}
                        className={cn(
                          mission.visible ? "text-green-600" : "text-gray-500"
                        )}
                      >
                        {mission.visible ? 
                          <Eye className="h-4 w-4" /> : 
                          <EyeOff className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
