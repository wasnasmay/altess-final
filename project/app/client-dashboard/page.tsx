'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getRoleRedirectPath } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Clock, MapPin, Users, Star, MessageSquare, Plus, Bell,
  TrendingUp, Heart, DollarSign, Home, Activity, Send, CheckCircle2,
  AlertCircle, Mail, BarChart3, X, Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Booking {
  id: string;
  event_date: string;
  event_time: string;
  event_type: string;
  event_location: string;
  guest_count: number;
  status: string;
  price_agreed: number;
  orchestra: {
    name: string;
    image_url: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender: {
    full_name: string;
    role: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  action_url: string;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingEvents: 0,
    totalSpent: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', message: '' });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    checkClientAccess();
  }, []);

  const checkClientAccess = async () => {
    if (!user?.id) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profileData) {
        toast.error('Erreur de chargement du profil');
        router.push('/login');
        return;
      }

      if (profileData.role !== 'client') {
        const correctPath = getRoleRedirectPath(profileData.role);
        router.replace(correctPath);
        return;
      }

      await fetchData();
    } catch (error) {
      console.error('Error checking client access:', error);
      router.push('/login');
    }
  };

  const fetchData = async () => {
    try {
      const [bookingsRes, messagesRes, notificationsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            orchestra:orchestras(name, image_url)
          `)
          .eq('client_id', user?.id)
          .order('event_date', { ascending: true }),
        supabase
          .from('client_messages')
          .select(`
            *,
            sender:sender_id(full_name, role)
          `)
          .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('client_notifications')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (bookingsRes.data) {
        setBookings(bookingsRes.data as any);

        const now = new Date();
        const upcomingCount = bookingsRes.data.filter((b: any) =>
          new Date(b.event_date) > now && b.status !== 'cancelled'
        ).length;

        const totalSpent = bookingsRes.data
          .filter((b: any) => b.status === 'completed' && b.price_agreed)
          .reduce((sum: number, b: any) => sum + Number(b.price_agreed), 0);

        setStats(prev => ({
          ...prev,
          totalBookings: bookingsRes.data.length,
          upcomingEvents: upcomingCount,
          totalSpent
        }));
      }

      if (messagesRes.data) {
        setMessages(messagesRes.data as any);
        const unreadCount = messagesRes.data.filter((m: any) =>
          m.recipient_id === user?.id && !m.is_read
        ).length;
        setStats(prev => ({ ...prev, unreadMessages: unreadCount }));
      }

      if (notificationsRes.data) {
        setNotifications(notificationsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.message) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const { data: adminData } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (!adminData) {
        toast.error('Impossible de trouver un administrateur');
        return;
      }

      const { error } = await supabase
        .from('client_messages')
        .insert({
          sender_id: user?.id,
          recipient_id: adminData.id,
          subject: newMessage.subject,
          message: newMessage.message,
          message_type: 'support'
        });

      if (error) throw error;

      toast.success('Message envoyé avec succès');
      setShowMessageDialog(false);
      setNewMessage({ subject: '', message: '' });
      fetchData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('client_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      fetchData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, any> = {
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'En attente' },
      confirmed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', label: 'Confirmée' },
      cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', label: 'Annulée' },
      completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Terminée' }
    };
    const c = config[status] || config.pending;
    return <Badge className={`${c.bg} ${c.text} ${c.border} border`}>{c.label}</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') return <AlertCircle className="w-4 h-4 text-red-400" />;
    return <Bell className="w-4 h-4 text-blue-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                Mon Espace Premium
              </h1>
            </div>
            <p className="text-slate-400">Bienvenue dans votre tableau de bord personnalisé</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="border-amber-500/30 hover:bg-amber-500/10 text-amber-400"
          >
            <Home className="w-4 h-4 mr-2" />
            Retour au Site
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalBookings}</div>
              <div className="text-sm text-slate-400">Réservations Total</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.upcomingEvents}</div>
              <div className="text-sm text-slate-400">Événements à Venir</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-amber-500/20">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <BarChart3 className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalSpent}€</div>
              <div className="text-sm text-slate-400">Dépenses Totales</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-500/20">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                {stats.unreadMessages > 0 && (
                  <Badge className="bg-red-500">{stats.unreadMessages}</Badge>
                )}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{messages.length}</div>
              <div className="text-sm text-slate-400">Messages</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-4 bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600">
              <Calendar className="w-4 h-4 mr-2" />
              Réservations
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
              {stats.unreadMessages > 0 && (
                <Badge className="ml-2 bg-red-500">{stats.unreadMessages}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Prochaines Réservations */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Prochaines Réservations
                  </CardTitle>
                  <CardDescription>Vos événements à venir</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    {bookings
                      .filter(b => new Date(b.event_date) > new Date() && b.status !== 'cancelled')
                      .slice(0, 3)
                      .map((booking) => (
                        <div key={booking.id} className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-medium text-white">{booking.orchestra.name}</div>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.event_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    {bookings.filter(b => new Date(b.event_date) > new Date()).length === 0 && (
                      <div className="text-center text-slate-400 py-8">
                        Aucun événement à venir
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Messages Récents */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-400" />
                      Messages Récents
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setShowMessageDialog(true)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Nouveau
                    </Button>
                  </div>
                  <CardDescription>Vos dernières conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    {messages.slice(0, 5).map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-4 p-4 rounded-lg border ${
                          !msg.is_read && msg.recipient_id === user?.id
                            ? 'bg-purple-500/10 border-purple-500/30'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-white text-sm">{msg.subject}</div>
                          {!msg.is_read && msg.recipient_id === user?.id && (
                            <Badge className="bg-purple-500 text-xs">Nouveau</Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 line-clamp-2 mb-2">
                          {msg.message}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center text-slate-400 py-8">
                        Aucun message
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/20">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Besoin d'aide pour votre événement ?
                    </h3>
                    <p className="text-slate-300 mb-4">
                      Notre équipe est là pour vous accompagner dans l'organisation de votre événement parfait.
                    </p>
                    <Button
                      onClick={() => setShowMessageDialog(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-600"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Contacter un conseiller
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="pt-6 text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400">Aucune réservation pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white flex items-center gap-2">
                            {booking.orchestra.name}
                            {getStatusBadge(booking.status)}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {booking.event_type}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            {new Date(booking.event_date).toLocaleDateString('fr-FR')}
                          </div>
                          {booking.event_time && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Clock className="w-4 h-4 text-blue-400" />
                              {booking.event_time}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <MapPin className="w-4 h-4 text-blue-400" />
                            {booking.event_location}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {booking.guest_count && (
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                              <Users className="w-4 h-4 text-blue-400" />
                              {booking.guest_count} invités
                            </div>
                          )}
                          {booking.price_agreed && (
                            <div className="text-lg font-bold text-amber-400">
                              {booking.price_agreed}€
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Messagerie</CardTitle>
                  <Button
                    onClick={() => setShowMessageDialog(true)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Nouveau message
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`mb-4 p-4 rounded-lg border ${
                        !msg.is_read && msg.recipient_id === user?.id
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-white mb-1">{msg.subject}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(msg.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        {!msg.is_read && msg.recipient_id === user?.id && (
                          <Badge className="bg-purple-500">Nouveau</Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-300 whitespace-pre-wrap">
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center text-slate-400 py-12">
                      <Mail className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p>Aucun message</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`mb-4 p-4 rounded-lg border ${
                        !notif.is_read
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getPriorityIcon(notif.priority)}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="font-semibold text-white">{notif.title}</div>
                            {!notif.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markNotificationAsRead(notif.id)}
                                className="text-green-400 hover:bg-green-500/10"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mb-2">{notif.message}</p>
                          <div className="text-xs text-slate-500">
                            {new Date(notif.created_at).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center text-slate-400 py-12">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p>Aucune notification</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Nouveau Message */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Nouveau message</DialogTitle>
            <DialogDescription>
              Contactez notre équipe pour toute question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subject" className="text-slate-200">Sujet</Label>
              <Input
                id="subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                placeholder="Ex: Question sur ma réservation"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-slate-200">Message</Label>
              <Textarea
                id="message"
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                placeholder="Décrivez votre demande..."
                rows={6}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMessageDialog(false)}
              className="border-slate-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
