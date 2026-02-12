'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar, DollarSign, Users, Ticket, ScanLine, Edit, Plus,
  TrendingUp, Eye, BarChart3, CheckCircle, Info, Home
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import OrganizerSidebar from '@/components/OrganizerSidebar';
import OrganizerPayoutModule from '@/components/OrganizerPayoutModule';
import TicketQuotaManager from '@/components/TicketQuotaManager';
import ProTicketScanner from '@/components/ProTicketScanner';
import EventStepperForm from '@/components/EventStepperForm';
import PromoCodeManager from '@/components/PromoCodeManager';
import StoreQRGenerator from '@/components/StoreQRGenerator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface Event {
  id: string;
  title: string;
  event_date: string;
  city: string;
  tickets_sold: number;
  ticket_categories: any[];
  status: string;
  main_image: string;
}

interface Stats {
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  ticketsSold: number;
}

interface Organizer {
  id: string;
  company_name: string;
  slug: string;
  user_id: string;
  logo_url: string | null;
  brand_color: string;
  pending_balance: number;
  total_revenue: number;
  bank_details: any;
}

export default function OrganizerDashboardPremium() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    activeEvents: 0,
    totalRevenue: 0,
    ticketsSold: 0
  });
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showQuotaManager, setShowQuotaManager] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [salesChartData, setSalesChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile && profile.role !== 'organizer') {
      router.push('/');
      toast.error('Accès refusé', {
        description: 'Cette page est réservée aux organisateurs'
      });
      return;
    }

    loadData();
  }, [user, profile]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: organizerData, error: orgError } = await supabase
        .from('event_organizers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (orgError) {
        if (orgError.code === 'PGRST116') {
          toast.info('Bienvenue ! Créons votre espace', {
            description: 'Quelques informations sont nécessaires'
          });
          router.push('/organizer-onboarding');
          return;
        }
        throw orgError;
      }

      if (!organizerData.onboarding_completed) {
        toast.info('Finalisez votre inscription', {
          description: 'Quelques informations supplémentaires sont nécessaires'
        });
        router.push('/organizer-onboarding');
        return;
      }

      setOrganizer(organizerData);
      await loadEvents(organizerData.id);
      await loadStats(organizerData.id);
      await loadSalesChart(organizerData.id);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (organizerId: string) => {
    // organizer_id dans public_events pointe vers auth.users.id, pas event_organizers.id
    const { data: organizerData } = await supabase
      .from('event_organizers')
      .select('user_id')
      .eq('id', organizerId)
      .single();

    if (!organizerData) return;

    const { data, error } = await supabase
      .from('public_events')
      .select('*')
      .eq('organizer_id', organizerData.user_id)
      .order('event_date', { ascending: false });

    if (data) {
      setEvents(data);
    }
  };

  const loadStats = async (organizerId: string) => {
    // Récupérer les événements via user_id
    const { data: organizerData } = await supabase
      .from('event_organizers')
      .select('user_id')
      .eq('id', organizerId)
      .single();

    if (!organizerData) return;

    const { data: eventsData } = await supabase
      .from('public_events')
      .select('id, status')
      .eq('organizer_id', organizerData.user_id);

    // Pour les tickets, on utilise l'ID de event_organizers
    const { data: ticketsData } = await supabase
      .from('ticket_purchases')
      .select('final_amount, quantity')
      .eq('organizer_id', organizerId);

    if (eventsData && ticketsData) {
      const totalRevenue = ticketsData.reduce((sum, t) => sum + parseFloat(t.final_amount.toString()), 0);
      const ticketsSold = ticketsData.reduce((sum, t) => sum + t.quantity, 0);

      setStats({
        totalEvents: eventsData.length,
        activeEvents: eventsData.filter(e => e.status === 'upcoming').length,
        totalRevenue,
        ticketsSold
      });
    }
  };

  const loadSalesChart = async (organizerId: string) => {
    // Charger les ventes des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: ticketsData } = await supabase
      .from('ticket_purchases')
      .select('created_at, final_amount')
      .eq('organizer_id', organizerId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (!ticketsData) return;

    // Grouper par jour
    const salesByDay: { [key: string]: number } = {};

    // Initialiser tous les jours avec 0
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateKey = date.toISOString().split('T')[0];
      salesByDay[dateKey] = 0;
    }

    // Remplir avec les vraies données
    ticketsData.forEach(ticket => {
      const dateKey = ticket.created_at.split('T')[0];
      if (salesByDay[dateKey] !== undefined) {
        salesByDay[dateKey] += parseFloat(ticket.final_amount.toString());
      }
    });

    // Convertir en format pour recharts
    const chartData = Object.entries(salesByDay).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      ventes: Math.round(amount)
    }));

    setSalesChartData(chartData);
  };

  const handleRequestPayout = async () => {
    toast.success('Demande envoyée', {
      description: 'Votre demande de virement a été envoyée avec succès'
    });
  };

  const handleStatClick = (statType: string) => {
    setSelectedStat(selectedStat === statType ? null : statType);
    toast.info('Filtre appliqué', {
      description: `Affichage des données filtrées par ${statType}`
    });
  };

  const getFilteredEvents = () => {
    if (!selectedStat) return events;

    switch (selectedStat) {
      case 'active':
        return events.filter(e => e.status === 'active');
      case 'revenue':
        return events.sort((a, b) => b.tickets_sold - a.tickets_sold);
      case 'tickets':
        return events.filter(e => e.tickets_sold > 0);
      default:
        return events;
    }
  };

  if (loading || !organizer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  const STAT_CARDS = [
    {
      id: 'active',
      title: 'Événements actifs',
      value: stats.activeEvents,
      icon: Calendar,
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-600/10',
      borderColor: 'border-blue-600/30'
    },
    {
      id: 'revenue',
      title: 'Chiffre d\'affaires',
      value: stats.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      icon: DollarSign,
      color: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-600/10',
      borderColor: 'border-green-600/30'
    },
    {
      id: 'tickets',
      title: 'Billets vendus',
      value: stats.ticketsSold,
      icon: Ticket,
      color: 'from-amber-600 to-orange-600',
      bgColor: 'bg-amber-600/10',
      borderColor: 'border-amber-600/30'
    },
    {
      id: 'participants',
      title: 'Participants',
      value: stats.ticketsSold,
      icon: Users,
      color: 'from-purple-600 to-pink-600',
      bgColor: 'bg-purple-600/10',
      borderColor: 'border-purple-600/30'
    }
  ];

  return (
    <div className="flex min-h-screen bg-black">
      <OrganizerSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        companyName={organizer.company_name}
        companySlug={organizer.slug}
        notificationCount={organizer.pending_balance > 0 ? 1 : 0}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                {organizer.company_name}
              </h1>
              <p className="text-slate-400 mt-1">Tableau de bord professionnel</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour à Altess
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowScanner(true)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      <ScanLine className="w-4 h-4 mr-2" />
                      Scanner
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scanner les billets en direct</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                onClick={() => window.open(`/boutique/${organizer.slug}`, '_blank')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ma boutique
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map((stat) => {
                  const Icon = stat.icon;
                  const isSelected = selectedStat === stat.id;

                  return (
                    <Card
                      key={stat.id}
                      onClick={() => handleStatClick(stat.id)}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        isSelected
                          ? 'ring-2 ring-amber-500 shadow-xl shadow-amber-500/20'
                          : 'hover:shadow-lg'
                      } bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800`}
                    >
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        {isSelected && (
                          <Badge className="mt-2 bg-amber-600">Filtré</Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedStat && (
                <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
                  <p className="text-amber-400 text-sm flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Affichage filtré par : {STAT_CARDS.find(s => s.id === selectedStat)?.title}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStat(null)}
                      className="ml-auto text-amber-400 hover:text-amber-300"
                    >
                      Réinitialiser
                    </Button>
                  </p>
                </div>
              )}

              {salesChartData.length > 0 && (
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                      Courbe des ventes - 30 derniers jours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={salesChartData}>
                        <defs>
                          <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          style={{ fontSize: '12px' }}
                          tickFormatter={(value) => `${value}€`}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: any) => [`${value}€`, 'Ventes']}
                        />
                        <Area
                          type="monotone"
                          dataKey="ventes"
                          stroke="#f59e0b"
                          fillOpacity={1}
                          fill="url(#colorVentes)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-amber-500" />
                      Aperçu des ventes
                    </span>
                    <Button
                      onClick={() => setShowEventForm(true)}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouvel événement
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getFilteredEvents().slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          {event.main_image && (
                            <img
                              src={event.main_image}
                              alt={event.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h4 className="font-medium text-white">{event.title}</h4>
                            <p className="text-sm text-slate-400">
                              {new Date(event.event_date).toLocaleDateString('fr-FR')} - {event.city}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-slate-400">Billets vendus</p>
                            <p className="font-bold text-white">{event.tickets_sold || 0}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowQuotaManager(true);
                            }}
                            className="border-slate-700 text-white hover:bg-slate-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Mes Événements</h2>
                <Button
                  onClick={() => setShowEventForm(true)}
                  className="bg-gradient-to-r from-amber-600 to-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un événement
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="bg-slate-900 border-slate-800 hover:shadow-xl transition-all">
                    {event.main_image && (
                      <img
                        src={event.main_image}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-white text-lg">{event.title}</h3>
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm mb-4">
                        {new Date(event.event_date).toLocaleDateString('fr-FR')} - {event.city}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Billets vendus</p>
                          <p className="text-lg font-bold text-white">{event.tickets_sold || 0}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowQuotaManager(true);
                          }}
                          className="border-slate-700 text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'accounting' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Comptabilité</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OrganizerPayoutModule
                  organizerId={organizer.id}
                  pendingBalance={organizer.pending_balance}
                  events={events}
                  onRequestPayout={handleRequestPayout}
                />

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                      Informations bancaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-slate-400">IBAN</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="w-4 h-4 text-slate-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">
                                Numéro de compte bancaire international. Format : FR76 XXXX XXXX XXXX XXXX XXXX XXX
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-white font-mono">
                        {organizer.bank_details?.iban || 'Non renseigné'}
                      </p>
                    </div>

                    <Button variant="outline" className="w-full border-slate-700 text-white">
                      Modifier mes coordonnées bancaires
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'promotion' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Promotion</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PromoCodeManager organizerId={organizer.id} />
                <StoreQRGenerator
                  organizerSlug={organizer.slug}
                  organizerName={organizer.company_name}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showEventForm && (
        <EventStepperForm
          onClose={() => setShowEventForm(false)}
          onSuccess={() => {
            setShowEventForm(false);
            loadData();
          }}
        />
      )}

      {showQuotaManager && selectedEvent && (
        <TicketQuotaManager
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          categories={selectedEvent.ticket_categories || []}
          isOpen={showQuotaManager}
          onClose={() => {
            setShowQuotaManager(false);
            setSelectedEvent(null);
          }}
          onUpdate={() => loadData()}
        />
      )}

      {showScanner && (
        <ProTicketScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          organizerId={organizer.id}
        />
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
