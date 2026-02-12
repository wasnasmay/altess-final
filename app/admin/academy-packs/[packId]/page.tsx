'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import AdminNavigation from '@/components/AdminNavigation';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ArrowLeft, BookOpen, Video, MoveUp, MoveDown } from 'lucide-react';

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  course_order: number;
};

type Lesson = {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description: string;
  vimeo_video_id: string | null;
  vimeo_teaser_id: string | null;
  duration_seconds: number;
  lesson_order: number;
  is_free: boolean;
};

export default function AdminPackCoursesPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params?.packId as string;

  const [packTitle, setPackTitle] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);

  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [courseForm, setCourseForm] = useState({ title: '', slug: '', description: '', course_order: 0 });
  const [lessonForm, setLessonForm] = useState({
    title: '',
    slug: '',
    description: '',
    vimeo_video_id: '',
    vimeo_teaser_id: '',
    duration_seconds: 0,
    lesson_order: 0,
    is_free: false,
  });

  useEffect(() => {
    loadData();
  }, [packId]);

  async function loadData() {
    try {
      const { data: pack } = await supabase
        .from('academy_packs')
        .select('title')
        .eq('id', packId)
        .single();

      if (pack) setPackTitle(pack.title);

      const { data: coursesData, error: coursesError } = await supabase
        .from('academy_pack_courses')
        .select('*')
        .eq('pack_id', packId)
        .order('course_order');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      const lessonsMap: Record<string, Lesson[]> = {};
      for (const course of coursesData || []) {
        const { data: lessonsData } = await supabase
          .from('academy_course_lessons')
          .select('*')
          .eq('course_id', course.id)
          .order('lesson_order');

        lessonsMap[course.id] = lessonsData || [];
      }
      setLessons(lessonsMap);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function handleSubmitCourse(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('academy_pack_courses')
          .update(courseForm)
          .eq('id', editingCourse.id);
        if (error) throw error;
        toast.success('Cours mis à jour');
      } else {
        const { error } = await supabase
          .from('academy_pack_courses')
          .insert([{ ...courseForm, pack_id: packId }]);
        if (error) throw error;
        toast.success('Cours créé');
      }
      setCourseDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  async function handleSubmitLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourseId) return;

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('academy_course_lessons')
          .update(lessonForm)
          .eq('id', editingLesson.id);
        if (error) throw error;
        toast.success('Leçon mise à jour');
      } else {
        const { error } = await supabase
          .from('academy_course_lessons')
          .insert([{ ...lessonForm, course_id: selectedCourseId }]);
        if (error) throw error;
        toast.success('Leçon créée');
      }
      setLessonDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }

  function handleAddCourse() {
    setEditingCourse(null);
    setCourseForm({ title: '', slug: '', description: '', course_order: courses.length });
    setCourseDialogOpen(true);
  }

  function handleEditCourse(course: Course) {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      course_order: course.course_order
    });
    setCourseDialogOpen(true);
  }

  function handleAddLesson(courseId: string) {
    setSelectedCourseId(courseId);
    setEditingLesson(null);
    const courseLessons = lessons[courseId] || [];
    setLessonForm({
      title: '',
      slug: '',
      description: '',
      vimeo_video_id: '',
      vimeo_teaser_id: '',
      duration_seconds: 0,
      lesson_order: courseLessons.length,
      is_free: false,
    });
    setLessonDialogOpen(true);
  }

  function handleEditLesson(lesson: Lesson) {
    setSelectedCourseId(lesson.course_id);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      vimeo_video_id: lesson.vimeo_video_id || '',
      vimeo_teaser_id: lesson.vimeo_teaser_id || '',
      duration_seconds: lesson.duration_seconds,
      lesson_order: lesson.lesson_order,
      is_free: lesson.is_free,
    });
    setLessonDialogOpen(true);
  }

  async function handleDeleteCourse(id: string) {
    if (!confirm('Supprimer ce cours et toutes ses leçons ?')) return;
    try {
      const { error } = await supabase
        .from('academy_pack_courses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Cours supprimé');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm('Supprimer cette leçon ?')) return;
    try {
      const { error } = await supabase
        .from('academy_course_lessons')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Leçon supprimée');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavigation title="Gestion des Cours" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation title="Gestion des Cours" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push('/admin/academy-packs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-4xl font-bold">{packTitle}</h1>
            <p className="text-muted-foreground">Cours et Leçons</p>
          </div>
        </div>

        <Button onClick={handleAddCourse} className="mb-6 bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Cours
        </Button>

        <Accordion type="multiple" className="space-y-4">
          {courses.map((course) => (
            <AccordionItem key={course.id} value={course.id} className="border rounded-lg bg-slate-900/50">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold">{course.title}</span>
                    <span className="text-sm text-muted-foreground">
                      ({lessons[course.id]?.length || 0} leçons)
                    </span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleEditCourse(course)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-3 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddLesson(course.id)}
                    className="mb-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle Leçon
                  </Button>

                  {lessons[course.id]?.map((lesson) => (
                    <Card key={lesson.id} className="bg-slate-800/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Video className="w-4 h-4 text-blue-400" />
                            <div className="flex-1">
                              <div className="font-medium">{lesson.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {lesson.vimeo_video_id && `ID: ${lesson.vimeo_video_id}`}
                                {lesson.is_free && ' • Gratuit'}
                                {lesson.duration_seconds > 0 && ` • ${Math.floor(lesson.duration_seconds / 60)}min`}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditLesson(lesson)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!lessons[course.id] || lessons[course.id].length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucune leçon. Cliquez sur "Nouvelle Leçon" pour commencer.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {courses.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-muted-foreground">Aucun cours. Cliquez sur "Nouveau Cours" pour commencer.</p>
          </Card>
        )}
      </div>

      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Modifier le cours' : 'Nouveau cours'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCourse} className="space-y-4">
            <div>
              <Label htmlFor="course_title">Titre *</Label>
              <Input
                id="course_title"
                value={courseForm.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setCourseForm({ ...courseForm, title, slug: editingCourse ? courseForm.slug : generateSlug(title) });
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="course_slug">Slug *</Label>
              <Input
                id="course_slug"
                value={courseForm.slug}
                onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="course_description">Description</Label>
              <Textarea
                id="course_description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCourseDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                {editingCourse ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLesson} className="space-y-4">
            <div>
              <Label htmlFor="lesson_title">Titre *</Label>
              <Input
                id="lesson_title"
                value={lessonForm.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setLessonForm({ ...lessonForm, title, slug: editingLesson ? lessonForm.slug : generateSlug(title) });
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="lesson_slug">Slug *</Label>
              <Input
                id="lesson_slug"
                value={lessonForm.slug}
                onChange={(e) => setLessonForm({ ...lessonForm, slug: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lesson_description">Description</Label>
              <Textarea
                id="lesson_description"
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vimeo_video_id">ID Vidéo Vimeo Complète *</Label>
                <Input
                  id="vimeo_video_id"
                  value={lessonForm.vimeo_video_id}
                  onChange={(e) => setLessonForm({ ...lessonForm, vimeo_video_id: e.target.value })}
                  placeholder="123456789"
                />
              </div>
              <div>
                <Label htmlFor="vimeo_teaser_id">ID Vidéo Teaser 30s *</Label>
                <Input
                  id="vimeo_teaser_id"
                  value={lessonForm.vimeo_teaser_id}
                  onChange={(e) => setLessonForm({ ...lessonForm, vimeo_teaser_id: e.target.value })}
                  placeholder="987654321"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="duration_seconds">Durée (secondes)</Label>
              <Input
                id="duration_seconds"
                type="number"
                value={lessonForm.duration_seconds}
                onChange={(e) => setLessonForm({ ...lessonForm, duration_seconds: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_free"
                checked={lessonForm.is_free}
                onCheckedChange={(checked) => setLessonForm({ ...lessonForm, is_free: checked })}
              />
              <Label htmlFor="is_free">Leçon gratuite (visible sans achat)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLessonDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                {editingLesson ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
