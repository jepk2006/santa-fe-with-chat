'use client';

import { Search } from 'lucide-react';

export function AdminSearch() {
  return (
    <form action="/admin/search" method="GET" className="hidden md:flex items-center bg-neutral-100 rounded-full px-3 py-1 w-56 focus-within:bg-neutral-200 transition">
      <Search className="h-4 w-4 text-neutral-500 mr-2" />
      <input
        type="text"
        name="q"
        placeholder="Buscar"
        className="bg-transparent outline-none border-none text-sm w-full placeholder:text-neutral-500"
        autoComplete="off"
      />
    </form>
  );
}
