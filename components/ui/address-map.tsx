'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, Libraries } from '@react-google-maps/api';
import { Input } from './input';
import { Label } from './label';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -17.7833,
  lng: -63.1833, // Santa Cruz, Bolivia
};

const libraries: Libraries = ['places'];

export interface AddressObject {
  coordinates: { lat: number; lng: number; };
  street: string;
  houseNumber: string;
  details: string;
  fullAddress: string;
}

interface AddressMapProps {
  onAddressSelect: (address: AddressObject | null) => void;
  initialAddress?: AddressObject | string;
}

export function AddressMap({ onAddressSelect, initialAddress }: AddressMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLng | null>(null);
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [details, setDetails] = useState('');

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const lastSentAddress = useRef<string | null>(null);

  const getAddressComponent = (place: google.maps.places.PlaceResult | google.maps.GeocoderResult, type: string) => {
    return place.address_components?.find(c => c.types.includes(type))?.long_name || '';
  };
  
  useEffect(() => {
    if (!markerPosition) return;
    
    const addressObject: AddressObject = {
      coordinates: markerPosition.toJSON(),
      street,
      houseNumber,
      details,
      fullAddress: `${street}, ${houseNumber}`,
    };
    
    const addressString = JSON.stringify(addressObject);
    if (lastSentAddress.current !== addressString) {
      onAddressSelect(addressObject);
      lastSentAddress.current = addressString;
    }
  }, [markerPosition, street, houseNumber, details, onAddressSelect]);
  
  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const location = place.geometry.location;
      setMarkerPosition(location);
      const streetName = getAddressComponent(place, 'route');
      setStreet(streetName);
      setHouseNumber(getAddressComponent(place, 'street_number'));
    }
  }, []);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const location = e.latLng;
      setMarkerPosition(location);
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const place = results[0];
          setStreet(getAddressComponent(place, 'route'));
          setHouseNumber(getAddressComponent(place, 'street_number'));
        }
      });
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return; // Don't run until the API is loaded

    const initAddress = typeof initialAddress === 'object' ? initialAddress : null;
    const initAddressString = initAddress ? JSON.stringify(initAddress) : null;
    
    // Only update from parent if the address is truly different
    if (initAddress && initAddressString !== lastSentAddress.current) {
      setMarkerPosition(new google.maps.LatLng(initAddress.coordinates.lat, initAddress.coordinates.lng));
      setStreet(initAddress.street);
      setHouseNumber(initAddress.houseNumber);
      setDetails(initAddress.details);
    } else if (!initialAddress) {
        navigator.geolocation.getCurrentPosition(
            (pos) => setMarkerPosition(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude)),
            () => setMarkerPosition(new google.maps.LatLng(defaultCenter.lat, defaultCenter.lng))
        );
    }
  }, [initialAddress, isLoaded]);

  if (loadError) return <div>Error al cargar el mapa. Por favor, verifique su clave API.</div>;
  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <div className="space-y-4">
      <Autocomplete
        onLoad={(ref) => (autocompleteRef.current = ref)}
        onPlaceChanged={handlePlaceChanged}
        options={{ types: ['address'], componentRestrictions: { country: 'bo' } }}
      >
        <Input type="text" placeholder="Buscar una dirección..." />
      </Autocomplete>
      
      <div className="h-80 w-full rounded-md overflow-hidden relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={markerPosition?.toJSON() || defaultCenter}
          zoom={13}
          options={{ mapTypeId: 'satellite', mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}
        >
          {markerPosition && <Marker position={markerPosition} draggable={true} onDragEnd={handleMarkerDragEnd} />}
        </GoogleMap>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="street">Calle</Label>
            <Input 
              id="street" 
              value={street} 
              onChange={(e) => setStreet(e.target.value)} 
              placeholder="Nombre de la calle"
              className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="houseNumber">Número de casa</Label>
            <Input 
              id="houseNumber" 
              value={houseNumber} 
              onChange={(e) => setHouseNumber(e.target.value)} 
              placeholder="Ej: 1234"
              className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
            />
        </div>
      </div>
       <div className="space-y-2">
            <Label htmlFor="details">Detalles Adicionales</Label>
            <Input 
              id="details" 
              value={details} 
              onChange={(e) => setDetails(e.target.value)} 
              placeholder="Apartamento, punto de referencia, etc."
              className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
            />
      </div>
    </div>
  );
} 