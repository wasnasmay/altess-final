'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Music2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePlayer } from '@/contexts/PlayerContext';

type ScheduledProgram = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  media?: {
    source_url: string;
    media_type: string;
    thumbnail_url?: string;
    duration_seconds: number;
  };
  status: string;
};

export default function GlobalProgramsPanel() {
  const pathname = usePathname();
  const { mode } = usePlayer();
  const [isProgramsPanelOpen, setIsProgramsPanelOpen] = useState(false);
  const [upcomingPrograms, setUpcomingPrograms] = useState<ScheduledProgram[]>([]);

  const isHomePage = pathname === '/';

  useEffect(() => {
    loadUpcomingPrograms();
    const interval = setInterval(loadUpcomingPrograms, 30000);
    return () => clearInterval(interval);
  }, [mode]);

  async function loadUpcomingPrograms() {
    try {
      const now = new Date();
      const dateStr = format(now, 'yyyy-MM-dd');
      const timeStr = format(now, 'HH:mm:ss');

      const { data: channels } = await supabase
        .from('playout_channels')
        .select('id, type')
        .eq('type', mode === 'tv' ? 'tv' : 'radio')
        .eq('is_active', true)
        .maybeSingle();

      if (!channels) {
        setUpcomingPrograms([]);
        return;
      }

      const { data: schedules, error } = await supabase
        .from('playout_schedules')
        .select(`
          id,
          scheduled_date,
          start_time,
          end_time,
          title,
          status,
          media:playout_media_library (
            title,
            media_url,
            type,
            thumbnail_url,
            duration_seconds
          )
        `)
        .eq('channel_type', mode === 'tv' ? 'tv' : 'radio')
        .eq('scheduled_date', dateStr)
        .order('start_time');

      if (error) throw error;

      const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const upcomingProgs: ScheduledProgram[] = [];

      for (const schedule of schedules || []) {
        const [hours, minutes, seconds] = schedule.start_time.split(':').map(Number);
        const startInSeconds = hours * 3600 + minutes * 60 + (seconds || 0);

        if (currentTimeInSeconds < startInSeconds) {
          const start_time = schedule.start_time;
          const end_time = schedule.end_time;

          const mediaData = Array.isArray(schedule.media) ? schedule.media[0] : schedule.media;

          upcomingProgs.push({
            id: schedule.id,
            title: mediaData?.title || 'Sans titre',
            start_time,
            end_time,
            status: schedule.status,
            media: mediaData ? {
              source_url: mediaData.media_url,
              media_type: mediaData.type,
              thumbnail_url: mediaData.thumbnail_url,
              duration_seconds: mediaData.duration_seconds
            } : undefined
          });
        }
      }

      setUpcomingPrograms(upcomingProgs.slice(0, 10));
    } catch (error) {
      console.error('Error loading upcoming programs:', error);
    }
  }

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  return (
    <>
      <div
        className="fixed top-0 right-0 h-full w-[50px]"
        style={{ zIndex: 99998 }}
        onMouseEnter={() => setIsProgramsPanelOpen(true)}
      />

      <div
        className={`fixed top-0 right-0 h-full transition-transform duration-500 ease-out ${
          isProgramsPanelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-3rem)]'
        }`}
        style={{ zIndex: 99999, pointerEvents: 'auto' }}
        onMouseLeave={() => setIsProgramsPanelOpen(false)}
      >
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-32 bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-md border-2 border-r-0 rounded-l-2xl flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-500 ${
          isProgramsPanelOpen ? 'border-amber-500/80' : 'border-amber-500/40'
        }`}>
          <div className="flex flex-col items-center gap-2">
            <Calendar className={`w-7 h-7 text-amber-500 transition-all duration-300 ${isProgramsPanelOpen ? 'animate-pulse' : ''}`} />
            <div className={`text-[10px] text-amber-500 font-bold transition-transform duration-500 whitespace-nowrap ${
              isProgramsPanelOpen ? 'rotate-0' : '-rotate-90'
            }`}>
              TV
            </div>
          </div>
        </div>

        <div className="w-96 h-full bg-black/95 backdrop-blur-2xl border-l-2 border-amber-500/40 shadow-2xl shadow-black/60 ml-12">
          <div className="h-full flex flex-col p-6">
            <div className="mb-6 flex items-center gap-3 border-b border-amber-500/30 pb-4 flex-shrink-0">
              <div className="bg-amber-500/20 p-2 rounded-lg">
                <Calendar className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white">Programmes</h3>
                <p className="text-xs text-gray-400">À venir prochainement</p>
              </div>
            </div>

            <ScrollArea className="flex-1 pr-4">
              {upcomingPrograms.length > 0 ? (
                <div className="space-y-4 pb-4">
                  {upcomingPrograms.map((program) => (
                    <Card
                      key={program.id}
                      className="border-2 border-amber-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/30 hover:border-amber-500/60 cursor-pointer group bg-black/40 backdrop-blur-sm overflow-hidden"
                    >
                      <CardContent className="p-0">
                        {program.media?.thumbnail_url && (
                          <div className="relative aspect-video w-full overflow-hidden bg-black">
                            <img
                              src={program.media.thumbnail_url}
                              alt={program.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                            <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm rounded-lg px-3 py-1.5 group-hover:bg-amber-500 transition-colors duration-300 shadow-lg">
                              <div className="text-xs text-black/70 font-medium">Début</div>
                              <div className="text-lg font-bold text-black">
                                {program.start_time.substring(0, 5)}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-base mb-3 line-clamp-2 text-white group-hover:text-amber-400 transition-colors duration-300">
                            {program.title}
                          </h4>
                          <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 flex-shrink-0 text-amber-500" />
                              <span>{program.start_time.substring(0, 5)} - {program.end_time.substring(0, 5)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Music2 className="w-4 h-4 flex-shrink-0 text-amber-500" />
                              <span>Durée: {program.media ? Math.floor(program.media.duration_seconds / 60) : '?'} min</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Calendar className="w-16 h-16 text-amber-500/20 mb-4" />
                  <p className="text-sm text-gray-500">Aucun programme prévu</p>
                  <p className="text-xs text-gray-600 mt-2">Revenez plus tard</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
}
