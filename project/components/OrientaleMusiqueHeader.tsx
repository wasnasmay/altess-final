'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Phone, Menu, X, Home as HomeIcon, Video, Tv, Award, Info as InfoIcon } from 'lucide-react';
import OrientaleMusiquelogo from '@/components/OrientaleMusiquelogo';

export default function OrientaleMusiqueHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToSection(sectionId: string) {
    if (pathname !== '/orientale-musique') {
      window.location.href = `/orientale-musique#${sectionId}`;
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  }

  const menuItems = [
    { id: 'accueil', label: 'Accueil', icon: HomeIcon, href: '/orientale-musique' },
    { id: 'demo', label: 'Démos', icon: Video, href: '/orientale-musique#demo' },
    { id: 'galerie', label: 'Galerie', icon: Tv, href: '/orientale-musique#galerie' },
    { id: 'formules', label: 'Formules', icon: Award, href: '/orientale-musique#formules' },
    { id: 'apropos', label: 'À Propos', icon: InfoIcon, href: '/orientale-musique#apropos' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-black/95 backdrop-blur-xl border-b border-amber-900/30 shadow-2xl shadow-amber-900/20' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-20">
          <Link href="/orientale-musique">
            <OrientaleMusiquelogo className="w-auto h-auto cursor-pointer" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2">
            {menuItems.map((item) => (
              item.id === 'accueil' ? (
                <Link key={item.id} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-all ${
                      pathname === '/orientale-musique' && item.id === 'accueil'
                        ? 'bg-gradient-to-r from-amber-900/30 to-yellow-900/30 text-amber-300 border border-amber-600/30'
                        : 'text-amber-600/60 hover:text-amber-400 hover:bg-amber-900/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection(item.id)}
                  className="text-amber-600/60 hover:text-amber-400 hover:bg-amber-900/10"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              )
            ))}
            <Link href="/orientale-musique/stars">
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-600/60 hover:text-amber-400 hover:bg-amber-900/10"
              >
                <Star className="w-4 h-4 mr-2" />
                Nos Stars
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => scrollToSection('contact')}
              className="ml-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-medium shadow-lg shadow-amber-900/30"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact
            </Button>
            <a href="https://altess.fr" target="_self">
              <Button variant="ghost" size="sm" className="text-amber-600/60 hover:text-amber-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour Altess
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-amber-400"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-black/98 backdrop-blur-xl border-b border-amber-900/30 shadow-2xl">
            <div className="container mx-auto px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                item.id === 'accueil' ? (
                  <Link key={item.id} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-amber-300"
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => scrollToSection(item.id)}
                    className="w-full justify-start text-amber-300"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                )
              ))}
              <Link href="/orientale-musique/stars" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-amber-300">
                  <Star className="w-4 h-4 mr-2" />
                  Nos Stars
                </Button>
              </Link>
              <Button
                onClick={() => scrollToSection('contact')}
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-black font-medium mt-4"
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <a href="https://altess.fr" target="_self" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-amber-600/60 border-t border-amber-900/20 mt-4 pt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour Altess
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
