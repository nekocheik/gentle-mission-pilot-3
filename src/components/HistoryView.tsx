import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { LabelType, Mission } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Activity, Focus, Coffee, Paintbrush, 
  Calendar, Users, FileText, CheckCircle, XCircle
} from 'lucide-react';

export function HistoryView() {
  const { missions } = useAppStore();
  
  const completedMissions = useMemo(() => 
    missions.filter(m => m.status === 'completed'), [missions]);
  
  const refusedMissions = useMemo(() => 
    missions.filter(m => m.status === 'refused'), [missions]);

  const labelStats = useMemo(() => {
    const stats: Record<LabelType, { 
      count: number, 
      completed: number, 
      totalDuration: number,
      averageRating: number,
      ratings: number[]
    }> = {} as any;
    
    const labels: LabelType[] = [
      'lecture', 'mouvement', 'focus', 'pause_mentale', 
      'créativité', 'routine', 'social', 'admin'
    ];
    
    // Initialize stats
    labels.forEach(label => {
      stats[label] = { 
        count: 0, 
        completed: 0, 
        totalDuration: 0,
        averageRating: 0,
        ratings: []
      };
    });
    
    // Populate stats
    missions.forEach(mission => {
      if (!stats[mission.label]) return;
      
      stats[mission.label].count++;
      
      if (mission.status === 'completed') {
        stats[mission.label].completed++;
        stats[mission.label].totalDuration += mission.duration_minutes;
        
        if (mission.feedback) {
          stats[mission.label].ratings.push(mission.feedback.rating);
        }
      }
    });
    
    // Calculate average ratings
    Object.keys(stats).forEach(label => {
      const typedLabel = label as LabelType;
      const { ratings } = stats[typedLabel];
      
      if (ratings.length > 0) {
        stats[typedLabel].averageRating = 
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      }
    });
    
    return stats;
  }, [missions]);

  const getLabelIcon = (label: LabelType) => {
    const icons: Record<LabelType, React.ReactNode> = {
      'lecture': <BookOpen size={18} />,
      'mouvement': <Activity size={18} />,
      'focus': <Focus size={18} />,
      'pause_mentale': <Coffee size={18} />,
      'créativité': <Paintbrush size={18} />,
      'routine': <Calendar size={18} />,
      'social': <Users size={18} />,
      'admin': <FileText size={18} />
    };
    return icons[label];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  return (
    <div className="w-full h-full p-4 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Historique et Statistiques</h2>
      
      <Tabs defaultValue="stats">
        <TabsList className="mb-4">
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
          <TabsTrigger value="completed">Missions complétées</TabsTrigger>
          <TabsTrigger value="refused">Missions refusées</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vue d'ensemble</CardTitle>
              <CardDescription>
                Statistiques globales sur vos missions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stats-card">
                  <p className="text-sm text-muted-foreground">Total missions</p>
                  <p className="text-2xl font-bold">{missions.length}</p>
                </div>
                <div className="stats-card">
                  <p className="text-sm text-muted-foreground">Complétées</p>
                  <p className="text-2xl font-bold text-green-600">{completedMissions.length}</p>
                </div>
                <div className="stats-card">
                  <p className="text-sm text-muted-foreground">Refusées</p>
                  <p className="text-2xl font-bold text-red-500">{refusedMissions.length}</p>
                </div>
                <div className="stats-card">
                  <p className="text-sm text-muted-foreground">Taux de succès</p>
                  <p className="text-2xl font-bold">
                    {missions.length > 0 
                      ? Math.round((completedMissions.length / missions.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Par catégorie</CardTitle>
              <CardDescription>
                Performances par type de mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(labelStats).map(([label, stats]) => {
                  const typedLabel = label as LabelType;
                  if (stats.count === 0) return null;
                  
                  return (
                    <div key={label} className="flex items-center space-x-4">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {getLabelIcon(typedLabel)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium capitalize">
                            {typedLabel.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {stats.completed}/{stats.count}
                          </p>
                        </div>
                        <div className="w-full bg-muted h-2 rounded-full mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${stats.count > 0 
                                ? (stats.completed / stats.count * 100) 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {stats.averageRating > 0 
                            ? `${stats.averageRating.toFixed(1)}/5` 
                            : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stats.totalDuration} min
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Missions complétées</CardTitle>
              <CardDescription>
                Les missions que vous avez terminées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {completedMissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune mission complétée pour le moment
                    </p>
                  ) : (
                    completedMissions
                      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
                      .map((mission) => (
                        <div 
                          key={mission.id} 
                          className="p-4 border rounded-md flex items-start justify-between"
                        >
                          <div className="flex items-start space-x-3">
                            <CheckCircle size={18} className="text-green-500 mt-1" />
                            <div>
                              <p className="font-medium">{mission.title}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(mission.completed_at || '')}
                                </span>
                                <span className="mx-2 text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {mission.label.replace('_', ' ')}
                                </span>
                              </div>
                              {mission.feedback && (
                                <div className="mt-2 text-sm">
                                  <span className="font-medium">Feedback: </span>
                                  <span>{mission.feedback.rating}/5</span>
                                  {mission.feedback.comment && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      "{mission.feedback.comment}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {mission.duration_minutes} min
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="refused">
          <Card>
            <CardHeader>
              <CardTitle>Missions refusées</CardTitle>
              <CardDescription>
                Les missions que vous avez choisi de ne pas faire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {refusedMissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune mission refusée pour le moment
                    </p>
                  ) : (
                    refusedMissions
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((mission) => (
                        <div 
                          key={mission.id} 
                          className="p-4 border rounded-md flex items-start justify-between"
                        >
                          <div className="flex items-start space-x-3">
                            <XCircle size={18} className="text-red-500 mt-1" />
                            <div>
                              <p className="font-medium">{mission.title}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(mission.created_at)}
                                </span>
                                <span className="mx-2 text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {mission.label.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {mission.duration_minutes} min
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
