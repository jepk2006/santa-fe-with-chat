'use client';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';

export default function OrdersTable({ orders }: { orders: any[] }) {
  const router = useRouter();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fecha</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map(order => (
          <TableRow
            key={order.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => router.push(`/account/order/${order.id}`)}
          >
            <TableCell>{formatId(order.id)}</TableCell>
            <TableCell>{formatCurrency(order.total_price)}</TableCell>
            <TableCell><Badge variant="secondary" className="capitalize">{order.status}</Badge></TableCell>
            <TableCell>{formatDateTime(new Date(order.created_at)).dateOnly}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 