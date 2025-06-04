import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Pedidos',
};

export default function PedidosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 