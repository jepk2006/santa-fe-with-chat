import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Sobre Nosotros | Santa Fe',
  description: 'Conoce más sobre Santa Fe, tu tienda de confianza en Bolivia',
};

export default function AboutPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Sobre Santa Fe</h1>
          <p className="text-xl text-gray-600">
            Tu tienda de confianza en Bolivia desde 2023
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border">
          <h2 className="text-2xl font-semibold mb-4">Nuestra Misión</h2>
          <p className="text-gray-600 leading-relaxed">
            En Santa Fe, nos dedicamos a proporcionar productos de la más alta calidad a precios accesibles. 
            Nuestra misión es ser el puente entre los mejores productores locales y nuestros valiosos clientes, 
            garantizando siempre la mejor experiencia de compra.
          </p>
        </div>

        {/* Values Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="text-xl font-semibold mb-3">Calidad</h3>
            <p className="text-gray-600">
              Seleccionamos cuidadosamente cada producto para garantizar la mejor calidad para nuestros clientes.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="text-xl font-semibold mb-3">Confianza</h3>
            <p className="text-gray-600">
              Construimos relaciones duraderas basadas en la honestidad y el servicio excepcional.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <h3 className="text-xl font-semibold mb-3">Compromiso</h3>
            <p className="text-gray-600">
              Nos comprometemos a mejorar constantemente para satisfacer las necesidades de nuestros clientes.
            </p>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border">
          <h2 className="text-2xl font-semibold mb-4">Nuestra Historia</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Santa Fe nació con la visión de revolucionar la forma en que las personas compran en Bolivia. 
            Desde nuestros inicios, nos hemos enfocado en combinar la tradición del comercio local con la 
            innovación tecnológica, creando una experiencia de compra única.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Hoy en día, seguimos creciendo y evolucionando, siempre manteniendo nuestro compromiso con la 
            calidad y el servicio al cliente que nos ha caracterizado desde el primer día.
          </p>
        </div>

        {/* Contact Section */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">¿Tienes alguna pregunta?</h2>
          <p className="text-gray-600">
            Estamos aquí para ayudarte. Contáctanos a través de nuestros canales de atención al cliente.
          </p>
        </div>
      </div>
    </div>
  );
} 