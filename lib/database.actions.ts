'use server';

export async function handleSupabaseError(error: any) {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'An error occurred while accessing the database');
}

export async function convertToSnakeCase(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
      value
    ])
  );
}

export async function convertToCamelCase(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
      value
    ])
  );
}

export async function handlePagination(page: number = 1, pageSize: number = 10) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  return { start, end };
} 