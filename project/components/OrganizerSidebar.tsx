'use client';

import { cn } from '@/lib/utils';
import { LayoutDashboard, Calendar, DollarSign, Tag, Store, Building2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface OrganizerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  companyName: string;
  companySlug: string;
  notificationCount?: number;
}

const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Vue d\'ensemble'
  },
  {
    id: 'events',
    label: 'Mes Événements',
    icon: Calendar,
    description: 'Gérer vos événements'
  },
  {
    id: 'accounting',
    label: 'Comptabilité',
    icon: DollarSign,
    description: 'Finances et virements'
  },
  {
    id: 'promotion',
    label: 'Promotion',
    icon: Tag,
    description: 'Codes promo et marketing'
  }
];

export default function OrganizerSidebar({
  activeTab,
  onTabChange,
  companyName,
  companySlug,
  notificationCount = 0
}: OrganizerSidebarProps) {
  const shopUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://altess.fr'}/boutique/${companySlug}`;

  const copyShopLink = () => {
    navigator.clipboard.writeText(shopUrl);
    toast.success('Lien copié', {
      description: 'Le lien de votre boutique a été copié dans le presse-papier'
    });
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3 mb-2">
          <Building2 className="w-8 h-8 text-amber-500" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{companyName}</h2>
            <p className="text-xs text-slate-400 truncate">/{companySlug}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1.5">Lien de votre boutique</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-900/50 rounded px-2 py-1.5 min-w-0">
                <p className="text-xs text-amber-400 truncate font-mono">
                  altess.fr/{companySlug}
                </p>
              </div>
              <Button
                onClick={copyShopLink}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-amber-600 hover:text-white"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <Button
            onClick={() => window.open(`/boutique/${companySlug}`, '_blank')}
            variant="outline"
            size="sm"
            className="w-full bg-slate-800 border-slate-700 hover:bg-amber-600 hover:border-amber-600 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Voir ma boutique
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-start p-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mr-3 mt-0.5 flex-shrink-0",
                isActive ? "text-white" : "text-slate-400 group-hover:text-amber-400"
              )} />
              <div className="flex-1 text-left">
                <div className="font-medium text-sm mb-0.5">{item.label}</div>
                <div className={cn(
                  "text-xs",
                  isActive ? "text-amber-100" : "text-slate-500 group-hover:text-slate-400"
                )}>
                  {item.description}
                </div>
              </div>
              {item.id === 'accounting' && notificationCount > 0 && (
                <Badge variant="destructive" className="ml-2 px-2 py-0.5 text-xs">
                  {notificationCount}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-gradient-to-r from-amber-600/20 to-purple-600/20 rounded-lg p-4 border border-amber-600/30">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xs font-medium text-white">Plateforme opérationnelle</p>
          </div>
          <p className="text-xs text-slate-400">
            Tous les systèmes fonctionnent normalement
          </p>
        </div>
      </div>
    </aside>
  );
}
