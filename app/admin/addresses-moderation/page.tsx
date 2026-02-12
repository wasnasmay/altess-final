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
  MapPin,
  Eye,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type GoodAddress = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  cuisine_type: string;
  short_description: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  address: string;
  price_range: string;
  rating: number;
  is_active: boolean;
  approval_status: string;
  expires_at: string;
  approved_at: string;
  created_at: string;
};

export default function AdminAddressesModerationPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<GoodAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<GoodAddress | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      const { data, error } = await supabase
        .from('good_addresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(addressId: string) {
    try {
      const { error } = await supabase
        .from('good_addresses')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          is_active: true
        })
        .eq('id', addressId);

      if (error) throw error;
      toast.success('Adresse approuvée');
      loadAddresses();
    } catch (error) {
      console.error('Error approving address:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  }

  async function handleReject(addressId: string) {
    const reason = prompt('Raison du rejet (optionnelle):');

    try {
      const { error } = await supabase
        .from('good_addresses')
        .update({
          approval_status: 'rejected',
          is_active: false
        })
        .eq('id', addressId);

      if (error) throw error;
      toast.success('Adresse rejetée');
      loadAddresses();
    } catch (error) {
      console.error('Error rejecting address:', error);
      toast.error('Erreur lors du rejet');
    }
  }

  function viewDetails(address: GoodAddress) {
    setSelectedAddress(address);
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
        <AdminNavigation title="Modération des Bonnes Adresses" />
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
      <AdminNavigation title="Modération des Bonnes Adresses" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Modération des Bonnes Adresses</h1>
            <p className="text-muted-foreground mt-2">Approuvez ou rejetez les adresses soumises</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className="overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    {address.name}
                  </CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getApprovalBadge(address.approval_status || 'pending')}
                  {address.expires_at && getTimeRemaining(address.expires_at)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {address.short_description}
                </p>

                <div className="space-y-2 text-sm">
                  {address.category && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{address.category}</Badge>
                      {address.subcategory && (
                        <Badge variant="outline" className="text-xs">{address.subcategory}</Badge>
                      )}
                    </div>
                  )}
                  {address.cuisine_type && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                        {address.cuisine_type}
                      </Badge>
                    </div>
                  )}
                  {address.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{address.city}</span>
                    </div>
                  )}
                  {address.rating && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{address.rating}/5</span>
                    </div>
                  )}
                  {address.price_range && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{address.price_range}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDetails(address)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </Button>
                  {address.approval_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(address.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(address.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {address.approval_status === 'rejected' && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(address.id)}
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

        {addresses.length === 0 && (
          <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">Aucune adresse à modérer</p>
            <p className="text-sm text-muted-foreground mt-2">Les adresses soumises apparaîtront ici</p>
          </Card>
        )}
      </div>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Détails de l'adresse
              {selectedAddress && getApprovalBadge(selectedAddress.approval_status || 'pending')}
            </DialogTitle>
          </DialogHeader>

          {selectedAddress && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedAddress.name}</h3>
                <p className="text-muted-foreground">{selectedAddress.short_description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {selectedAddress.category && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                    <p className="capitalize">{selectedAddress.category}</p>
                    {selectedAddress.subcategory && (
                      <p className="text-sm text-muted-foreground">{selectedAddress.subcategory}</p>
                    )}
                  </div>
                )}
                {selectedAddress.cuisine_type && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type de cuisine</p>
                    <p>{selectedAddress.cuisine_type}</p>
                  </div>
                )}
                {selectedAddress.city && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ville</p>
                    <p>{selectedAddress.city}</p>
                  </div>
                )}
                {selectedAddress.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p>{selectedAddress.address}</p>
                  </div>
                )}
                {selectedAddress.price_range && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Gamme de prix</p>
                    <p className="font-semibold">{selectedAddress.price_range}</p>
                  </div>
                )}
                {selectedAddress.rating && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Note</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span className="font-semibold">{selectedAddress.rating}/5</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {selectedAddress.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedAddress.phone}</span>
                  </div>
                )}
                {selectedAddress.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedAddress.email}</span>
                  </div>
                )}
                {selectedAddress.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={selectedAddress.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {selectedAddress.website}
                    </a>
                  </div>
                )}
              </div>

              {selectedAddress.expires_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Validité</p>
                  <div className="flex items-center gap-2">
                    {getTimeRemaining(selectedAddress.expires_at)}
                    <span className="text-sm text-muted-foreground">
                      (expire le {new Date(selectedAddress.expires_at).toLocaleDateString('fr-FR')})
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedAddress.approval_status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        handleApprove(selectedAddress.id);
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
                        handleReject(selectedAddress.id);
                        setDetailsDialogOpen(false);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeter
                    </Button>
                  </>
                )}
                {selectedAddress.approval_status === 'rejected' && (
                  <Button
                    onClick={() => {
                      handleApprove(selectedAddress.id);
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
