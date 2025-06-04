import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import PageTransitionProvider from '@/components/providers/page-transition-provider';
import { createClient } from '@/lib/supabase-server';
import { handleCookieOperation } from '@/lib/actions/auth.actions';

export const dynamic = 'force-dynamic';

// Function to safely handle Supabase auth in server components
async function getSupabaseSession() {
  try {
    // const supabase = createClient(); // This line seems redundant
    
    // Create a client with the cookie handler
    const client = await createClient();
    
    // Attempt to get the session
    const { data: { session }, error } = await client.auth.getSession();

    return { data: { session }, error };
  } catch (error) {
    console.error('Auth error in layout:', error);
    // Return null session on error
    return { data: { session: null }, error };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the session but handle errors gracefully
  await getSupabaseSession();

  return (
    <div className='flex h-screen flex-col'>
      <Header />
      <main className='flex-1 wrapper'>
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
      </main>
      <Footer />
    </div>
  );
}
