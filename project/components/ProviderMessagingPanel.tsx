'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, User, Clock, FileText } from 'lucide-react';

interface Message {
  id: string;
  sender: 'client' | 'provider';
  text: string;
  timestamp: Date;
  clientName?: string;
}

interface Conversation {
  id: string;
  clientName: string;
  clientInitials: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  messages: Message[];
}

const demoConversations: Conversation[] = [
  {
    id: '1',
    clientName: 'Sophie Martin',
    clientInitials: 'SM',
    lastMessage: 'Bonjour, je souhaite avoir un devis pour...',
    timestamp: new Date(Date.now() - 3600000),
    unread: 2,
    messages: [
      {
        id: '1',
        sender: 'client',
        text: 'Bonjour, je souhaite avoir un devis pour un mariage prévu le 15 juillet.',
        timestamp: new Date(Date.now() - 7200000),
        clientName: 'Sophie Martin'
      },
      {
        id: '2',
        sender: 'provider',
        text: 'Bonjour Sophie, avec plaisir ! Combien d\'invités prévoyez-vous ?',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        sender: 'client',
        text: 'Environ 150 personnes.',
        timestamp: new Date(Date.now() - 3600000),
        clientName: 'Sophie Martin'
      }
    ]
  },
  {
    id: '2',
    clientName: 'Ahmed Benali',
    clientInitials: 'AB',
    lastMessage: 'Merci pour votre réponse rapide !',
    timestamp: new Date(Date.now() - 86400000),
    unread: 0,
    messages: [
      {
        id: '1',
        sender: 'client',
        text: 'Bonjour, est-il possible d\'avoir un orchestre de 8 musiciens ?',
        timestamp: new Date(Date.now() - 90000000),
        clientName: 'Ahmed Benali'
      },
      {
        id: '2',
        sender: 'provider',
        text: 'Oui bien sûr ! Je vous envoie un devis personnalisé.',
        timestamp: new Date(Date.now() - 86400000)
      },
      {
        id: '3',
        sender: 'client',
        text: 'Merci pour votre réponse rapide !',
        timestamp: new Date(Date.now() - 86400000),
        clientName: 'Ahmed Benali'
      }
    ]
  }
];

export default function ProviderMessagingPanel() {
  const [conversations] = useState<Conversation[]>(demoConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(conversations[0]);
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    setMessageText('');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[600px]">
      <Card className="bg-zinc-900/50 border-zinc-800 md:col-span-1">
        <CardHeader className="pb-3 border-b border-zinc-800">
          <CardTitle className="text-lg font-light text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-amber-600" />
            Conversations
          </CardTitle>
        </CardHeader>
        <ScrollArea className="h-[520px]">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedConv?.id === conv.id
                    ? 'bg-amber-600/20 border border-amber-600/30'
                    : 'bg-black/30 border border-transparent hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 bg-amber-600/20 border border-amber-600/30">
                    <AvatarFallback className="bg-transparent text-amber-600 text-sm font-medium">
                      {conv.clientInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {conv.clientName}
                      </span>
                      {conv.unread > 0 && (
                        <Badge className="bg-amber-600 text-black text-xs h-5 px-2">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1">
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(conv.timestamp)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800 md:col-span-2 flex flex-col">
        {selectedConv ? (
          <>
            <CardHeader className="pb-3 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-amber-600/20 border border-amber-600/30">
                    <AvatarFallback className="bg-transparent text-amber-600 text-sm font-medium">
                      {selectedConv.clientInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base font-medium text-white">
                      {selectedConv.clientName}
                    </CardTitle>
                    <p className="text-xs text-gray-400">En ligne</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-600/10 border border-amber-600/30 text-amber-600 hover:bg-amber-600/20"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Créer un devis
                </Button>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'provider' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender === 'provider'
                          ? 'bg-gradient-to-br from-amber-600 to-amber-500 text-black'
                          : 'bg-zinc-800 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'provider' ? 'text-black/60' : 'text-gray-400'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <CardContent className="pt-3 border-t border-zinc-800">
              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Écrivez votre message..."
                  className="bg-black/50 border-zinc-800 text-white"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
