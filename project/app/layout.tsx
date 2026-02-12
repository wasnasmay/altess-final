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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://altess.fr'),
  title: 'ALTESS - Le sens du partage | WebTV, Événementiel, Académie',
  description: 'ALTESS : votre plateforme culturelle et événementielle. WebTV en direct, orchestres prestigieux, académie de musique, bonnes adresses et voyages.',
  openGraph: {
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
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
