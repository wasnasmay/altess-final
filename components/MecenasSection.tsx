'use client';

import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function MecenasSection() {
  return (
    <section className="mb-10 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-gradient-to-r from-black/30 via-amber-950/20 to-black/30 backdrop-blur-md border border-amber-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-serif text-amber-400/90">Le Cercle des Mécènes</p>
            <p className="text-xs text-slate-500">Soutenez notre mission culturelle</p>
          </div>
        </div>

        <Link href="/mecenes">
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-600/70 to-rose-600/70 hover:from-amber-500 hover:to-rose-500 text-white text-xs px-6 py-2 border border-amber-500/30 shadow-md hover:shadow-amber-500/20 transition-all"
          >
            Contribuer
          </Button>
        </Link>
      </div>
    </section>
  );
}
