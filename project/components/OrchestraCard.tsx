'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Orchestra } from '@/lib/supabase';
import { Music, Users, Sparkles } from 'lucide-react';
import { useState } from 'react';

type OrchestraCardProps = {
  orchestra: Orchestra;
  onRequestQuote: (orchestra: Orchestra) => void;
};

export function OrchestraCard({ orchestra, onRequestQuote }: OrchestraCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="group relative overflow-hidden bg-card border-border/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-64 overflow-hidden">
        <img
          src={orchestra.image_url}
          alt={orchestra.name}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute top-4 right-4">
          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold mb-2 gold-gradient">
            {orchestra.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {orchestra.description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-primary" />
            <span>{orchestra.members_count} musiciens</span>
          </div>
          <div className="flex items-center gap-1">
            <Music className="w-4 h-4 text-primary" />
            <span>{orchestra.price_range}€</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {orchestra.specialties.map((specialty) => (
            <Badge
              key={specialty}
              variant="secondary"
              className="text-xs bg-secondary/50"
            >
              {specialty}
            </Badge>
          ))}
        </div>

        <Button
          onClick={() => onRequestQuote(orchestra)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30"
        >
          Demander un devis
        </Button>
      </div>
    </Card>
  );
}
