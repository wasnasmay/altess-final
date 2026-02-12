'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import AdminNavigation from '@/components/AdminNavigation';
import { Save, FileText } from 'lucide-react';

type PageContent = {
  id: string;
  page_slug: string;
  title: string;
  subtitle: string;
  hero_text: string;
  section_title: string;
  feature_1_icon: string;
  feature_1_title: string;
  feature_1_text: string;
  feature_2_icon: string;
  feature_2_title: string;
  feature_2_text: string;
  feature_3_icon: string;
  feature_3_title: string;
  feature_3_text: string;
  feature_4_icon: string;
  feature_4_title: string;
  feature_4_text: string;
  cta_text: string;
  meta_description: string;
  is_published: boolean;
};

const PAGES = [
  { slug: 'orchestres', label: 'Orchestres' },
  { slug: 'prestations', label: 'Prestations' },
  { slug: 'partenaires', label: 'Partenaires' },
  { slug: 'stars', label: 'Stars' },
];

export default function PageSEOAdmin() {
  const [contents, setContents] = useState<Record<string, PageContent>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('orchestres');

  useEffect(() => {
    loadContents();
  }, []);

  async function loadContents() {
    try {
      const { data, error } = await supabase
        .from('page_seo_content')
        .select('*');

      if (error) throw error;

      const contentMap: Record<string, PageContent> = {};
      data?.forEach((item) => {
        contentMap[item.page_slug] = item;
      });

      setContents(contentMap);
    } catch (error) {
      console.error('Error loading contents:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(pageSlug: string) {
    setSaving(true);
    try {
      const content = contents[pageSlug];
      if (!content) {
        toast.error('Contenu introuvable');
        return;
      }

      const { error } = await supabase
        .from('page_seo_content')
        .update({
          title: content.title,
          subtitle: content.subtitle,
          hero_text: content.hero_text,
          section_title: content.section_title,
          feature_1_icon: content.feature_1_icon,
          feature_1_title: content.feature_1_title,
          feature_1_text: content.feature_1_text,
          feature_2_icon: content.feature_2_icon,
          feature_2_title: content.feature_2_title,
          feature_2_text: content.feature_2_text,
          feature_3_icon: content.feature_3_icon,
          feature_3_title: content.feature_3_title,
          feature_3_text: content.feature_3_text,
          feature_4_icon: content.feature_4_icon,
          feature_4_title: content.feature_4_title,
          feature_4_text: content.feature_4_text,
          cta_text: content.cta_text,
          meta_description: content.meta_description,
          is_published: content.is_published,
        })
        .eq('page_slug', pageSlug);

      if (error) throw error;

      toast.success('Contenu sauvegardé avec succès');
      loadContents();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  function updateContent(pageSlug: string, field: string, value: any) {
    setContents((prev) => ({
      ...prev,
      [pageSlug]: {
        ...prev[pageSlug],
        [field]: value,
      },
    }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Gestion Contenu SEO" />
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
      <AdminNavigation title="Gestion Contenu SEO" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Gérez le contenu textuel SEO de chaque page. Ces textes apparaîtront en haut de chaque rubrique pour améliorer le référencement.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            {PAGES.map((page) => (
              <TabsTrigger key={page.slug} value={page.slug}>
                {page.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PAGES.map((page) => {
            const content = contents[page.slug];
            if (!content) return null;

            return (
              <TabsContent key={page.slug} value={page.slug} className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Contenu de la page {page.label}
                        </CardTitle>
                        <CardDescription>
                          Personnalisez le contenu SEO de la rubrique {page.label}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`published-${page.slug}`}>Publié</Label>
                        <Switch
                          id={`published-${page.slug}`}
                          checked={content.is_published}
                          onCheckedChange={(checked) =>
                            updateContent(page.slug, 'is_published', checked)
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`title-${page.slug}`}>Titre Principal</Label>
                        <Input
                          id={`title-${page.slug}`}
                          value={content.title}
                          onChange={(e) => updateContent(page.slug, 'title', e.target.value)}
                          placeholder="Ex: Orchestres Orientaux de Prestige"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`subtitle-${page.slug}`}>Sous-titre</Label>
                        <Input
                          id={`subtitle-${page.slug}`}
                          value={content.subtitle}
                          onChange={(e) => updateContent(page.slug, 'subtitle', e.target.value)}
                          placeholder="Ex: Des formations musicales d'exception"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`hero-${page.slug}`}>Texte d'Introduction</Label>
                      <Textarea
                        id={`hero-${page.slug}`}
                        value={content.hero_text}
                        onChange={(e) => updateContent(page.slug, 'hero_text', e.target.value)}
                        rows={4}
                        placeholder="Texte principal présentant la rubrique..."
                      />
                    </div>

                    <div>
                      <Label htmlFor={`section-${page.slug}`}>Titre de la Section Caractéristiques</Label>
                      <Input
                        id={`section-${page.slug}`}
                        value={content.section_title}
                        onChange={(e) => updateContent(page.slug, 'section_title', e.target.value)}
                        placeholder="Ex: Nos Garanties Excellence"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((num) => (
                        <Card key={num} className="bg-muted/50">
                          <CardHeader>
                            <CardTitle className="text-base">Caractéristique {num}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label htmlFor={`icon-${num}-${page.slug}`}>
                                Icône Lucide (ex: Shield, Award, Star)
                              </Label>
                              <Input
                                id={`icon-${num}-${page.slug}`}
                                value={content[`feature_${num}_icon` as keyof PageContent] as string}
                                onChange={(e) =>
                                  updateContent(page.slug, `feature_${num}_icon`, e.target.value)
                                }
                                placeholder="Shield"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`title-${num}-${page.slug}`}>Titre</Label>
                              <Input
                                id={`title-${num}-${page.slug}`}
                                value={content[`feature_${num}_title` as keyof PageContent] as string}
                                onChange={(e) =>
                                  updateContent(page.slug, `feature_${num}_title`, e.target.value)
                                }
                                placeholder="Ex: Musiciens Professionnels"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`text-${num}-${page.slug}`}>Description</Label>
                              <Textarea
                                id={`text-${num}-${page.slug}`}
                                value={content[`feature_${num}_text` as keyof PageContent] as string}
                                onChange={(e) =>
                                  updateContent(page.slug, `feature_${num}_text`, e.target.value)
                                }
                                rows={2}
                                placeholder="Description de la caractéristique..."
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div>
                      <Label htmlFor={`cta-${page.slug}`}>Texte d'Appel à l'Action</Label>
                      <Input
                        id={`cta-${page.slug}`}
                        value={content.cta_text}
                        onChange={(e) => updateContent(page.slug, 'cta_text', e.target.value)}
                        placeholder="Ex: Réservez votre orchestre dès maintenant..."
                      />
                    </div>

                    <div>
                      <Label htmlFor={`meta-${page.slug}`}>Meta Description (SEO)</Label>
                      <Textarea
                        id={`meta-${page.slug}`}
                        value={content.meta_description}
                        onChange={(e) =>
                          updateContent(page.slug, 'meta_description', e.target.value)
                        }
                        rows={2}
                        placeholder="Description pour les moteurs de recherche (150-160 caractères)"
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {content.meta_description.length} / 160 caractères
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={() => handleSave(page.slug)} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
