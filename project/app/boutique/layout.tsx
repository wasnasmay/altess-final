import { Toaster } from '@/components/ui/sonner';

export default function BoutiqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
