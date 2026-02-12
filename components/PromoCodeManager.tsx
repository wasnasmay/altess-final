'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Percent, Tag, Plus, Trash2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export default function PromoCodeManager({ organizerId }: { organizerId: string }) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [newCode, setNewCode] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    max_uses: null as number | null,
    valid_until: ''
  });

  useEffect(() => {
    loadPromoCodes();
  }, [organizerId]);

  const loadPromoCodes = async () => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    if (data) {
      setPromoCodes(data);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  const createPromoCode = async () => {
    if (!newCode.code || newCode.discount_value <= 0) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          organizer_id: organizerId,
          code: newCode.code.toUpperCase(),
          discount_type: newCode.discount_type,
          discount_value: newCode.discount_value,
          max_uses: newCode.max_uses,
          valid_until: newCode.valid_until || null,
          is_active: true
        });

      if (error) throw error;

      setShowCreateDialog(false);
      setNewCode({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        max_uses: null,
        valid_until: ''
      });
      loadPromoCodes();
    } catch (error) {
      console.error('Error creating promo code:', error);
      alert('Erreur lors de la création du code promo');
    } finally {
      setLoading(false);
    }
  };

  const togglePromoCode = async (id: string, isActive: boolean) => {
    await supabase
      .from('promo_codes')
      .update({ is_active: !isActive })
      .eq('id', id);

    loadPromoCodes();
  };

  const deletePromoCode = async (id: string) => {
    if (confirm('Supprimer ce code promo ?')) {
      await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      loadPromoCodes();
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" />
            Codes promo
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="w-4 h-4 text-gray-500 ml-2" />
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                  <p className="text-sm">Créez des codes de réduction pour attirer plus de clients. Les codes peuvent être en pourcentage ou en montant fixe.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:from-amber-500 hover:to-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau code
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Créer un code promo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-white">Code *</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newCode.code}
                      onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                      placeholder="PROMO10"
                      className="bg-black border-gray-700 text-white uppercase"
                      maxLength={20}
                    />
                    <Button
                      onClick={generateCode}
                      variant="outline"
                      className="border-gray-700 text-amber-400"
                    >
                      Générer
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-white">Type de réduction *</Label>
                  <Select
                    value={newCode.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed') => setNewCode({ ...newCode, discount_type: value })}
                  >
                    <SelectTrigger className="bg-black border-gray-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Valeur de la réduction *</Label>
                  <div className="relative mt-2">
                    <Input
                      type="number"
                      value={newCode.discount_value}
                      onChange={(e) => setNewCode({ ...newCode, discount_value: parseFloat(e.target.value) })}
                      className="bg-black border-gray-700 text-white pr-12"
                      min="0"
                      step={newCode.discount_type === 'percentage' ? '1' : '0.01'}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {newCode.discount_type === 'percentage' ? '%' : '€'}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-white">Nombre max d'utilisations</Label>
                  <Input
                    type="number"
                    value={newCode.max_uses || ''}
                    onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Illimité"
                    className="bg-black border-gray-700 text-white mt-2"
                    min="1"
                  />
                </div>

                <div>
                  <Label className="text-white">Date d'expiration</Label>
                  <Input
                    type="date"
                    value={newCode.valid_until}
                    onChange={(e) => setNewCode({ ...newCode, valid_until: e.target.value })}
                    className="bg-black border-gray-700 text-white mt-2"
                  />
                </div>

                <Button
                  onClick={createPromoCode}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black"
                >
                  {loading ? 'Création...' : 'Créer le code promo'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {promoCodes.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Aucun code promo créé</p>
            <p className="text-sm text-gray-500">Créez votre premier code pour booster vos ventes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promoCodes.map((promo) => (
              <Card key={promo.id} className="bg-black border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1 bg-amber-500/20 text-amber-400 font-bold text-lg rounded border border-amber-500/30">
                            {promo.code}
                          </code>
                          <Button
                            onClick={() => copyToClipboard(promo.code)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            {copied === promo.code ? (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Badge className={promo.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                          {promo.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Percent className="w-4 h-4" />
                          <span className="font-bold">
                            -{promo.discount_value}{promo.discount_type === 'percentage' ? '%' : '€'}
                          </span>
                        </div>
                        <div className="text-gray-400">
                          {promo.current_uses} / {promo.max_uses || '∞'} utilisations
                        </div>
                        {promo.valid_until && (
                          <div className="text-gray-400">
                            Expire le {new Date(promo.valid_until).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={() => togglePromoCode(promo.id, promo.is_active)}
                        className="data-[state=checked]:bg-amber-500"
                      />
                      <Button
                        onClick={() => deletePromoCode(promo.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
