'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, CheckCheck, Music, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';

type ClientMessage = {
  id: string;
  client_name: string;
  client_email: string;
  message: string;
  admin_response: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string | null;
};

export default function OrientaleMusiqueMessagesAdmin() {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ClientMessage | null>(null);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('admin-om-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_messages'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .eq('context', 'orientale_musique')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(messageId: string) {
    const { error } = await supabase
      .from('client_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (!error) {
      await loadMessages();
    }
  }

  async function handleSendResponse() {
    if (!selectedMessage || !responseText.trim()) {
      toast.error('Veuillez écrire une réponse');
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase
        .from('client_messages')
        .update({
          admin_response: responseText.trim(),
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      toast.success('Réponse envoyée !');
      setResponseText('');
      setSelectedMessage(null);
      await loadMessages();
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Erreur lors de l\'envoi de la réponse');
    } finally {
      setIsSending(false);
    }
  }

  const unreadCount = messages.filter(m => !m.is_read).length;
  const unansweredCount = messages.filter(m => !m.admin_response).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Music className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-amber-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-amber-500" />
            Messagerie Orientale Musique
          </h1>
          <p className="text-amber-600/70 mt-1">Gérez les conversations avec vos clients</p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-amber-600 text-black px-4 py-2">
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </Badge>
          <Badge className="bg-yellow-600 text-black px-4 py-2">
            {unansweredCount} sans réponse
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-amber-950/20 to-black border-amber-700/30">
          <CardHeader>
            <CardTitle className="text-amber-300 text-lg">Messages reçus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-amber-600/50 py-8">
                Aucun message pour le moment
              </div>
            ) : (
              messages.map((msg) => (
                <Card
                  key={msg.id}
                  className={`cursor-pointer transition-all hover:border-amber-600/50 ${
                    selectedMessage?.id === msg.id
                      ? 'bg-amber-900/30 border-amber-600'
                      : 'bg-black/50 border-amber-700/20'
                  }`}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (!msg.is_read) markAsRead(msg.id);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-300 text-sm">{msg.client_name}</h4>
                        <p className="text-xs text-amber-600/70 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {msg.client_email}
                        </p>
                      </div>
                      {!msg.is_read && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-sm text-amber-200/70 line-clamp-2 mb-2">{msg.message}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {msg.admin_response ? (
                        <Badge variant="outline" className="border-green-600 text-green-400 text-xs">
                          <CheckCheck className="w-3 h-3 mr-1" />
                          Répondu
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-600 text-amber-400 text-xs">
                          En attente
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Message Detail & Response */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-amber-950/20 to-black border-amber-700/30">
          <CardHeader>
            <CardTitle className="text-amber-300 text-lg">
              {selectedMessage ? 'Conversation' : 'Sélectionnez un message'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Client Info */}
                <div className="bg-black/50 p-4 rounded-lg border border-amber-700/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-amber-600/70 mb-1">Client</p>
                      <p className="text-amber-300 font-medium">{selectedMessage.client_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600/70 mb-1">Email</p>
                      <p className="text-amber-300 font-medium text-sm">{selectedMessage.client_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600/70 mb-1">Date</p>
                      <p className="text-amber-300 font-medium text-sm">
                        {new Date(selectedMessage.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600/70 mb-1">Statut</p>
                      {selectedMessage.admin_response ? (
                        <Badge variant="outline" className="border-green-600 text-green-400">
                          <CheckCheck className="w-3 h-3 mr-1" />
                          Répondu
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-600 text-amber-400">
                          En attente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Client Message */}
                <div>
                  <p className="text-xs text-amber-600/70 mb-2">Message du client</p>
                  <div className="bg-gradient-to-r from-amber-900/30 to-black p-4 rounded-lg border border-amber-700/20">
                    <p className="text-amber-200">{selectedMessage.message}</p>
                  </div>
                </div>

                {/* Admin Response */}
                {selectedMessage.admin_response ? (
                  <div>
                    <p className="text-xs text-amber-600/70 mb-2">Votre réponse</p>
                    <div className="bg-green-900/20 p-4 rounded-lg border border-green-700/20">
                      <p className="text-green-200">{selectedMessage.admin_response}</p>
                      {selectedMessage.updated_at && (
                        <p className="text-xs text-green-600/50 mt-2">
                          Envoyé le {new Date(selectedMessage.updated_at).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-amber-600/70 mb-2">Votre réponse</p>
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Écrivez votre réponse au client..."
                      className="bg-black/50 border-amber-700/30 text-white min-h-[150px] mb-4"
                    />
                    <Button
                      onClick={handleSendResponse}
                      disabled={isSending || !responseText.trim()}
                      className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-medium"
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer la réponse
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-amber-600/50">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez un message pour voir la conversation</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
