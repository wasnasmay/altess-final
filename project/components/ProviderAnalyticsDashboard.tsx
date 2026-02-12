'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp, Users, Play, Download, Award, Sparkles } from 'lucide-react';

export default function ProviderAnalyticsDashboard() {
  const stats = {
    videoViews: 12847,
    profileVisits: 3291,
    quoteRequests: 47,
    conversionRate: 14.3
  };

  const topVideos = [
    { id: '1', title: 'Mariage au Château', views: 4521, likes: 234 },
    { id: '2', title: 'Soirée Corporate', views: 3892, likes: 198 },
    { id: '3', title: 'Anniversaire Premium', views: 2134, likes: 145 }
  ];

  const handleDownloadBadge = () => {
    const svgBadge = `
      <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#D4AF37;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="80" rx="8" fill="#000000"/>
        <rect x="2" y="2" width="196" height="76" rx="6" fill="url(#goldGradient)" opacity="0.1"/>
        <rect x="2" y="2" width="196" height="76" rx="6" stroke="url(#goldGradient)" stroke-width="2" fill="none"/>

        <path d="M30 40 L35 50 L45 30 L50 45 L55 35" stroke="#D4AF37" stroke-width="2" fill="none"/>

        <text x="70" y="35" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#D4AF37">
          PARTENAIRE CERTIFIÉ
        </text>
        <text x="70" y="52" font-family="Arial, sans-serif" font-size="12" fill="#888888">
          ALTESS Excellence
        </text>
      </svg>
    `;

    const blob = new Blob([svgBadge], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'badge-altess-partenaire-certifie.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border-amber-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-amber-600" />
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats.videoViews.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Vues de vidéos</div>
            <div className="text-xs text-green-400 mt-1">+23% ce mois</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600/10 to-transparent border-blue-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats.profileVisits.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Visites du profil</div>
            <div className="text-xs text-green-400 mt-1">+18% ce mois</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/10 to-transparent border-green-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-5 h-5 text-green-400" />
              <Badge className="bg-green-500 text-white text-xs">Hot</Badge>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats.quoteRequests}
            </div>
            <div className="text-xs text-gray-400">Demandes de devis</div>
            <div className="text-xs text-green-400 mt-1">+34% ce mois</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/10 to-transparent border-purple-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats.conversionRate}%
            </div>
            <div className="text-xs text-gray-400">Taux de conversion</div>
            <div className="text-xs text-purple-400 mt-1">Excellent</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-light text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Vos Vidéos les Plus Vues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topVideos.map((video, index) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-zinc-800 hover:border-amber-600/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-600/20 text-amber-600' :
                    index === 1 ? 'bg-gray-500/20 text-gray-400' :
                    'bg-orange-600/20 text-orange-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{video.title}</div>
                    <div className="text-xs text-gray-400">
                      {video.views.toLocaleString()} vues • {video.likes} likes
                    </div>
                  </div>
                </div>
                <Eye className="w-4 h-4 text-gray-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border-amber-600/30">
        <CardHeader>
          <CardTitle className="text-lg font-light text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Badge Partenaire Certifié
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-64 h-32 bg-black/50 rounded-lg border-2 border-amber-600/30 flex items-center justify-center">
              <div className="text-center">
                <div className="text-amber-600 font-bold text-lg mb-1">PARTENAIRE CERTIFIÉ</div>
                <div className="text-gray-400 text-xs">ALTESS Excellence</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <Sparkles className="w-3 h-3 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium mb-2">Affichez votre badge sur votre site</h4>
              <p className="text-sm text-gray-400 mb-4">
                Téléchargez votre badge certifié ALTESS et ajoutez-le à votre site web pour
                renforcer votre crédibilité auprès de vos clients.
              </p>
              <Button
                onClick={handleDownloadBadge}
                className="bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le Badge
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
