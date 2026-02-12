'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, ChatMessage } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && isStarted && userEmail) {
      loadMessages();
      const unsubscribe = subscribeToMessages();
      return unsubscribe;
    }
  }, [isOpen, isStarted, userEmail]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_email=eq.${userEmail}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleStartChat(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setIsStarted(true);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('chat_messages').insert({
        user_name: userName,
        user_email: userEmail,
        message: userMessage,
        response: '',
        is_admin_response: false,
      });

      if (insertError) throw insertError;

      const context = `Budget estimé: Non spécifié, Type d'événement: Non spécifié`;

      console.log('🤖 Sending message to AI...');
      console.log('URL:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gemini-chat`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gemini-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            context,
          }),
        }
      );

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ AI Response received:', data);

      if (data.error) {
        console.error('❌ API Error:', data.error);
        console.error('Debug info:', data.debug);
      }

      const aiResponse = data.response;

      await supabase.from('chat_messages').insert({
        user_name: 'Assistant IA',
        user_email: userEmail,
        message: aiResponse,
        response: userMessage,
        is_admin_response: false,
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-amber-500 hover:bg-amber-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110"
        style={{ boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)' }}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-md">
      <Card className="shadow-2xl border-border/50">
        <CardHeader className="bg-primary/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="gold-gradient">Assistant Orientale Musique</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!isStarted ? (
            <form onSubmit={handleStartChat} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Votre nom</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Ahmed Benali"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Votre email</label>
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="ahmed@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Démarrer la conversation
              </Button>
            </form>
          ) : (
            <>
              <ScrollArea className="h-96 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="w-12 h-12 mx-auto mb-2 text-primary" />
                      <p>Bonjour {userName}!</p>
                      <p className="text-sm mt-2">
                        Comment puis-je vous aider à choisir l'orchestre parfait pour votre événement?
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${
                        msg.user_name === 'Assistant IA' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div
                        className={`flex gap-2 max-w-[80%] ${
                          msg.user_name === 'Assistant IA' ? 'flex-row' : 'flex-row-reverse'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.user_name === 'Assistant IA'
                              ? 'bg-primary/10'
                              : 'bg-secondary'
                          }`}
                        >
                          {msg.user_name === 'Assistant IA' ? (
                            <Bot className="w-4 h-4 text-primary" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={`rounded-lg p-3 ${
                            msg.user_name === 'Assistant IA'
                              ? 'bg-card border border-border/50'
                              : 'bg-primary text-primary-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="bg-card border border-border/50 rounded-lg p-3">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Posez votre question..."
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={loading || !inputMessage.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
