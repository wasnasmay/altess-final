'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AdminNavigation from '@/components/AdminNavigation';
import { toast } from 'sonner';
import { QrCode, Search, CheckCircle, XCircle, AlertCircle, Ticket, User, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type BookingResult = {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  total_tickets: number;
  total_amount: number;
  checked_in: boolean;
  checked_in_at: string | null;
  qr_code_data: string;
  event: {
    title: string;
    event_date: string;
    event_time: string;
    venue_name: string;
  };
};

export default function AdminScannerPage() {
  const { user } = useAuth();
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<BookingResult | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'already_used'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useState<HTMLVideoElement | null>(null)[0];
  const [stream, setStream] = useState<MediaStream | null>(null);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef) {
        videoRef.srcObject = mediaStream;
      }
      setScanning(true);
      toast.success('Caméra activée - Scannez un QR Code');
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Impossible d\'accéder à la caméra');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  }

  async function handleManualValidation() {
    if (!manualCode.trim()) {
      toast.error('Veuillez saisir un code');
      return;
    }
    await validateTicket(manualCode);
  }

  async function validateTicket(qrData: string) {
    try {
      setScanStatus('idle');
      setErrorMessage('');

      const { data: booking, error } = await supabase
        .from('event_bookings')
        .select(`
          id,
          booking_reference,
          customer_name,
          customer_email,
          total_tickets,
          total_amount,
          checked_in,
          checked_in_at,
          qr_code_data,
          payment_status,
          status,
          event:public_events(title, event_date, event_time, venue_name)
        `)
        .eq('qr_code_data', qrData)
        .maybeSingle();

      if (error) throw error;

      if (!booking) {
        setScanStatus('error');
        setErrorMessage('Billet non trouvé. Vérifiez le QR code.');
        toast.error('Billet invalide');
        return;
      }

      if (booking.status !== 'confirmed') {
        setScanStatus('error');
        setErrorMessage('Ce billet n\'est pas confirmé.');
        toast.error('Billet non confirmé');
        setScanResult(booking as any);
        return;
      }

      if (booking.payment_status !== 'succeeded') {
        setScanStatus('error');
        setErrorMessage('Le paiement de ce billet n\'est pas validé.');
        toast.error('Paiement non validé');
        setScanResult(booking as any);
        return;
      }

      if (booking.checked_in) {
        setScanStatus('already_used');
        setErrorMessage(`Billet déjà utilisé le ${new Date(booking.checked_in_at!).toLocaleString('fr-FR')}`);
        toast.error('Billet déjà scanné');
        setScanResult(booking as any);
        return;
      }

      const { error: updateError } = await supabase
        .from('event_bookings')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: user?.id
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      setScanStatus('success');
      setScanResult(booking as any);
      toast.success('Billet validé avec succès');

      setTimeout(() => {
        setScanStatus('idle');
        setScanResult(null);
        setManualCode('');
      }, 5000);

    } catch (error) {
      console.error('Error validating ticket:', error);
      setScanStatus('error');
      setErrorMessage('Erreur lors de la validation');
      toast.error('Erreur de validation');
    }
  }

  function getStatusIcon() {
    switch (scanStatus) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500 animate-shake" />;
      case 'already_used':
        return <AlertCircle className="w-16 h-16 text-orange-500 animate-pulse" />;
      default:
        return <QrCode className="w-16 h-16 text-muted-foreground" />;
    }
  }

  function getStatusColor() {
    switch (scanStatus) {
      case 'success':
        return 'bg-green-500/10 border-green-500';
      case 'error':
        return 'bg-red-500/10 border-red-500';
      case 'already_used':
        return 'bg-orange-500/10 border-orange-500';
      default:
        return 'bg-muted border-border';
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavigation title="Scanner de Billets" />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Scanner QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!scanning ? (
                <div className="text-center">
                  <Button
                    onClick={startCamera}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Activer la Caméra
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Cliquez pour activer le scanner de QR code
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={(el) => {
                        if (el) {
                          (videoRef as any) = el;
                          if (stream) el.srcObject = stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-4 border-amber-500 rounded-lg"></div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-white text-sm bg-black/50 px-4 py-2 rounded inline-block">
                        Positionnez le QR code dans le cadre jaune
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={stopCamera}
                    className="w-full"
                  >
                    Arrêter le Scanner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Validation Manuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Saisir le code du billet
                  </label>
                  <Input
                    placeholder="ALTESS-TICKET-..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleManualValidation();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleManualValidation}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Valider le Code
                </Button>
                <p className="text-xs text-muted-foreground">
                  Entrez le code du billet manuellement si le QR code ne fonctionne pas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={`border-2 ${getStatusColor()} transition-all`}>
          <CardHeader>
            <CardTitle className="text-center">Résultat de la Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              {getStatusIcon()}
            </div>

            {scanStatus === 'idle' && !scanResult && (
              <div className="text-center">
                <p className="text-muted-foreground">
                  Scannez un QR code ou saisissez un code manuellement pour valider un billet
                </p>
              </div>
            )}

            {(scanStatus === 'error' || scanStatus === 'already_used') && errorMessage && (
              <div className="text-center mb-6">
                <p className={`text-lg font-semibold ${
                  scanStatus === 'error' ? 'text-red-600' : 'text-orange-600'
                }`}>
                  {errorMessage}
                </p>
              </div>
            )}

            {scanResult && (
              <div className="space-y-4 mt-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Référence</div>
                      <div className="font-mono font-semibold">{scanResult.booking_reference}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Statut</div>
                      <div>
                        {scanStatus === 'success' && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Billet Validé
                          </Badge>
                        )}
                        {scanStatus === 'already_used' && (
                          <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Déjà Utilisé
                          </Badge>
                        )}
                        {scanStatus === 'error' && (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                            <XCircle className="w-3 h-3 mr-1" />
                            Invalide
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Client
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nom :</span>
                      <span className="font-medium">{scanResult.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email :</span>
                      <span className="font-medium">{scanResult.customer_email}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Événement
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">{scanResult.event?.title}</div>
                    <div className="text-muted-foreground">
                      {scanResult.event?.event_date &&
                        new Date(scanResult.event.event_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      }
                      {scanResult.event?.event_time && ` à ${scanResult.event.event_time}`}
                    </div>
                    {scanResult.event?.venue_name && (
                      <div className="text-muted-foreground">{scanResult.event.venue_name}</div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    Billets
                  </h3>
                  <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Nombre de billets</div>
                      <div className="text-2xl font-bold">{scanResult.total_tickets}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Montant</div>
                      <div className="text-2xl font-bold text-primary">{scanResult.total_amount} €</div>
                    </div>
                  </div>
                </div>

                {scanStatus === 'success' && (
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-semibold text-green-600">Entrée autorisée</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Validé le {new Date().toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                )}

                {scanStatus === 'already_used' && scanResult.checked_in_at && (
                  <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg text-center">
                    <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="font-semibold text-orange-600">Billet déjà scanné</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Première utilisation : {new Date(scanResult.checked_in_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-2">
              <li>Activez le scanner et présentez le QR code du billet devant la caméra</li>
              <li>Alternativement, saisissez manuellement le code du billet</li>
              <li>Un billet validé (vert) autorise l'entrée</li>
              <li>Un billet déjà utilisé (orange) a déjà été scanné et ne peut plus être utilisé</li>
              <li>Un billet invalide (rouge) n'existe pas ou n'est pas confirmé</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
