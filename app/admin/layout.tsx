import { AdminNav } from '@/components/admin/admin-nav';
import { checkAdminStatus } from '@/lib/actions/auth.actions';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This server action can properly set and get cookies
  const user = await checkAdminStatus();

  return (
    <div className='flex flex-col'>
      <AdminNav user={user} />
      <div className='flex-1 space-y-4 p-8 pt-6 container mx-auto'>
        {children}
      </div>
    </div>
  );
}
