// Next.js 15 page component (server component)
import { OrderDetailsClient } from './order-details-client';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function OrderDetailsPage({ params, searchParams }: PageProps) {
  // In Next.js 15, params and searchParams are Promises, so we need to await them
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  return <OrderDetailsClient params={resolvedParams} searchParams={resolvedSearchParams} />;
}