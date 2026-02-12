'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Camera, CheckCircle, XCircle, AlertCircle, User, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ScanResult {
  success: boolean;
  message: string;
  ticket?: any;
}

export default function TicketScannerFullscreen({ onClose }: { onClose: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Impossible d\'accéder à la caméra. Utilisez la saisie manuelle.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const validateTicket = async (ticketCode: string) => {
    try {
      setScanning(false);
      stopCamera();

      const { data: ticket, error } = await supabase
        .from('ticket_purchases')
        .select(`
          *,
          event:public_events(title, event_date, venue_name)
        `)
        .or(`ticket_number.eq.${ticketCode},qr_code_data.eq.${ticketCode}`)
        .single();

      if (error || !ticket) {
        setResult({
          success: false,
          message: 'Billet introuvable ou invalide'
        });
        playErrorSound();
        vibrate([200, 100, 200]);
        return;
      }

      if (ticket.ticket_status === 'used') {
        setResult({
          success: false,
          message: `Billet déjà scanné le ${new Date(ticket.used_at).toLocaleString('fr-FR')}`,
          ticket
        });
        playErrorSound();
        vibrate([200, 100, 200]);
        return;
      }

      if (ticket.ticket_status === 'cancelled') {
        setResult({
          success: false,
          message: 'Billet annulé',
          ticket
        });
        playErrorSound();
        vibrate([200, 100, 200]);
        return;
      }

      await supabase
        .from('ticket_purchases')
        .update({
          ticket_status: 'used',
          used_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      setResult({
        success: true,
        message: 'Billet validé avec succès',
        ticket
      });
      playSuccessSound();
      vibrate([100, 50, 100]);

      setTimeout(() => {
        setResult(null);
        startCamera();
      }, 3000);

    } catch (error) {
      console.error('Error validating ticket:', error);
      setResult({
        success: false,
        message: 'Erreur lors de la validation'
      });
      playErrorSound();
    }
  };

  const handleManualScan = () => {
    if (manualCode.trim()) {
      validateTicket(manualCode.trim());
      setManualCode('');
    }
  };

  const playSuccessSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDRBWrOjvr2EXCECa2vPFdidFKX/M8dqKOQcZZrnr66VSEQ1Aq+PwtmMcBjiR1/LMeSwFJHfH8N2RQAoVXrPq66pXFApGn+DyvmwhBTGH0fPTgjMGHm7A7eSbTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDRBWrOjvr2EXCECa2vPFdidFKX/M8dqKOQcZZrnr66VSEQ1Aq+PwtmMcBjiR1/LMeSwFJHfH8N2RQAoVXrPq66pXFApGn+DyvmwhBTGH0fPTgjMGHm7A7eSbTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDRBWrOjvr2EXCECa2vPFdidFKX/M8dqKOQcZZrnr66VSEQ1Aq+PwtmMcBjiR1/LMeSwFJHfH8N2RQAoVXrPq66pXFApGn+DyvmwhBTGH0fPTgjMGHm7A7eSbTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDRBWrOjvr2EXCECa2vPFdidFKX/M8dqKOQcZZrnr66VSEQ1Aq+PwtmMcBjiR1/LMeSwFJHfH8N2RQAoVXrPq66pXFApGn+DyvmwhBTGH0fPTgjMGHm7A7eSbTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDQ==');
    audio.play().catch(() => {});
  };

  const playErrorSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDRBWrOjvr2EXCECa2vPFdidFKX/M8dqKOQcZZrnr66VSEQ1Aq+PwtmMcBjiR1/LMeSwFJHfH8N2RQAoVXrPq66pXFApGn+DyvmwhBTGH0fPTgjMGHm7A7eSbTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDRBWrOjvr2EXCECa2vPFdidFKX/M8dqKOQcZZrnr66VSEQ1Aq+PwtmMcBjiR1/LMeSwFJHfH8N2RQAoVXrPq66pXFApGn+DyvmwhBTGH0fPTgjMGHm7A7eSbTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDRBWrOjvr2EXCECa2vPFdidFKX/M8dqKOQcZZrnr66VSEQ1Aq+PwtmMcBjiR1/LMeSwFJHfH8N2RQAoVXrPq66pXFApGn+DyvmwhBTGH0fPTgjMGHm7A7eSbTA0PVqzn77BdGAg+ltryxnYpBSl+zPLaizsIGGS56+mhUBAKTKXh8bllHAU2j9bzzn0vBSh6yfDglUcLEmS16OyrWBULSKHf8L1pIAUuhM/z1YU1Bxxyw+7mnlARDlOs5O+zYBoGPJLZ88p5LQUne8rx3JI+CRZiturqpVISCkqk4fG8aCAFMojP89GBMwYeasDv45xKDQ==');
    audio.play().catch(() => {});
  };

  const vibrate = (pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Contrôle d'accès</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {!result ? (
          <div className="flex-1 relative">
            {scanning && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-amber-500 rounded-2xl shadow-2xl">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-2xl" />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
              <Card className="bg-gray-900/95 border-gray-800 backdrop-blur-sm">
                <CardContent className="p-6">
                  <p className="text-center text-white font-semibold mb-4">
                    <Camera className="w-5 h-5 inline mr-2" />
                    Scannez le QR code du billet
                  </p>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                        placeholder="Ou saisir le code manuellement"
                        className="flex-1 px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
                      />
                      <Button
                        onClick={handleManualScan}
                        className="bg-gradient-to-r from-amber-400 to-amber-600 text-black px-6"
                      >
                        Valider
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex items-center justify-center p-6 ${
            result.success
              ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 animate-pulse'
              : 'bg-gradient-to-br from-red-500/20 to-red-600/10 animate-pulse'
          }`}>
            <Card className={`w-full max-w-md ${
              result.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <CardContent className="p-8 text-center">
                {result.success ? (
                  <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6 animate-in zoom-in duration-500" />
                ) : (
                  <XCircle className="w-24 h-24 text-red-400 mx-auto mb-6 animate-in zoom-in duration-500" />
                )}

                <h3 className={`text-3xl font-bold mb-4 ${
                  result.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {result.success ? 'BILLET VALIDE' : 'BILLET INVALIDE'}
                </h3>

                <p className="text-xl text-white mb-6">{result.message}</p>

                {result.ticket && (
                  <div className="bg-black/50 rounded-lg p-6 space-y-3 text-left">
                    <div className="flex items-center gap-3 text-white">
                      <User className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-xs text-gray-400">Titulaire</p>
                        <p className="font-semibold">
                          {result.ticket.customer_first_name} {result.ticket.customer_last_name}
                        </p>
                      </div>
                    </div>

                    {result.ticket.event && (
                      <>
                        <div className="flex items-center gap-3 text-white">
                          <Calendar className="w-5 h-5 text-amber-400" />
                          <div>
                            <p className="text-xs text-gray-400">Événement</p>
                            <p className="font-semibold">{result.ticket.event.title}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-white">
                          <MapPin className="w-5 h-5 text-amber-400" />
                          <div>
                            <p className="text-xs text-gray-400">Lieu</p>
                            <p className="font-semibold">{result.ticket.event.venue_name}</p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-400">Catégorie</p>
                      <p className="text-amber-400 font-bold">{result.ticket.ticket_tier_name}</p>
                    </div>
                  </div>
                )}

                {!result.success && (
                  <Button
                    onClick={() => {
                      setResult(null);
                      startCamera();
                    }}
                    className="mt-6 bg-gradient-to-r from-amber-400 to-amber-600 text-black"
                  >
                    Scanner un autre billet
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
