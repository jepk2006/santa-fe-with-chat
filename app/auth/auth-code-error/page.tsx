import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            Error de Verificación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Lo sentimos, hubo un problema al verificar tu cuenta. Es posible que el enlace haya expirado o ya haya sido utilizado.
          </p>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/register">
                Registrarse de Nuevo
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">
                Iniciar Sesión
              </Link>
            </Button>
            
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">
                Regresar al Inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 