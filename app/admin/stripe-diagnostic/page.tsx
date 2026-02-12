'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, RefreshCw, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';

type StripeProduct = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  images: string[];
  metadata: Record<string, string>;
  prices: {
    id: string;
    amount: number | null;
    currency: string;
    interval: string | null;
    type: string;
  }[];
};

type TestResult = {
  success: boolean;
  configured: boolean;
  products?: StripeProduct[];
  totalProducts?: number;
  message?: string;
  error?: string;
  details?: string;
};

export default function StripeDiagnosticPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, profile, router]);

  const testStripeConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/test-connection');
      const data = await response.json();

      setTestResult(data);

      if (data.success) {
        toast.success('Connexion Stripe réussie !');
      } else {
        toast.error('Erreur de connexion Stripe');
      }
    } catch (error: any) {
      console.error('Error testing Stripe:', error);
      setTestResult({
        success: false,
        configured: false,
        error: error.message || 'Erreur lors du test',
      });
      toast.error('Erreur lors du test de connexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testStripeConnection();
  }, []);

  const formatPrice = (amount: number | null, currency: string) => {
    if (amount === null) return 'N/A';
    const formatted = (amount / 100).toFixed(2);
    return `${formatted} ${currency.toUpperCase()}`;
  };

  if (!user || profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <AdminNavigation title="Diagnostic Stripe" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Diagnostic Stripe</h1>
            <p className="text-gray-400">Vérification de la configuration et des produits Stripe</p>
          </div>

          {/* Test Connection Button */}
          <div className="mb-6">
            <Button
              onClick={testStripeConnection}
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tester la connexion
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-6">
              {/* Configuration Status */}
              <Card className="bg-black/40 border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    Statut de la connexion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Configuration</p>
                      <Badge className={testResult.configured ? 'bg-green-500' : 'bg-red-500'}>
                        {testResult.configured ? 'Configuré' : 'Non configuré'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Connexion</p>
                      <Badge className={testResult.success ? 'bg-green-500' : 'bg-red-500'}>
                        {testResult.success ? 'Réussie' : 'Échouée'}
                      </Badge>
                    </div>
                  </div>

                  {testResult.message && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm">{testResult.message}</p>
                    </div>
                  )}

                  {testResult.error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm font-medium mb-2">{testResult.error}</p>
                      {testResult.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-white">
                            Détails techniques
                          </summary>
                          <pre className="mt-2 text-xs text-gray-500 overflow-x-auto">
                            {testResult.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  {testResult.totalProducts !== undefined && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-400 text-sm">
                        <strong>{testResult.totalProducts}</strong> produit(s) trouvé(s) sur Stripe
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Products List */}
              {testResult.products && testResult.products.length > 0 && (
                <Card className="bg-black/40 border-amber-500/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-amber-500" />
                      <CardTitle className="text-white">Produits Stripe</CardTitle>
                    </div>
                    <CardDescription className="text-gray-400">
                      Liste des produits actifs sur votre compte Stripe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testResult.products.map((product) => (
                        <div
                          key={product.id}
                          className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-amber-500/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-white font-semibold text-lg">{product.name}</h3>
                              {product.description && (
                                <p className="text-gray-400 text-sm mt-1">{product.description}</p>
                              )}
                            </div>
                            <Badge className={product.active ? 'bg-green-500' : 'bg-gray-500'}>
                              {product.active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <p className="text-gray-400 text-xs">ID: {product.id}</p>

                            {product.prices.length > 0 && (
                              <div className="mt-3">
                                <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  Prix disponibles:
                                </p>
                                <div className="space-y-2">
                                  {product.prices.map((price) => (
                                    <div
                                      key={price.id}
                                      className="flex items-center justify-between p-2 bg-black/30 rounded"
                                    >
                                      <span className="text-white font-medium">
                                        {formatPrice(price.amount, price.currency)}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {price.interval && (
                                          <Badge variant="outline" className="text-xs">
                                            {price.interval === 'month' ? 'Mensuel' : price.interval === 'year' ? 'Annuel' : price.interval}
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          {price.type === 'recurring' ? 'Récurrent' : 'Unique'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {product.images.length > 0 && (
                              <div className="mt-3">
                                <p className="text-gray-400 text-sm mb-2">Image:</p>
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-32 h-32 object-cover rounded-lg border border-gray-700"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Environment Variables Info */}
              <Card className="bg-black/40 border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Variables d'environnement</CardTitle>
                  <CardDescription className="text-gray-400">
                    Vérifiez que vos clés sont bien configurées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <code className="text-amber-400">STRIPE_SECRET_KEY:</code>
                      <Badge className={process.env.STRIPE_SECRET_KEY ? 'bg-green-500' : 'bg-red-500'}>
                        {process.env.STRIPE_SECRET_KEY ? 'Définie' : 'Manquante'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-amber-400">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:</code>
                      <Badge className={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'bg-green-500' : 'bg-red-500'}>
                        {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Définie' : 'Manquante'}
                      </Badge>
                    </div>
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-400 text-xs">
                        <strong>Note:</strong> Les variables d'environnement doivent être redéployées sur Vercel après modification du fichier .env
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
