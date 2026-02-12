'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import AdminNavigation from '@/components/AdminNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Crown,
  Search,
  Calendar,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  account_type: string;
  premium_expires_at?: string;
  created_at: string;
  total_revenue: number;
}

interface ProviderProfile {
  id: string;
  business_name: string;
  contact_email: string;
  account_type: string;
  premium_expires_at?: string;
  created_at: string;
  subscription_revenue: number;
  city?: string;
  category?: string;
}

export default function UsersManagementPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'users' | 'providers'>('users');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | ProviderProfile | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [premiumDuration, setPremiumDuration] = useState('365');
  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState(false);

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
    if (user && profile?.role === 'admin') {
      loadData();
    }
  }, [user, profile, viewMode]);

  async function loadData() {
    try {
      setLoadingData(true);

      if (viewMode === 'users') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } else {
        const { data, error } = await supabase
          .from('event_providers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProviders(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoadingData(false);
    }
  }

  async function handleTogglePremium(profile: UserProfile | ProviderProfile, upgrade: boolean) {
    if (upgrade) {
      setSelectedProfile(profile);
      setShowUpgradeDialog(true);
    } else {
      // Downgrade to normal
      try {
        setProcessing(true);
        const tableName = viewMode === 'users' ? 'profiles' : 'event_providers';

        const { error } = await supabase
          .from(tableName)
          .update({
            account_type: 'normal',
            premium_expires_at: null,
          })
          .eq('id', profile.id);

        if (error) throw error;

        toast.success('Compte passé en Normal');
        loadData();
      } catch (error) {
        console.error('Error downgrading account:', error);
        toast.error('Erreur lors de la modification');
      } finally {
        setProcessing(false);
      }
    }
  }

  async function confirmUpgrade() {
    if (!selectedProfile) return;

    try {
      setProcessing(true);
      const tableName = viewMode === 'users' ? 'profiles' : 'event_providers';
      const days = parseInt(premiumDuration);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { error } = await supabase
        .from(tableName)
        .update({
          account_type: 'premium',
          premium_expires_at: expiresAt.toISOString(),
          last_payment_date: new Date().toISOString(),
        })
        .eq('id', selectedProfile.id);

      if (error) throw error;

      toast.success(`Compte passé en Premium (${days} jours)`);
      setShowUpgradeDialog(false);
      setSelectedProfile(null);
      loadData();
    } catch (error) {
      console.error('Error upgrading account:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setProcessing(false);
    }
  }

  function isPremiumExpiring(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  function isPremiumExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  function formatExpiryDate(expiresAt?: string): string {
    if (!expiresAt) return 'N/A';
    const daysUntil = Math.floor(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil < 0) return 'Expiré';
    if (daysUntil === 0) return 'Expire aujourd\'hui';
    if (daysUntil === 1) return 'Expire demain';
    if (daysUntil <= 7) return `${daysUntil} jours restants`;
    return new Date(expiresAt).toLocaleDateString('fr-FR');
  }

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProviders = providers.filter((p) =>
    p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const premiumUsersCount = users.filter(u => u.account_type === 'premium').length;
  const premiumProvidersCount = providers.filter(p => p.account_type === 'premium').length;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <AdminSidebar />
      <div className="ml-16">
        <div className="border-b border-amber-500/20 bg-black/40 backdrop-blur-sm p-4">
          <div className="container mx-auto">
            <AdminNavigation title="Gestion des Comptes" />
          </div>
        </div>

        <div className="container mx-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-400">Total Utilisateurs</p>
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-400">Prestataires</p>
                    <p className="text-2xl font-bold text-white">{providers.length}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-400">Premium Users</p>
                    <p className="text-2xl font-bold text-white">{premiumUsersCount}</p>
                  </div>
                  <Crown className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-400">Premium Providers</p>
                    <p className="text-2xl font-bold text-white">{premiumProvidersCount}</p>
                  </div>
                  <Crown className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <Card className="bg-black/40 border-amber-500/20 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* View Toggle */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setViewMode('users')}
                    variant={viewMode === 'users' ? 'default' : 'outline'}
                    className={viewMode === 'users' ? 'bg-amber-600' : ''}
                  >
                    Utilisateurs ({users.length})
                  </Button>
                  <Button
                    onClick={() => setViewMode('providers')}
                    variant={viewMode === 'providers' ? 'default' : 'outline'}
                    className={viewMode === 'providers' ? 'bg-amber-600' : ''}
                  >
                    Prestataires ({providers.length})
                  </Button>
                </div>

                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom ou email..."
                    className="pl-10 bg-zinc-900 border-zinc-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users/Providers List */}
          {loadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
              <p className="text-zinc-400">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {viewMode === 'users'
                ? filteredUsers.map((user) => (
                    <Card
                      key={user.id}
                      className="bg-black/40 border-amber-500/20 hover:border-amber-500/40 transition-all"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* User Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white text-lg">
                                  {user.full_name || user.email}
                                </h3>
                                {user.account_type === 'premium' && (
                                  <Crown className="w-5 h-5 text-amber-500" />
                                )}
                                {user.role === 'admin' && (
                                  <Badge className="bg-red-500/20 text-red-400">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-zinc-400">{user.email}</p>
                              {user.account_type === 'premium' && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Calendar className="w-4 h-4 text-zinc-500" />
                                  <span
                                    className={`text-xs ${
                                      isPremiumExpired(user.premium_expires_at)
                                        ? 'text-red-400'
                                        : isPremiumExpiring(user.premium_expires_at)
                                        ? 'text-orange-400'
                                        : 'text-green-400'
                                    }`}
                                  >
                                    {formatExpiryDate(user.premium_expires_at)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="text-right">
                              <Badge className="bg-amber-500/20 text-amber-400 mb-2">
                                {user.account_type === 'premium' ? 'Premium' : 'Normal'}
                              </Badge>
                              {user.total_revenue > 0 && (
                                <p className="text-xs text-zinc-400">
                                  Revenus: {user.total_revenue.toFixed(2)}€
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="ml-4">
                            {user.account_type === 'premium' ? (
                              <Button
                                onClick={() => handleTogglePremium(user, false)}
                                disabled={processing}
                                variant="outline"
                                size="sm"
                                className="gap-2 border-zinc-600 hover:border-zinc-500"
                              >
                                <ArrowDownCircle className="w-4 h-4" />
                                Passer en Normal
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleTogglePremium(user, true)}
                                disabled={processing}
                                size="sm"
                                className="gap-2 bg-amber-600 hover:bg-amber-700"
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                                Passer en Premium
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : filteredProviders.map((provider) => (
                    <Card
                      key={provider.id}
                      className="bg-black/40 border-amber-500/20 hover:border-amber-500/40 transition-all"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Provider Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-white text-lg">
                                  {provider.business_name}
                                </h3>
                                {provider.account_type === 'premium' && (
                                  <Crown className="w-5 h-5 text-amber-500" />
                                )}
                              </div>
                              <p className="text-sm text-zinc-400">{provider.contact_email}</p>
                              {provider.city && (
                                <p className="text-xs text-zinc-500 mt-1">{provider.city}</p>
                              )}
                              {provider.account_type === 'premium' && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Calendar className="w-4 h-4 text-zinc-500" />
                                  <span
                                    className={`text-xs ${
                                      isPremiumExpired(provider.premium_expires_at)
                                        ? 'text-red-400'
                                        : isPremiumExpiring(provider.premium_expires_at)
                                        ? 'text-orange-400'
                                        : 'text-green-400'
                                    }`}
                                  >
                                    {formatExpiryDate(provider.premium_expires_at)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="text-right">
                              <Badge className="bg-amber-500/20 text-amber-400 mb-2">
                                {provider.account_type === 'premium' ? 'Premium' : 'Normal'}
                              </Badge>
                              {provider.subscription_revenue > 0 && (
                                <p className="text-xs text-zinc-400">
                                  Revenus: {provider.subscription_revenue.toFixed(2)}€
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="ml-4">
                            {provider.account_type === 'premium' ? (
                              <Button
                                onClick={() => handleTogglePremium(provider, false)}
                                disabled={processing}
                                variant="outline"
                                size="sm"
                                className="gap-2 border-zinc-600 hover:border-zinc-500"
                              >
                                <ArrowDownCircle className="w-4 h-4" />
                                Passer en Normal
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleTogglePremium(provider, true)}
                                disabled={processing}
                                size="sm"
                                className="gap-2 bg-amber-600 hover:bg-amber-700"
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                                Passer en Premium
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
          )}
        </div>
      </div>

      {/* Upgrade to Premium Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-zinc-900 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-500" />
              Passer en Premium
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400">Durée de l'abonnement</Label>
              <select
                value={premiumDuration}
                onChange={(e) => setPremiumDuration(e.target.value)}
                className="w-full mt-2 p-3 rounded-lg bg-black border border-zinc-700 text-white"
              >
                <option value="30">1 mois (30 jours)</option>
                <option value="90">3 mois (90 jours)</option>
                <option value="180">6 mois (180 jours)</option>
                <option value="365">1 an (365 jours)</option>
              </select>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-400">
                Le compte sera Premium jusqu'au{' '}
                {new Date(
                  Date.now() + parseInt(premiumDuration) * 24 * 60 * 60 * 1000
                ).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUpgradeDialog(false);
                setSelectedProfile(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmUpgrade}
              disabled={processing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              Activer Premium
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
