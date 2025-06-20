export const LOCATIONS = [
  {
    id: 'fabrica',
    name: 'Fábrica',
    address: 'Km 17 Doble vía la Guardia',
    coordinates: { lat: -17.89044843743826, lng: -63.30959124662632 }
  },
  {
    id: 'agencia4',
    name: 'Carnes Express - Santa Fe',
    address: 'Avenida Banzer C/ Ochoo N° 2010',
    coordinates: { lat: -17.762658722069858, lng: -63.17766170185259 }
  },
  {
    id: 'agencia3',
    name: 'Agencia #3',
    address: '4to anillo Doble Vía la Guardia',
    coordinates: { lat: -17.80755368139653, lng: -63.21032306211199 }
  },
  {
    id: 'agencia6',
    name: 'Agencia #6',
    address: 'Av. Pilcomayo #242',
    coordinates: { lat: -17.802254782800325, lng: -63.18459865767217 }
  }
] as const;

export type LocationId = typeof LOCATIONS[number]['id']; 