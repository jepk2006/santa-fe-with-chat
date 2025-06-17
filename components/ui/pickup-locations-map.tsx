'use client';

interface PickupLocationsMapProps {
  className?: string;
}

export default function PickupLocationsMap({ className }: PickupLocationsMapProps) {
  // Get API key from environment
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Exact coordinates for each pickup location
  const locations = [
    { name: "Fábrica", lat: -17.89044843743826, lng: -63.30959124662632 },
    { name: "Carnes Express - Santa Fe", lat: -17.762658722069858, lng: -63.17766170185259 },
    { name: "Agencia #3", lat: -17.80755368139653, lng: -63.21032306211199 },
    { name: "Agencia #6", lat: -17.802254782800325, lng: -63.18459865767217 }
  ];

  // Calculate center point of all locations for optimal map view
  const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
  const centerLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

  // Try using search with specific business names at coordinates for better marker visibility
  const businessQuery = "Frigorifico Santa Fe OR Carnes Express Santa Fe OR Agencia Santa Fe";
  const encodedBusinessQuery = encodeURIComponent(businessQuery);
  
  // Alternative 1: Search for business names (better for showing individual markers)
  const businessSearchUrl = `https://www.google.com/maps/embed/v1/search?key=${apiKey}&q=${encodedBusinessQuery}&center=${centerLat},${centerLng}&zoom=11&maptype=satellite`;
  
  // Alternative 2: Directions API to show all locations as waypoints (shows all 4 points clearly)
  const origin = `${locations[0].lat},${locations[0].lng}`;
  const destination = `${locations[3].lat},${locations[3].lng}`;
  const waypoints = `${locations[1].lat},${locations[1].lng}|${locations[2].lat},${locations[2].lng}`;
  const directionsUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}&waypoints=${waypoints}&zoom=10&maptype=satellite&mode=driving`;
  
  // Use business search first, fallback to directions if needed
  const satelliteMapUrl = businessSearchUrl;

  // Handle missing API key
  if (!apiKey) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Ubicaciones de Retiro</h3>
          <div className="rounded-lg border p-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              Map unavailable: Google Maps API key not configured
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Ubicaciones de Retiro</h3>
        <div className="rounded-lg overflow-hidden border">
          <iframe
            src={satelliteMapUrl}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Pickup Locations Satellite Map"
          />
        </div>
        <p className="text-xs text-gray-500">
          Haz clic en los marcadores del mapa para ver más detalles de cada ubicación
        </p>
      </div>
    </div>
  );
} 