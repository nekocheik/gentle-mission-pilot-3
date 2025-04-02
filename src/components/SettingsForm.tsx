import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const settingsSchema = z.object({
  activeTimeStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format invalide. Utilisez HH:MM (ex: 09:00)',
  }),
  activeTimeEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format invalide. Utilisez HH:MM (ex: 18:00)',
  }),
  dailyBudgetMinutes: z.number().min(15).max(480),
  soundEnabled: z.boolean(),
  apiKey: z.string().min(1, 'Clé API requise pour le fonctionnement de l\'IA'),
  notificationSound: z.string(),
  completionSound: z.string(),
  startSound: z.string(),
  restTimeShort: z.number().min(1).max(60),
  restTimeLong: z.number().min(10).max(180),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm() {
  const { settings, updateSettings } = useAppStore();
  
  // Add apiKey to localStorage
  const getApiKey = () => localStorage.getItem('openrouter-api-key') || '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';
  const setApiKey = (key: string) => localStorage.setItem('openrouter-api-key', key);
  
  // Available sounds
  const availableSounds = [
    { value: '/notification.mp3', label: 'Notification standard' },
    { value: '/bell.mp3', label: 'Cloche' },
    { value: '/ding.mp3', label: 'Ding' },
    { value: '/success.mp3', label: 'Succès' },
  ];
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      activeTimeStart: settings.activeTimeStart,
      activeTimeEnd: settings.activeTimeEnd,
      dailyBudgetMinutes: settings.dailyBudgetMinutes,
      soundEnabled: settings.soundEnabled,
      apiKey: getApiKey(),
      notificationSound: settings.selectedSounds?.notification || '/notification.mp3',
      completionSound: settings.selectedSounds?.completion || '/notification.mp3',
      startSound: settings.selectedSounds?.start || '/notification.mp3',
      restTimeShort: settings.restTimeShort || 5,
      restTimeLong: settings.restTimeLong || 30,
    },
  });
  
  // Update form when settings change
  useEffect(() => {
    form.reset({
      activeTimeStart: settings.activeTimeStart,
      activeTimeEnd: settings.activeTimeEnd,
      dailyBudgetMinutes: settings.dailyBudgetMinutes,
      soundEnabled: settings.soundEnabled,
      apiKey: getApiKey(),
      notificationSound: settings.selectedSounds?.notification || '/notification.mp3',
      completionSound: settings.selectedSounds?.completion || '/notification.mp3',
      startSound: settings.selectedSounds?.start || '/notification.mp3',
      restTimeShort: settings.restTimeShort || 5,
      restTimeLong: settings.restTimeLong || 30,
    });
  }, [settings, form.reset]);
  
  const playSound = (soundUrl: string) => {
    const sound = new Audio(soundUrl);
    sound.volume = 0.5;
    sound.play().catch(e => console.error('Error playing sound:', e));
  };
  
  const onSubmit = (data: SettingsFormValues) => {
    updateSettings({
      activeTimeStart: data.activeTimeStart,
      activeTimeEnd: data.activeTimeEnd,
      dailyBudgetMinutes: data.dailyBudgetMinutes,
      soundEnabled: data.soundEnabled,
      selectedSounds: {
        notification: data.notificationSound,
        completion: data.completionSound,
        start: data.startSound,
      },
      restTimeShort: data.restTimeShort,
      restTimeLong: data.restTimeLong,
    });
    
    setApiKey(data.apiKey);
    
    toast.success('Paramètres enregistrés');
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Paramètres</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Plage horaire active</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activeTimeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Début</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="activeTimeEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="dailyBudgetMinutes"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <div className="flex justify-between mb-2">
                    <FormLabel>Budget quotidien</FormLabel>
                    <span className="text-sm">{value} minutes</span>
                  </div>
                  <FormControl>
                    <Slider
                      defaultValue={[value]}
                      min={15}
                      max={480}
                      step={15}
                      onValueChange={(vals) => onChange(vals[0])}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Durée totale des missions par jour
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <h3 className="text-lg font-medium mt-6">Temps de repos</h3>
            
            <FormField
              control={form.control}
              name="restTimeShort"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <div className="flex justify-between mb-2">
                    <FormLabel>Repos court</FormLabel>
                    <span className="text-sm">{value} minutes</span>
                  </div>
                  <FormControl>
                    <Slider
                      defaultValue={[value]}
                      min={1}
                      max={60}
                      step={1}
                      onValueChange={(vals) => onChange(vals[0])}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Durée du repos court entre les missions
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="restTimeLong"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <div className="flex justify-between mb-2">
                    <FormLabel>Repos long</FormLabel>
                    <span className="text-sm">{value} minutes</span>
                  </div>
                  <FormControl>
                    <Slider
                      defaultValue={[value]}
                      min={10}
                      max={180}
                      step={5}
                      onValueChange={(vals) => onChange(vals[0])}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Durée du repos long entre les missions
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <h3 className="text-lg font-medium mt-6">Notifications sonores</h3>
            
            <FormField
              control={form.control}
              name="soundEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Sons de notification</FormLabel>
                    <FormDescription>
                      Activer les sons lors des notifications
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch('soundEnabled') && (
              <>
                <FormField
                  control={form.control}
                  name="notificationSound"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Son de notification</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un son" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSounds.map((sound) => (
                                <SelectItem key={sound.value} value={sound.value}>
                                  {sound.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => playSound(field.value)}
                        >
                          Tester
                        </Button>
                      </div>
                      <FormDescription>
                        Son joué à la création d'une nouvelle mission
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startSound"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Son de démarrage</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un son" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSounds.map((sound) => (
                                <SelectItem key={sound.value} value={sound.value}>
                                  {sound.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => playSound(field.value)}
                        >
                          Tester
                        </Button>
                      </div>
                      <FormDescription>
                        Son joué au démarrage d'une mission
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="completionSound"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Son de complétion</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un son" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSounds.map((sound) => (
                                <SelectItem key={sound.value} value={sound.value}>
                                  {sound.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => playSound(field.value)}
                        >
                          Tester
                        </Button>
                      </div>
                      <FormDescription>
                        Son joué à la complétion d'une mission
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configuration IA</h3>
            
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clé API OpenRouter</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nécessaire pour l'IA adaptative
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button type="submit" className="w-full">
            Enregistrer
          </Button>
        </form>
      </Form>
    </div>
  );
}
