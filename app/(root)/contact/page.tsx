import { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PickupLocationsMap from '@/components/ui/pickup-locations-map';

export const metadata: Metadata = {
  title: 'Contáctanos | Santa Fe',
  description: 'Ponte en contacto con nosotros para cualquier consulta o sugerencia',
};

const LOCATIONS = [
  {
    id: 'fabrica',
    name: 'Fábrica',
    address: 'Km 17 Doble vía la Guardia',
    phones: {
      landline: ['3-3522780', '3-3522769'],
      mobile: ['77333052', '77393042']
    },
    hours: {
      monday: '3:00 AM - 3:00 PM',
      tuesday: '6:00 AM - 3:00 PM',
      wednesday: '6:00 AM - 3:00 PM',
      thursday: '6:00 AM - 3:00 PM',
      friday: '6:00 AM - 3:00 PM',
      saturday: '6:00 AM - 2:00 PM',
      sunday: 'Cerrado'
    },
    coordinates: { lat: -17.89044843743826, lng: -63.30959124662632 }
  },
  {
    id: 'agencia4',
    name: 'Carnes Express - Santa Fe',
    address: 'Avenida Banzer C/ Ochoo N° 2010',
    phones: {
      mobile: ['75333307']
    },
    hours: {
      weekdays: '9:00 AM - 6:00 PM',
      saturday: '8:30 AM - 4:00 PM',
      sunday: 'Cerrado'
    },
    coordinates: { lat: -17.762658722069858, lng: -63.17766170185259 }
  },
  {
    id: 'agencia3',
    name: 'Agencia #3',
    address: '4to anillo Doble Vía la Guardia',
    phones: {
      landline: ['3-3532388'],
      mobile: ['78129634']
    },
    hours: {
      weekdays: '8:30 AM - 5:30 PM',
      saturday: '8:30 AM - 4:00 PM',
      sunday: 'Cerrado'
    },
    coordinates: { lat: -17.80755368139653, lng: -63.21032306211199 }
  },
  {
    id: 'agencia6',
    name: 'Agencia #6',
    address: 'Av. Pilcomayo #242',
    phones: {
      landline: ['3-3557884'],
      mobile: ['77333106']
    },
    hours: {
      weekdays: '9:00 AM - 6:00 PM',
      saturday: '9:00 AM - 1:00 PM',
      sunday: 'Cerrado'
    },
    coordinates: { lat: -17.802254782800325, lng: -63.18459865767217 }
  }
];

export default function ContactPage() {
  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contáctanos</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Envíanos tus preguntas, comentarios o sugerencias y te responderemos lo antes posible.
          </p>
        </div>

        {/* Locations Map */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Nuestras Ubicaciones</h2>
          <PickupLocationsMap className="mb-8" />
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LOCATIONS.map((location) => (
              <div key={location.id} className="bg-white p-6 rounded-xl border">
                <h3 className="font-semibold text-lg mb-3">{location.name}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{location.address}</span>
                  </div>
                  {location.phones.landline && location.phones.landline.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <div>
                        {location.phones.landline.map((phone, index) => (
                          <a 
                            key={phone} 
                            href={`tel:+591${phone.replace(/\D/g, '')}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {phone}{index < location.phones.landline.length - 1 ? ' / ' : ''}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {location.phones.mobile && location.phones.mobile.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <div>
                        {location.phones.mobile.map((phone, index) => (
                          <a 
                            key={phone} 
                            href={`tel:+591${phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {phone}{index < location.phones.mobile.length - 1 ? ' / ' : ''}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-gray-600">
                    <Clock className="h-4 w-4 flex-shrink-0 mt-1" />
                    <div className="space-y-1">
                      {location.id === 'fabrica' ? (
                        <>
                          <div><span className="font-medium">Lunes:</span> {location.hours.monday}</div>
                          <div><span className="font-medium">Martes:</span> {location.hours.tuesday}</div>
                          <div><span className="font-medium">Miércoles:</span> {location.hours.wednesday}</div>
                          <div><span className="font-medium">Jueves:</span> {location.hours.thursday}</div>
                          <div><span className="font-medium">Viernes:</span> {location.hours.friday}</div>
                          <div><span className="font-medium">Sábado:</span> {location.hours.saturday}</div>
                          <div><span className="font-medium">Domingo:</span> {location.hours.sunday}</div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="font-medium">Lun - Vie:</span> {location.hours.weekdays}
                          </div>
                          <div>
                            <span className="font-medium">Sáb:</span> {location.hours.saturday}
                          </div>
                          <div>
                            <span className="font-medium">Dom:</span> {location.hours.sunday}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <a 
                    href={`https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs underline block mt-2"
                  >
                    Ver en Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Información General</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-blue/10 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-brand-blue" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <a href="mailto:contacto@santafe.com" className="text-gray-600 hover:text-gray-900">
                      contacto@santafe.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-brand-blue/10 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-brand-blue" />
                  </div>
                  <div>
                    <p className="font-medium">Horario de Atención</p>
                    <p className="text-gray-600">Lun - Vie: 9:00 - 18:00</p>
                    <p className="text-gray-600">Sáb: 9:00 - 13:00</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Atención al Cliente</h3>
              <p className="text-gray-600 text-sm">
                Nuestro equipo de atención al cliente está disponible para ayudarte
                con cualquier consulta sobre productos, pedidos o servicios.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-xl border">
            <h2 className="text-2xl font-semibold mb-6">Envíanos un Mensaje</h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nombre
                  </label>
                  <Input
                    id="name"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Asunto
                </label>
                <Input
                  id="subject"
                  placeholder="¿Sobre qué nos quieres contactar?"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Mensaje
                </label>
                <Textarea
                  id="message"
                  placeholder="Escribe tu mensaje aquí..."
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Enviar Mensaje
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 