'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users, MessageSquare, Bell, Send, Search, Filter,
  TrendingUp, Calendar, Mail, AlertCircle, CheckCircle2,
  BarChart3, User, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  total_bookings: number;
  total_spent: number;
  last_activity: string;
}

interface Message {
  id: string;
  sender: {
    full_name: string;
    email: string;
  };
  recipient_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  message_type: string;
}

export default function ClientManagementPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', message: '', recipient_id: '' });
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    notification_type: 'system',
    priority: 'normal',
    recipient_id: ''
  });

  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalMessages: 0,
    unreadMessages: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile?.role !== 'admin') {
      toast.error('Accès refusé');
      router.push('/');
      return;
    }

    loadData();
  }, [user, profile]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [clientsRes, messagesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'client')
          .order('created_at', { ascending: false }),
        supabase
          .from('client_messages')
          .select(`
            *,
            sender:sender_id(full_name, email)
          `)
          .eq('message_type', 'support')
          .order('created_at', { ascending: false })
      ]);

      if (clientsRes.data) {
        const enrichedClients = await Promise.all(
          clientsRes.data.map(async (client) => {
            const { data: bookings } = await supabase
              .from('bookings')
              .select('price_agreed, status')
              .eq('client_id', client.id);

            const totalBookings = bookings?.length || 0;
            const totalSpent = bookings
              ?.filter(b => b.status === 'completed')
              .reduce((sum, b) => sum + (Number(b.price_agreed) || 0), 0) || 0;

            const { data: activity } = await supabase
              .from('client_activity_log')
              .select('created_at')
              .eq('user_id', client.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...client,
              total_bookings: totalBookings,
              total_spent: totalSpent,
              last_activity: activity?.created_at || client.created_at
            };
          })
        );

        setClients(enrichedClients);

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const activeClients = enrichedClients.filter(
          c => new Date(c.last_activity) > thirtyDaysAgo
        ).length;

        setStats(prev => ({
          ...prev,
          totalClients: enrichedClients.length,
          activeClients
        }));
      }

      if (messagesRes.data) {
        setMessages(messagesRes.data as any);
        const unreadCount = messagesRes.data.filter((m: any) => !m.is_read).length;

        setStats(prev => ({
          ...prev,
          totalMessages: messagesRes.data.length,
          unreadMessages: unreadCount
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.message) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const { error } = await supabase
        .from('client_messages')
        .insert({
          sender_id: user?.id,
          recipient_id: newMessage.recipient_id,
          subject: newMessage.subject,
          message: newMessage.message,
          message_type: 'support'
        });

      if (error) throw error;

      toast.success('Message envoyé avec succès');
      setShowMessageDialog(false);
      setNewMessage({ subject: '', message: '', recipient_id: '' });
      loadData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const handleSendNotification = async () => {
    if (!newNotification.recipient_id || !newNotification.title || !newNotification.message) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const { error } = await supabase
        .from('client_notifications')
        .insert({
          user_id: newNotification.recipient_id,
          title: newNotification.title,
          message: newNotification.message,
          notification_type: newNotification.notification_type,
          priority: newNotification.priority
        });

      if (error) throw error;

      toast.success('Notification envoyée avec succès');
      setShowNotificationDialog(false);
      setNewNotification({
        title: '',
        message: '',
        notification_type: 'system',
        priority: 'normal',
        recipient_id: ''
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('client_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId);
      loadData();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(msg =>
    !selectedClient || msg.sender.email === clients.find(c => c.id === selectedClient)?.email
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <AdminSidebar />
        <div className="lg:ml-64 p-4 md:p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminSidebar />

      <div className="lg:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Gestion des Clients</h1>
              <p className="text-slate-400 text-sm md:text-base">Messages, notifications et statistiques</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-500/20">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalClients}</div>
                <div className="text-sm text-slate-400">Clients Total</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.activeClients}</div>
                <div className="text-sm text-slate-400">Clients Actifs (30j)</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-purple-500/20">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  {stats.unreadMessages > 0 && (
                    <Badge className="bg-red-500">{stats.unreadMessages}</Badge>
                  )}
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalMessages}</div>
                <div className="text-sm text-slate-400">Messages Support</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-amber-500/20">
                    <Bell className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {clients.reduce((sum, c) => sum + c.total_spent, 0).toFixed(0)}€
                </div>
                <div className="text-sm text-slate-400">Chiffre d'Affaires</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="clients" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-slate-900/50 border border-slate-800">
              <TabsTrigger value="clients">
                <Users className="w-4 h-4 mr-2" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="messages">
                <MessageSquare className="w-4 h-4 mr-2" />
                Messages
                {stats.unreadMessages > 0 && (
                  <Badge className="ml-2 bg-red-500">{stats.unreadMessages}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle className="text-white">Liste des Clients</CardTitle>
                    <div className="flex gap-2">
                      <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Rechercher un client..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-blue-500/20">
                                <User className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-white">{client.full_name || 'Sans nom'}</div>
                                <div className="text-sm text-slate-400">{client.email}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setNewMessage({ ...newMessage, recipient_id: client.id });
                                  setShowMessageDialog(true);
                                }}
                                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setNewNotification({ ...newNotification, recipient_id: client.id });
                                  setShowNotificationDialog(true);
                                }}
                                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                              >
                                <Bell className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Réservations:</span>
                              <div className="font-medium text-blue-400">{client.total_bookings}</div>
                            </div>
                            <div>
                              <span className="text-slate-500">Dépenses:</span>
                              <div className="font-medium text-green-400">{client.total_spent}€</div>
                            </div>
                            <div>
                              <span className="text-slate-500">Inscrit le:</span>
                              <div className="font-medium text-slate-300">
                                {new Date(client.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500">Dernière activité:</span>
                              <div className="font-medium text-slate-300">
                                {new Date(client.last_activity).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Messages Support</CardTitle>
                    <Button
                      onClick={() => setShowMessageDialog(true)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Nouveau message
                    </Button>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Filter className="w-4 h-4" />
                      <Select value={selectedClient || ''} onValueChange={setSelectedClient}>
                        <SelectTrigger className="w-64 bg-slate-800 border-slate-700">
                          <SelectValue placeholder="Filtrer par client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous les clients</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.full_name || client.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    {filteredMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`mb-4 p-4 rounded-lg border ${
                          !msg.is_read
                            ? 'bg-purple-500/10 border-purple-500/30'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-500/20">
                              <Mail className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-white">{msg.subject}</div>
                              <div className="text-sm text-slate-400">
                                De: {msg.sender.full_name || msg.sender.email}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(msg.created_at).toLocaleString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          {!msg.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markMessageAsRead(msg.id)}
                              className="text-green-400 hover:bg-green-500/10"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap pl-11">
                          {msg.message}
                        </div>
                      </div>
                    ))}
                    {filteredMessages.length === 0 && (
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Envoyer une Notification</CardTitle>
                    <Button
                      onClick={() => setShowNotificationDialog(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-600"
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Nouvelle notification
                    </Button>
                  </div>
                  <CardDescription>
                    Envoyez des notifications à vos clients pour les informer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-amber-400 mb-1">Types de notifications</div>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li><strong>Système:</strong> Mises à jour et changements</li>
                            <li><strong>Promo:</strong> Offres et promotions</li>
                            <li><strong>Réservation:</strong> Confirmations et rappels</li>
                            <li><strong>Paiement:</strong> Statuts de paiement</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog Nouveau Message */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Envoyer un message</DialogTitle>
            <DialogDescription>Répondez à un client ou envoyez un nouveau message</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="recipient" className="text-slate-200">Destinataire</Label>
              <Select
                value={newMessage.recipient_id}
                onValueChange={(value) => setNewMessage({ ...newMessage, recipient_id: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Sélectionnez un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject" className="text-slate-200">Sujet</Label>
              <Input
                id="subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                placeholder="Sujet du message"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-slate-200">Message</Label>
              <Textarea
                id="message"
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                placeholder="Votre message..."
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

      {/* Dialog Nouvelle Notification */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Créer une notification</DialogTitle>
            <DialogDescription>Envoyez une notification à un client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="notif-recipient" className="text-slate-200">Destinataire</Label>
              <Select
                value={newNotification.recipient_id}
                onValueChange={(value) => setNewNotification({ ...newNotification, recipient_id: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Sélectionnez un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="notif-type" className="text-slate-200">Type</Label>
                <Select
                  value={newNotification.notification_type}
                  onValueChange={(value) => setNewNotification({ ...newNotification, notification_type: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Système</SelectItem>
                    <SelectItem value="promo">Promotion</SelectItem>
                    <SelectItem value="booking">Réservation</SelectItem>
                    <SelectItem value="payment">Paiement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notif-priority" className="text-slate-200">Priorité</Label>
                <Select
                  value={newNotification.priority}
                  onValueChange={(value) => setNewNotification({ ...newNotification, priority: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notif-title" className="text-slate-200">Titre</Label>
              <Input
                id="notif-title"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                placeholder="Titre de la notification"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="notif-message" className="text-slate-200">Message</Label>
              <Textarea
                id="notif-message"
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                placeholder="Contenu de la notification..."
                rows={4}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotificationDialog(false)}
              className="border-slate-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendNotification}
              className="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              <Bell className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
