'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminNavigation from '@/components/AdminNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Radio, Plus, Edit2, Trash2, Save, X, ArrowUp, ArrowDown, PlayCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface RadioStation {
  id: string;
  name: string;
  stream_url: string;
  logo_url: string | null;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function RadioStationsAdminPage() {
  const { profile } = useAuth();
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    name: '',
    stream_url: '',
    logo_url: '',
    color: '#f59e0b',
    is_active: true,
  });

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (profile?.role === 'admin') {
        console.log('✅ Admin vérifié:', {
          userId: profile.id,
          role: profile.role,
          email: profile.email
        });
        fetchStations();
      } else if (profile) {
        console.warn('⚠️ Accès refusé - Rôle:', profile.role);
      }
    };

    checkAdminAndFetch();
  }, [profile]);

  const fetchStations = async () => {
    try {
      const { data, error } = await supabase
        .from('radio_stations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setStations(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des stations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Vérifier que l'utilisateur est bien admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté pour effectuer cette action');
        return;
      }

      console.log('🔐 Tentative d\'enregistrement:', {
        userId: user.id,
        userEmail: user.email,
        profileRole: profile?.role,
        action: editingId ? 'UPDATE' : 'INSERT'
      });

      if (editingId) {
        const { error, data } = await supabase
          .from('radio_stations')
          .update({
            name: formData.name,
            stream_url: formData.stream_url,
            logo_url: formData.logo_url || null,
            color: formData.color,
            is_active: formData.is_active,
          })
          .eq('id', editingId)
          .select();

        if (error) {
          console.error('❌ Erreur UPDATE:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log('✅ Station mise à jour:', data);
        toast.success('Station mise à jour avec succès');
      } else {
        const maxOrder = Math.max(...stations.map(s => s.display_order), 0);

        const { error, data } = await supabase
          .from('radio_stations')
          .insert({
            name: formData.name,
            stream_url: formData.stream_url,
            logo_url: formData.logo_url || null,
            color: formData.color,
            display_order: maxOrder + 1,
            is_active: formData.is_active,
          })
          .select();

        if (error) {
          console.error('❌ Erreur INSERT:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log('✅ Station créée:', data);
        toast.success('Station créée avec succès');
      }

      resetForm();
      fetchStations();
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur inconnue';
      const errorCode = error?.code || '';

      console.error('❌ Erreur complète:', error);

      if (errorCode === '42501' || errorMessage.includes('permission')) {
        toast.error('Erreur de permissions: Vérifiez que vous êtes bien administrateur');
      } else if (errorCode === '23505') {
        toast.error('Cette station existe déjà');
      } else {
        toast.error(`Erreur lors de l'enregistrement: ${errorMessage}`);
      }
    }
  };

  const handleEdit = (station: RadioStation) => {
    setEditingId(station.id);
    setFormData({
      name: station.name,
      stream_url: station.stream_url,
      logo_url: station.logo_url || '',
      color: station.color,
      is_active: station.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette station ?')) return;

    try {
      const { error } = await supabase
        .from('radio_stations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Station supprimée');
      fetchStations();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = stations.findIndex(s => s.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === stations.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newStations = [...stations];
    [newStations[index], newStations[newIndex]] = [newStations[newIndex], newStations[index]];

    try {
      const updates = newStations.map((station, idx) => ({
        id: station.id,
        display_order: idx + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('radio_stations')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      fetchStations();
    } catch (error: any) {
      toast.error('Erreur lors du déplacement');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      stream_url: '',
      logo_url: '',
      color: '#f59e0b',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleTestStream = async (station: RadioStation) => {
    setTestingId(station.id);
    setTestResults(prev => ({ ...prev, [station.id]: { loading: true } }));

    try {
      const response = await fetch('/api/radio/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamUrl: station.stream_url,
        }),
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, [station.id]: result }));

      if (result.success && result.valid) {
        toast.success(`✅ ${result.message}`);
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error: any) {
      console.error('Erreur lors du test:', error);
      setTestResults(prev => ({
        ...prev,
        [station.id]: {
          success: false,
          valid: false,
          message: 'Erreur de connexion au service de test',
        }
      }));
      toast.error('Erreur lors du test du flux');
    } finally {
      setTestingId(null);
    }
  };

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500" />
            <p className="text-slate-400">Vérification des permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2 text-white">Accès refusé</h2>
            <p className="text-slate-400 mb-4">Cette page est réservée aux administrateurs</p>
            <div className="text-sm text-slate-400 bg-slate-800/50 p-4 rounded-lg">
              <p><strong>Utilisateur:</strong> {profile.email}</p>
              <p><strong>Rôle:</strong> {profile.role}</p>
              <p className="mt-2 text-xs">Si vous pensez que c'est une erreur, contactez un administrateur</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <AdminNavigation title="Gestion des Stations Radio" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Radio className="w-8 h-8 text-primary" />
              Gestion des Flux Radio
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les stations de radio ALTESS
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle Station
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingId ? 'Modifier la Station' : 'Nouvelle Station'}
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de la Station *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Radio ALTESS"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="stream_url">URL du Flux Audio *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stream_url"
                        value={formData.stream_url}
                        onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                        placeholder="https://stream.radio.co/..."
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (formData.stream_url) {
                            handleTestStream({
                              id: 'temp-test',
                              stream_url: formData.stream_url,
                              name: formData.name || 'Test',
                            } as RadioStation);
                          } else {
                            toast.error('Veuillez entrer une URL de flux');
                          }
                        }}
                        disabled={testingId === 'temp-test' || !formData.stream_url}
                        className="gap-2"
                      >
                        {testingId === 'temp-test' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4" />
                            Tester
                          </>
                        )}
                      </Button>
                    </div>
                    {testResults['temp-test'] && !testResults['temp-test'].loading && (
                      <div className={`mt-2 p-3 rounded-lg text-sm ${
                        testResults['temp-test'].success
                          ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                          : 'bg-red-500/10 text-red-700 dark:text-red-400'
                      }`}>
                        {testResults['temp-test'].message}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="logo_url">URL du Logo</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="color">Couleur (Hex)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#f59e0b"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Station active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="gap-2">
                    <Save className="w-4 h-4" />
                    {editingId ? 'Mettre à jour' : 'Créer'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Chargement...</p>
          ) : stations.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucune station configurée</p>
          ) : (
            stations.map((station, index) => (
              <Card key={station.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: station.color }}
                      >
                        <Radio className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{station.name}</h3>
                          {station.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{station.stream_url}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ordre: {station.display_order} • Couleur: {station.color}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestStream(station)}
                        disabled={testingId === station.id}
                        className="gap-2"
                      >
                        {testingId === station.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Test...
                          </>
                        ) : testResults[station.id]?.success ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Tester
                          </>
                        ) : testResults[station.id]?.success === false ? (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            Tester
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4" />
                            Tester
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMove(station.id, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMove(station.id, 'down')}
                        disabled={index === stations.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(station)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(station.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {testResults[station.id] && !testResults[station.id].loading && (
                    <div className={`mt-4 p-4 rounded-lg border ${
                      testResults[station.id].success
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        {testResults[station.id].success ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-semibold ${
                            testResults[station.id].success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                          }`}>
                            {testResults[station.id].message}
                          </p>
                          {testResults[station.id].details && (
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              {testResults[station.id].details.contentType && (
                                <p>Type: {testResults[station.id].details.contentType}</p>
                              )}
                              {testResults[station.id].details.bitrate && (
                                <p>Débit: {testResults[station.id].details.bitrate}</p>
                              )}
                              {testResults[station.id].details.title && (
                                <p>En cours: {testResults[station.id].details.title}</p>
                              )}
                              {testResults[station.id].details.icecastServer && (
                                <p className="text-green-600">✓ Serveur Icecast détecté</p>
                              )}
                              {testResults[station.id].details.metadataAvailable && (
                                <p className="text-green-600">✓ Métadonnées disponibles</p>
                              )}
                              {testResults[station.id].details.error && (
                                <p className="text-red-600">Erreur: {testResults[station.id].details.error}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
