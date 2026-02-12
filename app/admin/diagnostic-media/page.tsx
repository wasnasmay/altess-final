'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminNavigation from '@/components/AdminNavigation';

type MediaDiagnostic = {
  id: string;
  title: string;
  duration_seconds: number;
  duration_ms: number | null;
  created_at: string;
  media_url: string;
};

export default function DiagnosticMediaPage() {
  const [media, setMedia] = useState<MediaDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<string>('');

  useEffect(() => {
    loadDiagnosticData();
  }, []);

  async function loadDiagnosticData() {
    try {
      const { data, error } = await supabase
        .from('playout_media_library')
        .select('id, title, duration_seconds, duration_ms, created_at, media_url')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      console.log('════════════════════════════════════════');
      console.log('[DIAGNOSTIC] Données brutes de Supabase:');
      console.log(JSON.stringify(data, null, 2));
      console.log('════════════════════════════════════════');

      setMedia(data || []);
      setRawData(JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.error('[DIAGNOSTIC] Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(durationMs: number | null): string {
    if (!durationMs) return '00:00:00 (NULL ou 0)';
    const totalSeconds = Math.round(durationMs / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} (${durationMs}ms)`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <AdminNavigation title="Diagnostic Médias - Durées" />

        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle>État de la base de données</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong className="text-green-400">Connexion Supabase:</strong>{' '}
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                  <span className="text-green-300">{process.env.NEXT_PUBLIC_SUPABASE_URL}</span>
                ) : (
                  <span className="text-red-400">Non configurée</span>
                )}
              </div>

              <Button onClick={loadDiagnosticData} className="bg-blue-600 hover:bg-blue-700">
                Recharger les données
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <>
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader>
                <CardTitle>Dernières 10 vidéos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {media.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-800 rounded-lg border-2"
                      style={{
                        borderColor:
                          !item.duration_ms || item.duration_ms === 0 ? '#ef4444' : '#10b981',
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="font-bold text-lg mb-2">#{idx + 1} {item.title}</div>
                          <div className="text-sm text-slate-400 space-y-1">
                            <div>
                              <strong>ID:</strong> {item.id}
                            </div>
                            <div>
                              <strong>Date:</strong>{' '}
                              {new Date(item.created_at).toLocaleString('fr-FR')}
                            </div>
                            <div className="break-all">
                              <strong>URL:</strong> {item.media_url.substring(0, 80)}...
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="bg-slate-950 p-3 rounded text-sm font-mono space-y-1">
                            <div>
                              <strong className="text-yellow-400">duration_seconds (DB):</strong>{' '}
                              <span className="text-white">{item.duration_seconds}</span>
                            </div>
                            <div>
                              <strong className="text-yellow-400">duration_ms (DB):</strong>{' '}
                              <span className="text-white">
                                {item.duration_ms ?? 'NULL'}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-slate-700">
                              <strong className="text-green-400">Affichage:</strong>{' '}
                              <span
                                className={
                                  !item.duration_ms || item.duration_ms === 0
                                    ? 'text-red-400 font-bold'
                                    : 'text-green-300'
                                }
                              >
                                {formatDuration(item.duration_ms)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle>Données brutes JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-slate-950 p-4 rounded overflow-auto max-h-96">
                  {rawData}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
