'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Trash2, Edit, Video, Music, Youtube, Upload, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MediaItem {
  id: string;
  title: string;
  type: string;
  duration_seconds: number | null;
  duration_ms?: number;
  thumbnail_url: string | null;
  media_url: string;
}

interface ScheduleItem {
  id: string;
  channel_type: 'webtv' | 'webradio';
  scheduled_date: string;
  start_time: string;
  end_time: string;
  title: string;
  media_id: string | null;
  status: string;
  media?: MediaItem;
}

interface PlayoutScheduleCalendarProps {
  channelType: 'webtv' | 'webradio';
}

export function PlayoutScheduleCalendar({ channelType }: PlayoutScheduleCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    media_id: '',
    scheduled_date: '',
    start_time: '00:00',
    end_time: '01:00',
  });
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    loadSchedules();
    loadMediaLibrary();
  }, [currentWeekStart, channelType]);

  async function loadSchedules() {
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('playout_schedules')
        .select(`
          *,
          media:playout_media_library(id, title, type, duration_seconds)
        `)
        .eq('channel_type', channelType)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date')
        .order('start_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Erreur lors du chargement du calendrier');
    } finally {
      setLoading(false);
    }
  }

  async function loadMediaLibrary() {
    try {
      const mediaType = channelType === 'webtv' ? 'video' : 'audio';
      const { data, error } = await supabase
        .from('playout_media_library')
        .select('id, title, type, duration_seconds, thumbnail_url, media_url')
        .eq('type', mediaType)
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setMediaLibrary(data || []);
    } catch (error) {
      console.error('Error loading media library:', error);
    }
  }

  function calculateEndTime(startTime: string, durationSeconds: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setSeconds(startDate.getSeconds() + durationSeconds);

    const endHours = startDate.getHours().toString().padStart(2, '0');
    const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  }

  async function handleAddSchedule() {
    if (!formData.title || !formData.media_id || !formData.scheduled_date) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const { error } = await supabase.from('playout_schedules').insert({
        channel_type: channelType,
        title: formData.title,
        media_id: formData.media_id,
        scheduled_date: formData.scheduled_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        status: 'scheduled',
      });

      if (error) throw error;

      toast.success('Programmation ajoutée avec succès');
      setIsAddDialogOpen(false);
      setFormData({
        title: '',
        media_id: '',
        scheduled_date: '',
        start_time: '00:00',
        end_time: '01:00',
      });
      loadSchedules();
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Erreur lors de l\'ajout de la programmation');
    }
  }

  function handleMediaChange(mediaId: string) {
    const selectedMedia = mediaLibrary.find((m) => m.id === mediaId);
    setFormData({ ...formData, media_id: mediaId });

    if (selectedMedia && selectedMedia.duration_seconds) {
      const endTime = calculateEndTime(formData.start_time, selectedMedia.duration_seconds);
      setFormData({
        ...formData,
        media_id: mediaId,
        end_time: endTime,
      });
      toast.success(`Durée: ${Math.floor(selectedMedia.duration_seconds / 60)}min ${selectedMedia.duration_seconds % 60}s - Fin calculée: ${endTime}`);
    }
  }

  function handleStartTimeChange(newStartTime: string) {
    const selectedMedia = mediaLibrary.find((m) => m.id === formData.media_id);

    if (selectedMedia && selectedMedia.duration_seconds) {
      const endTime = calculateEndTime(newStartTime, selectedMedia.duration_seconds);
      setFormData({
        ...formData,
        start_time: newStartTime,
        end_time: endTime,
      });
    } else {
      setFormData({ ...formData, start_time: newStartTime });
    }
  }

  async function handleDeleteSchedule(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette programmation ?')) return;

    try {
      const { error } = await supabase
        .from('playout_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Programmation supprimée avec succès');
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  function extractYouTubeId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  }

  function getSchedulesForDay(date: Date): ScheduleItem[] {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.filter((s) => s.scheduled_date === dateStr);
  }

  function openAddDialog(date: Date) {
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySchedules = schedules.filter((s) => s.scheduled_date === dateStr);

    let nextStartTime = '00:00';
    if (daySchedules.length > 0) {
      const lastSchedule = daySchedules[daySchedules.length - 1];
      nextStartTime = lastSchedule.end_time;
    }

    setFormData({
      ...formData,
      scheduled_date: dateStr,
      start_time: nextStartTime,
    });
    setIsAddDialogOpen(true);
  }

  async function autoScheduleDay(date: Date) {
    if (mediaLibrary.length === 0) {
      toast.error('Aucun média disponible pour la programmation automatique');
      return;
    }

    setIsAutoScheduling(true);
    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      const existingSchedules = schedules.filter((s) => s.scheduled_date === dateStr);
      let currentTime = existingSchedules.length > 0
        ? existingSchedules[existingSchedules.length - 1].end_time
        : '00:00';

      const mediasToSchedule = [...mediaLibrary].filter(m => m.duration_seconds);

      if (mediasToSchedule.length === 0) {
        toast.error('Aucun média avec durée définie');
        return;
      }

      const schedulePromises = [];
      let scheduledCount = 0;

      for (const media of mediasToSchedule) {
        if (!media.duration_seconds) continue;

        const [hours, minutes] = currentTime.split(':').map(Number);
        const currentMinutes = hours * 60 + minutes;

        if (currentMinutes >= 24 * 60) break;

        const endTime = calculateEndTime(currentTime, media.duration_seconds);

        schedulePromises.push(
          supabase.from('playout_schedules').insert({
            channel_type: channelType,
            title: media.title,
            media_id: media.id,
            scheduled_date: dateStr,
            start_time: currentTime,
            end_time: endTime,
            status: 'scheduled',
          })
        );

        currentTime = endTime;
        scheduledCount++;
      }

      await Promise.all(schedulePromises);

      toast.success(`${scheduledCount} médias programmés automatiquement`);
      loadSchedules();
    } catch (error) {
      console.error('Error auto-scheduling:', error);
      toast.error('Erreur lors de la programmation automatique');
    } finally {
      setIsAutoScheduling(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-light text-white">
            Calendrier {channelType === 'webtv' ? 'WebTV' : 'WebRadio'}
          </h2>
          <p className="text-zinc-400">
            Planifiez votre programmation minute par minute
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="bg-amber-600/10 border-amber-600/30 text-amber-600 hover:bg-amber-600 hover:text-black"
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="text-center font-light text-xl text-white capitalize">
        {format(currentWeekStart, 'MMMM yyyy', { locale: fr })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const daySchedules = getSchedulesForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={day.toString()} className={isToday ? 'border-amber-600 border-2 bg-amber-600/5' : 'bg-zinc-900 border-zinc-800'}>
              <CardHeader className="pb-4 border-b border-zinc-800">
                <CardTitle className="text-lg">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium text-white">
                      {format(day, 'EEEE', { locale: fr })}
                    </span>
                    <Badge variant={isToday ? 'default' : 'secondary'} className={`text-base px-3 py-1 ${isToday ? 'bg-amber-600 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                      {format(day, 'd')}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 min-h-[600px] pt-4 bg-black">
                {daySchedules.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">
                    Aucune programmation
                  </div>
                )}
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 bg-zinc-900 border border-amber-600/20 rounded-lg group hover:bg-zinc-800 hover:border-amber-600/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold text-lg">
                        <Clock className="w-6 h-6 text-amber-400" />
                        {schedule.start_time.substring(0, 5)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900 hover:text-white"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="font-semibold line-clamp-2 mb-2 text-white text-base">
                      {schedule.title}
                    </div>
                    {schedule.media && (
                      <div className="text-zinc-400 line-clamp-1 text-sm">
                        {schedule.media.title}
                      </div>
                    )}
                  </div>
                ))}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full py-5 text-base bg-amber-600/10 border-amber-600/30 text-amber-600 hover:bg-amber-600 hover:text-black hover:border-amber-600"
                    onClick={() => openAddDialog(day)}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full py-4 text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                    onClick={() => autoScheduleDay(day)}
                    disabled={isAutoScheduling || mediaLibrary.length === 0}
                  >
                    {isAutoScheduling ? 'Programmation...' : 'Auto-programmer'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl bg-black border-amber-600/30">
          <DialogHeader>
            <DialogTitle className="text-white">Ajouter une programmation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base text-zinc-300">Date</Label>
              <Input
                type="date"
                className="h-12 text-base bg-zinc-900 border-zinc-700 text-white"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base text-zinc-300 flex items-center gap-2 mb-2">
                  <Clock className="w-6 h-6 text-amber-400" />
                  Heure de début *
                </Label>
                <Input
                  type="time"
                  className="h-12 text-base bg-zinc-900 border-zinc-700 text-white"
                  value={formData.start_time}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-base text-zinc-300 flex items-center gap-2 mb-2">
                  <Clock className="w-6 h-6 text-amber-400" />
                  Heure de fin *
                </Label>
                <Input
                  type="time"
                  className="h-12 text-base bg-zinc-900 border-zinc-700 text-white"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  disabled={!!formData.media_id}
                />
                {formData.media_id && (
                  <p className="text-xs text-zinc-400 mt-1">
                    Calculé automatiquement
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-base text-zinc-300">Titre *</Label>
              <Input
                className="h-12 text-base bg-zinc-900 border-zinc-700 text-white"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de la programmation"
              />
            </div>
            <div>
              <Label className="text-base mb-3 block">Média * - Sélectionnez visuellement</Label>
              {mediaLibrary.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-zinc-800 rounded-lg bg-black">
                  <Video className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                  <p className="text-sm text-zinc-400">
                    Aucun média disponible. Ajoutez d'abord des médias à votre bibliothèque.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1 bg-black rounded-lg border border-zinc-800">
                  {mediaLibrary.map((media) => {
                    const isSelected = formData.media_id === media.id;
                    return (
                      <Card
                        key={media.id}
                        onClick={() => handleMediaChange(media.id)}
                        className={`cursor-pointer transition-all overflow-hidden hover:shadow-lg ${
                          isSelected
                            ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500'
                            : 'border-zinc-800 bg-zinc-900 hover:border-amber-500/30'
                        }`}
                      >
                        <div className="relative aspect-video bg-black">
                          {media.thumbnail_url ? (
                            <img
                              src={media.thumbnail_url}
                              alt={media.title}
                              className="w-full h-full object-cover"
                            />
                          ) : media.media_url && extractYouTubeId(media.media_url) ? (
                            <img
                              src={`https://img.youtube.com/vi/${extractYouTubeId(media.media_url)}/maxresdefault.jpg`}
                              alt={media.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-zinc-900 to-black">
                              {media.type === 'video' ? (
                                <Video className="w-10 h-10 text-amber-600/30" />
                              ) : (
                                <Music className="w-10 h-10 text-amber-600/30" />
                              )}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-7 h-7 text-black" />
                              </div>
                            </div>
                          )}
                          {media.duration_seconds && (
                            <Badge className="absolute bottom-2 right-2 bg-black/90 text-amber-400 border-amber-600/30 text-sm font-bold px-3 py-1.5">
                              {Math.floor(media.duration_seconds / 60)}:{(media.duration_seconds % 60).toString().padStart(2, '0')}
                            </Badge>
                          )}
                        </div>
                        <div className="p-3 bg-zinc-950 border-t border-zinc-800">
                          <p className={`text-sm font-medium line-clamp-2 ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                            {media.title}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
              {formData.media_id && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  L'heure de fin sera calculée automatiquement selon la durée du média
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Annuler
              </Button>
              <Button onClick={handleAddSchedule} className="bg-amber-600 text-black hover:bg-amber-500">
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
