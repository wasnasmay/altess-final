"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cacheManager } from '@/lib/cache-manager';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';
import {
  Users,
  Calendar,
  TrendingUp,
  Radio,
  Video,
  Library,
  Award,
  Heart,
  ArrowUpRight
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalOrchestras: number;
  totalRevenue: number;
  activeStreams: number;
  mediaLibraryItems: number;
}

export default function CompactAdminDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalOrchestras: 0,
    totalRevenue: 0,
    activeStreams: 2,
    mediaLibraryItems: 0
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    const cacheKey = 'admin_dashboard_stats';
    const cached = cacheManager.get<DashboardStats>(cacheKey);

    if (cached) {
      setStats(cached);
      return;
    }

    const [
      { count: usersCount },
      { count: bookingsCount },
      { count: orchestrasCount },
      { data: bookingsData },
      { count: mediaCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('orchestras').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('price_agreed'),
      supabase.from('media_library').select('*', { count: 'exact', head: true })
    ]);

    const totalRevenue = bookingsData?.reduce((sum, b) => sum + (b.price_agreed || 0), 0) || 0;

    const newStats = {
      totalUsers: usersCount || 0,
      totalBookings: bookingsCount || 0,
      totalOrchestras: orchestrasCount || 0,
      totalRevenue,
      activeStreams: 2,
      mediaLibraryItems: mediaCount || 0
    };

    setStats(newStats);
    cacheManager.set(cacheKey, newStats, 2 * 60 * 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
          <p className="mt-4 text-amber-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    return null;
  }

  const quickLinks = [
    { icon: Library, label: 'Bibliothèque', href: '/admin/webtv-playout', color: 'amber' },
    { icon: Video, label: 'WebTV', href: '/admin/webtv-ticker', color: 'red' },
    { icon: Radio, label: 'WebRadio', href: '/admin/webradio-playout', color: 'blue' },
    { icon: TrendingUp, label: 'Régie Pub', href: '/admin/ads', color: 'green' },
    { icon: Users, label: 'Utilisateurs', href: '/admin', color: 'purple' },
    { icon: Calendar, label: 'Réservations', href: '/admin/orders', color: 'pink' },
    { icon: Award, label: 'Orchestres', href: '/admin/orchestra-formulas', color: 'orange' },
    { icon: Heart, label: 'Mécènes', href: '/admin/mecenas', color: 'rose' }
  ];

  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar />

      <main className="ml-16 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">Dashboard Admin</h1>
          <p className="text-gray-400">Vue d'ensemble de la plateforme ALTESS</p>
        </div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-6 gap-3 mb-8">
          <StatCard
            icon={Users}
            label="Utilisateurs"
            value={stats.totalUsers}
            color="amber"
          />
          <StatCard
            icon={Calendar}
            label="Réservations"
            value={stats.totalBookings}
            color="blue"
          />
          <StatCard
            icon={Award}
            label="Orchestres"
            value={stats.totalOrchestras}
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Revenus"
            value={`${(stats.totalRevenue / 1000).toFixed(0)}K €`}
            color="green"
          />
          <StatCard
            icon={Radio}
            label="Flux actifs"
            value={stats.activeStreams}
            color="red"
          />
          <StatCard
            icon={Library}
            label="Médias"
            value={stats.mediaLibraryItems}
            color="orange"
          />
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-${link.color}-500/20 flex items-center justify-center`}>
                  <link.icon size={24} className="text-amber-400" />
                </div>
                <ArrowUpRight size={20} className="text-gray-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{link.label}</h3>
              <p className="text-xs text-gray-400">Gérer {link.label.toLowerCase()}</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity - Compact */}
        <div className="mt-8 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-amber-400 mb-4">Activité récente</h2>
          <div className="space-y-3">
            <ActivityItem
              icon={Users}
              text="3 nouveaux utilisateurs inscrits"
              time="Il y a 2 heures"
            />
            <ActivityItem
              icon={Calendar}
              text="2 nouvelles réservations confirmées"
              time="Il y a 5 heures"
            />
            <ActivityItem
              icon={Video}
              text="15 nouvelles vidéos ajoutées à la bibliothèque"
              time="Aujourd'hui"
            />
            <ActivityItem
              icon={TrendingUp}
              text="Campagne publicitaire activée"
              time="Hier"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon size={20} className="text-amber-400" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-amber-400">{value}</div>
    </div>
  );
}

function ActivityItem({ icon: Icon, text, time }: any) {
  return (
    <div className="flex items-center gap-4 p-3 bg-black/20 rounded-lg border border-amber-500/10">
      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{text}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}
