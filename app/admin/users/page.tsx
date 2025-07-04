import { Metadata } from 'next';
import { getAllUsers } from '@/lib/actions/user.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { requireAdmin } from '@/lib/auth-guard';
import { Plus } from 'lucide-react';
import { UserActions } from '@/components/admin/user-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Users',
};

const AdminUserPage = async () => {
  await requireAdmin();

  const { data: users } = await getAllUsers();
  
  if (!users || users.length === 0) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold tracking-tight'>Users</h1>
          <Button asChild>
            <Link href="/admin/users/create">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Link>
          </Button>
        </div>
        <div className='text-center py-8'>
          <p className='text-muted-foreground'>No users found in the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>Users</h1>
        <Button asChild>
          <Link href="/admin/users/create">
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Link>
        </Button>
      </div>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>PHONE</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.id.substring(0, 8)}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone_number || 'N/A'}</TableCell>
                  <TableCell>
                    {user.role === 'ventas' ? (
                      <Badge variant='outline' className="bg-brand-blue text-brand-white border-brand-blue rounded-full px-3">Ventas</Badge>
                    ) : (
                      <Badge variant='destructive'>Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions user={user} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUserPage;
