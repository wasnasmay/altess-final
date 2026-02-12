'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus,
  Trash2,
  Clock,
  ArrowUp,
  ArrowDown,
  Save,
  Library,
  Tv,
  Radio,
  Wand2,
  AlertCircle,
  Copy,
  CalendarClock,
  CalendarRange,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AdminNavigation from '@/components/AdminNavigation';

type MediaItem = {
  id: string;
  title: string;
  type: string;
  duration_seconds: number;
  duration_ms?: number;
  thumbnail_url: string | null;
};

type ScheduleItem = {
  id?: string;
  media_id: string;
  scheduled_time: string;
  start_time?: string;
  end_time?: string;
  title?: string;
  duration_seconds: number;
  order_position: number;
  transition_effect?: string;
  transition_duration?: number;
  media?: MediaItem;
};

type Channel = {
  id: string;
  name: string;
  type: string;
};

export default function PlayoutSchedulePage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState('00:00');
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [transitionEffect, setTransitionEffect] = useState('cut');
  const [transitionDuration, setTransitionDuration] = useState(1000);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [itemToDuplicate, setItemToDuplicate] = useState<ScheduleItem | null>(null);
  const [duplicateDate, setDuplicateDate] = useState<Date>(new Date());
  const [duplicateTime, setDuplicateTime] = useState('00:00');
  const [isAddingToSchedule, setIsAddingToSchedule] = useState(false);

  useEffect(() => {
    loadChannels();
    loadMediaLibrary();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadSchedule();
    }
  }, [selectedChannel, selectedDate]);

  // Réinitialisation du flag et du média sélectionné quand le dialog s'ouvre
  useEffect(() => {
    if (isAddDialogOpen) {
      setIsAddingToSchedule(false);
      setSelectedMedia('');
      console.log('[Playout Schedule] 🔄 Dialog ouvert, rechargement bibliothèque...');
      loadMediaLibrary();
    }
  }, [isAddDialogOpen]);

  async function loadChannels() {
    console.log('[Playout Schedule] 🔌 Chargement des canaux...');
    const { data } = await supabase
      .from('playout_channels')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data && data.length > 0) {
      console.log('[Playout Schedule] 📺 Canaux trouvés:', data.length);
      setChannels(data);

      // PRIORITÉ : Toujours sélectionner Web TV par défaut
      const webTvChannel = data.find(c => c.type === 'tv');
      const defaultChannel = webTvChannel || data[0];

      console.log('[Playout Schedule] ✅ CANAL PAR DÉFAUT SÉLECTIONNÉ:', {
        name: defaultChannel.name,
        type: defaultChannel.type,
        id: defaultChannel.id
      });

      setSelectedChannel(defaultChannel);
    } else {
      console.warn('[Playout Schedule] ⚠️ Aucun canal dans la base, création de canaux par défaut');

      // CANAUX PAR DÉFAUT : Toujours Web TV en premier
      const defaultChannels: Channel[] = [
        { id: 'default-tv', name: 'Web TV', type: 'tv' },
        { id: 'default-radio', name: 'Web Radio', type: 'radio' }
      ];

      setChannels(defaultChannels);
      setSelectedChannel(defaultChannels[0]); // Web TV par défaut

      console.log('[Playout Schedule] ✅ Canaux par défaut créés - Web TV sélectionné');
    }
  }

  async function loadMediaLibrary() {
    console.log('[Playout Schedule] 📚 Chargement de la bibliothèque média...');

    const { data, error } = await supabase
      .from('playout_media_library')
      .select('id, title, type, duration_seconds, duration_ms, thumbnail_url')
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('[Playout Schedule] ❌ Erreur chargement média:', error);
      return;
    }

    if (data) {
      console.log('[Playout Schedule] ✅ Médias chargés:', data.length);

      const normalizedData = data.map(media => {
        let finalDuration = media.duration_seconds;

        if (!finalDuration || finalDuration === 0) {
          if ((media as any).duration_ms && (media as any).duration_ms > 0) {
            finalDuration = Math.round((media as any).duration_ms / 1000);
            console.log(`[Playout Schedule] 🔄 Conversion ms→s pour "${media.title.substring(0, 40)}": ${(media as any).duration_ms}ms → ${finalDuration}s`);
          } else {
            finalDuration = 180;
            console.warn(`[Playout Schedule] ⚠️ Pas de durée valide pour "${media.title.substring(0, 40)}", fallback: 180s`);
          }
        }

        return {
          ...media,
          duration_seconds: finalDuration
        };
      });

      normalizedData.forEach((media, index) => {
        console.log(`[Playout Schedule] 📹 Media ${index + 1}:`, {
          id: media.id,
          title: media.title.substring(0, 50),
          type: media.type,
          duration_seconds: media.duration_seconds,
          duration_formatted: formatTime(media.duration_seconds || 0),
          is_valid: media.duration_seconds > 0 ? '✅' : '❌'
        });
      });

      const invalidCount = normalizedData.filter(m => !m.duration_seconds || m.duration_seconds === 0).length;
      if (invalidCount > 0) {
        console.warn(`[Playout Schedule] ⚠️ ${invalidCount} médias avec durée invalide après normalisation`);
      }

      setMediaLibrary(normalizedData);
    } else {
      console.warn('[Playout Schedule] ⚠️ Aucun média dans la bibliothèque');
      setMediaLibrary([]);
    }
  }

  async function loadSchedule() {
    if (!selectedChannel) {
      console.log('[Playout Schedule] loadSchedule: no channel selected');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    console.log('[Playout Schedule] 📺 Loading schedule for:', {
      date: dateStr,
      channel_name: selectedChannel.name,
      channel_id: selectedChannel.id,
      channel_type: selectedChannel.type
    });

    const { data, error } = await supabase
      .from('playout_schedules')
      .select(`
        *,
        media:playout_media_library(id, title, type, duration_seconds, thumbnail_url)
      `)
      .eq('channel_id', selectedChannel.id)
      .eq('scheduled_date', dateStr)
      .order('scheduled_time');

    if (error) {
      console.error('[Playout Schedule] ❌ Error loading schedule:', error);
      toast.error(`Erreur chargement planning: ${error.message}`);
      return;
    }

    if (data) {
      console.log('[Playout Schedule] 📦 Raw data from DB:', data.length, 'items');

      const items = data.map(item => {
        // Les champs sont déjà corrects dans la nouvelle table
        const scheduledTime = item.scheduled_time || '00:00:00';
        const durationSeconds = item.duration_seconds || 0;

        return {
          ...item,
          scheduled_time: scheduledTime.substring(0, 5), // Format HH:mm
          duration_seconds: durationSeconds,
          order_position: item.order_position || 0,
          media: item.media as unknown as MediaItem
        };
      });

      console.log('[Playout Schedule] ✅ Loaded', items.length, 'schedule items');
      console.log('[Playout Schedule] 🎬 Items details:', items.map(i => ({
        id: i.id,
        title: i.title,
        time: i.scheduled_time,
        duration: i.duration_seconds
      })));

      setSchedule(items);
    } else {
      console.log('[Playout Schedule] ℹ️ No scheduled items for this date/channel');
      setSchedule([]);
    }
  }

  function checkTimeConflict(startTime: string, durationSeconds: number): boolean {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startInSeconds = hours * 3600 + minutes * 60;
    const endInSeconds = startInSeconds + durationSeconds;

    return schedule.some(item => {
      const [itemHours, itemMinutes] = item.scheduled_time.split(':').map(Number);
      const itemStartInSeconds = itemHours * 3600 + itemMinutes * 60;
      const itemEndInSeconds = itemStartInSeconds + item.duration_seconds;

      return (
        (startInSeconds >= itemStartInSeconds && startInSeconds < itemEndInSeconds) ||
        (endInSeconds > itemStartInSeconds && endInSeconds <= itemEndInSeconds) ||
        (startInSeconds <= itemStartInSeconds && endInSeconds >= itemEndInSeconds)
      );
    });
  }

  function getNextAvailableTime(): string {
    if (schedule.length === 0) return '00:00';

    const lastItem = schedule[schedule.length - 1];
    const [hours, minutes] = lastItem.scheduled_time.split(':').map(Number);
    const lastStartInSeconds = hours * 3600 + minutes * 60;
    const nextStartInSeconds = lastStartInSeconds + lastItem.duration_seconds;

    const nextHours = Math.floor(nextStartInSeconds / 3600) % 24;
    const nextMinutes = Math.floor((nextStartInSeconds % 3600) / 60);

    return `${nextHours.toString().padStart(2, '0')}:${nextMinutes.toString().padStart(2, '0')}`;
  }

  async function handleAddToSchedule() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔥🔥🔥 FONCTION handleAddToSchedule APPELÉE 🔥🔥🔥');
    console.log('═══════════════════════════════════════════════════════');
    console.log('[Playout Schedule] Début de la fonction');
    console.log('  - selectedChannel:', selectedChannel?.name);
    console.log('  - selectedMedia:', selectedMedia);
    console.log('  - selectedDate:', format(selectedDate, 'yyyy-MM-dd'));
    console.log('  - autoSchedule:', autoSchedule);
    console.log('  - scheduledTime:', scheduledTime);

    // Auto-sélection du canal si aucun n'est sélectionné
    let channelToUse = selectedChannel;
    if (!channelToUse && channels.length > 0) {
      channelToUse = channels.find(c => c.type === 'tv') || channels[0];
      setSelectedChannel(channelToUse);
      console.log('[Playout Schedule] ✅ Canal sélectionné automatiquement:', channelToUse.name);
    }

    if (!channelToUse || !selectedMedia) {
      console.error('[Playout Schedule] ❌ Missing channel or media');
      if (!channelToUse) {
        toast.error('Aucun canal disponible');
      } else {
        toast.error('Veuillez sélectionner un média');
      }
      return;
    }

    // ✅ RÉCUPÉRER LA DURÉE DIRECTEMENT DEPUIS LA BASE DE DONNÉES
    console.log('[Playout Schedule] 🔍 Récupération de la durée depuis la base...');
    console.log('[Playout Schedule] 🔍 selectedMedia ID:', selectedMedia, 'Type:', typeof selectedMedia);

    const { data: mediaFromDB, error: mediaError } = await supabase
      .from('playout_media_library')
      .select('*')
      .eq('id', selectedMedia)
      .maybeSingle();

    console.log('[Playout Schedule] 📊 Résultat requête DB:', {
      error: mediaError,
      data: mediaFromDB,
      duration_seconds: mediaFromDB?.duration_seconds,
      duration_ms: (mediaFromDB as any)?.duration_ms
    });

    if (mediaError) {
      console.error('[Playout Schedule] ❌ Erreur SQL récupération média:', mediaError);
      toast.error(`Erreur SQL: ${mediaError.message}`);
      return;
    }

    if (!mediaFromDB) {
      console.error('[Playout Schedule] ❌ Média non trouvé dans playout_media_library');
      console.error('[Playout Schedule] ID recherché:', selectedMedia);
      toast.error('Média introuvable dans la base de données');
      return;
    }

    console.log('[Playout Schedule] ✅ Média trouvé:', mediaFromDB.title);
    console.log('[Playout Schedule] ✅ Durée depuis DB (seconds):', mediaFromDB.duration_seconds);
    console.log('[Playout Schedule] ✅ Durée depuis DB (ms):', (mediaFromDB as any).duration_ms);

    let effectiveDuration = mediaFromDB.duration_seconds;

    if (!effectiveDuration || effectiveDuration === 0) {
      if ((mediaFromDB as any).duration_ms && (mediaFromDB as any).duration_ms > 0) {
        effectiveDuration = Math.round((mediaFromDB as any).duration_ms / 1000);
        console.log('[Playout Schedule] 🔄 Conversion duration_ms → duration_seconds');
        console.log('[Playout Schedule] 🔄', (mediaFromDB as any).duration_ms, 'ms →', effectiveDuration, 'secondes');
        console.log('[Playout Schedule] ✅ Durée valide après conversion:', formatTime(effectiveDuration));
      } else {
        effectiveDuration = 180;
        console.warn('[Playout Schedule] ⚠️ PROBLÈME: Aucune durée valide dans la base!');
        console.warn('[Playout Schedule] ⚠️ Média:', mediaFromDB.title);
        console.warn('[Playout Schedule] ⚠️ duration_seconds:', mediaFromDB.duration_seconds);
        console.warn('[Playout Schedule] ⚠️ duration_ms:', (mediaFromDB as any).duration_ms);
        console.warn('[Playout Schedule] ⚠️ Application durée par défaut: 180 secondes');
        toast.warning('⚠️ Ce média n\'a pas de durée valide. Durée par défaut de 3 minutes appliquée.', {
          duration: 4000,
        });
      }
    } else {
      console.log('[Playout Schedule] ✅ Durée valide détectée:', effectiveDuration, 'secondes');
      console.log('[Playout Schedule] ✅ Formatée:', formatTime(effectiveDuration));
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const finalTime = autoSchedule ? getNextAvailableTime() : scheduledTime;

    console.log('[Playout Schedule] Scheduling for:', finalTime);
    console.log('[Playout Schedule] Effective duration used:', effectiveDuration, 'seconds');

    if (!autoSchedule && checkTimeConflict(scheduledTime, effectiveDuration)) {
      const confirmAdd = window.confirm(
        `⚠️ Conflit d'horaire détecté!\n\n` +
        `Cette plage horaire (${scheduledTime} - ${calculateEndTime(scheduledTime, effectiveDuration)}) ` +
        `est déjà occupée.\n\n` +
        `Voulez-vous quand même ajouter ce média?`
      );

      if (!confirmAdd) {
        console.log('[Playout Schedule] User cancelled due to conflict');
        return;
      }
    }

    const scheduledDateTime = `${dateStr}T${finalTime}:00`;

    try {
      setIsAddingToSchedule(true);
      console.log('[Playout Schedule] Getting authenticated user...');

      const { data: { user } } = await supabase.auth.getUser();
      console.log('[Playout Schedule] User:', user?.id || 'anonymous');

      const endTime = calculateEndTime(finalTime, effectiveDuration);

      // Calculer la prochaine position dans le planning
      const maxPosition = schedule.length > 0
        ? Math.max(...schedule.map(s => s.order_position || 0))
        : 0;

      // CRITIQUE : Utiliser media.id (ID réel de la base) et channel_id
      // Créer un timestamp ISO valide pour PostgreSQL
      const scheduledDateTime = new Date(`${dateStr}T${finalTime}:00`).toISOString();

      const insertData = {
        channel_id: channelToUse.id,  // ✅ ID du canal
        media_id: mediaFromDB.id,  // ✅ ID RÉEL de playout_media_library
        scheduled_date: dateStr,
        scheduled_time: finalTime,
        scheduled_datetime: scheduledDateTime,
        duration_seconds: effectiveDuration,
        order_position: maxPosition + 1,
        status: 'scheduled',
        created_by: user?.id,
      };

      console.log('[Playout Schedule] 🔍 VALIDATION FINALE - Insert data:', {
        ...insertData,
        channel_name: channelToUse.name,
        media_id_source: 'mediaFromDB.id (FROM playout_media_library)',
        media_id_type: typeof mediaFromDB.id,
        media_title: mediaFromDB.title,
        duration_from_db: mediaFromDB.duration_seconds
      });

      console.log('[Playout Schedule] ✅ media_id VALIDÉ depuis DB:', {
        id: mediaFromDB.id,
        title: mediaFromDB.title,
        duration: mediaFromDB.duration_seconds
      });

      console.log('[Playout Schedule] Inserting into playout_schedules:', insertData);
      console.log('[Playout Schedule]   - Start:', finalTime, '→ End:', endTime);
      console.log('[Playout Schedule]   - Duration:', effectiveDuration, 'seconds');
      console.log('[Playout Schedule]   - Channel ID:', channelToUse.id);

      const { data, error } = await supabase
        .from('playout_schedules')
        .insert(insertData)
        .select();

      if (error) {
        console.error('═══════════════════════════════════════════════════════');
        console.error('[Playout Schedule] ❌❌❌ ERREUR SQL D\'INSERTION ❌❌❌');
        console.error('═══════════════════════════════════════════════════════');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        console.error('Data tentée d\'insertion:', insertData);
        console.error('═══════════════════════════════════════════════════════');

        // Message d'erreur spécifique selon le type
        if (error.message.includes('foreign key')) {
          throw new Error(`❌ FOREIGN KEY VIOLATION: Le media_id "${mediaFromDB.id}" n'existe pas dans playout_media_library. ${error.message}`);
        } else if (error.message.includes('check constraint')) {
          throw new Error(`❌ CONSTRAINT VIOLATION: ${error.message}`);
        } else {
          throw new Error(`❌ ERREUR SQL: ${error.message}`);
        }
      }

      console.log('═══════════════════════════════════════════════════════');
      console.log('[Playout Schedule] ✅✅✅ INSERT RÉUSSI ✅✅✅');
      console.log('[Playout Schedule] Data inserted:', data);
      console.log('═══════════════════════════════════════════════════════');

      toast.success('✅ Média ajouté au planning avec succès!', {
        duration: 3000,
      });

      console.log('[Playout Schedule] Reloading schedule and media library...');
      await Promise.all([
        loadSchedule(),
        loadMediaLibrary()
      ]);

      setIsAddDialogOpen(false);
      setSelectedMedia('');
      setScheduledTime('00:00');
      setTransitionEffect('cut');
      setTransitionDuration(1000);
      setAutoSchedule(true);

      console.log('[Playout Schedule] ✅ All done!');
      console.log('═══════════════════════════════════════════════════════');
    } catch (error: any) {
      console.error('[Playout Schedule] ❌ Fatal error:', error);
      console.error('═══════════════════════════════════════════════════════');
      toast.error(`Erreur: ${error.message || 'Erreur inconnue'}`, {
        duration: 5000,
      });
    } finally {
      setIsAddingToSchedule(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet élément du planning ?')) return;

    const { error } = await supabase
      .from('playout_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Élément supprimé');
      loadSchedule();
    }
  }

  function handleOpenDuplicateDialog(item: ScheduleItem) {
    setItemToDuplicate(item);
    setDuplicateDate(new Date());
    setDuplicateTime(item.scheduled_time);
    setIsDuplicateDialogOpen(true);
  }

  async function handleDuplicateItem() {
    if (!itemToDuplicate || !selectedChannel) return;

    const dateStr = format(duplicateDate, 'yyyy-MM-dd');
    const scheduledDateTime = `${dateStr}T${duplicateTime}:00`;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const media = mediaLibrary.find(m => String(m.id) === String(itemToDuplicate.media_id));
      if (!media) {
        console.error('Média non trouvé pour duplication:', itemToDuplicate.media_id);
        throw new Error('Média introuvable');
      }

      // ⚠️ VÉRIFICATION CRITIQUE pour duplication : S'assurer que le media_id existe
      console.log('[Playout Schedule] 🔒 DUPLICATION - Vérification media_id:', media.id);
      const { data: mediaExists, error: checkError } = await supabase
        .from('playout_media_library')
        .select('id, title')
        .eq('id', media.id)
        .maybeSingle();

      if (checkError || !mediaExists) {
        console.error('[Playout Schedule] ❌ DUPLICATION : media_id n\'existe PAS dans playout_media_library!');
        throw new Error(`Le média avec l'ID "${media.id}" n'existe pas dans la base de données`);
      }

      console.log('[Playout Schedule] ✅ DUPLICATION - media_id validé:', mediaExists.title);

      // Calculer la position suivante
      const maxPosition = schedule.length > 0
        ? Math.max(...schedule.map(s => s.order_position || 0))
        : 0;

      // Créer un timestamp ISO valide pour PostgreSQL
      const scheduledDateTime = new Date(`${dateStr}T${duplicateTime}:00`).toISOString();

      const { error } = await supabase
        .from('playout_schedules')
        .insert({
          channel_id: selectedChannel.id,
          media_id: media.id,  // ✅ ID RÉEL de playout_media_library
          scheduled_date: dateStr,
          scheduled_time: duplicateTime,
          scheduled_datetime: scheduledDateTime,
          duration_seconds: itemToDuplicate.duration_seconds,
          order_position: maxPosition + 1,
          status: 'scheduled',
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Programme dupliqué avec succès');
      setIsDuplicateDialogOpen(false);
      setItemToDuplicate(null);

      if (dateStr === format(selectedDate, 'yyyy-MM-dd')) {
        loadSchedule();
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDuplicateDay() {
    if (!selectedChannel || schedule.length === 0) {
      toast.error('Aucun programme à dupliquer');
      return;
    }

    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    const targetDateStr = format(newDate, 'yyyy-MM-dd');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const duplicates = schedule.map((item) => {
        const media = mediaLibrary.find(m => String(m.id) === String(item.media_id));
        return {
          channel_type: selectedChannel.name || selectedChannel.id,
          media_id: item.media_id,
          scheduled_date: targetDateStr,
          start_time: item.start_time,
          end_time: item.end_time,
          title: media?.title || item.title,
          status: 'scheduled',
          created_by: user?.id,
        };
      });

      const { error } = await supabase
        .from('playout_schedules')
        .insert(duplicates);

      if (error) throw error;

      toast.success(`Journée dupliquée vers le ${format(newDate, 'dd/MM/yyyy')}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDuplicateWeek() {
    if (!selectedChannel || schedule.length === 0) {
      toast.error('Aucun programme à dupliquer');
      return;
    }

    if (!confirm('Dupliquer cette journée sur les 7 prochains jours ?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + dayOffset);
        const targetDateStr = format(newDate, 'yyyy-MM-dd');

        const duplicates = schedule.map((item, index) => {
          const scheduledTime = item.scheduled_time || '00:00:00';
          // Créer un timestamp ISO valide pour PostgreSQL
          const scheduledDateTime = new Date(`${targetDateStr}T${scheduledTime}:00`).toISOString();

          return {
            channel_id: selectedChannel.id,
            media_id: item.media_id,
            scheduled_date: targetDateStr,
            scheduled_time: scheduledTime,
            scheduled_datetime: scheduledDateTime,
            duration_seconds: item.duration_seconds || 0,
            order_position: index + 1,
            status: 'scheduled',
            created_by: user?.id,
          };
        });

        const { error } = await supabase
          .from('playout_schedules')
          .insert(duplicates);

        if (error) throw error;
      }

      toast.success('Semaine dupliquée avec succès (7 jours)');
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const newSchedule = [...schedule];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newSchedule.length) return;

    [newSchedule[index], newSchedule[swapIndex]] = [newSchedule[swapIndex], newSchedule[index]];

    // Échanger les positions dans l'ordre
    const item1Position = newSchedule[index].order_position;
    const item2Position = newSchedule[swapIndex].order_position;

    await supabase
      .from('playout_schedules')
      .update({ order_position: item2Position })
      .eq('id', newSchedule[index].id);

    await supabase
      .from('playout_schedules')
      .update({ order_position: item1Position })
      .eq('id', newSchedule[swapIndex].id);

    setSchedule(newSchedule);
    loadSchedule();
    toast.success('Ordre mis à jour');
  }

  function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function calculateEndTime(startTime: string, durationSeconds: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startInSeconds = hours * 3600 + minutes * 60;
    const endInSeconds = startInSeconds + durationSeconds;

    const endHours = Math.floor(endInSeconds / 3600) % 24;
    const endMinutes = Math.floor((endInSeconds % 3600) / 60);

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  const totalDuration = schedule.reduce((sum, item) => sum + item.duration_seconds, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <AdminNavigation title="Programmation Play Out" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Select
                        value={selectedChannel?.id || ''}
                        onValueChange={(id) => {
                          const channel = channels.find(c => c.id === id);
                          if (channel) setSelectedChannel(channel);
                        }}
                      >
                        <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Sélectionner un canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map(channel => (
                            <SelectItem key={channel.id} value={channel.id}>
                              <div className="flex items-center gap-2">
                                {channel.type === 'tv' ? <Tv className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                                {channel.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="text-sm text-slate-400">
                        {format(selectedDate, 'PPPP', { locale: fr })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={handleDuplicateDay}
                      disabled={schedule.length === 0}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-400"
                      title="Dupliquer la journée vers demain"
                    >
                      <CalendarClock className="w-4 h-4 mr-2" />
                      Journée
                    </Button>
                    <Button
                      onClick={handleDuplicateWeek}
                      disabled={schedule.length === 0}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 border-2 border-purple-400"
                      title="Dupliquer sur les 7 prochains jours"
                    >
                      <CalendarRange className="w-4 h-4 mr-2" />
                      Semaine
                    </Button>
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {schedule.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Library className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="font-semibold text-lg">Aucun média programmé</p>
                      <p className="text-sm mt-2">
                        pour le {format(selectedDate, 'dd/MM/yyyy', { locale: fr })}
                      </p>
                      <p className="text-xs mt-2 text-slate-600">
                        Canal : {selectedChannel?.name} ({selectedChannel?.type === 'tv' ? 'webtv' : 'webradio'})
                      </p>
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        size="sm"
                        className="mt-4 bg-orange-600 hover:bg-orange-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter le premier média
                      </Button>
                    </div>
                  ) : (
                    <>
                      {schedule.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMove(index, 'up')}
                                disabled={index === 0}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMove(index, 'down')}
                                disabled={index === schedule.length - 1}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                            </div>

                            <div className="text-xs font-bold text-slate-500 w-12">
                              #{index + 1}
                            </div>

                            <div className="w-16 h-12 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                              {item.media?.thumbnail_url && (
                                <img
                                  src={item.media.thumbnail_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{item.media?.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-5 h-5 text-amber-400" />
                                  {item.scheduled_time}
                                </span>
                                <span>→</span>
                                <span>
                                  {calculateEndTime(item.scheduled_time, item.duration_seconds)}
                                </span>
                                <span className="px-3 py-1 bg-amber-600/20 border border-amber-600/30 rounded text-amber-400 font-bold text-sm">
                                  {formatTime(item.duration_seconds)}
                                </span>
                                <span className={cn(
                                  'px-2 py-0.5 rounded',
                                  item.media?.type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                                  item.media?.type === 'audio' ? 'bg-blue-500/20 text-blue-400' :
                                  item.media?.type === 'jingle' ? 'bg-green-500/20 text-green-400' :
                                  'bg-amber-500/20 text-amber-400'
                                )}>
                                  {item.media?.type}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDuplicateDialog(item)}
                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border-2 border-amber-500/30 hover:border-amber-500/50"
                                title="Dupliquer ce programme"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => item.id && handleDelete(item.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Durée totale</span>
                          <span className="text-2xl font-bold text-amber-400">
                            {formatTime(totalDuration)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {schedule.length} éléments programmés
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-slate-900 border-slate-800 sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Calendrier</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={fr}
                  className="bg-slate-900 w-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] bg-black border-amber-600/30 flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-amber-600/20">
              <DialogTitle className="text-white text-xl flex items-center justify-between">
                <span>Ajouter un média au planning</span>
                {selectedMedia && (
                  <span className="text-sm px-3 py-1 bg-green-600 text-white rounded-lg font-bold animate-pulse">
                    Média sélectionné
                  </span>
                )}
                {!selectedMedia && (
                  <span className="text-sm px-3 py-1 bg-red-600 text-white rounded-lg font-bold">
                    Aucun média sélectionné
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 px-6 py-3 overflow-y-auto flex-1">
              <div>
                <Label className="text-sm text-zinc-300 mb-2 block">
                  📺 Sélectionner un média visuellement
                  {!selectedMedia && (
                    <span className="ml-2 text-amber-500 font-bold animate-pulse">
                      Cliquez sur un média ci-dessous
                    </span>
                  )}
                </Label>
                {mediaLibrary.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900 rounded-lg border border-amber-600/20">
                    <p className="text-zinc-400">Aucun média dans la médiathèque</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[280px] overflow-y-auto p-2 bg-black rounded-lg border border-zinc-800">
                    {mediaLibrary.map(media => {
                      const mediaIdStr = String(media.id);
                      const isSelected = selectedMedia === mediaIdStr;
                      return (
                        <div
                          key={media.id}
                          onClick={() => {
                            console.log('CLIC MEDIA:', media.title, 'ID:', mediaIdStr);
                            setSelectedMedia(mediaIdStr);
                          }}
                          className={`relative group cursor-pointer rounded-lg overflow-hidden transition-all ${
                            isSelected
                              ? 'ring-4 ring-amber-500 bg-amber-500/20 border-4 border-amber-400 animate-pulse shadow-xl shadow-amber-500/50 scale-105'
                              : 'border-2 border-zinc-800 bg-zinc-900 hover:border-amber-500/50 hover:scale-102'
                          }`}
                        >
                          <div className="aspect-video bg-black relative overflow-hidden">
                            {media.thumbnail_url ? (
                              <img
                                src={media.thumbnail_url}
                                alt={media.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
                                {media.type === 'video' ? (
                                  <Tv className="w-10 h-10 text-amber-600/30" />
                                ) : (
                                  <Radio className="w-10 h-10 text-amber-600/30" />
                                )}
                              </div>
                            )}

                            {isSelected && (
                              <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                                  <Clock className="w-8 h-8 text-black" />
                                </div>
                              </div>
                            )}

                            <div className="absolute bottom-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 rounded-lg shadow-lg shadow-amber-500/50 border-2 border-amber-300">
                              <div className="text-base font-extrabold text-black" style={{ fontSize: '1.3rem' }}>
                                {(() => {
                                  const duration = Number(media.duration_seconds) || 0;
                                  if (duration === 0) {
                                    console.warn(`[VIGNETTE] ⚠️ "${media.title.substring(0, 30)}" - durée invalide, utilisation 180s par défaut`);
                                    return formatTime(180);
                                  }
                                  return formatTime(duration);
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-zinc-950 border-t border-zinc-800">
                            <p className={`text-sm font-medium line-clamp-2 ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                              {media.title}
                            </p>
                            <p className="text-xs text-zinc-500 capitalize mt-1">{media.type}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-zinc-400 mt-2">
                  Cliquez sur une miniature pour sélectionner le média
                </p>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <Label className="text-sm font-medium text-zinc-300">Programmation automatique</Label>
                    <p className="text-xs text-zinc-400">Le clip sera ajouté après le précédent</p>
                  </div>
                </div>
                <Switch
                  checked={autoSchedule}
                  onCheckedChange={setAutoSchedule}
                />
              </div>

              {autoSchedule ? (
                <Alert className="bg-amber-600/10 border-amber-600/30 py-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <AlertDescription className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-amber-300">Heure de diffusion automatique:</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-extrabold text-black shadow-lg shadow-amber-500/50 border-2 border-amber-300" style={{ fontSize: '1.1rem' }}>
                      {getNextAvailableTime()}
                    </span>
                    {selectedMedia && (() => {
                      const media = mediaLibrary.find(m => String(m.id) === String(selectedMedia));
                      return media ? (
                        <>
                          <span className="text-amber-300">→</span>
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-extrabold text-black shadow-lg shadow-amber-500/50 border-2 border-amber-300" style={{ fontSize: '1.1rem' }}>
                            {calculateEndTime(getNextAvailableTime(), media.duration_seconds)}
                          </span>
                        </>
                      ) : null;
                    })()}
                  </AlertDescription>
                </Alert>
              ) : (
                <div>
                  <Label className="text-zinc-300 flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Heure de diffusion manuelle *
                  </Label>
                  <div className="relative">
                    <div className="relative bg-zinc-900/80 p-3 rounded-lg border border-amber-600/30">
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-zinc-950/90 border-2 border-amber-600/40 text-amber-400 font-bold hover:border-amber-500/60 focus:border-amber-500 transition-colors rounded-lg text-center"
                        style={{ fontSize: '1.3rem', height: '50px', padding: '0 20px' }}
                      />
                      {selectedMedia && (() => {
                        const media = mediaLibrary.find(m => String(m.id) === String(selectedMedia));
                        const durationForCalc = Number(media?.duration_seconds) || 180;
                        return media ? (
                          <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                            <span className="text-zinc-400">Fin prévue:</span>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 border border-amber-600/40 rounded-lg font-bold text-amber-400" style={{ fontSize: '0.95rem' }}>
                              {scheduledTime && calculateEndTime(scheduledTime, durationForCalc)}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  {selectedMedia && checkTimeConflict(scheduledTime, Number(mediaLibrary.find(m => String(m.id) === String(selectedMedia))?.duration_seconds) || 0) && (
                    <Alert className="bg-red-500/10 border-red-500/30 mt-2 py-2">
                      <AlertCircle className="h-3 w-3 text-red-400" />
                      <AlertDescription className="text-xs text-red-300">
                        Conflit d'horaire détecté! Cette plage horaire est déjà occupée.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300 text-sm mb-1">Effet de transition</Label>
                  <Select value={transitionEffect} onValueChange={setTransitionEffect}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="cut">Coupure nette</SelectItem>
                      <SelectItem value="fade">Fondu</SelectItem>
                      <SelectItem value="crossfade">Fondu croisé</SelectItem>
                      <SelectItem value="none">Aucun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm mb-1">Durée (ms)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={transitionDuration}
                    onChange={(e) => setTransitionDuration(parseInt(e.target.value) || 1000)}
                    className="bg-zinc-900 border-zinc-700 text-white h-9"
                    disabled={transitionEffect === 'none' || transitionEffect === 'cut'}
                  />
                </div>
              </div>

              {selectedMedia && (() => {
                const media = mediaLibrary.find(m => String(m.id) === String(selectedMedia));
                const durationValue = Number(media?.duration_seconds) || 0;
                const hasInvalidDuration = durationValue === 0;

                console.log('[APERÇU SÉLECTIONNÉ]', {
                  title: media?.title.substring(0, 40),
                  duration_seconds_raw: media?.duration_seconds,
                  duration_seconds_type: typeof media?.duration_seconds,
                  durationValue,
                  hasInvalidDuration
                });

                return (
                  <>
                    {hasInvalidDuration && (
                      <Alert className="bg-amber-500/10 border-amber-500/30 py-3">
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                        <AlertDescription className="text-amber-300">
                          <strong>⚠️ Durée invalide (00:00:00)</strong>
                          <p className="text-xs mt-1">✅ Une durée par défaut de <strong>3 minutes</strong> sera automatiquement appliquée lors de l'ajout au planning.</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className={cn(
                      "p-3 rounded-lg border",
                      hasInvalidDuration
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-zinc-900 border-amber-600/20"
                    )}>
                      <div className="text-xs text-zinc-400 mb-2">Aperçu sélectionné:</div>
                      {media ? (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 bg-black rounded overflow-hidden border border-amber-600/30">
                            {media.thumbnail_url && (
                              <img src={media.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-amber-400 mb-1 text-sm">{media.title}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400">Durée:</span>
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-sm",
                                hasInvalidDuration
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-black"
                              )}>
                                <Clock className="w-3 h-3" />
                                {hasInvalidDuration ? (
                                  <span className="flex items-center gap-1">
                                    00:03:00
                                    <span className="text-xs">(défaut)</span>
                                  </span>
                                ) : (
                                  formatTime(durationValue)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </>
                );
              })()}

            </div>
            <div className="px-6 py-4 border-t border-amber-600/20 bg-black">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedMedia) {
                      toast.error('Veuillez sélectionner un média');
                      return;
                    }
                    if (isAddingToSchedule) return;
                    handleAddToSchedule();
                  }}
                  disabled={!selectedMedia || isAddingToSchedule}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2",
                    (!selectedMedia || isAddingToSchedule)
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                      : "bg-amber-600 hover:bg-amber-500 text-black cursor-pointer"
                  )}
                >
                  {isAddingToSchedule ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Ajouter au planning
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🚪 Bouton Annuler cliqué');
                    setIsAddDialogOpen(false);
                  }}
                  disabled={isAddingToSchedule}
                  className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] bg-black border-amber-600/30 flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-amber-600/20">
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                <Copy className="w-6 h-6 text-amber-500" />
                Où voulez-vous dupliquer ce programme ?
              </DialogTitle>
            </DialogHeader>
            {itemToDuplicate && (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  <div className="p-4 bg-zinc-900 rounded-lg border border-amber-600/20">
                    <div className="text-sm text-zinc-400 mb-3">Programme à dupliquer :</div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-14 bg-black rounded overflow-hidden border border-amber-600/30">
                        {itemToDuplicate.media?.thumbnail_url && (
                          <img
                            src={itemToDuplicate.media.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-amber-400 mb-2">
                          {itemToDuplicate.media?.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <Clock className="w-4 h-4" />
                          <span>{itemToDuplicate.scheduled_time}</span>
                          <span>•</span>
                          <span>{formatTime(itemToDuplicate.duration_seconds)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-zinc-300 mb-3 block text-base">
                      📅 Date de destination
                    </Label>
                    <Calendar
                      mode="single"
                      selected={duplicateDate}
                      onSelect={(date) => date && setDuplicateDate(date)}
                      locale={fr}
                      className="bg-zinc-900 border border-amber-600/20 rounded-lg p-3"
                    />
                  </div>

                  <div>
                    <Label className="text-zinc-300 flex items-center gap-2 mb-3 text-base">
                      <Clock className="w-5 h-5 text-amber-400" />
                      Heure de diffusion
                    </Label>
                    <Input
                      type="time"
                      value={duplicateTime}
                      onChange={(e) => setDuplicateTime(e.target.value)}
                      className="bg-zinc-950 border-2 border-amber-600/40 text-amber-400 font-bold text-center"
                      style={{ fontSize: '1.4rem', height: '55px' }}
                    />
                    <div className="mt-3 text-sm text-zinc-400 text-center">
                      Fin prévue : {calculateEndTime(duplicateTime, itemToDuplicate.duration_seconds)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 px-6 py-4 bg-black border-t border-amber-600/20">
                  <Button
                    onClick={handleDuplicateItem}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold h-11"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Dupliquer le programme
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDuplicateDialogOpen(false)}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Annuler
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
