'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import AdminNavigation from '@/components/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Play, Pause, ExternalLink, Check, X, TrendingUp, Users, Video, Crown } from 'lucide-react';

interface SocialVideo {
  id: string;
  provider_id: string;
  video_url: string;
  platform: string;
  title: string;
  duration: number;
  is_active: boolean;
  created_at: string;
  provider: {
    full_name: string;
    email: string;
  };
  subscription: {
    plan: {
      name: string;
    };
  };
}

export default function RegiePublicitairePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState<SocialVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'admin') {
        router.push('/admin');
      }
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadVideos();
    }
  }, [profile]);

  async function loadVideos() {
    try {
      setLoadingVideos(true);

      const { data, error } = await supabase
        .from('provider_social_videos')
        .select(`
          *,
          provider:profiles!provider_social_videos_provider_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrer uniquement les prestataires avec abonnement Premium
      const videosWithSubscription = await Promise.all(
        (data || []).map(async (video) => {
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('*, plan:subscription_plans(*)')
            .eq('user_id', video.provider_id)
            .eq('status', 'active')
            .maybeSingle();

          return {
            ...video,
            subscription: subData,
          };
        })
      );

      // Garder uniquement ceux avec abonnement actif (Premium)
      const premiumVideos = videosWithSubscription.filter((v) => v.subscription);

      setVideos(premiumVideos as any);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Erreur lors du chargement des vidéos');
    } finally {
      setLoadingVideos(false);
    }
  }

  async function toggleVideoStatus(videoId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('provider_social_videos')
        .update({ is_active: !currentStatus })
        .eq('id', videoId);

      if (error) throw error;

      toast.success(
        !currentStatus
          ? 'Vidéo activée pour diffusion'
          : 'Vidéo désactivée'
      );
      loadVideos();
    } catch (error) {
      console.error('Error toggling video status:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  }

  if (loading || !user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
          <p className="mt-4 text-amber-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'admin') {
    return null;
  }

  const filteredVideos = videos.filter((video) => {
    if (filter === 'active') return video.is_active;
    if (filter === 'inactive') return !video.is_active;
    return true;
  });

  const stats = {
    total: videos.length,
    active: videos.filter((v) => v.is_active).length,
    inactive: videos.filter((v) => !v.is_active).length,
    providers: new Set(videos.map((v) => v.provider_id)).size,
  };

  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar />
      <div className="ml-16">
        <AdminNavigation title="Gestion Régie Pub" />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Video className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
                  Gestion Régie Pub
                </h1>
                <p className="text-slate-400">
                  Contrôle des vidéos sociales diffusées dans "L'Heure des Réseaux Sociaux"
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-400 mb-1">Total Vidéos</p>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Video className="w-12 h-12 text-blue-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-400 mb-1">Actives</p>
                    <p className="text-3xl font-bold text-white">{stats.active}</p>
                  </div>
                  <Check className="w-12 h-12 text-green-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-400 mb-1">Inactives</p>
                    <p className="text-3xl font-bold text-white">{stats.inactive}</p>
                  </div>
                  <X className="w-12 h-12 text-red-400 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-400 mb-1">Prestataires Premium</p>
                    <p className="text-3xl font-bold text-white">{stats.providers}</p>
                  </div>
                  <Crown className="w-12 h-12 text-amber-400 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <span className="text-white font-medium">Filtrer:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-amber-500 hover:bg-amber-600' : 'border-amber-500/30'}
                  >
                    Toutes ({stats.total})
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'active' ? 'default' : 'outline'}
                    onClick={() => setFilter('active')}
                    className={filter === 'active' ? 'bg-green-500 hover:bg-green-600' : 'border-green-500/30'}
                  >
                    Actives ({stats.active})
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'inactive' ? 'default' : 'outline'}
                    onClick={() => setFilter('inactive')}
                    className={filter === 'inactive' ? 'bg-red-500 hover:bg-red-600' : 'border-red-500/30'}
                  >
                    Inactives ({stats.inactive})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des vidéos */}
          <Card className="bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400 flex items-center gap-2">
                <Crown className="w-6 h-6" />
                Vidéos Sociales Premium
              </CardTitle>
              <CardDescription className="text-slate-400">
                Seuls les prestataires avec abonnement actif apparaissent ici
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVideos ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
                  <p className="mt-4 text-slate-400">Chargement des vidéos...</p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 mb-2">Aucune vidéo trouvée</p>
                  <p className="text-sm text-slate-500">
                    {filter === 'all'
                      ? 'Aucun prestataire Premium n\'a ajouté de vidéo'
                      : `Aucune vidéo ${filter === 'active' ? 'active' : 'inactive'}`}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredVideos.map((video) => (
                    <Card
                      key={video.id}
                      className={`bg-black/40 transition-all ${
                        video.is_active
                          ? 'border-green-500/30 hover:border-green-500/50'
                          : 'border-red-500/20 hover:border-red-500/40'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {/* Miniature vidéo */}
                          <div className="w-48 h-28 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 border-2 border-amber-500/20">
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                              <Play className="w-12 h-12 text-amber-400/50" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-white mb-1">
                                  {video.title || 'Sans titre'}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Crown className="w-4 h-4 text-amber-400" />
                                    {video.provider?.full_name || 'Prestataire'}
                                  </span>
                                  <span>•</span>
                                  <Badge variant="outline" className="capitalize border-amber-500/30">
                                    {video.subscription?.plan?.name || 'Premium'}
                                  </Badge>
                                </div>
                              </div>
                              <Badge
                                className={`${
                                  video.is_active
                                    ? 'bg-green-500 text-white'
                                    : 'bg-red-500/20 text-red-400 border-red-500/50'
                                }`}
                              >
                                {video.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                              <div>
                                <span className="text-slate-400">Plateforme:</span>
                                <div className="font-medium text-white capitalize">
                                  {video.platform}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">Durée:</span>
                                <div className="font-medium text-white">{video.duration}s</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Ajoutée le:</span>
                                <div className="font-medium text-white">
                                  {new Date(video.created_at).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => toggleVideoStatus(video.id, video.is_active)}
                                className={
                                  video.is_active
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                }
                              >
                                {video.is_active ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Activer
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(video.video_url, '_blank')}
                                className="border-amber-500/30 hover:bg-amber-500/10"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Voir sur {video.platform}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="mt-6 bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-400 mb-2">
                    À propos de la Régie Pub Sociale
                  </h4>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li>✓ Seuls les prestataires avec abonnement Premium actif sont listés</li>
                    <li>✓ Les vidéos actives sont diffusées dans "L'Heure des Réseaux Sociaux"</li>
                    <li>✓ Vous gardez le contrôle total sur ce qui passe à l'antenne</li>
                    <li>✓ Les prestataires peuvent ajouter leurs vidéos depuis leur dashboard</li>
                    <li>✓ Activez/désactivez les vidéos en un clic</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
