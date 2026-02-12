'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AdminNavigation from '@/components/AdminNavigation';
import { Users, ShoppingCart, Award, TrendingUp, BookOpen, CheckCircle } from 'lucide-react';

type Stats = {
  totalPacks: number;
  publishedPacks: number;
  totalPurchases: number;
  totalRevenue: number;
  totalCourses: number;
  totalLessons: number;
  certificatesIssued: number;
};

type Purchase = {
  id: string;
  user_id: string;
  pack_id: string;
  amount_paid: number;
  purchase_date: string;
  payment_status: string;
  user_email?: string;
  pack_title?: string;
};

export default function AcademyStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalPacks: 0,
    publishedPacks: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    totalCourses: 0,
    totalLessons: 0,
    certificatesIssued: 0,
  });
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [packsRes, coursesRes, lessonsRes, purchasesRes, certsRes] = await Promise.all([
        supabase.from('academy_packs').select('id, is_published'),
        supabase.from('academy_pack_courses').select('id'),
        supabase.from('academy_course_lessons').select('id'),
        supabase.from('academy_user_purchases').select(`
          id,
          user_id,
          pack_id,
          amount_paid,
          purchase_date,
          payment_status
        `).order('purchase_date', { ascending: false }),
        supabase.from('academy_certificates').select('id'),
      ]);

      const packsData = packsRes.data || [];
      const purchasesData = purchasesRes.data || [];

      const purchasesWithDetails: Purchase[] = [];
      for (const purchase of purchasesData) {
        const { data: packData } = await supabase
          .from('academy_packs')
          .select('title')
          .eq('id', purchase.pack_id)
          .single();

        purchasesWithDetails.push({
          ...purchase,
          user_email: 'Utilisateur',
          pack_title: packData?.title || 'Pack supprimé',
        });
      }

      setStats({
        totalPacks: packsData.length,
        publishedPacks: packsData.filter((p) => p.is_published).length,
        totalPurchases: purchasesData.length,
        totalRevenue: purchasesData
          .filter((p) => p.payment_status === 'completed')
          .reduce((sum, p) => sum + (p.amount_paid || 0), 0),
        totalCourses: coursesRes.data?.length || 0,
        totalLessons: lessonsRes.data?.length || 0,
        certificatesIssued: certsRes.data?.length || 0,
      });

      setPurchases(purchasesWithDetails);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Statistiques Académie" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation title="Statistiques Académie" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Packs de Formation</CardTitle>
              <BookOpen className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{stats.totalPacks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.publishedPacks} publiés
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achats Réalisés</CardTitle>
              <ShoppingCart className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.totalPurchases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Élèves inscrits
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {stats.totalRevenue.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Paiements complétés
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificats</CardTitle>
              <Award className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">{stats.certificatesIssued}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Formations complétées
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contenu Pédagogique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cours créés</span>
                <span className="font-semibold text-lg">{stats.totalCourses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Leçons vidéo</span>
                <span className="font-semibold text-lg">{stats.totalLessons}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Moyenne/Pack</span>
                <span className="font-semibold text-lg">
                  {stats.totalPacks > 0 ? Math.round(stats.totalCourses / stats.totalPacks) : 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Commerciale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prix moyen</span>
                <span className="font-semibold text-lg">
                  {stats.totalPurchases > 0
                    ? (stats.totalRevenue / stats.totalPurchases).toFixed(2)
                    : 0}€
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taux conversion</span>
                <span className="font-semibold text-lg">
                  {stats.certificatesIssued > 0 && stats.totalPurchases > 0
                    ? ((stats.certificatesIssued / stats.totalPurchases) * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En cours</span>
                <span className="font-semibold text-lg">
                  {stats.totalPurchases - stats.certificatesIssued}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement Élèves</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taux complétion</span>
                <span className="font-semibold text-lg">
                  {stats.totalPurchases > 0
                    ? ((stats.certificatesIssued / stats.totalPurchases) * 100).toFixed(0)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Actifs</span>
                <span className="font-semibold text-lg">{stats.totalPurchases}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Certifiés</span>
                <span className="font-semibold text-lg">{stats.certificatesIssued}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Liste des Élèves Inscrits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Aucun achat pour le moment
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date d'achat</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {purchase.user_email || 'Email non disponible'}
                      </TableCell>
                      <TableCell>{purchase.pack_title}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {purchase.amount_paid.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        {new Date(purchase.purchase_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {purchase.payment_status === 'completed' ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Payé
                          </Badge>
                        ) : (
                          <Badge variant="secondary">En attente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
