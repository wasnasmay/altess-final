'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import AdminNavigation from '@/components/AdminNavigation';
import {
  Music2,
  Plus,
  Edit,
  Trash2,
  Star,
  Image as ImageIcon,
  Video,
  FileText,
  Package,
  Users,
  Calendar,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';

type OrchestraFormula = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_from: number;
  image_url: string;
  features: string[];
  display_order: number;
  is_active: boolean;
};

type StarArtist = {
  id: string;
  name: string;
  title: string;
  description: string;
  specialties: string[];
  image_url: string;
  display_order: number;
  is_active: boolean;
};

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string;
  category: string;
  display_order: number;
  is_active: boolean;
};

type Instrument = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  is_available: boolean;
};

type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string;
  event_date: string;
  event_type: string;
  guests_count: number;
  location: string;
  message: string;
  status: string;
  created_at: string;
};

export default function OrientaleMusiqueAdmin() {
  const [activeTab, setActiveTab] = useState('overview');

  const [formulas, setFormulas] = useState<OrchestraFormula[]>([]);
  const [stars, setStars] = useState<StarArtist[]>([]);
  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      await Promise.all([
        loadFormulas(),
        loadStars(),
        loadVideos(),
        loadInstruments(),
        loadBookings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFormulas() {
    const { data } = await supabase
      .from('orchestra_formulas')
      .select('*')
      .order('display_order', { ascending: true });
    if (data) setFormulas(data);
  }

  async function loadStars() {
    const { data } = await supabase
      .from('stars')
      .select('*')
      .order('display_order', { ascending: true });
    if (data) setStars(data);
  }

  async function loadVideos() {
    const { data } = await supabase
      .from('demo_videos')
      .select('*')
      .order('display_order', { ascending: true });
    if (data) setVideos(data);
  }

  async function loadInstruments() {
    const { data } = await supabase
      .from('instruments')
      .select('*')
      .order('name', { ascending: true });
    if (data) setInstruments(data);
  }

  async function loadBookings() {
    const { data } = await supabase
      .from('orchestra_bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBookings(data);
  }

  async function toggleActive(table: string, id: string, currentState: boolean) {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;

      toast.success(`${currentState ? 'Désactivé' : 'Activé'} avec succès`);
      loadAllData();
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  }

  async function deleteItem(table: string, id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Supprimé avec succès');
      loadAllData();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  }

  const stats = {
    formulas: { total: formulas.length, active: formulas.filter(f => f.is_active).length },
    stars: { total: stars.length, active: stars.filter(s => s.is_active).length },
    videos: { total: videos.length, active: videos.filter(v => v.is_active).length },
    instruments: { total: instruments.length, available: instruments.filter(i => i.is_available).length },
    bookings: { total: bookings.length, pending: bookings.filter(b => b.status === 'pending').length }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminNavigation title="Orientale Musique" />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-center">
              <Music2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gold-gradient">Gestion Orientale Musique</h1>
              <p className="text-slate-400">Gérez toutes les fonctionnalités en un seul endroit</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-500">{stats.formulas.active}/{stats.formulas.total}</div>
                <div className="text-sm text-slate-400">Formules actives</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-500">{stats.stars.active}/{stats.stars.total}</div>
                <div className="text-sm text-slate-400">Stars actives</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-500">{stats.videos.active}/{stats.videos.total}</div>
                <div className="text-sm text-slate-400">Vidéos actives</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-500">{stats.instruments.available}/{stats.instruments.total}</div>
                <div className="text-sm text-slate-400">Instruments dispos</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-500">{stats.bookings.pending}/{stats.bookings.total}</div>
                <div className="text-sm text-slate-400">Réservations</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 bg-slate-900/50 border border-amber-500/20 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Package className="w-4 h-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="formulas" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <FileText className="w-4 h-4 mr-2" />
              Formules
            </TabsTrigger>
            <TabsTrigger value="stars" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Star className="w-4 h-4 mr-2" />
              Stars
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Video className="w-4 h-4 mr-2" />
              Vidéos
            </TabsTrigger>
            <TabsTrigger value="instruments" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Music2 className="w-4 h-4 mr-2" />
              Instruments
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <Calendar className="w-4 h-4 mr-2" />
              Réservations
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              <ExternalLink className="w-4 h-4 mr-2" />
              Liens
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer"
                    onClick={() => setActiveTab('formulas')}>
                <div className="h-2 bg-gradient-to-r from-amber-600 to-amber-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="w-5 h-5 text-amber-500" />
                    Formules d'Orchestre
                  </CardTitle>
                  <CardDescription>Packages et tarifs des prestations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-white font-bold">{stats.formulas.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actives:</span>
                      <span className="text-amber-500 font-bold">{stats.formulas.active}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer"
                    onClick={() => setActiveTab('stars')}>
                <div className="h-2 bg-gradient-to-r from-yellow-600 to-yellow-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Stars & Artistes
                  </CardTitle>
                  <CardDescription>Artistes et musiciens vedettes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-white font-bold">{stats.stars.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actives:</span>
                      <span className="text-yellow-500 font-bold">{stats.stars.active}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer"
                    onClick={() => setActiveTab('videos')}>
                <div className="h-2 bg-gradient-to-r from-red-600 to-red-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Video className="w-5 h-5 text-red-500" />
                    Vidéos Démo
                  </CardTitle>
                  <CardDescription>Vidéos YouTube de démonstration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-white font-bold">{stats.videos.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actives:</span>
                      <span className="text-red-500 font-bold">{stats.videos.active}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer"
                    onClick={() => setActiveTab('instruments')}>
                <div className="h-2 bg-gradient-to-r from-purple-600 to-purple-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Music2 className="w-5 h-5 text-purple-500" />
                    Instruments
                  </CardTitle>
                  <CardDescription>Catalogue d'instruments proposés</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-white font-bold">{stats.instruments.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Disponibles:</span>
                      <span className="text-purple-500 font-bold">{stats.instruments.available}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer"
                    onClick={() => setActiveTab('bookings')}>
                <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-500" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Réservations
                  </CardTitle>
                  <CardDescription>Demandes de réservation clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-white font-bold">{stats.bookings.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">En attente:</span>
                      <span className="text-blue-500 font-bold">{stats.bookings.pending}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-amber-900/20 to-slate-900/50 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <ExternalLink className="w-5 h-5 text-amber-500" />
                    Accès Rapides
                  </CardTitle>
                  <CardDescription>Liens vers les pages publiques</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => window.open('/orientale-musique', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Site White-Label
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => window.open('/evenementiel/notre-orchestre', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Page Altess
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                      onClick={() => window.open('/composer-orchestre', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Outil Compositeur
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Formulas Tab */}
          <TabsContent value="formulas" className="mt-6">
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Formules d'Orchestre</CardTitle>
                    <CardDescription>Gérer les packages et tarifs</CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open('/admin/orchestra-formulas', '_blank')}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir l'éditeur complet
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formulas.map((formula) => (
                    <Card key={formula.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {formula.image_url && (
                              <img
                                src={formula.image_url}
                                alt={formula.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div>
                              <h3 className="font-bold text-white">{formula.name}</h3>
                              <p className="text-sm text-slate-400">À partir de {formula.price_from}€</p>
                              <Badge variant={formula.is_active ? 'default' : 'secondary'} className="mt-1">
                                {formula.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={formula.is_active ? 'outline' : 'default'}
                              onClick={() => toggleActive('orchestra_formulas', formula.id, formula.is_active)}
                            >
                              {formula.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteItem('orchestra_formulas', formula.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stars Tab */}
          <TabsContent value="stars" className="mt-6">
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Stars & Artistes</CardTitle>
                    <CardDescription>Gérer les artistes vedettes</CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open('/admin/stars', '_blank')}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir l'éditeur complet
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stars.map((star) => (
                    <Card key={star.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {star.image_url && (
                            <img
                              src={star.image_url}
                              alt={star.name}
                              className="w-20 h-20 object-cover rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{star.name}</h3>
                            <p className="text-sm text-amber-500">{star.title}</p>
                            <Badge variant={star.is_active ? 'default' : 'secondary'} className="mt-1">
                              {star.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant={star.is_active ? 'outline' : 'default'}
                              onClick={() => toggleActive('stars', star.id, star.is_active)}
                            >
                              {star.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteItem('stars', star.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-6">
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Vidéos Démo</CardTitle>
                    <CardDescription>Gérer les vidéos YouTube</CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open('/admin/demo-videos', '_blank')}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir l'éditeur complet
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <Card key={video.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        {video.thumbnail_url && (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-32 object-cover rounded mb-3"
                          />
                        )}
                        <h3 className="font-bold text-white text-sm mb-2">{video.title}</h3>
                        <div className="flex items-center justify-between">
                          <Badge variant={video.is_active ? 'default' : 'secondary'}>
                            {video.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={video.is_active ? 'outline' : 'default'}
                              onClick={() => toggleActive('demo_videos', video.id, video.is_active)}
                            >
                              {video.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteItem('demo_videos', video.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Instruments Tab */}
          <TabsContent value="instruments" className="mt-6">
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Instruments</CardTitle>
                    <CardDescription>Gérer le catalogue d'instruments</CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open('/admin/instruments', '_blank')}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir l'éditeur complet
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {instruments.map((instrument) => (
                    <Card key={instrument.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Music2 className="w-10 h-10 text-amber-500" />
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{instrument.name}</h3>
                            <p className="text-sm text-slate-400">{instrument.category}</p>
                            <p className="text-amber-500 font-semibold">{instrument.price}€</p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteItem('instruments', instrument.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-6">
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Réservations</CardTitle>
                    <CardDescription>Demandes de réservation clients</CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open('/admin/bookings', '_blank')}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir l'éditeur complet
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.slice(0, 10).map((booking) => (
                    <Card key={booking.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white">{booking.name}</h3>
                            <p className="text-sm text-slate-400">{booking.email} • {booking.phone}</p>
                            <p className="text-sm text-amber-500">
                              {booking.event_type} • {booking.event_date} • {booking.guests_count} invités
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{booking.location}</p>
                          </div>
                          <Badge variant={
                            booking.status === 'pending' ? 'default' :
                            booking.status === 'confirmed' ? 'default' :
                            'secondary'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="mt-6">
            <Card className="bg-slate-900/50 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white">Accès Rapides & Liens</CardTitle>
                <CardDescription>Liens vers toutes les pages d'Orientale Musique</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Pages Publiques</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/orientale-musique', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Site White-Label
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/evenementiel/notre-orchestre', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Notre Orchestre (Altess)
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/evenementiel/notre-orchestre/formules', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Nos Formules
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/evenementiel/notre-orchestre/stars', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Nos Stars
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/composer-orchestre', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Composer votre Orchestre
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Pages Admin</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/admin/orchestra-formulas', '_blank')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gérer les Formules
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/admin/stars', '_blank')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gérer les Stars
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/admin/demo-videos', '_blank')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gérer les Vidéos
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/admin/carousel', '_blank')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gérer le Carrousel
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/admin/instruments', '_blank')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gérer les Instruments
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/admin/bookings', '_blank')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gérer les Réservations
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-amber-500 hover:bg-amber-500/10"
                        onClick={() => window.open('/admin/quotes', '_blank')}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Gérer les Devis
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
