export type Role = 'admin' | 'ventas';

export type User = {
  id: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}; 