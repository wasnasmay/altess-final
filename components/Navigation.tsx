'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { supabase } from '@/lib/supabase';
import * as LucideIcons from 'lucide-react';
import { User, LogIn, LogOut, Menu, ChevronDown, Briefcase, Tv, Settings, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  target: string;
}

const getIcon = (iconName: string) => {
  const icons = LucideIcons as any;
  return icons[iconName] || icons.Circle;
};

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { isPlayerOpen, setIsPlayerOpen, currentMedia } = usePlayer();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchNavigationItems();
  }, []);

  const fetchNavigationItems = async () => {
    try {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setNavItems(data || []);
    } catch (error) {
      console.error('Error fetching navigation items:', error);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[200000] transition-all duration-500 ${
        scrolled
          ? 'bg-background/98 backdrop-blur-xl border-b border-primary/20 shadow-2xl shadow-primary/5'
          : 'bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                className="transition-all duration-300 group-hover:scale-110"
              >
                <defs>
                  <linearGradient id="arch-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path
                  d="M 8 28 Q 8 12, 16 8 Q 24 12, 24 28"
                  fill="none"
                  stroke="url(#arch-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="16" cy="8" r="2" fill="url(#arch-gradient)" />
                <line x1="8" y1="28" x2="24" y2="28" stroke="url(#arch-gradient)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-serif font-light tracking-wide gold-gradient" style={{ fontFamily: 'Georgia, serif' }}>
                Votre Altesse
              </span>
              <span className="text-[10px] text-primary/60 tracking-wider uppercase -mt-1">
                L'Excellence au Service du Partage
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <Link key={item.id} href={item.href} target={item.target}>
                  <Button
                    variant="ghost"
                    className="text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all duration-300 relative group"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/50 group-hover:w-full transition-all duration-300" />
                  </Button>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {/* Global TV Button - Only show when not on home page and media is playing */}
            {pathname !== '/' && currentMedia && (
              <Button
                variant="ghost"
                size="icon"
                className="relative group text-foreground/80 hover:text-amber-500 hover:bg-amber-500/10 transition-all duration-300 rounded-full"
                onClick={() => {
                  if (isPlayerOpen) {
                    setIsPlayerOpen(false);
                  } else {
                    router.push('/');
                  }
                }}
                title={isPlayerOpen ? 'Fermer le lecteur' : 'Retour à la WebTV'}
              >
                <Tv className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all duration-300"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mon Espace
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-black/95 border-amber-500/30 backdrop-blur-xl z-[200001]">
                  <DropdownMenuLabel className="text-amber-400 font-light text-xs tracking-wider">
                    MON ESPACE
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-amber-500/20" />

                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-amber-500/10">
                    <Link
                      href={
                        profile?.role === 'admin' ? '/admin' :
                        profile?.role === 'organizer' ? '/organizer-dashboard-premium' :
                        profile?.role === 'partner' ? '/partner-dashboard' :
                        profile?.role === 'provider' ? '/provider-dashboard' :
                        '/client-dashboard'
                      }
                      className="flex items-center"
                    >
                      <User className="w-4 h-4 mr-2 text-amber-400" />
                      <span className="text-white font-light">
                        {profile?.role === 'organizer' ? 'Espace Organisateur' :
                         profile?.role === 'partner' || profile?.role === 'provider' ? 'Espace Partenaire' :
                         'Mon Compte'}
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator className="bg-amber-500/20" />
                      <DropdownMenuItem asChild className="cursor-pointer hover:bg-amber-500/10">
                        <Link href="/admin" className="flex items-center">
                          <Settings className="w-4 h-4 mr-2 text-amber-400" />
                          <span className="text-white font-light">Administration</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator className="bg-amber-500/20" />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer hover:bg-red-500/10 text-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="font-light">Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all duration-300"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Connexion
                  </Button>
                </Link>
                <Link href="/login" className="hidden sm:block">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-foreground/80 hover:text-primary hover:bg-primary/10"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background/98 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 32 32">
                      <defs>
                        <linearGradient id="arch-gradient-menu" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                          <stop offset="50%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>
                      <path d="M 8 28 Q 8 12, 16 8 Q 24 12, 24 28" fill="none" stroke="url(#arch-gradient-menu)" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="16" cy="8" r="2" fill="url(#arch-gradient-menu)" />
                      <line x1="8" y1="28" x2="24" y2="28" stroke="url(#arch-gradient-menu)" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span className="gold-gradient">Menu</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-8 space-y-2">
                  {navItems.map((item) => {
                    const Icon = getIcon(item.icon);
                    return (
                      <Link key={item.id} href={item.href} target={item.target} onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10"
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}

                  <div className="pt-4 border-t border-border/50 space-y-2">
                    {user ? (
                      <>
                        <Link
                          href={
                            profile?.role === 'admin' ? '/admin' :
                            profile?.role === 'organizer' ? '/organizer-dashboard-premium' :
                            profile?.role === 'partner' ? '/partner-dashboard' :
                            profile?.role === 'provider' ? '/provider-dashboard' :
                            '/client-dashboard'
                          }
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10"
                          >
                            <User className="w-4 h-4 mr-3" />
                            {profile?.role === 'organizer' ? 'Espace Organisateur' :
                             profile?.role === 'partner' || profile?.role === 'provider' ? 'Espace Partenaire' :
                             'Mon Compte'}
                          </Button>
                        </Link>

                        {profile?.role === 'admin' && (
                          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10"
                            >
                              <Settings className="w-4 h-4 mr-3" />
                              Administration
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start text-foreground/80 hover:text-destructive hover:bg-destructive/10"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Déconnexion
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-foreground/80 hover:text-primary hover:bg-primary/10"
                          >
                            <LogIn className="w-4 h-4 mr-3" />
                            Connexion
                          </Button>
                        </Link>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button
                            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30"
                          >
                            <UserPlus className="w-4 h-4 mr-3" />
                            S'inscrire
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
