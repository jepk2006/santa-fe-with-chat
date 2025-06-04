import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';
import HashRedirector from '@/components/auth/hash-redirector';
import AuthProvider from '@/components/providers/session-provider';

// Body font - Inter
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Heading font - Outfit
const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: {
    template: `%s | Santa Fe`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${outfit.variable} ${inter.variable}`}>
      <body className={`${inter.className} antialiased min-h-screen`}>
        <AuthProvider>
          <ThemeProvider>
            <div className="animate-fade-in">
              <HashRedirector />
              {children}
              <Toaster position="bottom-right" />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
