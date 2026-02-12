'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import TeacherCard from '@/components/TeacherCard';
import ContactTeacherModal from '@/components/ContactTeacherModal';
import {
  Search,
  Filter,
  Crown,
  Star,
  Award,
  Users,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import type { TeacherWithSubscription } from '@/lib/types/altos';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithSubscription | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers_with_subscription')
        .select('*')
        .order('is_subscribed', { ascending: false })
        .order('average_rating', { ascending: false })
        .order('total_reviews', { ascending: false });

      if (error) throw error;

      setTeachers(data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (teacher: TeacherWithSubscription) => {
    setSelectedTeacher(teacher);
    setIsContactModalOpen(true);
  };

  const allSpecialties = Array.from(
    new Set(
      teachers.flatMap(t => t.specialties || [])
    )
  ).sort();

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch =
      !searchQuery ||
      teacher.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.biography?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpecialty =
      selectedSpecialty === 'all' ||
      teacher.specialties?.includes(selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  const subscribedCount = teachers.filter(t => t.is_subscribed).length;
  const averageRating = teachers.length > 0
    ? (teachers.reduce((acc, t) => acc + (t.average_rating || 0), 0) / teachers.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Chargement des professeurs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 text-transparent bg-clip-text">
                Nos Professeurs
              </h1>
              <p className="text-xl text-gray-400">
                Trouvez le professeur idéal pour votre apprentissage musical
              </p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-lg px-4 py-2">
              <Crown className="w-5 h-5 mr-2" />
              {subscribedCount} Experts Vérifiés
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{teachers.length}</div>
                    <div className="text-sm text-gray-400">Professeurs</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                    <Star className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{averageRating}</div>
                    <div className="text-sm text-gray-400">Note moyenne</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{allSpecialties.length}</div>
                    <div className="text-sm text-gray-400">Spécialités</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, spécialité, instrument..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 text-lg"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 mr-2">Filtrer par spécialité:</span>
            <Button
              onClick={() => setSelectedSpecialty('all')}
              variant={selectedSpecialty === 'all' ? 'default' : 'outline'}
              className={selectedSpecialty === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
              }
            >
              Tous ({teachers.length})
            </Button>
            {allSpecialties.slice(0, 8).map((specialty) => {
              const count = teachers.filter(t => t.specialties?.includes(specialty)).length;
              return (
                <Button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  variant={selectedSpecialty === specialty ? 'default' : 'outline'}
                  className={selectedSpecialty === specialty
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
                  }
                >
                  {specialty} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {filteredTeachers.filter(t => t.is_subscribed).length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h2 className="text-3xl font-bold text-white">
                Experts Vérifiés
              </h2>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                Recommandés
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers
                .filter(teacher => teacher.is_subscribed)
                .map((teacher) => (
                  <TeacherCard
                    key={teacher.id}
                    teacher={teacher}
                    onContactClick={handleContactClick}
                  />
                ))}
            </div>
          </div>
        )}

        {filteredTeachers.filter(t => !t.is_subscribed).length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-gray-400" />
              <h2 className="text-3xl font-bold text-white">
                Autres Professeurs
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers
                .filter(teacher => !teacher.is_subscribed)
                .map((teacher) => (
                  <TeacherCard
                    key={teacher.id}
                    teacher={teacher}
                    onContactClick={handleContactClick}
                  />
                ))}
            </div>
          </div>
        )}

        {filteredTeachers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">Aucun professeur trouvé</h3>
            <p className="text-gray-400">Essayez d'ajuster vos filtres de recherche</p>
          </div>
        )}
      </div>

      <ContactTeacherModal
        teacher={selectedTeacher}
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setSelectedTeacher(null);
        }}
      />
    </div>
  );
}
