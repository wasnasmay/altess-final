import '../globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { Toaster } from '@/components/ui/sonner';
import OrientaleMusiqueHeader from '@/components/OrientaleMusiqueHeader';
import WhatsAppFloatingButton from '@/components/WhatsAppFloatingButton';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Orientale Musique - Orchestre Oriental de Prestige',
  description: 'Orientale Musique : orchestre oriental professionnel pour vos événements prestigieux. Mariages, soirées privées, événements d\'entreprise.',
  openGraph: {
    title: 'Orientale Musique - Orchestre Oriental de Prestige',
    description: 'Orchestre oriental professionnel pour vos événements prestigieux',
    images: [{ url: '/image_(4).png' }],
  },
};

export default function OrientaleMusiqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <AuthProvider>
          <PlayerProvider>
            <OrientaleMusiqueHeader />
            <div className="pt-20">
              {children}
            </div>
            <WhatsAppFloatingButton />
            <Toaster />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
