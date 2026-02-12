'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContactTeacherModal from '@/components/ContactTeacherModal';
import {
  Crown,
  Star,
  Award,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Calendar,
  Users,
  ArrowLeft,
  CheckCircle2,
  Quote,
  ThumbsUp
} from 'lucide-react';
import type { TeacherWithSubscription, TeacherReview } from '@/lib/types/altos';

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params?.teacherId as string;

  const [teacher, setTeacher] = useState<TeacherWithSubscription | null>(null);
  const [reviews, setReviews] = useState<TeacherReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    if (teacherId) {
      loadTeacherData();
      incrementViewCount();
    }
  }, [teacherId]);

  const loadTeacherData = async () => {
    try {
      const [teacherResponse, reviewsResponse] = await Promise.all([
        supabase
          .from('teachers_with_subscription')
          .select('*')
          .eq('profile_id', teacherId)
          .maybeSingle(),
        supabase
          .from('teacher_reviews')
          .select(`
            *,
            profiles!teacher_reviews_student_id_fkey(full_name)
          `)
          .eq('teacher_id', teacherId)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
      ]);

      if (teacherResponse.data) {
        setTeacher(teacherResponse.data);
      }

      if (reviewsResponse.data) {
        setReviews(reviewsResponse.data);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment', {
        row_id: teacherId,
        table_name: 'teacher_profiles',
        column_name: 'view_count'
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating
            ? 'text-amber-400 fill-amber-400'
            : 'text-gray-600'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="text-3xl font-bold mb-4">Professeur introuvable</h2>
          <Button onClick={() => router.push('/academy/teachers')}>
            Retour aux professeurs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 sticky top-8">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block mb-4">
                    <Avatar className="w-32 h-32 border-4 border-amber-500/30">
                      <AvatarImage src={teacher.profile_image} alt={teacher.full_name || 'Professeur'} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-4xl">
                        {teacher.full_name?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    {teacher.is_subscribed && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full p-2">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold text-white mb-2">
                    {teacher.full_name}
                  </h1>

                  {teacher.is_subscribed && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 mb-4">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Expert Vérifié
                    </Badge>
                  )}

                  {teacher.average_rating > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="flex gap-1">
                        {renderStars(Math.round(teacher.average_rating))}
                      </div>
                      <span className="text-2xl font-bold text-white">
                        {teacher.average_rating.toFixed(1)}
                      </span>
                      <span className="text-gray-400">
                        ({teacher.total_reviews} avis)
                      </span>
                    </div>
                  )}
                </div>

                {teacher.is_subscribed && (
                  <>
                    <Button
                      onClick={() => setIsContactModalOpen(true)}
                      className="w-full mb-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contacter le professeur
                    </Button>

                    <Button
                      onClick={() => router.push('/rendez-vous')}
                      variant="outline"
                      className="w-full border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Prendre rendez-vous
                    </Button>

                    <Separator className="my-6 bg-gray-700" />

                    {(teacher.phone || teacher.email || teacher.website) && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-white mb-3">Contact Direct</h3>
                        {teacher.email && (
                          <a
                            href={`mailto:${teacher.email}`}
                            className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{teacher.email}</span>
                          </a>
                        )}
                        {teacher.phone && (
                          <a
                            href={`tel:${teacher.phone}`}
                            className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{teacher.phone}</span>
                          </a>
                        )}
                        {teacher.website && (
                          <a
                            href={teacher.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            <span className="text-sm">Site web</span>
                          </a>
                        )}
                      </div>
                    )}
                  </>
                )}

                <Separator className="my-6 bg-gray-700" />

                <div className="space-y-4">
                  {teacher.years_experience && teacher.years_experience > 0 && (
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-amber-400" />
                      <div>
                        <div className="text-sm text-gray-400">Expérience</div>
                        <div className="text-white font-semibold">
                          {teacher.years_experience} ans
                        </div>
                      </div>
                    </div>
                  )}

                  {teacher.total_students > 0 && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-sm text-gray-400">Élèves</div>
                        <div className="text-white font-semibold">
                          {teacher.total_students}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {teacher.biography && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Biographie</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {teacher.biography}
                  </p>
                </CardContent>
              </Card>
            )}

            {teacher.specialties && teacher.specialties.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Spécialités</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {teacher.specialties.map((specialty, index) => (
                      <Badge
                        key={index}
                        className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-base px-4 py-2"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {teacher.qualifications && teacher.qualifications.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Diplômes & Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teacher.qualifications.map((qualification, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                        <span className="text-gray-300">{qualification}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reviews.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                    Avis des élèves ({reviews.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-l-4 border-amber-500/30 pl-4 py-2"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                                {review.profiles?.full_name?.charAt(0) || 'E'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">
                                  {review.profiles?.full_name || 'Élève'}
                                </span>
                                {review.is_verified && (
                                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Vérifié
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1 mt-1">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-400">
                            {formatDate(review.created_at)}
                          </span>
                        </div>

                        {review.comment && (
                          <div className="mt-3 mb-3">
                            <Quote className="w-4 h-4 text-gray-500 mb-1" />
                            <p className="text-gray-300 italic pl-2">
                              {review.comment}
                            </p>
                          </div>
                        )}

                        {review.teacher_response && (
                          <div className="mt-4 ml-6 p-3 bg-amber-900/20 rounded-lg border-l-2 border-amber-500/50">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageCircle className="w-4 h-4 text-amber-400" />
                              <span className="text-sm font-semibold text-amber-300">
                                Réponse du professeur
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">
                              {review.teacher_response}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {reviews.length === 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Pas encore d'avis
                  </h3>
                  <p className="text-gray-400">
                    Soyez le premier à laisser un avis sur ce professeur
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ContactTeacherModal
        teacher={teacher}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
}
