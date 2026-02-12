"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Library,
  Radio,
  TrendingUp,
  Settings,
  LayoutDashboard,
  Calendar,
  Share2,
  Video,
  Crown,
  AlertCircle,
  Users,
  CreditCard,
  Music2
} from 'lucide-react';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  highlight?: boolean;
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const items: SidebarItem[] = [
    {
      icon: <Crown size={20} />,
      label: 'Dashboard Premium',
      href: '/admin/dashboard-premium'
    },
    {
      icon: <Music2 size={20} />,
      label: 'Orientale Musique',
      href: '/admin/orientale-musique',
      badge: 'star',
      highlight: true
    },
    {
      icon: <AlertCircle size={20} />,
      label: 'Modération',
      href: '/admin/moderation-center'
    },
    {
      icon: <Users size={20} />,
      label: 'Comptes',
      href: '/admin/users'
    },
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Gestion Globale',
      href: '/admin/gestion-globale'
    },
    {
      icon: <Library size={20} />,
      label: 'Bibliothèque',
      href: '/admin/webtv-playout'
    },
    {
      icon: <Radio size={20} />,
      label: 'Direct TV',
      href: '/admin/webtv-ticker'
    },
    {
      icon: <Share2 size={20} />,
      label: 'Social Hub',
      href: '/admin/social-hub'
    },
    {
      icon: <Video size={20} />,
      label: 'Régie Pub',
      href: '/admin/regie-pub'
    },
    {
      icon: <TrendingUp size={20} />,
      label: 'Publicités',
      href: '/admin/ads'
    },
    {
      icon: <Calendar size={20} />,
      label: 'Programmation',
      href: '/playout/schedule'
    },
    {
      icon: <Settings size={20} />,
      label: 'Paramètres Site',
      href: '/admin/site-settings'
    },
    {
      icon: <Settings size={20} />,
      label: 'SEO',
      href: '/admin/page-seo'
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Diagnostic Stripe',
      href: '/admin/stripe-diagnostic'
    }
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-black border-r border-amber-500/20 flex flex-col items-center py-6 z-50">
      {/* Logo ALTESS */}
      <div className="mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-xl">A</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-2 w-full px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative group w-full h-12 flex items-center justify-center rounded-lg
                transition-all duration-200
                ${item.highlight
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-500/50'
                  : ''
                }
                ${isActive
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-400 hover:bg-amber-500/10 hover:text-amber-300'
                }
              `}
              title={item.label}
            >
              {item.icon}

              {/* Tooltip */}
              <div className={`absolute left-full ml-2 px-3 py-1.5 bg-black border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ${
                item.highlight
                  ? 'border-amber-400 text-amber-300 font-semibold'
                  : 'border-amber-500/30 text-amber-400'
              }`}>
                {item.label}
                {item.highlight && (
                  <span className="ml-2 text-xs">⭐</span>
                )}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-r-full" />
              )}

              {/* Badge */}
              {item.badge === 'star' && (
                <span className="absolute -top-1 -right-1 text-amber-400 animate-pulse">⭐</span>
              )}
              {item.badge && item.badge !== 'star' && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto">
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-semibold text-sm hover:scale-110 transition-transform">
          AD
        </button>
      </div>
    </aside>
  );
}
