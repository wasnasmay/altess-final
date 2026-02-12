'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestChatPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function testAPI() {
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gemini-chat`;

      console.log('🔍 Test API Configuration:');
      console.log('URL:', url);
      console.log('API Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('API Key (first 20 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message || 'Bonjour, test de connexion',
          context: 'Test depuis la page de diagnostic',
        }),
      });

      console.log('📡 Status:', res.status);
      console.log('📡 Status Text:', res.statusText);
      console.log('📡 Headers:', Object.fromEntries(res.headers.entries()));

      const data = await res.json();
      console.log('📦 Response Data:', data);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
      }

      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Test Gemini Chat API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Message de test</label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Quel orchestre pour un mariage?"
              />
            </div>

            <Button
              onClick={testAPI}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Test en cours...' : 'Tester l\'API'}
            </Button>

            {error && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg">
                <h3 className="font-bold mb-2">❌ Erreur:</h3>
                <pre className="whitespace-pre-wrap text-sm">{error}</pre>
              </div>
            )}

            {response && (
              <div className="p-4 bg-green-100 text-green-800 rounded-lg">
                <h3 className="font-bold mb-2">✅ Réponse:</h3>
                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
              </div>
            )}

            <div className="p-4 bg-blue-100 text-blue-800 rounded-lg text-sm">
              <h3 className="font-bold mb-2">ℹ️ Configuration:</h3>
              <ul className="space-y-1">
                <li>• URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Non définie'}</li>
                <li>• Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Définie' : '❌ Non définie'}</li>
              </ul>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-semibold mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ouvrez la console (F12)</li>
                <li>Cliquez sur "Tester l'API"</li>
                <li>Regardez les logs détaillés dans la console</li>
                <li>Si erreur 401: clé API invalide</li>
                <li>Si erreur 404: fonction non trouvée</li>
                <li>Si erreur 429: quota dépassé</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
