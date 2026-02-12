'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminNavigation from '@/components/AdminNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Save, AlertCircle, CheckCircle2, Radio, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TickerSettings {
  id: string;
  text: string;
  speed: 'slow' | 'medium' | 'fast';
  color: string;
  is_enabled: boolean;
  live_video_id: string | null;
  updated_at: string;
}

export default function WebTVTickerPage() {
  const [settings, setSettings] = useState<TickerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const colorOptions = [
    { value: 'amber', label: 'Ambre', class: 'bg-amber-400' },
    { value: 'red', label: 'Rouge', class: 'bg-red-400' },
    { value: 'blue', label: 'Bleu', class: 'bg-blue-400' },
    { value: 'green', label: 'Vert', class: 'bg-green-400' },
    { value: 'purple', label: 'Violet', class: 'bg-purple-400' },
    { value: 'white', label: 'Blanc', class: 'bg-white border border-gray-300' },
  ];

  const speedOptions = [
    { value: 'slow', label: 'Lent', duration: '35s' },
    { value: 'medium', label: 'Moyen', duration: '25s' },
    { value: 'fast', label: 'Rapide', duration: '15s' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('🔍 [WebTV Ticker] Début du chargement...');
      console.log('📡 [WebTV Ticker] URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);

      const { data, error, count } = await supabase
        .from('webtv_ticker_settings')
        .select('*', { count: 'exact' });

      console.log('📊 [WebTV Ticker] Résultat de la requête:', { data, error, count });

      if (error) {
        console.error('❌ [WebTV Ticker] Erreur Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [WebTV Ticker] Aucune configuration trouvée');
        setMessage({
          type: 'error',
          text: 'Configuration non trouvée. La base de données est vide.'
        });
        setSettings(null);
      } else {
        console.log('✅ [WebTV Ticker] Configuration chargée:', data[0]);
        setSettings(data[0]);
      }
    } catch (error: any) {
      console.error('💥 [WebTV Ticker] Erreur lors du chargement:', error);
      setMessage({
        type: 'error',
        text: `Erreur: ${error.message || 'Impossible de charger les paramètres'}`
      });
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('webtv_ticker_settings')
        .update({
          text: settings.text,
          speed: settings.speed,
          color: settings.color,
          is_enabled: settings.is_enabled,
          live_video_id: settings.live_video_id?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès !' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <AdminNavigation title="Bandeau Défilant WebTV" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <AdminNavigation title="Bandeau Défilant WebTV" />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {message && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Configuration du Bandeau</CardTitle>
              <CardDescription>
                Impossible de charger la configuration. Essayez de recharger la page ou contactez l'administrateur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                Recharger la Page
              </Button>

              <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 <strong>Info:</strong> La configuration existe dans la base de données mais n'a pas pu être chargée.
                  Vérifiez que vous êtes bien connecté.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getSpeedDuration = (speed: string) => {
    return speedOptions.find(s => s.value === speed)?.duration || '25s';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <AdminNavigation title="Bandeau Défilant WebTV" />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Bandeau Défilant WebTV</h1>
          <p className="text-gray-400">Gérez le texte et l'apparence du bandeau d'information en temps réel</p>
        </div>

        {message && (
          <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className="mb-6">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Activation</CardTitle>
              <CardDescription>Afficher ou masquer le bandeau sur le site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Switch
                  checked={settings.is_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, is_enabled: checked })}
                  className="data-[state=checked]:bg-amber-500"
                />
                <Label className="text-white text-lg">
                  {settings.is_enabled ? 'Bandeau Activé' : 'Bandeau Désactivé'}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Radio className="h-5 w-5 text-red-500" />
                    Diffusion Live YouTube
                  </CardTitle>
                  <CardDescription>Passer en direct avec une vidéo YouTube Live (prioritaire sur la programmation)</CardDescription>
                </div>
                {settings.live_video_id && (
                  <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/50">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-semibold">EN DIRECT</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">ID de la vidéo YouTube Live</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.live_video_id || ''}
                    onChange={(e) => setSettings({ ...settings, live_video_id: e.target.value })}
                    placeholder="Ex: dQw4w9WgXcQ"
                    className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 flex-1"
                  />
                  {settings.live_video_id && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSettings({ ...settings, live_video_id: null })}
                      className="border-red-600 hover:bg-red-600/20 text-red-400"
                      title="Effacer et retour à la programmation"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  💡 Collez l'ID de la vidéo YouTube Live (pas l'URL complète). Si ce champ est rempli, le Live sera diffusé en priorité.
                  Effacez-le pour revenir automatiquement à la programmation normale.
                </p>
              </div>

              {settings.live_video_id && (
                <Alert className="bg-red-900/20 border-red-700/50">
                  <Radio className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-300">
                    <strong>Mode Live Activé:</strong> Le lecteur WebTV diffuse actuellement le Live YouTube.
                    La programmation normale reprendra automatiquement dès que vous effacerez ce champ.
                  </AlertDescription>
                </Alert>
              )}

              {!settings.live_video_id && (
                <Alert className="bg-gray-700/20 border-gray-600">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <AlertDescription className="text-gray-300">
                    Aucun Live en cours. La WebTV diffuse la programmation normale.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Texte du Bandeau</CardTitle>
              <CardDescription>Le message qui défilera sur le site</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={settings.text}
                onChange={(e) => setSettings({ ...settings, text: e.target.value })}
                placeholder="Entrez le texte à afficher..."
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
              />
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Vitesse de Défilement</CardTitle>
              <CardDescription>Contrôlez la vitesse du mouvement</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={settings.speed}
                onValueChange={(value) => setSettings({ ...settings, speed: value as 'slow' | 'medium' | 'fast' })}
                className="grid grid-cols-3 gap-4"
              >
                {speedOptions.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-600 bg-gray-700/30 p-4 hover:bg-gray-700/50 hover:border-amber-500/50 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-500/10 cursor-pointer transition-all"
                    >
                      <span className="text-lg font-semibold text-white">{option.label}</span>
                      <span className="text-sm text-gray-400">{option.duration}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Couleur du Texte</CardTitle>
              <CardDescription>Choisissez la couleur d'affichage</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={settings.color}
                onValueChange={(value) => setSettings({ ...settings, color: value })}
                className="grid grid-cols-3 gap-4"
              >
                {colorOptions.map((option) => (
                  <div key={option.value}>
                    <RadioGroupItem
                      value={option.value}
                      id={`color-${option.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`color-${option.value}`}
                      className="flex items-center justify-center gap-3 rounded-lg border-2 border-gray-600 bg-gray-700/30 p-4 hover:bg-gray-700/50 hover:border-amber-500/50 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-500/10 cursor-pointer transition-all"
                    >
                      <div className={`w-6 h-6 rounded-full ${option.class}`}></div>
                      <span className="text-white font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Aperçu en Direct</CardTitle>
              <CardDescription>Visualisez le rendu final</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-lg bg-black/90 border border-gray-700" style={{ height: '60px' }}>
                <div
                  className={`whitespace-nowrap text-${settings.color}-400 text-lg font-medium py-4 px-6 absolute`}
                  style={{
                    animation: `scroll-left ${getSpeedDuration(settings.speed)} linear infinite`,
                    willChange: 'transform',
                  }}
                >
                  {settings.text} • {settings.text} • {settings.text}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold px-8 py-6 text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Sauvegarder les Modifications
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
