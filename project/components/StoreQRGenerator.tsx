'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Printer, Share2, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function StoreQRGenerator({ organizerSlug, organizerName }: { organizerSlug: string; organizerName: string }) {
  const [qrSize, setQrSize] = useState(256);
  const qrRef = useRef<HTMLDivElement>(null);

  const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/boutique/${organizerSlug}`;

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = qrSize + 80;
    canvas.height = qrSize + 120;

    img.onload = () => {
      if (!ctx) return;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(organizerName, canvas.width / 2, 35);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(40, 50, qrSize, qrSize);

      ctx.drawImage(img, 40, 50, qrSize, qrSize);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px Arial';
      ctx.fillText('Scannez pour accéder à la billetterie', canvas.width / 2, qrSize + 80);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_Code_${organizerSlug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${organizerName}</title>
          <style>
            @page { size: A4; margin: 0; }
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
              background: white;
            }
            h1 {
              color: #F59E0B;
              font-size: 48px;
              margin-bottom: 20px;
              text-align: center;
            }
            .qr-container {
              background: white;
              padding: 40px;
              border: 4px solid #F59E0B;
              border-radius: 20px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            p {
              color: #6B7280;
              font-size: 20px;
              margin-top: 20px;
              text-align: center;
            }
            .url {
              color: #9CA3AF;
              font-size: 14px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <h1>${organizerName}</h1>
          <div class="qr-container">
            ${qrRef.current?.innerHTML || ''}
          </div>
          <p>Scannez pour accéder à la billetterie en ligne</p>
          <p class="url">${storeUrl}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Billetterie ${organizerName}`,
          text: 'Découvrez notre billetterie en ligne',
          url: storeUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(storeUrl);
      alert('Lien copié dans le presse-papier !');
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-amber-400" />
          QR Code de votre boutique
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="w-4 h-4 text-gray-500 ml-2" />
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 border-gray-700 text-white max-w-xs">
                <p className="text-sm">Téléchargez ou imprimez ce QR code pour l'afficher sur vos flyers, affiches et supports de communication. Vos clients pourront scanner le code pour accéder directement à votre billetterie.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-8">
            <div ref={qrRef} className="flex justify-center mb-6">
              <div className="bg-white p-6 rounded-xl shadow-2xl">
                <QRCode
                  value={storeUrl}
                  size={qrSize}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-white font-semibold mb-2">{organizerName}</p>
              <p className="text-sm text-gray-400 break-all">{storeUrl}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={downloadQR}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>

            <Button
              onClick={printQR}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>

            <Button
              onClick={shareQR}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>

          <Card className="bg-black border-gray-700">
            <CardContent className="p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Conseils d'utilisation
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Imprimez le QR code en haute qualité sur vos flyers et affiches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Assurez-vous que le code soit d'au moins 3x3 cm pour une lecture optimale</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Ajoutez un appel à l'action : "Scannez pour réserver vos billets"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Partagez-le sur vos réseaux sociaux pour faciliter l'accès</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
