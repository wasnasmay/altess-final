'use client';

import { useRef, useState, useEffect } from 'react';
import { Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRCode from 'react-qr-code';

interface GoldenTicketProps {
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  venueName: string;
  city: string;
  customerName: string;
  ticketTier: string;
  qrCodeData: string;
  organizerLogo?: string;
  organizerName?: string;
  eventSlug?: string;
  eventImage?: string;
}

export default function GoldenTicket({
  ticketNumber,
  eventTitle,
  eventDate,
  eventTime,
  venueName,
  city,
  customerName,
  ticketTier,
  qrCodeData,
  organizerLogo,
  organizerName,
  eventSlug,
  eventImage,
}: GoldenTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      (document as any).fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    } else {
      setFontsLoaded(true);
    }
  }, []);

  const validationUrl = eventSlug
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/e/${eventSlug}/validate/${qrCodeData}`
    : qrCodeData;

  async function downloadTicket() {
    if (!ticketRef.current || !fontsLoaded) {
      alert('Veuillez patienter, le billet se prépare...');
      return;
    }

    setIsDownloading(true);

    try {
      const images = ticketRef.current.querySelectorAll('img');

      await Promise.all(
        Array.from(images).map((img) => {
          return new Promise<void>((resolve, reject) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve();
            } else {
              const timeoutId = setTimeout(() => {
                resolve();
              }, 5000);

              img.onload = () => {
                clearTimeout(timeoutId);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeoutId);
                resolve();
              };

              if (!img.complete) {
                img.crossOrigin = 'anonymous';
                const src = img.src;
                img.src = '';
                img.src = src;
              }
            }
          });
        })
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(ticketRef.current, {
        scale: 4,
        backgroundColor: '#0a0a0a',
        logging: false,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        removeContainer: true,
        foreignObjectRendering: false,
        width: ticketRef.current.offsetWidth,
        height: ticketRef.current.offsetHeight,
        windowWidth: ticketRef.current.offsetWidth,
        windowHeight: ticketRef.current.offsetHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-ticket-content]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.animation = 'none';

            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el: any) => {
              el.style.animation = 'none';
              el.style.transition = 'none';
            });
          }
        },
      });

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `Billet-Dore-${eventTitle.replace(/[^a-z0-9]/gi, '-')}-${ticketNumber}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
          setIsDownloading(false);
        },
        'image/png',
        1.0
      );
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Erreur lors du téléchargement. Veuillez réessayer ou faire une capture d\'écran.');
      setIsDownloading(false);
    }
  }

  const formattedDate = new Date(eventDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div
        ref={ticketRef}
        data-ticket-content
        className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden group cursor-pointer"
        style={{
          aspectRatio: '16/9',
          background: '#0a0a0a',
          boxShadow: '0 25px 50px -12px rgba(217, 119, 6, 0.4), 0 0 80px rgba(217, 119, 6, 0.15)',
        }}
      >
        {/* Image de l'événement en arrière-plan */}
        {eventImage && (
          <div className="absolute inset-0">
            <img
              src={eventImage}
              alt={eventTitle}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              style={{
                filter: 'brightness(0.35) blur(2px)',
                transform: 'scale(1.05)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.8) 40%, rgba(10,10,10,0.7) 60%, rgba(10,10,10,0.85) 100%)',
              }}
            />
          </div>
        )}

        {/* Section gauche avec image visible */}
        {eventImage && (
          <div className="absolute left-0 top-0 bottom-0 w-1/3">
            <div className="absolute inset-0 p-8">
              <div
                className="h-full rounded-2xl overflow-hidden"
                style={{
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  boxShadow: '0 0 30px rgba(217, 119, 6, 0.2)',
                }}
              >
                <img
                  src={eventImage}
                  alt={eventTitle}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                  style={{
                    filter: 'brightness(0.9) saturate(1.1)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Texture dorée subtile */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Bordure dorée nette */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            border: '4px solid transparent',
            borderImage: 'linear-gradient(135deg, #d97706, #fbbf24, #f59e0b, #fbbf24, #d97706) 1',
            boxShadow: 'inset 0 0 60px rgba(217, 119, 6, 0.15)',
          }}
        />

        {/* Contenu du billet */}
        <div className={`absolute inset-0 ${eventImage ? 'pl-[35%]' : 'pl-0'} pr-8 py-8 flex flex-col justify-between`}>
          {/* En-tête */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-amber-400" />
                <span
                  className="text-sm font-black tracking-widest uppercase"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Édition Dorée
                </span>
              </div>
              <h2
                className="text-4xl font-black leading-tight mb-1"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 0 40px rgba(251, 191, 36, 0.3)',
                  letterSpacing: '-0.02em',
                }}
              >
                {eventTitle}
              </h2>
              {organizerName && (
                <p className="text-sm text-slate-300 mb-2 font-medium">
                  Organisé par : <span className="text-amber-400 font-bold">{organizerName}</span>
                </p>
              )}
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    color: '#000',
                  }}
                >
                  {ticketTier}
                </span>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-semibold">Billet Vérifié</span>
              </div>
            </div>

            {/* Logo organisateur */}
            {organizerLogo && (
              <div
                className="flex-shrink-0 ml-4 p-3 rounded-xl bg-black/40"
                style={{
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <img
                  src={organizerLogo}
                  alt="Organisateur"
                  crossOrigin="anonymous"
                  className="h-14 w-auto object-contain"
                />
              </div>
            )}
          </div>

          {/* Section centrale avec infos et QR Code */}
          <div className="flex items-end justify-between gap-8">
            <div className="flex-1 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-amber-500 uppercase tracking-widest mb-2 font-bold">Titulaire</p>
                <p
                  className="text-2xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {customerName}
                </p>
              </div>

              <div>
                <p className="text-xs text-amber-500 uppercase tracking-widest mb-2 font-bold">Numéro</p>
                <p className="text-sm font-mono font-bold text-amber-400 tracking-wider">
                  {ticketNumber}
                </p>
              </div>

              <div>
                <p className="text-xs text-amber-500 uppercase tracking-widest mb-2 font-bold">Date & Heure</p>
                <p className="text-white font-bold text-sm leading-tight">
                  {formattedDate}
                  {eventTime && (
                    <>
                      <br />
                      <span className="text-amber-400">{eventTime.substring(0, 5)}</span>
                    </>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-amber-500 uppercase tracking-widest mb-2 font-bold">Lieu</p>
                <p className="text-white font-bold text-sm leading-tight">
                  {venueName}
                  <br />
                  <span className="text-slate-400">{city}</span>
                </p>
              </div>
            </div>

            {/* QR Code avec bordure dorée */}
            <div className="flex-shrink-0">
              <div
                className="p-1 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #d97706, #fbbf24, #f59e0b)',
                }}
              >
                <div className="bg-white p-4 rounded-xl">
                  <QRCode
                    value={validationUrl}
                    size={140}
                    level="H"
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  />
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-amber-400 font-bold mb-1">
                  Scanner pour valider
                </p>
                {eventSlug && (
                  <p className="text-xs text-slate-400 font-mono break-all px-2">
                    altess.fr/e/{eventSlug}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-amber-900/40">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#10b981' }}
              />
              <span className="text-xs text-slate-400">
                Billet numérique sécurisé
              </span>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Propulsé par</p>
              <p
                className="text-2xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ALTESS
              </p>
            </div>
          </div>
        </div>

        {/* Effet de brillance en coin */}
        <div
          className="absolute top-0 right-0 w-40 h-40 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* Bouton de téléchargement */}
      <div className="text-center">
        <Button
          onClick={downloadTicket}
          disabled={isDownloading || !fontsLoaded}
          size="lg"
          className="font-black text-black hover:scale-105 transition-all shadow-2xl px-8 py-6 text-lg"
          style={{
            background: isDownloading
              ? '#94a3b8'
              : 'linear-gradient(135deg, #d97706 0%, #fbbf24 50%, #f59e0b 100%)',
          }}
        >
          <Download className="w-6 h-6 mr-3" />
          {isDownloading ? 'Génération en cours...' : 'Télécharger mon Billet Doré'}
        </Button>
        <p className="text-sm text-slate-400 mt-3 font-medium">
          {isDownloading
            ? 'Veuillez patienter, génération haute définition en cours...'
            : 'Format HD 4K - Prêt à imprimer ou à présenter sur mobile'
          }
        </p>
        {!fontsLoaded && (
          <p className="text-xs text-amber-500 mt-2">
            Chargement des polices en cours...
          </p>
        )}
      </div>

      {/* Styles pour l'impression */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Masquer tout sauf le billet */
          body > *:not([data-ticket-content]) {
            display: none !important;
          }

          /* Forcer l'affichage du billet */
          [data-ticket-content] {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            transform: none !important;
          }

          /* Préserver les couleurs et gradients */
          [data-ticket-content] * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* Masquer les boutons et éléments interactifs */
          button,
          .no-print {
            display: none !important;
          }

          /* Optimiser les images pour l'impression */
          img {
            max-width: 100% !important;
            page-break-inside: avoid !important;
          }

          /* Assurer la visibilité des bordures dorées */
          [data-ticket-content] > div[style*="border"] {
            border-width: 3px !important;
          }
        }
      `}</style>
    </div>
  );
}
