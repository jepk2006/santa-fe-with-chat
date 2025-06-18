import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { createClient } from '@/lib/supabase-server';
import { Button } from '@/components/ui/button';
import LogoutButton from '@/components/auth/logout-button';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = async () => {
  const currentYear = new Date().getFullYear();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.role === 'admin';
    }

    return (
      <footer className='border-t bg-gray-50'>
        <div className='container py-12 md:py-16'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Contact Info */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-lg'>Contacto</h3>
              <ul className='space-y-3 text-sm text-gray-600'>
                <li className='flex items-center gap-2'>
                  <Phone className='h-4 w-4' />
                  <span>+591 XXX XXX XXX</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  <a href="mailto:contacto@santafe.com" className='hover:text-gray-900'>
                    contacto@santafe.com
                  </a>
                </li>
                <li className='flex items-center gap-2'>
                  <MapPin className='h-4 w-4' />
                  <span>La Paz, Bolivia</span>
                </li>
              </ul>
            </div>

            {/* Contact Button */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-lg'>¿Necesitas Ayuda?</h3>
              <div className='space-y-3'>
                <Button asChild className='w-full'>
                  <Link href="/contact">Contáctanos</Link>
                </Button>
                <p className='text-xs text-gray-500 text-center'>
                  Estamos aquí para ayudarte
                </p>
              </div>
            </div>
          </div>

          <div className='mt-12 pt-8 border-t border-gray-200'>
            <div className='text-center text-sm text-gray-600'>
              <p>© {currentYear} Santa Fe. Todos los derechos reservados.</p>
              {isAdmin && (
                <p className='mt-2'>
                  <Link
                    href='/admin'
                    className='text-primary hover:underline'
                  >
                    Admin Dashboard
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>
    );
  } catch (error) {
    // Fallback footer without user-specific content
    return (
      <footer className='border-t bg-gray-50'>
        <div className='container py-12 md:py-16'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Contact Info */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-lg'>Contacto</h3>
              <ul className='space-y-3 text-sm text-gray-600'>
                <li className='flex items-center gap-2'>
                  <Phone className='h-4 w-4' />
                  <span>+591 XXX XXX XXX</span>
                </li>
                <li className='flex items-center gap-2'>
                  <Mail className='h-4 w-4' />
                  <a href="mailto:contacto@santafe.com" className='hover:text-gray-900'>
                    contacto@santafe.com
                  </a>
                </li>
                <li className='flex items-center gap-2'>
                  <MapPin className='h-4 w-4' />
                  <span>La Paz, Bolivia</span>
                </li>
              </ul>
            </div>

            {/* Contact Button */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-lg'>¿Necesitas Ayuda?</h3>
              <div className='space-y-3'>
                <Button asChild className='w-full'>
                  <Link href="/contact">Contáctanos</Link>
                </Button>
                <p className='text-xs text-gray-500 text-center'>
                  Estamos aquí para ayudarte
                </p>
              </div>
            </div>
          </div>

          <div className='mt-12 pt-8 border-t border-gray-200'>
            <div className='text-center text-sm text-gray-600'>
              <p>© {currentYear} Santa Fe. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    );
  }
};

export default Footer; 