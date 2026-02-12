import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { Toaster } from '@/components/ui/sonner';
import { LazyYouTubeWrapper } from '@/components/LazyYouTubeWrapper';
import GlobalProgramsPanel from '@/components/GlobalProgramsPanel';
import { GlobalRadioPlayer } from '@/components/GlobalRadioPlayer';
import { ConditionalLayout } from '@/components/ConditionalLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://votre-altesse.fr'),
  title: 'Votre Altesse - L\'Excellence au Service du Partage | WebTV, Événementiel, Académie',
  description: 'Votre Altesse : votre plateforme culturelle et événementielle de prestige. WebTV en direct, orchestres d\'excellence, académie de musique, bonnes adresses et voyages.',
  openGraph: {
    title: 'Votre Altesse - L\'Excellence au Service du Partage',
    description: 'Votre plateforme culturelle et événementielle de prestige.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Votre Altesse - L\'Excellence au Service du Partage',
    description: 'Votre plateforme culturelle et événementielle de prestige.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <AuthProvider>
          <PlayerProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <LazyYouTubeWrapper />
            <GlobalRadioPlayer />
            <GlobalProgramsPanel />
            <Toaster />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
