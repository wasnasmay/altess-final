"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Percent, TrendingUp, Settings } from "lucide-react";

interface CommissionSetting {
  id: string;
  commission_type: 'fixed' | 'percentage';
  commission_value: number;
  stripe_fee_percentage: number;
  stripe_fee_fixed: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CommissionSettingsPage() {
  const [settings, setSettings] = useState<CommissionSetting[]>([]);
  const [activeSetting, setActiveSetting] = useState<CommissionSetting | null>(null);
  const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('percentage');
  const [commissionValue, setCommissionValue] = useState<string>('5.00');
  const [stripeFeePercentage, setStripeFeePercentage] = useState<string>('1.4');
  const [stripeFeeFixed, setStripeFeeFixed] = useState<string>('0.25');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_commission_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSettings(data || []);

      const active = data?.find(s => s.is_active);
      if (active) {
        setActiveSetting(active);
        setCommissionType(active.commission_type);
        setCommissionValue(active.commission_value.toString());
        setStripeFeePercentage((active.stripe_fee_percentage * 100).toFixed(2));
        setStripeFeeFixed(active.stripe_fee_fixed.toString());
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Désactiver toutes les configurations existantes
      if (activeSetting) {
        await supabase
          .from('platform_commission_settings')
          .update({ is_active: false })
          .eq('id', activeSetting.id);
      }

      // Créer une nouvelle configuration active
      const { data, error } = await supabase
        .from('platform_commission_settings')
        .insert({
          commission_type: commissionType,
          commission_value: parseFloat(commissionValue),
          stripe_fee_percentage: parseFloat(stripeFeePercentage) / 100,
          stripe_fee_fixed: parseFloat(stripeFeeFixed),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Configuration enregistrée",
        description: "Les nouveaux paramètres de commission sont actifs",
      });

      loadSettings();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function calculateExample() {
    const ticketPrice = 100;
    const quantity = 1;
    const subtotal = ticketPrice * quantity;

    const stripeFee = (subtotal * (parseFloat(stripeFeePercentage) / 100)) + parseFloat(stripeFeeFixed);

    let platformCommission = 0;
    if (commissionType === 'fixed') {
      platformCommission = parseFloat(commissionValue) * quantity;
    } else {
      platformCommission = subtotal * (parseFloat(commissionValue) / 100);
    }

    const organizerAmount = subtotal - stripeFee - platformCommission;

    return {
      subtotal: subtotal.toFixed(2),
      stripeFee: stripeFee.toFixed(2),
      platformCommission: platformCommission.toFixed(2),
      organizerAmount: organizerAmount.toFixed(2),
    };
  }

  const example = calculateExample();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <Settings className="w-10 h-10 text-blue-600" />
              Configuration des Commissions
            </h1>
            <p className="text-slate-600 mt-2">
              Définissez les frais et commissions de la plateforme ALTESS
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Configuration */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Paramètres de Commission
              </CardTitle>
              <CardDescription>
                Configurez le modèle de commission ALTESS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type de commission */}
              <div className="space-y-3">
                <Label>Type de Commission</Label>
                <RadioGroup value={commissionType} onValueChange={(v) => setCommissionType(v as any)}>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Pourcentage</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Commission calculée en % du prix du billet
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Montant Fixe</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Commission fixe par billet vendu
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Valeur de la commission */}
              <div className="space-y-2">
                <Label htmlFor="commission_value">
                  {commissionType === 'percentage' ? 'Pourcentage (%)' : 'Montant Fixe (€)'}
                </Label>
                <Input
                  id="commission_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(e.target.value)}
                  placeholder={commissionType === 'percentage' ? '5.00' : '2.50'}
                />
                <p className="text-sm text-slate-500">
                  {commissionType === 'percentage'
                    ? 'Ex: 5% signifie 5€ de commission sur un billet de 100€'
                    : 'Ex: 2.50€ de commission par billet vendu'
                  }
                </p>
              </div>

              {/* Frais Stripe */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-slate-900">Frais Stripe (Techniques)</h3>

                <div className="space-y-2">
                  <Label htmlFor="stripe_percentage">Pourcentage Stripe (%)</Label>
                  <Input
                    id="stripe_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    value={stripeFeePercentage}
                    onChange={(e) => setStripeFeePercentage(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Par défaut: 1.4% (frais Stripe standard EU)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_fixed">Frais Fixes Stripe (€)</Label>
                  <Input
                    id="stripe_fixed"
                    type="number"
                    step="0.01"
                    min="0"
                    value={stripeFeeFixed}
                    onChange={(e) => setStripeFeeFixed(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Par défaut: 0.25€ par transaction</p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
                {saving ? 'Enregistrement...' : 'Enregistrer la Configuration'}
              </Button>
            </CardContent>
          </Card>

          {/* Exemple de calcul */}
          <div className="space-y-6">
            <Card className="shadow-xl border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="text-blue-900">Simulation</CardTitle>
                <CardDescription>Exemple pour un billet à 100€</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <span className="text-slate-600">Prix du billet</span>
                    <span className="font-bold text-lg">100.00€</span>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Frais Stripe</span>
                      <span className="text-red-600 font-medium">-{example.stripeFee}€</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Commission ALTESS</span>
                      <span className="text-orange-600 font-medium">-{example.platformCommission}€</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-blue-200 pt-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                      <span className="font-semibold text-green-900">Part Organisateur</span>
                      <span className="font-bold text-2xl text-green-700">{example.organizerAmount}€</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-1">
                  <p className="font-medium text-blue-900">Répartition:</p>
                  <p className="text-blue-700">• Organisateur: {((parseFloat(example.organizerAmount) / 100) * 100).toFixed(1)}%</p>
                  <p className="text-blue-700">• ALTESS: {((parseFloat(example.platformCommission) / 100) * 100).toFixed(1)}%</p>
                  <p className="text-blue-700">• Stripe: {((parseFloat(example.stripeFee) / 100) * 100).toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Historique */}
            <Card className="shadow-xl border-slate-200">
              <CardHeader>
                <CardTitle className="text-sm">Historique des Configurations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {settings.map((setting) => (
                    <div
                      key={setting.id}
                      className={`p-3 rounded-lg border text-sm ${
                        setting.is_active
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {setting.commission_type === 'percentage'
                              ? `${setting.commission_value}%`
                              : `${setting.commission_value}€ fixe`
                            }
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(setting.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {setting.is_active && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
