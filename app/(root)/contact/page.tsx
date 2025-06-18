import { Metadata } from 'next';
import { Mail, Phone, PhoneCall, MapPin, Clock } from 'lucide-react';
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
      weekdays: '06:00 - 15:00',
      saturday: '06:00 - 14:00',
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
      weekdays: '09:00 - 18:00',
      saturday: '08:30 - 16:00',
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
      weekdays: '08:30 - 17:30',
      saturday: '08:30 - 16:00',
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
      weekdays: '06:00 - 18:00',
      saturday: '06:00 - 17:00',
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
            Estamos aquí para ayudarte. Encuentra la ubicación más cercana a ti.
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
                      <PhoneCall className="h-4 w-4 flex-shrink-0" />
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
                      <div>
                        <span className="font-medium">Lun - Vie:</span> {location.hours.weekdays}
                      </div>
                      <div>
                        <span className="font-medium">Sáb:</span> {location.hours.saturday}
                      </div>
                      <div>
                        <span className="font-medium">Dom:</span> {location.hours.sunday}
                      </div>
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
      </div>
    </div>
  );
} 