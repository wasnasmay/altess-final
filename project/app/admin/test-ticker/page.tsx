'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TestTickerPage() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleTestSubmit(e: React.FormEvent) {
    console.log('🎯 TEST SUBMIT APPELÉ');
    e.preventDefault();

    setSubmitting(true);

    try {
      console.log('1️⃣ Vérification session...');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('❌ Pas de session');
        toast.error('Pas de session');
        return;
      }

      console.log('2️⃣ Session OK:', session.user.email);

      console.log('3️⃣ Vérification profil...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('❌ Erreur profil:', profileError);
        toast.error('Erreur profil: ' + profileError.message);
        return;
      }

      console.log('4️⃣ Profil:', profile);

      if (profile?.role !== 'admin') {
        console.error('❌ Pas admin, rôle:', profile?.role);
        toast.error('Pas admin, rôle: ' + profile?.role);
        return;
      }

      console.log('5️⃣ Admin confirmé, tentative d\'insertion...');

      const insertData = {
        message: message,
        background_color: 'rgba(0, 0, 0, 0.9)',
        text_color: '#FFFFFF',
        is_active: true,
        priority: 5,
        display_duration_seconds: 30
      };

      console.log('6️⃣ Données à insérer:', insertData);

      const { data, error } = await supabase
        .from('advertising_tickers')
        .insert([insertData])
        .select();

      if (error) {
        console.error('❌ Erreur insertion:', error);
        toast.error('Erreur: ' + error.message);
        return;
      }

      console.log('✅ SUCCESS! Ticker créé:', data);
      toast.success('Ticker créé avec succès!');
      setMessage('');

    } catch (error: any) {
      console.error('💥 Exception:', error);
      toast.error('Exception: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pt-24 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>🧪 TEST - Création Ticker Sans Dialog</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTestSubmit} className="space-y-4">
            <div>
              <Label htmlFor="test-message">Message de Test</Label>
              <Textarea
                id="test-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tapez votre message de test..."
                required
                rows={3}
                className="w-full"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {submitting ? 'Test en cours...' : '🧪 TEST CRÉER'}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  console.log('🔍 Test onClick direct');
                  alert('onClick fonctionne!');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Test onClick
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1 mt-4">
              <p>Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ouvrez la console (F12)</li>
                <li>Remplissez le message</li>
                <li>Cliquez sur "TEST CRÉER"</li>
                <li>Regardez les logs dans la console</li>
              </ol>
            </div>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Logs attendus:</h3>
            <pre className="text-xs overflow-auto">
{`🎯 TEST SUBMIT APPELÉ
1️⃣ Vérification session...
2️⃣ Session OK: [email]
3️⃣ Vérification profil...
4️⃣ Profil: {role: 'admin', email: '...'}
5️⃣ Admin confirmé, tentative d'insertion...
6️⃣ Données à insérer: {...}
✅ SUCCESS! Ticker créé: [...]`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
