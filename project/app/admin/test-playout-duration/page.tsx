'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPlayoutDuration() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      console.log('[TEST DURATION] Chargement des données...');

      const { data, error } = await supabase
        .from('playout_media_library')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('[TEST DURATION] Résultat brut:', data);
      console.log('[TEST DURATION] Erreur:', error);

      if (error) {
        console.error('[TEST DURATION] ERREUR:', error);
      } else {
        console.log('[TEST DURATION] Nombre de médias:', data?.length);
        data?.forEach((item, index) => {
          console.log(`[TEST DURATION] Media ${index + 1}:`, {
            title: item.title,
            duration_seconds: item.duration_seconds,
            duration_ms: item.duration_ms,
            type_of_duration_seconds: typeof item.duration_seconds,
            type_of_duration_ms: typeof item.duration_ms,
          });
        });
        setRawData(data || []);
      }
    } catch (err) {
      console.error('[TEST DURATION] EXCEPTION:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number, durationMs?: number): string {
    console.log('[TEST DURATION] formatDuration appelé:', { seconds, durationMs });

    let effectiveSeconds = seconds;

    if ((!effectiveSeconds || effectiveSeconds === 0) && durationMs && durationMs > 0) {
      effectiveSeconds = Math.round(durationMs / 1000);
      console.log('[TEST DURATION] Conversion depuis duration_ms:', effectiveSeconds);
    }

    const hrs = Math.floor(effectiveSeconds / 3600);
    const mins = Math.floor((effectiveSeconds % 3600) / 60);
    const secs = effectiveSeconds % 60;

    const result = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    console.log('[TEST DURATION] Résultat formaté:', result);

    return result;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Chargement...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">TEST DIAGNOSTIC - Durées Playout</h1>

      <Card className="bg-slate-900 border-slate-800 mb-8">
        <CardHeader>
          <CardTitle>Données brutes de la base</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto bg-slate-950 p-4 rounded">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rawData.map((item, index) => (
          <Card key={item.id} className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400">Titre</div>
                  <div className="font-semibold">{item.title}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">Type</div>
                  <div>{item.type}</div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">duration_seconds (brut)</div>
                  <div className="font-mono text-green-400">
                    {item.duration_seconds}
                    <span className="text-xs text-slate-500 ml-2">
                      (type: {typeof item.duration_seconds})
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400">duration_ms (brut)</div>
                  <div className="font-mono text-blue-400">
                    {item.duration_ms || 'null'}
                    <span className="text-xs text-slate-500 ml-2">
                      (type: {typeof item.duration_ms})
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-slate-400 mb-2">Durée formatée</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {formatDuration(item.duration_seconds, item.duration_ms)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
