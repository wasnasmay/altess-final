'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Star,
  MessageCircle,
  Calendar,
  Award,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { TeacherWithSubscription } from '@/lib/types/altos';

interface TeacherCardProps {
  teacher: TeacherWithSubscription;
  onContactClick?: (teacher: TeacherWithSubscription) => void;
}

export default function TeacherCard({ teacher, onContactClick }: TeacherCardProps) {
  const router = useRouter();

  const handleViewProfile = () => {
    router.push(`/academy/teachers/${teacher.profile_id}`);
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContactClick) {
      onContactClick(teacher);
    }
  };

  return (
    <Card
      className="group bg-gray-800/50 border-gray-700 hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer overflow-hidden"
      onClick={handleViewProfile}
    >
      <div className="relative">
        <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden">
          {teacher.profile_image ? (
            <img
              src={teacher.profile_image}
              alt={teacher.full_name || 'Professeur'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {teacher.full_name?.charAt(0) || 'P'}
                </span>
              </div>
            </div>
          )}

          {teacher.is_subscribed && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                <Crown className="w-3 h-3 mr-1" />
                Expert Vérifié
              </Badge>
            </div>
          )}

          {teacher.average_rating > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-white font-semibold">{teacher.average_rating.toFixed(1)}</span>
              <span className="text-gray-300 text-sm">({teacher.total_reviews})</span>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
              {teacher.full_name || 'Professeur'}
            </h3>

            {teacher.specialties && teacher.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {teacher.specialties.slice(0, 3).map((specialty, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs border-amber-500/30 text-amber-300 bg-amber-500/10"
                  >
                    {specialty}
                  </Badge>
                ))}
                {teacher.specialties.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-gray-600 text-gray-400 bg-gray-700/50"
                  >
                    +{teacher.specialties.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {teacher.biography && (
              <p className="text-gray-400 text-sm line-clamp-2">
                {teacher.biography}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              {teacher.years_experience && teacher.years_experience > 0 && (
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>{teacher.years_experience} ans</span>
                </div>
              )}

              {teacher.total_students > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{teacher.total_students} élèves</span>
                </div>
              )}
            </div>
          </div>

          {teacher.qualifications && teacher.qualifications.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 line-clamp-1">
                {teacher.qualifications[0]}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {teacher.is_subscribed ? (
              <>
                <Button
                  onClick={handleContact}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
                <Button
                  onClick={handleViewProfile}
                  variant="outline"
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Rendez-vous
                </Button>
              </>
            ) : (
              <Button
                onClick={handleViewProfile}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                Voir le profil
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
