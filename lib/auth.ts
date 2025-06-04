import { User } from './types';

// Role-based access control
export const rolePermissions = {
  admin: {
    canAccessUsers: true,
    canAccessProducts: true,
    canAccessOrders: true,
  },
  ventas: {
    canAccessUsers: false,
    canAccessProducts: false,
    canAccessOrders: true,
  },
} as const;

// Helper function to check if a user has permission
export function hasPermission(user: User | null, permission: keyof typeof rolePermissions.admin): boolean {
  if (!user) return false;
  
  // Safety check - if role doesn't exist in permissions, default to no access
  if (!user.role || !rolePermissions[user.role]) {
    console.warn(`Unknown role: ${user.role} - defaulting to no permissions`);
    return false;
  }
  
  // Safety check - if permission doesn't exist for role, default to no access
  if (rolePermissions[user.role][permission] === undefined) {
    console.warn(`Permission ${permission} not defined for role ${user.role}`);
    return false;
  }
  
  return rolePermissions[user.role][permission];
}

// Helper function to check if a user can access a route
export function canAccessRoute(user: User | null, path: string): boolean {
  if (!user) return false;
  
  // Safety check - if role is invalid, default to no access
  if (!user.role) {
    console.warn('User has no role defined - defaulting to no access');
    return false;
  }
  
  // Admin can access everything
  if (user.role === 'admin') return true;
  
  // Ventas can only access orders
  if (user.role === 'ventas') {
    return path.startsWith('/admin/pedidos');
  }
  
  return false;
} 