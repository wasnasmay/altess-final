'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

type PremiumAd = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  cta_text: string;
  placement: string;
  content_type: string;
};

export default function PremiumAdsGrid({ placement = 'home_hero' }: { placement?: string }) {
  const [ads, setAds] = useState<PremiumAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, [placement]);

  async function loadAds() {
    try {
      const { data, error } = await supabase
        .from('premium_ads')
        .select('*')
        .eq('placement', placement)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error loading ads:', error);
        throw error;
      }

      console.log('Loaded ads for placement', placement, ':', data?.length || 0, data);
      setAds(data || []);

      if (data && data.length > 0) {
        data.forEach(ad => trackImpression(ad.id));
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function trackImpression(adId: string) {
    try {
      await supabase.rpc('track_ad_impression', {
        p_ad_id: adId,
        p_user_id: null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer || null
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  async function trackClick(adId: string) {
    try {
      await supabase.rpc('track_ad_click', {
        p_ad_id: adId,
        p_user_id: null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer || null
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  if (loading) {
    return null;
  }

  if (ads.length === 0) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-slate-500">Aucune publicité disponible pour le moment</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
              Découvertes Premium
            </h2>
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-slate-400 text-lg">Nos partenaires sélectionnés pour vous</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ads.map((ad) => (
            <Link
              key={ad.id}
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(ad.id)}
              className="group"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20 h-full">
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Premium
                  </div>
                </div>

                {ad.image_url && (
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  </div>
                )}

                <CardContent className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                    {ad.title}
                  </h3>

                  {ad.description && (
                    <p className="text-slate-400 text-sm line-clamp-3">
                      {ad.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-amber-500/20">
                    <span className="text-amber-400 font-semibold group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      {ad.cta_text}
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>

                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/0 via-transparent to-transparent group-hover:from-amber-500/10 transition-all duration-300 pointer-events-none" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
