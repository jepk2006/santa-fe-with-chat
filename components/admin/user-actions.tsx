'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteUser } from '@/lib/actions/user.actions';
import { useState } from 'react';

interface UserActionsProps {
  user: {
    id: string;
    name?: string;
    email?: string;
  };
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const displayName = user.name || user.email || "this user";

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${displayName}?`)) {
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log("Deleting user with ID:", user.id);
      
      const result = await deleteUser(user.id);
      
      if (result.success) {
        toast.success('User deleted successfully');
        router.refresh();
      } else {
        console.error("Delete failed:", result.message);
        toast.error(`Failed to delete user: ${result.message}`);
      }
    } catch (error) {
      console.error("Error in delete handler:", error);
      toast.error(`Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/users/${user.id}`} className="flex items-center">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-red-600 focus:text-red-500 cursor-pointer"
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 