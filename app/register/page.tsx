import { Metadata } from 'next';
import RegisterForm from '@/components/auth/register-form';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Crear Cuenta',
};

export default function RegisterPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-start -mt-32 -ml-8">
          <Link href="/">
            <Image src="/images/logo.png" alt="Logo" width={300} height={120} className="object-contain" />
          </Link>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Crear Cuenta</h1>
            <p className="text-sm text-muted-foreground">Ingresa tus datos para registrarte</p>
          </div>
          <RegisterForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 