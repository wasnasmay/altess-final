'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as LucideIcons from 'lucide-react';

type PageSEOContent = {
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
};

interface PageSEOSectionProps {
  pageSlug: string;
}

export function PageSEOSection({ pageSlug }: PageSEOSectionProps) {
  const [content, setContent] = useState<PageSEOContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [pageSlug]);

  async function loadContent() {
    try {
      const { data, error } = await supabase
        .from('page_seo_content')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setContent(data);
    } catch (error) {
      console.error('Error loading SEO content:', error);
    } finally {
      setLoading(false);
    }
  }

  function getIconComponent(iconName: string) {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Star;
    return Icon;
  }

  if (loading || !content) return null;

  const features = [
    {
      icon: content.feature_1_icon,
      title: content.feature_1_title,
      text: content.feature_1_text,
    },
    {
      icon: content.feature_2_icon,
      title: content.feature_2_title,
      text: content.feature_2_text,
    },
    {
      icon: content.feature_3_icon,
      title: content.feature_3_title,
      text: content.feature_3_text,
    },
    {
      icon: content.feature_4_icon,
      title: content.feature_4_title,
      text: content.feature_4_text,
    },
  ];

  return (
    <section className="max-w-6xl mx-auto mb-16 px-4">
      <div className="bg-gradient-to-br from-slate-900/80 via-black to-slate-900/80 border border-amber-500/30 rounded-3xl p-8 md:p-12 shadow-2xl shadow-amber-500/10 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {content.title}
          </h2>
          <p className="text-xl text-amber-400 mb-6">{content.subtitle}</p>
          <p className="text-lg text-slate-300 leading-relaxed max-w-4xl mx-auto">
            {content.hero_text}
          </p>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center text-white mb-8">
            {content.section_title}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = getIconComponent(feature.icon);
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-6 bg-black/40 rounded-xl border border-amber-500/10 hover:border-amber-500/30 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-amber-500" />
                  </div>
                  <h4 className="font-semibold text-white mb-2 text-lg">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {content.cta_text && (
          <div className="mt-10 text-center">
            <p className="text-lg text-amber-400 font-medium">{content.cta_text}</p>
          </div>
        )}
      </div>
    </section>
  );
}
