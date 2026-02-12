'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, Calendar, ArrowLeft, Home, ChevronUp, ChevronDown, Clock, Copy, CalendarRange, Check, Play } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminNavigation from '@/components/AdminNavigation';

interface ScheduleItem {
  id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  media_id?: string;
  media?: {
    title: string;
    duration_seconds: number;
    duration_ms?: number;
    media_url: string;
  };
}

interface PlayoutTimelineGridProps {
  channelType: 'webtv' | 'webradio';
}

interface MediaItem {
  id: string;
  title: string;
  media_url: string;
  duration_seconds: number;
  duration_ms?: number;
  type: string;
  thumbnail_url?: string;
}

export default function PlayoutTimelineGrid({ channelType }: PlayoutTimelineGridProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    start_time: '00:00',
    duration_seconds: 0,
    youtube_url: '',
    media_url: '',
  });
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateTargetDate, setDuplicateTargetDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [duplicateMode, setDuplicateMode] = useState<'day' | 'week' | 'single'>('day');
  const [scheduleToDuplicate, setScheduleToDuplicate] = useState<string | null>(null);
  const [duplicatePreview, setDuplicatePreview] = useState<ScheduleItem[]>([]);
  const [isEditingDuplicate, setIsEditingDuplicate] = useState(false);
  const [conflicts, setConflicts] = useState<{item: ScheduleItem, existing: ScheduleItem}[]>([]);
  const [conflictResolution, setConflictResolution] = useState<'replace' | 'skip' | 'ask'>('ask');

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSchedules();
    loadMediaLibrary();
  }, [currentDate, channelType]);

  async function loadSchedules() {
    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('playout_schedules')
        .select(`
          *,
          media:playout_media_library (
            title,
            duration_seconds,
            media_url
          )
        `)
        .eq('channel_type', channelType)
        .eq('scheduled_date', dateStr)
        .order('start_time');

      if (error) throw error;

      const mappedData = (data || []).map((item: any) => {
        if (item.media_library) {
          item.media = item.media_library;
        }
        return item;
      });

      setSchedules(mappedData);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  }

  async function loadMediaLibrary() {
    try {
      const mediaType = channelType === 'webtv' ? 'video' : 'audio';
      const { data, error } = await supabase
        .from('playout_media_library')
        .select('*')
        .eq('type', mediaType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaLibrary(data || []);
    } catch (error) {
      console.error('Error loading media library:', error);
      toast.error('Erreur lors du chargement de la médiathèque');
    }
  }

  function handleMediaSelect(mediaId: string) {
    const media = mediaLibrary.find((m) => m.id === mediaId);
    if (media) {
      setSelectedMediaId(mediaId);
      setFormData({
        ...formData,
        title: media.title,
        duration_seconds: media.duration_seconds || 0,
        media_url: media.media_url || '',
      });
      if (media.duration_seconds) {
        toast.success(`Durée automatique: ${Math.floor(media.duration_seconds / 60)}min ${media.duration_seconds % 60}s`);
      } else {
        toast.error('⚠️ Durée non définie! Cliquez sur "Détecter" pour l\'obtenir automatiquement', { duration: 5000 });
      }
    }
  }

  async function fetchYouTubeDuration(url: string) {
    try {
      setIsFetchingYoutube(true);
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-video-duration`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(`Erreur: ${data.error}`);
        if (data.error.includes('API key')) {
          toast.error('Veuillez configurer la clé API YouTube dans Supabase');
        }
        return;
      }

      if (data.duration && data.title) {
        const platform = data.platform === 'vimeo' ? 'Vimeo' : 'YouTube';
        setFormData({
          ...formData,
          title: data.title,
          duration_seconds: data.duration,
          youtube_url: url,
          media_url: url,
        });
        const minutes = Math.floor(data.duration / 60);
        const seconds = data.duration % 60;
        toast.success(`${platform} - Durée: ${minutes}min ${seconds}s`);
      } else {
        toast.error('Impossible de récupérer les informations de la vidéo');
      }
    } catch (error) {
      console.error('Error fetching video info:', error);
      toast.error('Erreur lors de la récupération des informations');
    } finally {
      setIsFetchingYoutube(false);
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
    if (!formData.title) {
      toast.error('⚠️ Le titre est obligatoire');
      return;
    }
    if (!formData.start_time) {
      toast.error('⚠️ L\'heure de début est obligatoire');
      return;
    }
    if (!formData.duration_seconds || formData.duration_seconds <= 0) {
      toast.error('⚠️ La durée est obligatoire! Utilisez le bouton "Détecter" pour l\'obtenir automatiquement', { duration: 6000 });
      return;
    }

    try {
      let mediaId = selectedMediaId || null;

      if (!mediaId && formData.youtube_url) {
        const { data: mediaData, error: mediaError } = await supabase
          .from('playout_media_library')
          .insert({
            title: formData.title,
            type: channelType === 'webtv' ? 'video' : 'audio',
            media_url: formData.youtube_url,
            duration_seconds: formData.duration_seconds,
            is_active: true,
          })
          .select()
          .single();

        if (mediaError) throw mediaError;
        mediaId = mediaData.id;
      }

      const endTime = calculateEndTime(formData.start_time, formData.duration_seconds);

      const { error } = await supabase.from('playout_schedules').insert({
        channel_type: channelType,
        title: formData.title,
        media_id: mediaId,
        scheduled_date: format(currentDate, 'yyyy-MM-dd'),
        start_time: formData.start_time,
        end_time: endTime,
        status: 'scheduled',
      });

      if (error) throw error;

      toast.success('Programmation ajoutée');
      setFormData({
        title: '',
        start_time: endTime,
        duration_seconds: 0,
        youtube_url: '',
        media_url: '',
      });
      setYoutubeUrl('');
      setSelectedMediaId('');
      setIsAddDialogOpen(false);
      loadSchedules();
      loadMediaLibrary();
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  }

  async function handleDeleteSchedule(id: string) {
    if (!confirm('Supprimer cette programmation ?')) return;

    try {
      const { error } = await supabase.from('playout_schedules').delete().eq('id', id);
      if (error) throw error;
      toast.success('Programmation supprimée');
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleDrop(dropTime: string) {
    if (!draggedItem) return;

    const item = schedules.find((s) => s.id === draggedItem);
    if (!item) return;

    try {
      const duration = calculateDuration(item.start_time, item.end_time);
      const newEndTime = calculateEndTime(dropTime, duration);

      const { error } = await supabase
        .from('playout_schedules')
        .update({
          start_time: dropTime,
          end_time: newEndTime,
        })
        .eq('id', draggedItem);

      if (error) throw error;
      toast.success('Programmation déplacée');
      loadSchedules();
    } catch (error) {
      console.error('Error moving schedule:', error);
      toast.error('Erreur lors du déplacement');
    }

    setDraggedItem(null);
  }

  function calculateDuration(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM) * 60;
  }

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  async function openDuplicateDialog(mode: 'day' | 'week' | 'single', scheduleId?: string) {
    setDuplicateMode(mode);
    setScheduleToDuplicate(scheduleId || null);
    setConflicts([]);
    setConflictResolution('ask');

    if (mode === 'week') {
      setDuplicateTargetDate(format(addDays(currentDate, 7), 'yyyy-MM-dd'));
      await loadWeekSchedules();
    } else if (mode === 'day') {
      setDuplicateTargetDate(format(addDays(currentDate, 1), 'yyyy-MM-dd'));
      setDuplicatePreview(schedules.map(s => ({
        ...s,
        id: `preview-${s.id}`,
        scheduled_date: format(addDays(currentDate, 1), 'yyyy-MM-dd')
      })));
    } else if (scheduleId) {
      setDuplicateTargetDate(format(addDays(currentDate, 1), 'yyyy-MM-dd'));
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule) {
        setDuplicatePreview([{
          ...schedule,
          id: `preview-${schedule.id}`,
          scheduled_date: format(addDays(currentDate, 1), 'yyyy-MM-dd')
        }]);
      }
    }

    setIsDuplicateDialogOpen(true);
    setIsEditingDuplicate(false);
  }

  async function loadWeekSchedules() {
    try {
      const weekSchedules: ScheduleItem[] = [];
      for (let i = 0; i < 7; i++) {
        const date = format(addDays(currentDate, i), 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('playout_schedules')
          .select(`
            *,
            media:playout_media_library (
              title,
              duration_seconds,
              media_url
            )
          `)
          .eq('channel_type', channelType)
          .eq('scheduled_date', date)
          .order('start_time');

        if (error) throw error;

        const mappedData = (data || []).map((item: any) => {
          if (item.media_library) {
            item.media = item.media_library;
          }
          return {
            ...item,
            id: `preview-${item.id}`,
            scheduled_date: format(addDays(new Date(date), 7), 'yyyy-MM-dd')
          };
        });

        weekSchedules.push(...mappedData);
      }

      setDuplicatePreview(weekSchedules);
      toast.success(`${weekSchedules.length} programmes chargés pour la semaine`);
    } catch (error) {
      console.error('Error loading week schedules:', error);
      toast.error('Erreur lors du chargement de la semaine');
    }
  }

  function updateDuplicatePreviewDate(newDate: string) {
    setDuplicateTargetDate(newDate);
    setDuplicatePreview(prev => prev.map(p => ({
      ...p,
      scheduled_date: newDate
    })));
  }

  function updatePreviewItem(index: number, field: string, value: any) {
    setDuplicatePreview(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  function removePreviewItem(index: number) {
    setDuplicatePreview(prev => prev.filter((_, i) => i !== index));
  }

  async function checkConflicts(items: ScheduleItem[]) {
    try {
      const uniqueDates = Array.from(new Set(items.map(i => i.scheduled_date)));
      const allExisting: ScheduleItem[] = [];

      for (const date of uniqueDates) {
        const { data, error } = await supabase
          .from('playout_schedules')
          .select('*')
          .eq('channel_type', channelType)
          .eq('scheduled_date', date);

        if (error) throw error;
        if (data) allExisting.push(...data as ScheduleItem[]);
      }

      const detectedConflicts: {item: ScheduleItem, existing: ScheduleItem}[] = [];

      items.forEach(item => {
        const itemStartMin = timeToMinutes(item.start_time);
        const itemEndMin = timeToMinutes(item.end_time);

        allExisting.forEach(existing => {
          if (existing.scheduled_date !== item.scheduled_date) return;

          const existStartMin = timeToMinutes(existing.start_time);
          const existEndMin = timeToMinutes(existing.end_time);

          const hasOverlap = (
            (itemStartMin >= existStartMin && itemStartMin < existEndMin) ||
            (itemEndMin > existStartMin && itemEndMin <= existEndMin) ||
            (itemStartMin <= existStartMin && itemEndMin >= existEndMin)
          );

          if (hasOverlap) {
            detectedConflicts.push({ item, existing });
          }
        });
      });

      return detectedConflicts;
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  }

  async function confirmDuplicate() {
    if (duplicatePreview.length === 0) {
      toast.error('Aucun programme à dupliquer');
      return;
    }

    const detectedConflicts = await checkConflicts(duplicatePreview);

    if (detectedConflicts.length > 0 && conflictResolution === 'ask') {
      setConflicts(detectedConflicts);
      toast.warning(`${detectedConflicts.length} conflit(s) détecté(s). Veuillez choisir une action.`);
      return;
    }

    try {
      if (conflictResolution === 'replace' && conflicts.length > 0) {
        const conflictIds = conflicts.map(c => c.existing.id);
        const { error: deleteError } = await supabase
          .from('playout_schedules')
          .delete()
          .in('id', conflictIds);

        if (deleteError) throw deleteError;
        toast.info(`${conflictIds.length} programme(s) existant(s) remplacé(s)`);
      }

      let itemsToInsert = duplicatePreview;
      if (conflictResolution === 'skip') {
        const conflictItemIds = conflicts.map(c => c.item.id);
        itemsToInsert = duplicatePreview.filter(item => !conflictItemIds.includes(item.id));
      }

      if (itemsToInsert.length === 0) {
        toast.info('Aucun programme à insérer après résolution des conflits');
        return;
      }

      const insertData = itemsToInsert.map(item => ({
        channel_type: channelType,
        title: item.title,
        media_id: item.media_id,
        scheduled_date: item.scheduled_date,
        start_time: item.start_time,
        end_time: item.end_time,
        status: 'scheduled'
      }));

      const { error } = await supabase
        .from('playout_schedules')
        .insert(insertData);

      if (error) throw error;

      toast.success(`${itemsToInsert.length} programme(s) dupliqué(s) avec succès`);
      setIsDuplicateDialogOpen(false);
      setDuplicatePreview([]);
      setConflicts([]);
      setConflictResolution('ask');

      loadSchedules();
    } catch (error) {
      console.error('Error duplicating schedules:', error);
      toast.error('Erreur lors de la duplication');
    }
  }

  function renderTimeline() {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const pixelsPerMinute = 2;

    return (
      <div className="relative" style={{ height: `${24 * 60 * pixelsPerMinute}px` }}>
        {hours.map((hour) => (
          <div
            key={hour}
            className="absolute w-full border-t border-border"
            style={{ top: `${hour * 60 * pixelsPerMinute}px` }}
          >
            <div className="sticky left-0 bg-background px-4 py-1 text-sm font-semibold text-muted-foreground">
              {hour.toString().padStart(2, '0')}:00
            </div>
          </div>
        ))}

        {Array.from({ length: 24 * 60 }, (_, i) => i).map((minute) => (
          <div
            key={minute}
            className="absolute w-full cursor-pointer hover:bg-primary/5"
            style={{
              top: `${minute * pixelsPerMinute}px`,
              height: `${pixelsPerMinute}px`,
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(minutesToTime(minute))}
          />
        ))}

        {schedules.map((schedule) => {
          const startMinutes = timeToMinutes(schedule.start_time);
          const endMinutes = timeToMinutes(schedule.end_time);
          const duration = endMinutes - startMinutes;

          return (
            <div
              key={schedule.id}
              draggable
              onDragStart={() => setDraggedItem(schedule.id)}
              onDragEnd={() => setDraggedItem(null)}
              className="absolute left-24 right-4 bg-primary text-primary-foreground rounded-lg p-3 shadow-lg cursor-move hover:shadow-xl transition-all group border-2 border-primary/20"
              style={{
                top: `${startMinutes * pixelsPerMinute}px`,
                height: `${duration * pixelsPerMinute}px`,
                minHeight: '60px',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="w-4 h-4 flex-shrink-0 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{schedule.title}</div>
                    <div className="text-xs opacity-90 mt-1">
                      {schedule.start_time} - {schedule.end_time}
                      {schedule.media && (
                        <span className="ml-2">
                          ({Math.floor(schedule.media.duration_seconds / 60)}min)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                    onClick={() => openDuplicateDialog('single', schedule.id)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b bg-card p-4">
        <div className="container mx-auto">
          <AdminNavigation
            title={`${channelType === 'webtv' ? 'WebTV' : 'WebRadio'} - Programmation`}
          />
        </div>
        <div className="container mx-auto mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subDays(currentDate, 1))}
            >
              <Calendar className="w-4 h-4" />
            </Button>
            <div className="text-lg font-semibold px-4">
              {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addDays(currentDate, 1))}
            >
              <Calendar className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Aujourd'hui
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => openDuplicateDialog('day')}
              variant="outline"
              size="lg"
              className="gap-2"
              disabled={schedules.length === 0}
            >
              <Copy className="w-5 h-5" />
              Dupliquer la journée
            </Button>
            <Button
              onClick={() => openDuplicateDialog('week')}
              variant="outline"
              size="lg"
              className="gap-2 border-amber-500/30 hover:bg-amber-500/10"
            >
              <CalendarRange className="w-5 h-5" />
              Dupliquer la semaine
            </Button>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter une programmation
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto" ref={timelineRef}>
        <div className="min-w-[800px]">{renderTimeline()}</div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Ajouter une programmation</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="library">Depuis la médiathèque</TabsTrigger>
              <TabsTrigger value="youtube">Ajouter YouTube/Vimeo</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto space-y-4 px-1">
              <TabsContent value="library" className="mt-0 pt-4 space-y-4">
                <div>
                  <Label className="text-base mb-3 block text-zinc-300">📺 Sélectionner un média visuellement</Label>
                {mediaLibrary.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900 rounded-lg border border-amber-600/20">
                    <p className="text-zinc-400">Aucun média dans la médiathèque</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2">
                    {mediaLibrary.map((media) => {
                      const isSelected = selectedMediaId === media.id;
                      const durationText = media.duration_seconds
                        ? `${Math.floor(media.duration_seconds / 60)}:${(media.duration_seconds % 60).toString().padStart(2, '0')}`
                        : 'Durée non définie';

                      return (
                        <div
                          key={media.id}
                          onClick={() => handleMediaSelect(media.id)}
                          className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected
                              ? 'border-amber-500 shadow-lg shadow-amber-500/50'
                              : 'border-transparent hover:border-amber-500/50'
                          }`}
                        >
                          {/* Miniature */}
                          <div className="aspect-video bg-black/40 relative overflow-hidden">
                            {media.thumbnail_url ? (
                              <img
                                src={media.thumbnail_url}
                                alt={media.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                                <Play className="w-12 h-12 text-amber-400/50" />
                              </div>
                            )}

                            {/* Overlay sélectionné */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                                  <Check className="w-6 h-6 text-black" />
                                </div>
                              </div>
                            )}

                            {/* Durée */}
                            <div className="absolute bottom-2 right-2 bg-black/90 px-3 py-1.5 rounded text-sm font-bold text-amber-400 border border-amber-600/30">
                              {durationText}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-3 bg-black/60">
                            <p className="text-sm font-medium text-white truncate" title={media.title}>
                              {media.title}
                            </p>
                            <p className="text-xs text-amber-400/70 capitalize">
                              {media.type}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-zinc-400 mt-3">
                  Cliquez sur une vignette pour sélectionner le média à ajouter au planning
                </p>
              </div>
            </TabsContent>

            <TabsContent value="youtube" className="mt-0 pt-4 space-y-4">
              <div>
                <Label className="text-base">URL YouTube / Vimeo</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="h-12 text-base"
                  />
                  <Button
                    onClick={() => fetchYouTubeDuration(youtubeUrl)}
                    disabled={!youtubeUrl || isFetchingYoutube}
                    className="h-12"
                  >
                    {isFetchingYoutube ? 'Chargement...' : 'Récupérer'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Collez l'URL YouTube ou Vimeo et cliquez sur "Récupérer" pour obtenir le titre et la durée automatiquement
                </p>
              </div>
            </TabsContent>

            <div className="space-y-4 pt-4">
              <Label className="text-base">Titre</Label>
              <Input
                placeholder="Titre de la programmation"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-12 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2 mb-2">
                  <Clock className="w-6 h-6 text-amber-400" />
                  Heure de début
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="h-12 text-lg font-mono bg-background text-foreground border-2 border-primary/20 focus:border-primary"
                  />
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-5 w-8"
                      onClick={() => {
                        const [hours, minutes] = formData.start_time.split(':').map(Number);
                        const newMinutes = (minutes + 15) % 60;
                        const newHours = minutes + 15 >= 60 ? (hours + 1) % 24 : hours;
                        setFormData({
                          ...formData,
                          start_time: `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
                        });
                      }}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-5 w-8"
                      onClick={() => {
                        const [hours, minutes] = formData.start_time.split(':').map(Number);
                        const newMinutes = minutes - 15 < 0 ? 60 + (minutes - 15) : minutes - 15;
                        const newHours = minutes - 15 < 0 ? (hours - 1 + 24) % 24 : hours;
                        setFormData({
                          ...formData,
                          start_time: `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
                        });
                      }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setFormData({ ...formData, start_time: '00:00' })}
                  >
                    00:00
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setFormData({ ...formData, start_time: '06:00' })}
                  >
                    06:00
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setFormData({ ...formData, start_time: '12:00' })}
                  >
                    12:00
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setFormData({ ...formData, start_time: '18:00' })}
                  >
                    18:00
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-base font-semibold">Durée (en secondes)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={formData.duration_seconds || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })
                    }
                    className="h-12 text-lg bg-background text-foreground border-2 border-input focus:border-primary"
                    disabled={!!formData.youtube_url}
                  />
                  {formData.media_url && !formData.duration_seconds && !isFetchingYoutube && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-12 px-4 whitespace-nowrap bg-orange-600 hover:bg-orange-700"
                      onClick={async () => {
                        if (formData.media_url) {
                          await fetchYouTubeDuration(formData.media_url);
                        }
                      }}
                    >
                      Détecter
                    </Button>
                  )}
                </div>
                {formData.duration_seconds > 0 ? (
                  <p className="text-sm text-primary font-medium mt-1">
                    ✓ {Math.floor(formData.duration_seconds / 60)}min {formData.duration_seconds % 60}s
                  </p>
                ) : formData.media_url && !isFetchingYoutube ? (
                  <p className="text-sm text-orange-600 font-medium mt-1 flex items-center gap-1">
                    ⚠️ Durée manquante - Cliquez sur "Détecter" pour l'obtenir automatiquement
                  </p>
                ) : null}
              </div>
            </div>
            </div>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50 bg-background flex-shrink-0">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Fermer
            </Button>
            <Button
              onClick={handleAddSchedule}
              disabled={!formData.title || !formData.duration_seconds || formData.duration_seconds <= 0}
              className={!formData.duration_seconds || formData.duration_seconds <= 0 ? 'opacity-50 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-black font-bold'}
            >
              {!formData.duration_seconds || formData.duration_seconds <= 0 ? '⚠️ Durée requise' : 'Ajouter et continuer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {duplicateMode === 'week' && (
                <>
                  <CalendarRange className="w-5 h-5 text-amber-500" />
                  Dupliquer toute la semaine ({duplicatePreview.length} programmes)
                </>
              )}
              {duplicateMode === 'day' && (
                <>
                  <Copy className="w-5 h-5 text-blue-500" />
                  Dupliquer toute la journée ({schedules.length} programmes)
                </>
              )}
              {duplicateMode === 'single' && (
                <>
                  <Copy className="w-5 h-5" />
                  Dupliquer le programme
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-auto">
            {duplicateMode === 'week' ? (
              <div className="space-y-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-700 font-semibold">
                  <CalendarRange className="w-5 h-5" />
                  Duplication de la semaine entière
                </div>
                <p className="text-sm text-muted-foreground">
                  Les programmes du {format(currentDate, 'd MMM', { locale: fr })} au {format(addDays(currentDate, 6), 'd MMM yyyy', { locale: fr })} seront dupliqués vers la semaine suivante
                </p>
                <p className="text-xs text-amber-600 font-medium">
                  ⚠️ Cette action copiera tous les programmes de la semaine actuelle
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Date cible</Label>
                <Input
                  type="date"
                  value={duplicateTargetDate}
                  onChange={(e) => updateDuplicatePreviewDate(e.target.value)}
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Les programmes seront dupliqués sur cette date avec les mêmes horaires
                </p>
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="space-y-3 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-700 font-semibold">
                  <Clock className="w-5 h-5" />
                  Conflits détectés ({conflicts.length})
                </div>
                <p className="text-sm text-muted-foreground">
                  Certains créneaux horaires sont déjà occupés. Choisissez comment gérer ces conflits :
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setConflictResolution('replace')}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      conflictResolution === 'replace'
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-border hover:border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Check className={`w-5 h-5 ${conflictResolution === 'replace' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-semibold">Remplacer les programmes existants</div>
                        <div className="text-xs text-muted-foreground">
                          Les programmes en conflit seront supprimés et remplacés par les nouveaux
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setConflictResolution('skip')}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      conflictResolution === 'skip'
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-border hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Check className={`w-5 h-5 ${conflictResolution === 'skip' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-semibold">Ignorer les conflits</div>
                        <div className="text-xs text-muted-foreground">
                          Ne dupliquer que les programmes sans conflit
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  <div className="text-xs font-semibold text-muted-foreground">Détails des conflits :</div>
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className="text-xs bg-background/50 p-2 rounded border">
                      <span className="font-semibold">{conflict.item.title}</span>
                      <span className="text-muted-foreground"> ({conflict.item.start_time} - {conflict.item.end_time})</span>
                      <span className="text-orange-600"> ⚠️ conflit avec </span>
                      <span className="font-semibold">{conflict.existing.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Programmes à dupliquer ({duplicatePreview.length})
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDuplicate(!isEditingDuplicate)}
                >
                  {isEditingDuplicate ? 'Masquer les modifications' : 'Modifier les programmes'}
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                {duplicatePreview.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Aucun programme à dupliquer</p>
                  </div>
                ) : (
                  duplicatePreview.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      {isEditingDuplicate ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">Programme {index + 1}</Label>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-destructive/20"
                              onClick={() => removePreviewItem(index)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs">Titre</Label>
                            <Input
                              value={item.title}
                              onChange={(e) => updatePreviewItem(index, 'title', e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Heure de début</Label>
                              <Input
                                type="time"
                                value={item.start_time}
                                onChange={(e) => {
                                  updatePreviewItem(index, 'start_time', e.target.value);
                                  if (item.media?.duration_seconds) {
                                    const newEndTime = calculateEndTime(e.target.value, item.media.duration_seconds);
                                    updatePreviewItem(index, 'end_time', newEndTime);
                                  }
                                }}
                                className="h-10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Heure de fin</Label>
                              <Input
                                type="time"
                                value={item.end_time}
                                onChange={(e) => updatePreviewItem(index, 'end_time', e.target.value)}
                                className="h-10"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.start_time} - {item.end_time}
                              {item.media && (
                                <span className="ml-2">
                                  ({Math.floor(item.media.duration_seconds / 60)}min)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {conflicts.length > 0 ? (
                <span className="text-orange-600 font-medium">
                  ⚠️ {conflicts.length} conflit(s) - {duplicatePreview.length - conflicts.length} programme(s) sans conflit
                </span>
              ) : (
                <span>
                  {duplicateMode === 'week' ? (
                    <>Semaine entière • {duplicatePreview.length} programme(s)</>
                  ) : (
                    <>{duplicatePreview.length} programme(s) • {duplicateMode === 'day' ? format(new Date(duplicateTargetDate), 'd MMMM yyyy', { locale: fr }) : format(new Date(duplicateTargetDate), 'd MMMM yyyy', { locale: fr })}</>
                  )}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDuplicateDialogOpen(false);
                  setDuplicatePreview([]);
                  setConflicts([]);
                  setConflictResolution('ask');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={confirmDuplicate}
                disabled={duplicatePreview.length === 0 || (conflicts.length > 0 && conflictResolution === 'ask')}
                className={conflicts.length > 0 && conflictResolution !== 'ask' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <Copy className="w-4 h-4 mr-2" />
                {conflicts.length > 0 && conflictResolution !== 'ask'
                  ? conflictResolution === 'replace'
                    ? 'Remplacer et dupliquer'
                    : 'Ignorer conflits et dupliquer'
                  : 'Confirmer la duplication'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
