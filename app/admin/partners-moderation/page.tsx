'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminNavigation from '@/components/AdminNavigation';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Eye,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Partner = {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  address: string;
  main_image: string;
  is_active: boolean;
  approval_status: string;
  expires_at: string;
  approved_at: string;
  created_at: string;
};

export default function AdminPartnersModerationPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  useEffect(() => {
    loadPartners();
  }, []);

  async function loadPartners() {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(partnerId: string) {
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          is_active: true
        })
        .eq('id', partnerId);

      if (error) throw error;
      toast.success('Partenaire approuvé');
      loadPartners();
    } catch (error) {
      console.error('Error approving partner:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  }

  async function handleReject(partnerId: string) {
    const reason = prompt('Raison du rejet (optionnelle):');

    try {
      const { error } = await supabase
        .from('partners')
        .update({
          approval_status: 'rejected',
          is_active: false
        })
        .eq('id', partnerId);

      if (error) throw error;
      toast.success('Partenaire rejeté');
      loadPartners();
    } catch (error) {
      console.error('Error rejecting partner:', error);
      toast.error('Erreur lors du rejet');
    }
  }

  function viewDetails(partner: Partner) {
    setSelectedPartner(partner);
    setDetailsDialogOpen(true);
  }

  function getApprovalBadge(status: string) {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
    }
  }

  function getTimeRemaining(expiresAt: string) {
    if (!expiresAt) return null;

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expiré
        </Badge>
      );
    } else if (diffDays <= 7) {
      return (
        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Expire dans {diffDays}j
        </Badge>
      );
    } else if (diffDays <= 30) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Expire dans {diffDays}j
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Valide {diffDays}j
        </Badge>
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Modération des Partenaires" />
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
      <AdminNavigation title="Modération des Partenaires" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Modération des Partenaires</h1>
            <p className="text-muted-foreground mt-2">Approuvez ou rejetez les partenaires soumis</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <Card key={partner.id} className="overflow-hidden border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-green-500" />
                    {partner.name}
                  </CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getApprovalBadge(partner.approval_status || 'pending')}
                  {partner.expires_at && getTimeRemaining(partner.expires_at)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {partner.short_description}
                </p>

                <div className="space-y-2 text-sm">
                  {partner.category && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{partner.category}</Badge>
                    </div>
                  )}
                  {partner.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{partner.city}</span>
                    </div>
                  )}
                  {partner.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDetails(partner)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </Button>
                  {partner.approval_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(partner.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(partner.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {partner.approval_status === 'rejected' && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(partner.id)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {partners.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">Aucun partenaire à modérer</p>
            <p className="text-sm text-muted-foreground mt-2">Les partenaires soumis apparaîtront ici</p>
          </Card>
        )}
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Détails du partenaire
              {selectedPartner && getApprovalBadge(selectedPartner.approval_status || 'pending')}
            </DialogTitle>
          </DialogHeader>

          {selectedPartner && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedPartner.name}</h3>
                <p className="text-muted-foreground">{selectedPartner.short_description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {selectedPartner.category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                    <p className="capitalize">{selectedPartner.category}</p>
                  </div>
                )}
                {selectedPartner.city && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ville</p>
                    <p>{selectedPartner.city}</p>
                  </div>
                )}
                {selectedPartner.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p>{selectedPartner.address}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {selectedPartner.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedPartner.phone}</span>
                  </div>
                )}
                {selectedPartner.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedPartner.email}</span>
                  </div>
                )}
                {selectedPartner.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={selectedPartner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {selectedPartner.website}
                    </a>
                  </div>
                )}
              </div>

              {selectedPartner.expires_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Validité</p>
                  <div className="flex items-center gap-2">
                    {getTimeRemaining(selectedPartner.expires_at)}
                    <span className="text-sm text-muted-foreground">
                      (expire le {new Date(selectedPartner.expires_at).toLocaleDateString('fr-FR')})
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedPartner.approval_status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        handleApprove(selectedPartner.id);
                        setDetailsDialogOpen(false);
                      }}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleReject(selectedPartner.id);
                        setDetailsDialogOpen(false);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}
                {selectedPartner.approval_status === 'rejected' && (
                  <Button
                    onClick={() => {
                      handleApprove(selectedPartner.id);
                      setDetailsDialogOpen(false);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Réapprouver
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
