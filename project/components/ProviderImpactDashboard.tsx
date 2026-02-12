'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Target,
  Zap,
  Image as ImageIcon,
  Video,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ProfileCompleteness {
  has_description: boolean;
  has_pricing: boolean;
  photos_count: number;
  videos_count: number;
  has_availability: boolean;
  has_whatsapp: boolean;
  optimization_score: number;
  missing_items: string[];
}

interface PerformanceMetrics {
  total_views: number;
  total_quotes_sent: number;
  total_quotes_accepted: number;
  conversion_rate: number;
  avg_response_time_hours: number;
}

interface PageView {
  visitor_city: string;
  visitor_region: string;
  viewed_at: string;
}

export default function ProviderImpactDashboard({ providerId }: { providerId: string }) {
  const [loading, setLoading] = useState(true);
  const [completeness, setCompleteness] = useState<ProfileCompleteness | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [pageViews, setPageViews] = useState<PageView[]>([]);

  useEffect(() => {
    fetchData();
  }, [providerId]);

  const fetchData = async () => {
    try {
      // Calculer le score d'optimisation
      await supabase.rpc('calculate_optimization_score', { provider_uuid: providerId });

      // Récupérer les données
      const [completenessRes, metricsRes, viewsRes] = await Promise.all([
        supabase
          .from('provider_profile_completeness')
          .select('*')
          .eq('provider_id', providerId)
          .maybeSingle(),
        supabase
          .from('provider_performance_metrics')
          .select('*')
          .eq('provider_id', providerId)
          .maybeSingle(),
        supabase
          .from('provider_page_views')
          .select('visitor_city, visitor_region, viewed_at')
          .eq('provider_id', providerId)
          .order('viewed_at', { ascending: false })
          .limit(100)
      ]);

      if (completenessRes.data) setCompleteness(completenessRes.data);
      if (metricsRes.data) setMetrics(metricsRes.data);
      if (viewsRes.data) setPageViews(viewsRes.data);
    } catch (error) {
      console.error('Error fetching impact data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Préparer les données pour les graphiques
  const getCityData = () => {
    const cityCount: Record<string, number> = {};
    pageViews.forEach(view => {
      if (view.visitor_city) {
        cityCount[view.visitor_city] = (cityCount[view.visitor_city] || 0) + 1;
      }
    });
    return Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => ({ city, visits: count }));
  };

  const getHourlyData = () => {
    const hourCount: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCount[i] = 0;

    pageViews.forEach(view => {
      const hour = new Date(view.viewed_at).getHours();
      hourCount[hour]++;
    });

    return Object.entries(hourCount).map(([hour, count]) => ({
      hour: `${hour}h`,
      visits: count
    }));
  };

  const getDailyData = () => {
    const dayCount: Record<string, number> = {};
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    days.forEach((_, idx) => dayCount[days[idx]] = 0);

    pageViews.forEach(view => {
      const dayIdx = new Date(view.viewed_at).getDay();
      dayCount[days[dayIdx]]++;
    });

    return days.map(day => ({ day, visits: dayCount[day] }));
  };

  const getChecklistItems = () => {
    const items = [];

    if (!completeness?.has_description) {
      items.push({ label: 'Ajoutez une description détaillée', icon: MessageSquare, completed: false });
    }
    if (!completeness?.has_pricing) {
      items.push({ label: 'Configurez vos tarifs', icon: DollarSign, completed: false });
    }
    if ((completeness?.photos_count || 0) < 5) {
      items.push({
        label: `Ajoutez ${5 - (completeness?.photos_count || 0)} photo(s) de plus`,
        icon: ImageIcon,
        completed: false
      });
    }
    if ((completeness?.videos_count || 0) < 2) {
      items.push({
        label: `Ajoutez ${2 - (completeness?.videos_count || 0)} vidéo(s) de plus`,
        icon: Video,
        completed: false
      });
    }
    if (!completeness?.has_availability) {
      items.push({ label: 'Configurez vos disponibilités', icon: Calendar, completed: false });
    }
    if (!completeness?.has_whatsapp) {
      items.push({ label: 'Ajoutez votre numéro WhatsApp', icon: MessageSquare, completed: false });
    }

    if (items.length === 0) {
      items.push({ label: 'Profil 100% optimisé', icon: CheckCircle2, completed: true });
    }

    return items;
  };

  const COLORS = ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', '#451a03', '#fbbf24', '#f97316'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const score = completeness?.optimization_score || 0;
  const cityData = getCityData();
  const hourlyData = getHourlyData();
  const dailyData = getDailyData();
  const checklistItems = getChecklistItems();

  return (
    <div className="space-y-6">
      {/* Score d'Optimisation */}
      <Card className="bg-gradient-to-br from-amber-600/20 to-transparent border-amber-600/30">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-light text-white mb-2">Score d'Optimisation de Visibilité</h3>
              <p className="text-sm text-gray-400">
                Optimisez votre profil pour attirer plus de clients
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-amber-600">{score}%</div>
              <Badge className={score === 100 ? 'bg-green-500' : 'bg-amber-600'}>
                {score === 100 ? 'Parfait' : 'En cours'}
              </Badge>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 transition-all duration-500 rounded-full"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {checklistItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    item.completed
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-black/30 border border-zinc-800 hover:border-amber-600/30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.completed ? 'bg-green-500/20' : 'bg-amber-600/20'
                  }`}>
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Icon className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <span className={`text-sm ${item.completed ? 'text-green-400' : 'text-gray-300'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques Commerciales */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-600/30 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Vues Totales</div>
                <div className="text-2xl font-bold text-white">{metrics?.total_views || 0}</div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-amber-600/30 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Temps de Réponse</div>
                <div className="text-2xl font-bold text-white">
                  {metrics?.avg_response_time_hours ? `${metrics.avg_response_time_hours.toFixed(1)}h` : 'N/A'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-600/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-green-600/30 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Taux de Conversion</div>
                <div className="text-2xl font-bold text-white">
                  {metrics?.conversion_rate ? `${metrics.conversion_rate.toFixed(1)}%` : '0%'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-600/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-600/30 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 mb-1">Devis Acceptés</div>
                <div className="text-2xl font-bold text-white">
                  {metrics?.total_quotes_accepted || 0}/{metrics?.total_quotes_sent || 0}
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-600/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques d'Audience */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Provenance Géographique */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-medium text-white">Provenance Géographique</h3>
            </div>
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="city"
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="visits" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnée pour le moment</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activité par Jour */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-medium text-white">Activité par Jour</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                />
                <YAxis
                  stroke="#71717a"
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activité par Heure */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-medium text-white">Pics d'Activité (24h)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="hour"
                stroke="#71717a"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
