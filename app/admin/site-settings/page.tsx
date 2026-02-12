'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw, AlertCircle, MessageCircle, Menu, Plus, Trash2, GripVertical, Image } from 'lucide-react';

type SiteSettings = {
  id: string;
  site_name: string;
  site_description: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  footer_text: string | null;
};

type WhatsAppSettings = {
  id: string;
  phone_number: string;
  message: string | null;
  position: string | null;
  is_enabled: boolean;
  color_scheme: string | null;
  show_on_mobile: boolean;
};

type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  target: string;
};

export default function SiteSettingsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile?.role !== 'admin') {
      toast.error('Accès refusé');
      router.push('/');
      return;
    }

    loadSettings();
  }, [user, profile, router]);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);

      // Charger les paramètres du site
      const { data: siteData, error: siteError } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (siteError) {
        console.error('Error loading settings:', siteError);
        setError(siteError.message);
        return;
      }

      if (!siteData) {
        setError('Aucun paramètre trouvé. Utilisez le script SQL pour initialiser la base de données.');
        return;
      }

      setSettings(siteData);

      // Charger les paramètres WhatsApp
      const { data: whatsappData, error: whatsappError } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!whatsappError && whatsappData) {
        setWhatsappSettings(whatsappData);
      } else {
        // Créer des paramètres par défaut si aucun n'existe
        setWhatsappSettings({
          id: '',
          phone_number: '',
          message: 'Bonjour, comment puis-je vous aider ?',
          position: 'bottom-left',
          is_enabled: true,
          color_scheme: 'green',
          show_on_mobile: true
        });
      }

      // Charger les éléments de navigation
      const { data: navData, error: navError } = await supabase
        .from('navigation_items')
        .select('*')
        .order('order_index');

      if (!navError && navData) {
        setNavigationItems(navData);
      }
    } catch (err: any) {
      console.error('Exception loading settings:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setSaving(true);

      // Sauvegarder les paramètres du site
      const { error: siteError } = await supabase
        .from('site_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (siteError) throw siteError;

      // Sauvegarder les paramètres WhatsApp
      if (whatsappSettings) {
        if (whatsappSettings.id) {
          // Mise à jour
          const { error: whatsappError } = await supabase
            .from('whatsapp_settings')
            .update({
              ...whatsappSettings,
              updated_at: new Date().toISOString()
            })
            .eq('id', whatsappSettings.id);

          if (whatsappError) throw whatsappError;
        } else {
          // Insertion
          const { data, error: whatsappError } = await supabase
            .from('whatsapp_settings')
            .insert([{
              phone_number: whatsappSettings.phone_number,
              message: whatsappSettings.message,
              position: whatsappSettings.position,
              is_enabled: whatsappSettings.is_enabled,
              color_scheme: whatsappSettings.color_scheme,
              show_on_mobile: whatsappSettings.show_on_mobile
            }])
            .select()
            .single();

          if (whatsappError) throw whatsappError;
          if (data) setWhatsappSettings(data);
        }
      }

      // Sauvegarder les éléments de navigation
      for (const item of navigationItems) {
        const { error: navError } = await supabase
          .from('navigation_items')
          .update({
            label: item.label,
            href: item.href,
            icon: item.icon,
            order_index: item.order_index,
            is_active: item.is_active,
            target: item.target,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (navError) throw navError;
      }

      toast.success('Paramètres enregistrés avec succès');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof SiteSettings, value: string) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  function handleWhatsAppChange(field: keyof WhatsAppSettings, value: string | boolean) {
    if (!whatsappSettings) return;
    setWhatsappSettings({ ...whatsappSettings, [field]: value });
  }

  function handleNavItemChange(id: string, field: keyof NavigationItem, value: string | boolean | number) {
    setNavigationItems(navigationItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }

  async function handleAddNavItem() {
    try {
      const newItem = {
        label: 'Nouveau menu',
        href: '/nouveau',
        icon: 'Circle',
        order_index: navigationItems.length + 1,
        is_active: true,
        target: '_self'
      };

      const { data, error } = await supabase
        .from('navigation_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setNavigationItems([...navigationItems, data]);
        toast.success('Élément ajouté');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'ajout');
    }
  }

  async function handleDeleteNavItem(id: string) {
    if (!confirm('Supprimer cet élément de navigation ?')) return;

    try {
      const { error } = await supabase
        .from('navigation_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNavigationItems(navigationItems.filter(item => item.id !== id));
      toast.success('Élément supprimé');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <AdminSidebar />
        <div className="lg:ml-64 p-4 md:p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <AdminSidebar />
        <div className="lg:ml-64 p-4 md:p-8">
          <Card className="max-w-2xl mx-auto bg-red-500/10 border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <p className="text-red-300 font-medium">Erreur de chargement</p>
                  <p className="text-red-400 text-sm">{error}</p>
                  <Button
                    onClick={loadSettings}
                    variant="outline"
                    size="sm"
                    className="mt-4 border-red-500/30 text-red-300 hover:bg-red-500/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminSidebar />

      <div className="lg:ml-64 p-4 md:p-8 relative">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Paramètres du site</h1>
                <p className="text-slate-400 text-sm md:text-base">Gérez les informations globales de votre plateforme</p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 gap-2 w-full md:w-auto shadow-lg"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>

          {/* General Settings */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Informations générales</CardTitle>
              <CardDescription>Nom du site, description et paramètres visuels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="site_name" className="text-slate-200">Nom du site</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name || ''}
                    onChange={(e) => handleChange('site_name', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="site_description" className="text-slate-200">Description</Label>
                  <Textarea
                    id="site_description"
                    value={settings.site_description || ''}
                    onChange={(e) => handleChange('site_description', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logo_url" className="text-slate-200">Logo du header (URL)</Label>
                  <Input
                    id="logo_url"
                    value={settings.logo_url || ''}
                    onChange={(e) => handleChange('logo_url', e.target.value)}
                    placeholder="/image_(4).png"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-400">Chemin vers votre logo (ex: /image_(4).png)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_color" className="text-slate-200">Couleur primaire</Label>
                  <Input
                    id="primary_color"
                    type="color"
                    value={settings.primary_color || '#F59E0B'}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color" className="text-slate-200">Couleur secondaire</Label>
                  <Input
                    id="secondary_color"
                    type="color"
                    value={settings.secondary_color || '#000000'}
                    onChange={(e) => handleChange('secondary_color', e.target.value)}
                    className="bg-slate-800/50 border-slate-700 h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Settings */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Menu className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Navigation du header</CardTitle>
                    <CardDescription>Gérez les menus de navigation du site</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={handleAddNavItem}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {navigationItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-5 h-5 text-slate-500" />
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label className="text-slate-300 text-xs">Nom du menu</Label>
                            <Input
                              value={item.label}
                              onChange={(e) => handleNavItemChange(item.id, 'label', e.target.value)}
                              className="bg-slate-900 border-slate-600 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300 text-xs">Lien (URL)</Label>
                            <Input
                              value={item.href}
                              onChange={(e) => handleNavItemChange(item.id, 'href', e.target.value)}
                              className="bg-slate-900 border-slate-600 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300 text-xs">Icône</Label>
                            <Input
                              value={item.icon}
                              onChange={(e) => handleNavItemChange(item.id, 'icon', e.target.value)}
                              placeholder="Home"
                              className="bg-slate-900 border-slate-600 text-white"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={(checked) => handleNavItemChange(item.id, 'is_active', checked)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Button
                          onClick={() => handleDeleteNavItem(item.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`px-2 py-1 rounded ${item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                        {item.is_active ? 'Actif' : 'Désactivé'}
                      </span>
                      <span>•</span>
                      <span>Ordre: {item.order_index}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Settings */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Informations de contact</CardTitle>
              <CardDescription>Email et numéro de téléphone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="text-slate-200">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="contact@example.com"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="text-slate-200">Téléphone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={settings.contact_phone || ''}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+33 1 23 45 67 89"
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Networks */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Réseaux sociaux</CardTitle>
              <CardDescription>Liens vers vos profils sociaux</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="social_facebook" className="text-slate-200">Facebook</Label>
                  <Input
                    id="social_facebook"
                    value={settings.social_facebook || ''}
                    onChange={(e) => handleChange('social_facebook', e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_instagram" className="text-slate-200">Instagram</Label>
                  <Input
                    id="social_instagram"
                    value={settings.social_instagram || ''}
                    onChange={(e) => handleChange('social_instagram', e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_youtube" className="text-slate-200">YouTube</Label>
                  <Input
                    id="social_youtube"
                    value={settings.social_youtube || ''}
                    onChange={(e) => handleChange('social_youtube', e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="social_tiktok" className="text-slate-200">TikTok</Label>
                  <Input
                    id="social_tiktok"
                    value={settings.social_tiktok || ''}
                    onChange={(e) => handleChange('social_tiktok', e.target.value)}
                    placeholder="https://tiktok.com/..."
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Settings */}
          {whatsappSettings && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">WhatsApp</CardTitle>
                    <CardDescription>Configuration du bouton WhatsApp sur le site</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="space-y-1">
                    <Label className="text-slate-200 font-medium">Activer le bouton WhatsApp</Label>
                    <p className="text-sm text-slate-400">Afficher le bouton flottant sur toutes les pages</p>
                  </div>
                  <Switch
                    checked={whatsappSettings.is_enabled}
                    onCheckedChange={(checked) => handleWhatsAppChange('is_enabled', checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_phone" className="text-slate-200">
                      Numéro WhatsApp <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="whatsapp_phone"
                      type="tel"
                      value={whatsappSettings.phone_number || ''}
                      onChange={(e) => handleWhatsAppChange('phone_number', e.target.value)}
                      placeholder="+33612345678"
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                    <p className="text-xs text-slate-400">Format international (ex: +33612345678)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_position" className="text-slate-200">Position du bouton</Label>
                    <Select
                      value={whatsappSettings.position || 'bottom-left'}
                      onValueChange={(value) => handleWhatsAppChange('position', value)}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-left">Bas à gauche</SelectItem>
                        <SelectItem value="bottom-right">Bas à droite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="whatsapp_message" className="text-slate-200">Message par défaut</Label>
                    <Textarea
                      id="whatsapp_message"
                      value={whatsappSettings.message || ''}
                      onChange={(e) => handleWhatsAppChange('message', e.target.value)}
                      placeholder="Bonjour, comment puis-je vous aider ?"
                      className="bg-slate-800/50 border-slate-700 text-white"
                      rows={2}
                    />
                    <p className="text-xs text-slate-400">Message pré-rempli lors du clic sur le bouton</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp_color" className="text-slate-200">Thème de couleur</Label>
                    <Select
                      value={whatsappSettings.color_scheme || 'green'}
                      onValueChange={(value) => handleWhatsAppChange('color_scheme', value)}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Vert (par défaut)</SelectItem>
                        <SelectItem value="blue">Bleu</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="space-y-1">
                      <Label className="text-slate-200">Afficher sur mobile</Label>
                      <p className="text-xs text-slate-400">Visible sur téléphones</p>
                    </div>
                    <Switch
                      checked={whatsappSettings.show_on_mobile}
                      onCheckedChange={(checked) => handleWhatsAppChange('show_on_mobile', checked)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Pied de page</CardTitle>
              <CardDescription>Texte affiché en bas du site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="footer_text" className="text-slate-200">Texte du footer</Label>
                <Textarea
                  id="footer_text"
                  value={settings.footer_text || ''}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bottom Save Button */}
          <div className="sticky bottom-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-t border-slate-800">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 gap-2 shadow-lg"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Enregistrement en cours...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer tous les paramètres
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
