import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import CreateUserForm from './create-user-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create User',
};

export default async function CreateUserPage() {
  await requireAdmin();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-medium">Create New User</h3>
        <p className="text-sm text-muted-foreground">
          Add a new user to the system
        </p>
      </div>
      <CreateUserForm />
    </div>
  );
} 