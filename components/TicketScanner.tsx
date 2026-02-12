'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle,
  XCircle,
  Scan,
  AlertTriangle,
  User,
  Ticket,
  Calendar
} from 'lucide-react';

type ScannedTicket = {
  id: string;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  ticket_category: string;
  price: number;
  is_scanned: boolean;
  scanned_at: string | null;
  event: {
    title: string;
    event_date: string;
    venue_name: string;
  };
};

export default function TicketScanner() {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScanned, setLastScanned] = useState<ScannedTicket | null>(null);
  const [scanStatus, setScanStatus] = useState<'success' | 'error' | 'warning' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setScanning(true);
      toast.success('Caméra activée');
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

  async function validateTicket(qrData: string) {
    try {
      // Parse QR data (format: event_id|ticket_number|hash)
      const parts = qrData.split('|');
      if (parts.length !== 3) {
        setScanStatus('error');
        setErrorMessage('QR Code invalide');
        toast.error('QR Code invalide');
        return;
      }

      const [eventId, ticketNumber] = parts;

      // Fetch ticket from database
      const { data: ticket, error } = await supabase
        .from('event_tickets')
        .select(`
          *,
          event:public_events(title, event_date, venue_name)
        `)
        .eq('qr_code_data', qrData)
        .maybeSingle();

      if (error) throw error;

      if (!ticket) {
        setScanStatus('error');
        setErrorMessage('Ticket introuvable');
        toast.error('Ticket introuvable');
        return;
      }

      // Check if already scanned
      if (ticket.is_scanned) {
        setScanStatus('warning');
        setErrorMessage(`Ticket déjà scanné le ${new Date(ticket.scanned_at).toLocaleString('fr-FR')}`);
        setLastScanned(ticket);
        toast.warning('Attention: Ticket déjà utilisé!');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Mark ticket as scanned
      const { error: updateError } = await supabase
        .from('event_tickets')
        .update({
          is_scanned: true,
          scanned_at: new Date().toISOString(),
          scanned_by: user?.id
        })
        .eq('id', ticket.id);

      if (updateError) throw updateError;

      // Success
      setScanStatus('success');
      setLastScanned({ ...ticket, is_scanned: true, scanned_at: new Date().toISOString() });
      toast.success('Ticket validé avec succès!');

    } catch (error) {
      console.error('Error validating ticket:', error);
      setScanStatus('error');
      setErrorMessage('Erreur lors de la validation');
      toast.error('Erreur lors de la validation');
    }
  }

  async function handleManualEntry() {
    if (!manualCode.trim()) {
      toast.error('Veuillez entrer un code');
      return;
    }
    await validateTicket(manualCode.trim());
    setManualCode('');
  }

  return (
    <div className="space-y-6">
      {/* Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scanner de Billets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Controls */}
          <div className="flex gap-2">
            {!scanning ? (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Activer la Caméra
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="destructive" className="flex-1">
                <XCircle className="w-4 h-4 mr-2" />
                Arrêter la Caméra
              </Button>
            )}
          </div>

          {/* Video Feed */}
          {scanning && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-amber-500 rounded-lg"></div>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Ou saisir le code manuellement :</p>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="TK-XXXXXXXXXX"
                onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
              />
              <Button onClick={handleManualEntry}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      {lastScanned && scanStatus && (
        <Card className={`
          ${scanStatus === 'success' ? 'bg-green-500/10 border-green-500/30' : ''}
          ${scanStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : ''}
          ${scanStatus === 'error' ? 'bg-red-500/10 border-red-500/30' : ''}
        `}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scanStatus === 'success' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-500">Ticket Validé</span>
                </>
              )}
              {scanStatus === 'warning' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-500">Attention</span>
                </>
              )}
              {scanStatus === 'error' && (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-500">Erreur</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanStatus === 'error' ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : (
              <>
                {scanStatus === 'warning' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                    <p className="text-amber-500 font-semibold">{errorMessage}</p>
                  </div>
                )}

                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{lastScanned.ticket_number}</span>
                    <Badge variant="outline" className="ml-auto">
                      {lastScanned.ticket_category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{lastScanned.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{lastScanned.customer_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{lastScanned.event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(lastScanned.event.event_date).toLocaleDateString('fr-FR')} - {lastScanned.event.venue_name}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-2xl font-bold text-primary">{lastScanned.price.toFixed(2)} €</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
