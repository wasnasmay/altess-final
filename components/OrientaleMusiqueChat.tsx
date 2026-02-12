'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Music } from 'lucide-react';
import { toast } from 'sonner';

type Message = {
  id: string;
  client_name: string;
  client_email: string;
  message: string;
  admin_response: string | null;
  created_at: string;
  is_read: boolean;
};

export default function OrientaleMusiqueChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('om_client_name');
    const savedEmail = localStorage.getItem('om_client_email');
    const savedSession = localStorage.getItem('om_session_id');

    if (savedName && savedEmail && savedSession) {
      setClientName(savedName);
      setClientEmail(savedEmail);
      setSessionId(savedSession);
      setIsRegistered(true);
      loadMessages(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (isRegistered && clientEmail) {
      const channel = supabase
        .channel('om-client-messages')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'client_messages',
            filter: `client_email=eq.${clientEmail}`
          },
          () => {
            loadMessages(clientEmail);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isRegistered, clientEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadMessages(email: string) {
    const { data, error } = await supabase
      .from('client_messages')
      .select('*')
      .eq('client_email', email)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!clientName.trim() || !clientEmail.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const newSessionId = `om-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    localStorage.setItem('om_client_name', clientName);
    localStorage.setItem('om_client_email', clientEmail);
    localStorage.setItem('om_session_id', newSessionId);

    setSessionId(newSessionId);
    setIsRegistered(true);

    await loadMessages(clientEmail);
    toast.success('Bienvenue ! Vous pouvez maintenant nous envoyer un message.');
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('client_messages')
      .insert({
        client_name: clientName,
        client_email: clientEmail,
        message: newMessage.trim(),
        context: 'orientale_musique'
      });

    if (error) {
      toast.error('Erreur lors de l\'envoi du message');
      return;
    }

    setNewMessage('');
    await loadMessages(clientEmail);
    toast.success('Message envoyé !');
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 shadow-2xl shadow-amber-900/50 group"
          size="icon"
        >
          <MessageCircle className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
          {messages.some(m => m.admin_response && !m.is_read) && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] bg-gradient-to-br from-amber-950/95 to-black border-amber-700/30 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-amber-700/30 bg-gradient-to-r from-amber-900/40 to-black">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                <Music className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-amber-300">Orientale Musique</h3>
                <p className="text-xs text-amber-600/70">Service Client</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-amber-600/60 hover:text-amber-400"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!isRegistered ? (
              // Registration Form
              <form onSubmit={handleRegister} className="p-4 space-y-4 flex flex-col justify-center flex-1">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold text-amber-300 mb-2">Bienvenue !</h4>
                  <p className="text-sm text-amber-600/70">Pour commencer, présentez-vous</p>
                </div>
                <div>
                  <Input
                    placeholder="Votre nom"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-black/50 border-amber-700/30 text-white"
                    required
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Votre email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="bg-black/50 border-amber-700/30 text-white"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-medium"
                >
                  Commencer la conversation
                </Button>
              </form>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-amber-600/50 text-sm mt-8">
                      Aucun message pour le moment.<br />Envoyez-nous votre première question !
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="space-y-2">
                        {/* Client Message */}
                        <div className="flex justify-end">
                          <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black px-4 py-2 rounded-lg rounded-tr-none max-w-[80%]">
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        {/* Admin Response */}
                        {msg.admin_response && (
                          <div className="flex justify-start">
                            <div className="bg-amber-950/50 text-amber-100 px-4 py-2 rounded-lg rounded-tl-none max-w-[80%] border border-amber-700/20">
                              <p className="text-sm">{msg.admin_response}</p>
                              <p className="text-xs text-amber-600/60 mt-1">Orientale Musique</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-amber-700/30 bg-black/50">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Votre message..."
                      className="bg-black/50 border-amber-700/30 text-white flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
