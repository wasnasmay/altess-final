'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Heart,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Mail,
  MessageSquare,
  Euro,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import AdminNavigation from '@/components/AdminNavigation';

type MecenasGoal = {
  id: string;
  target_amount: number;
  current_amount: number;
  is_active: boolean;
  created_at: string;
};

type Donation = {
  id: string;
  donor_name: string;
  email: string | null;
  amount: number;
  message: string | null;
  created_at: string;
};

type Stats = {
  totalDonations: number;
  totalAmount: number;
  donorCount: number;
  averageDonation: number;
  thisMonth: number;
  lastMonth: number;
};

export default function AdminMecenesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goal, setGoal] = useState<MecenasGoal | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDonations: 0,
    totalAmount: 0,
    donorCount: 0,
    averageDonation: 0,
    thisMonth: 0,
    lastMonth: 0,
  });

  const [targetAmount, setTargetAmount] = useState('50000');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  async function loadData() {
    try {
      setLoading(true);

      const { data: goalData } = await supabase
        .from('mecenas_goals')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (goalData) {
        setGoal(goalData);
        setTargetAmount(goalData.target_amount.toString());
      }

      const { data: donationsData } = await supabase
        .from('mecenas_donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (donationsData) {
        setDonations(donationsData);
        calculateStats(donationsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(donationsData: Donation[]) {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayThisMonthLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalAmount = donationsData.reduce((sum, d) => sum + d.amount, 0);
    const donorCount = new Set(donationsData.map(d => d.donor_name)).size;
    const averageDonation = donorCount > 0 ? totalAmount / donorCount : 0;

    const thisMonth = donationsData
      .filter(d => new Date(d.created_at) >= firstDayThisMonth)
      .reduce((sum, d) => sum + d.amount, 0);

    const lastMonth = donationsData
      .filter(d => {
        const date = new Date(d.created_at);
        return date >= firstDayLastMonth && date < firstDayThisMonthLastMonth;
      })
      .reduce((sum, d) => sum + d.amount, 0);

    setStats({
      totalDonations: donationsData.length,
      totalAmount,
      donorCount,
      averageDonation,
      thisMonth,
      lastMonth,
    });
  }

  async function handleUpdateGoal() {
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    setSaving(true);
    try {
      if (goal) {
        const { error } = await supabase
          .from('mecenas_goals')
          .update({ target_amount: amount })
          .eq('id', goal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mecenas_goals')
          .insert({ target_amount: amount, is_active: true });

        if (error) throw error;
      }

      toast.success('Objectif mis à jour');
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  }

  function exportToCSV() {
    const headers = ['Date', 'Nom', 'Email', 'Montant', 'Message'];
    const rows = donations.map(d => [
      new Date(d.created_at).toLocaleDateString('fr-FR'),
      d.donor_name,
      d.email || '',
      d.amount.toString(),
      d.message || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mecenes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const progressPercentage = goal ? Math.min((stats.totalAmount / goal.target_amount) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <AdminNavigation title="Gestion des Mécènes" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Gestion des Mécènes
            </h1>
            <p className="text-slate-400 mt-2">Tableau de bord administratif confidentiel</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={loadData}
              variant="outline"
              className="border-amber-500/30 hover:border-amber-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button
              onClick={exportToCSV}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-black via-gray-900 to-black border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-amber-400" />
                <span className="text-sm text-slate-400">Objectif</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {goal?.target_amount.toLocaleString('fr-FR') || '0'} €
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black via-gray-900 to-black border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <span className="text-sm text-slate-400">Collecté</span>
              </div>
              <p className="text-3xl font-bold text-green-400">
                {stats.totalAmount.toLocaleString('fr-FR')} €
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black via-gray-900 to-black border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="text-sm text-slate-400">Mécènes</span>
              </div>
              <p className="text-3xl font-bold text-blue-400">
                {stats.donorCount}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black via-gray-900 to-black border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Euro className="w-8 h-8 text-purple-400" />
                <span className="text-sm text-slate-400">Moy. don</span>
              </div>
              <p className="text-3xl font-bold text-purple-400">
                {stats.averageDonation.toFixed(0)} €
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 bg-gradient-to-br from-black via-gray-900 to-black border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Progression de la Collecte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Objectif actuel</span>
                  <span>{progressPercentage.toFixed(1)}% atteint</span>
                </div>
                <div className="relative h-8 bg-black/60 rounded-full overflow-hidden border border-amber-500/30">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 transition-all duration-1000"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target" className="text-amber-400">
                  Définir un nouvel objectif (€)
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="target"
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="bg-black/60 border-amber-500/30 text-white"
                    min="0"
                    step="1000"
                  />
                  <Button
                    onClick={handleUpdateGoal}
                    disabled={saving}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {saving ? 'Enregistrement...' : 'Mettre à jour'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-black via-gray-900 to-black border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-2xl text-amber-400 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Comparatif Mensuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-black/40 rounded-lg border border-green-500/20">
                <p className="text-sm text-slate-400 mb-1">Ce mois-ci</p>
                <p className="text-2xl font-bold text-green-400">
                  {stats.thisMonth.toLocaleString('fr-FR')} €
                </p>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-blue-500/20">
                <p className="text-sm text-slate-400 mb-1">Mois dernier</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.lastMonth.toLocaleString('fr-FR')} €
                </p>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-amber-500/20">
                <p className="text-sm text-slate-400 mb-1">Total dons</p>
                <p className="text-2xl font-bold text-amber-400">
                  {stats.totalDonations}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-black via-gray-900 to-black border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-400 flex items-center gap-2">
              <Heart className="w-6 h-6" />
              Liste des Contributions ({donations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-500/20">
                    <th className="text-left p-3 text-amber-400">Date</th>
                    <th className="text-left p-3 text-amber-400">Nom</th>
                    <th className="text-left p-3 text-amber-400">Email</th>
                    <th className="text-right p-3 text-amber-400">Montant</th>
                    <th className="text-left p-3 text-amber-400">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b border-slate-800/50 hover:bg-white/5">
                      <td className="p-3 text-slate-300">
                        {new Date(donation.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center border border-amber-500/30">
                            <Heart className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-white font-medium">{donation.donor_name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {donation.email ? (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-4 h-4 text-blue-400" />
                            <span className="text-sm">{donation.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">Non communiqué</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-green-400 font-bold text-lg">
                          {donation.amount.toLocaleString('fr-FR')} €
                        </span>
                      </td>
                      <td className="p-3">
                        {donation.message ? (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-300 text-sm line-clamp-2">
                              {donation.message}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {donations.length === 0 && (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">Aucune contribution enregistrée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
