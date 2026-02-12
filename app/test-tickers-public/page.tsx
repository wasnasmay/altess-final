'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type Ticker = {
  id: string;
  message: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  priority: number;
  display_duration_seconds: number;
};

export default function TestTickersPublic() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [rawResponse, setRawResponse] = useState<any>(null);

  useEffect(() => {
    testAccess();
  }, []);

  async function testAccess() {
    try {
      console.log('🔍 Test d\'accès PUBLIC aux advertising_tickers...');
      console.log('📡 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

      const { data, error, count } = await supabase
        .from('advertising_tickers')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('priority', { ascending: false });

      console.log('📊 Résultat:', { data, error, count });

      setRawResponse({ data, error, count });

      if (error) {
        console.error('❌ Erreur:', error);
        setError(error.message);
      } else {
        console.log('✅ Succès! Nombre de tickers:', data?.length);
        setTickers(data || []);
      }
    } catch (e: any) {
      console.error('💥 Exception:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800/50 border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              🧪 Test d'Accès Public - Advertising Tickers
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Cette page teste l'accès public aux messages publicitaires (sans authentification)
            </p>
          </CardHeader>
        </Card>

        {/* Status */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">Statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                  <span className="text-gray-300">Chargement...</span>
                </>
              ) : error ? (
                <>
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400">Erreur: {error}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400">Succès! {tickers.length} messages trouvés</span>
                </>
              )}
            </div>

            {/* Environment Info */}
            <div className="p-4 bg-black/40 rounded-lg space-y-2">
              <div className="text-sm">
                <span className="text-gray-400">Supabase URL: </span>
                <span className="text-gray-300">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configuré' : '❌ Manquant'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Supabase Key: </span>
                <span className="text-gray-300">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configuré' : '❌ Manquant'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickers List */}
        {!loading && tickers.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Messages Publicitaires Actifs ({tickers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tickers.map((ticker, index) => (
                <div
                  key={ticker.id}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: ticker.background_color,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Priorité: {ticker.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {ticker.display_duration_seconds}s
                        </Badge>
                      </div>
                      <p
                        className="text-base font-medium"
                        style={{ color: ticker.text_color }}
                      >
                        {ticker.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Raw Response */}
        {!loading && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Réponse Brute (Debug)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-gray-300 overflow-auto bg-black/40 p-4 rounded-lg">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-blue-300">💡 Utilisation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-200 space-y-2">
            <p>✅ Si vous voyez les messages ci-dessus, l'accès PUBLIC fonctionne!</p>
            <p>❌ Si vous voyez une erreur, vérifiez:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Les variables d'environnement NEXT_PUBLIC_SUPABASE_* sont configurées</li>
              <li>Les policies RLS permettent l'accès public en lecture</li>
              <li>Le cache Supabase est rafraîchi (NOTIFY pgrst, 'reload schema')</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
