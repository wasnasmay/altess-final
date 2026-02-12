'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ScanLine, CheckCircle2, XCircle, AlertCircle, User, Calendar, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProTicketScannerProps {
  isOpen: boolean;
  onClose: () => void;
  organizerId: string;
}

interface ScanResult {
  success: boolean;
  ticket?: any;
  message: string;
}

export default function ProTicketScanner({ isOpen, onClose, organizerId }: ProTicketScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const playSuccessSound = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  };

  const playErrorSound = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;

    const beep1 = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 400;
      osc.type = 'square';

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    };

    const beep2 = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 400;
      osc.type = 'square';

      gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.start(ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.25);
    };

    beep1();
    beep2();
  };

  const scanTicket = async (ticketCode: string) => {
    if (scanning) return;

    setScanning(true);
    try {
      const { data: ticket, error } = await supabase
        .from('ticket_purchases')
        .select('*, public_events(title, event_date)')
        .eq('ticket_number', ticketCode)
        .eq('organizer_id', organizerId)
        .single();

      if (error || !ticket) {
        const result: ScanResult = {
          success: false,
          message: 'Billet introuvable ou invalide'
        };
        setLastScan(result);
        setScanHistory(prev => [result, ...prev].slice(0, 10));
        setStats(prev => ({ ...prev, total: prev.total + 1, invalid: prev.invalid + 1 }));
        playErrorSound();
        return;
      }

      if (ticket.ticket_status === 'used') {
        const result: ScanResult = {
          success: false,
          ticket,
          message: 'Billet déjà scanné'
        };
        setLastScan(result);
        setScanHistory(prev => [result, ...prev].slice(0, 10));
        setStats(prev => ({ ...prev, total: prev.total + 1, invalid: prev.invalid + 1 }));
        playErrorSound();
        return;
      }

      if (ticket.ticket_status === 'cancelled') {
        const result: ScanResult = {
          success: false,
          ticket,
          message: 'Billet annulé'
        };
        setLastScan(result);
        setScanHistory(prev => [result, ...prev].slice(0, 10));
        setStats(prev => ({ ...prev, total: prev.total + 1, invalid: prev.invalid + 1 }));
        playErrorSound();
        return;
      }

      await supabase
        .from('ticket_purchases')
        .update({
          ticket_status: 'used',
          scanned_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      const result: ScanResult = {
        success: true,
        ticket,
        message: 'Billet valide - Accès autorisé'
      };
      setLastScan(result);
      setScanHistory(prev => [result, ...prev].slice(0, 10));
      setStats(prev => ({ ...prev, total: prev.total + 1, valid: prev.valid + 1 }));
      playSuccessSound();

    } catch (error) {
      console.error('Scan error:', error);
      const result: ScanResult = {
        success: false,
        message: 'Erreur lors du scan'
      };
      setLastScan(result);
      playErrorSound();
    } finally {
      setScanning(false);
    }
  };

  const handleManualInput = () => {
    const code = prompt('Entrez le numéro du billet :');
    if (code) {
      scanTicket(code.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 bg-black">
        <div className="relative w-full h-full flex flex-col">
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Scanner Pro</h2>
                <p className="text-sm text-slate-300">Scannez le QR code du billet</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-slate-900/80 backdrop-blur rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Total scans</div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="bg-green-900/80 backdrop-blur rounded-lg p-3">
                <div className="text-xs text-green-400 mb-1">Valides</div>
                <div className="text-2xl font-bold text-green-400">{stats.valid}</div>
              </div>
              <div className="bg-red-900/80 backdrop-blur rounded-lg p-3">
                <div className="text-xs text-red-400 mb-1">Refusés</div>
                <div className="text-2xl font-bold text-red-400">{stats.invalid}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 border-4 border-amber-500 rounded-2xl shadow-2xl">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-amber-500 rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-amber-500 rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-amber-500 rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-amber-500 rounded-br-2xl" />
                </div>
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="w-16 h-16 text-amber-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {lastScan && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                <div
                  className={`rounded-lg p-4 ${
                    lastScan.success
                      ? 'bg-green-600/20 border-2 border-green-500'
                      : 'bg-red-600/20 border-2 border-red-500'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {lastScan.success ? (
                      <CheckCircle2 className="w-12 h-12 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-12 h-12 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3
                        className={`text-lg font-bold mb-2 ${
                          lastScan.success ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {lastScan.message}
                      </h3>
                      {lastScan.ticket && (
                        <div className="space-y-1 text-white">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm">
                              {lastScan.ticket.customer_first_name} {lastScan.ticket.customer_last_name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Ticket className="w-4 h-4 text-slate-400" />
                            <span className="text-sm">{lastScan.ticket.ticket_type}</span>
                          </div>
                          {lastScan.ticket.public_events && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm">{lastScan.ticket.public_events.title}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-4 space-y-3">
            <Button
              onClick={handleManualInput}
              variant="outline"
              className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
            >
              Saisie manuelle du numéro
            </Button>

            {scanHistory.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2">
                {scanHistory.map((scan, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs bg-slate-800/50 rounded p-2"
                  >
                    <span className="text-slate-300 truncate flex-1">
                      {scan.ticket?.ticket_number || 'Inconnu'}
                    </span>
                    <Badge
                      variant={scan.success ? 'default' : 'destructive'}
                      className={scan.success ? 'bg-green-600' : ''}
                    >
                      {scan.success ? 'OK' : 'KO'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
