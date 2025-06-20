'use client';

import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ProductImages from '@/components/shared/product/product-images';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, Package, MapPin } from 'lucide-react';
import { LOCATIONS } from '@/lib/constants/locations';

interface InventoryUnit {
  id: string;
  unit_weight: number;
  unit_price: number;
  location_id: string;
  locations?: { name: string };
  distance?: number;
  locName?: string;
  storeId?: string;
}

interface ProductDetailsProps {
  product: Product;
  user: any;
  inventory: InventoryUnit[];
}

export default function ProductDetails({ product, user, inventory }: ProductDetailsProps) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [unitsWithDistance, setUnitsWithDistance] = useState<InventoryUnit[]>([]);
  const [quantity, setQuantity] = useState(1);
  
  // Support both camelCase and snake_case property access for compatibility
  const sellingMethod = (product as any).sellingMethod || (product as any).selling_method;
  const weightUnit = (product as any).weightUnit || (product as any).weight_unit;
  const minWeight = (product as any).minWeight || (product as any).min_weight;
  const isWeightCustom = sellingMethod === 'weight_custom';
  const isWeightFixed = sellingMethod === 'weight_fixed';
  const isWeightBased = isWeightCustom || isWeightFixed;
  
  const [weight, setWeight] = useState(Number(minWeight) || 1);
  
  // Compute distance between two lat/lng points (Haversine)
  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // On mount: try to get user position and sort units
  useEffect(() => {
    if (!inventory || inventory.length === 0) return;

    const enrichUnits = (lat?: number, lon?: number) => {
      const enhanced = inventory.map((unit) => {
        const locMeta = LOCATIONS.find((l) => l.id === unit.location_id || l.name === (unit.locations?.name ?? ''));
        const slugId = locMeta ? locMeta.id : undefined;
        const distance = lat && lon && locMeta ? getDistanceKm(lat, lon, locMeta.coordinates.lat, locMeta.coordinates.lng) : undefined;
        return { ...unit, distance, locName: locMeta?.name, storeId: slugId } as InventoryUnit & { distance?: number; locName?: string; storeId?: string };
      });
      // sort by distance if present, else leave order
      enhanced.sort((a, b) => {
        if (a.distance === undefined) return 0;
        if (b.distance === undefined) return 0;
        return a.distance - b.distance;
      });
      setUnitsWithDistance(enhanced);
      if (enhanced.length > 0) {
        const firstWithSlug = enhanced.find(u => u.storeId) as any;
        if(firstWithSlug) setSelectedStoreId(firstWithSlug.storeId as string);
      }
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          enrichUnits(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          enrichUnits();
        },
        { enableHighAccuracy: false, maximumAge: 60000 }
      );
    } else {
      enrichUnits();
    }
  }, [inventory]);
  
  const handleAddToCart = () => {
    if (isWeightFixed && inventory && inventory.length > 0) {
      // For weight_fixed products with inventory units
      if (selectedUnitIds.size === 0) {
        toast.error('Selecciona al menos una unidad disponible');
        return;
      }
      const itemsToAdd = Array.from(selectedUnitIds).map((uid) => inventory.find((u) => u.id === uid)).filter(Boolean) as InventoryUnit[];
      let addedCount = 0;
      itemsToAdd.forEach((unit) => {
        if (items.some((i:any)=> i.id===unit.id)) {
          toast.error('Ese corte ya está en tu carrito');
          return;
        }
        // Find location information for this unit
        const location = LOCATIONS.find(loc => loc.id === unit.storeId || loc.id === selectedStoreId);
        
        addItem({
          id: unit.id,
          name: product.name,
          price: unit.unit_price,
          image: product.images[0],
          quantity: 1,
          selling_method: 'weight_fixed',
          weight_unit: 'kg',
          weight: unit.unit_weight,
          locked: true,
          // Add location information
          location_id: unit.location_id,
          location_name: location?.name,
          location_address: location?.address,
          inventory_id: unit.id,
          product_id: product.id,
        });
        addedCount++;
      });
      if (addedCount === 0) return; // no success toast
    } else if (isWeightCustom) {
      // For weight_custom products where customer chooses weight
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: 1,
        selling_method: 'weight_custom',
        weight_unit: weightUnit || 'kg',
        weight: weight,
        locked: false,
      });
    } else {
      // For unit-based products - add the specified quantity
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
        quantity: quantity,
        selling_method: 'unit',
      });
    }
    
    const description = isWeightFixed && inventory && inventory.length > 0
      ? `${selectedUnitIds.size} unidades añadidas al carrito`
      : isWeightCustom 
        ? `${product.name} (${weight}kg) añadido al carrito`
        : `${product.name} (${quantity}x) añadido al carrito`;
    
    toast.success('Añadido al carrito', {
      description,
      action: {
        label: 'Ver carrito',
        onClick: () => router.push('/cart'),
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <ProductImages images={product.images} />
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center mt-2">
              <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
              {isWeightBased && weightUnit && (
                <span className="text-sm text-muted-foreground ml-1">
                  /{weightUnit}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mt-2 flex items-center space-x-2">
              <span className={`font-medium ${product.inStock ? "text-green-600" : "text-red-300"}`}>
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center text-sm text-muted-foreground">
                                 {isWeightCustom ? (
                    <>
                      <Scale className="h-4 w-4 mr-1" />
                      <span>Sold by weight (customer chooses)</span>
                    </>
                 ) : isWeightFixed ? (
                  <>
                    <Scale className="h-4 w-4 mr-1" />
                      <span>Sold by weight (fixed units)</span>
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-1" />
                    <span>Sold by unit</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">{product.description}</p>
            
            {product.inStock ? (
              <>
                {/* Unit-based products - show quantity selector */}
                {!isWeightBased ? (
                  <div className="space-y-3">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <div className="flex items-center space-x-3">
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value);
                          setQuantity(isNaN(newQuantity) ? 1 : newQuantity);
                        }}
                        className="w-24 border border-gray-300 bg-white"
                      />
                      <span className="text-sm font-medium text-gray-700">unidad(es)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatPrice(product.price * quantity)}
                    </p>
                  </div>
                ) : null}

                {/* Weight custom - customer chooses weight */}
                {isWeightCustom ? (
                  <div className="space-y-3">
                    <Label htmlFor="weight">Selecciona peso (kg)</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Input
                          id="weight"
                          type="number"
                          min={Number(minWeight) || 0.1}
                          step={0.1}
                          value={isNaN(weight) ? '' : weight}
                          onChange={(e) => {
                            const newWeight = parseFloat(e.target.value);
                            setWeight(isNaN(newWeight) ? 0 : newWeight);
                          }}
                          onBlur={(e) => {
                            if (!e.target.value || isNaN(parseFloat(e.target.value))) {
                              setWeight(Number(minWeight) || 1);
                            }
                          }}
                          className="w-24 border border-gray-300 bg-white"
                        />
                        <span className="text-sm font-medium text-gray-700">kg</span>
                      </div>
                      {Number(minWeight) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Peso mínimo: {Number(minWeight)} kg
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Total: {isNaN(weight) ? "-" : formatPrice(product.price * weight)}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Weight fixed - pre-packaged units */}
                {isWeightFixed && inventory && inventory.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-medium">Unidades con peso fijo disponibles</h4>
                      
                      {/* Location Selection Section */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center mb-2">
                          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                          <h5 className="font-medium text-blue-800">Selecciona ubicación de disponibilidad</h5>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                          Elige la sucursal para ver las unidades disponibles. Cada ubicación tiene diferentes unidades con pesos específicos.
                        </p>
                        {selectedStoreId && (
                          <select
                            className="border border-blue-300 rounded-lg p-3 w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={selectedStoreId || ''}
                            onChange={(e) => {
                              setSelectedStoreId(e.target.value);
                              setSelectedUnitIds(new Set());
                            }}
                          >
                            {LOCATIONS.map((loc) => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Available Units Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-800">Unidades disponibles</h5>
                          {selectedStoreId && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              📍 {LOCATIONS.find(loc => loc.id === selectedStoreId)?.name}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                          {unitsWithDistance.filter(u=>u.storeId===selectedStoreId).length === 0 ? (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">No hay unidades disponibles en esta sucursal.</p>
                              <p className="text-xs text-gray-400 mt-1">Intenta seleccionar otra ubicación.</p>
                  </div>
                ) : (
                            unitsWithDistance.filter(u=>u.storeId===selectedStoreId).map((unit) => (
                              <label key={unit.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-white border border-transparent hover:border-gray-200 cursor-pointer transition-all">
                                <input
                                  type="checkbox"
                                  value={unit.id}
                                  checked={selectedUnitIds.has(unit.id)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedUnitIds);
                                    if (e.target.checked) newSet.add(unit.id); else newSet.delete(unit.id);
                                    setSelectedUnitIds(newSet);
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1 flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-700">
                                    {unit.unit_weight} kg
                                  </span>
                                  <span className="text-sm font-semibold text-gray-800">
                                    {unit.unit_price.toFixed(2)} Bs.
                                  </span>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                        
                        {selectedUnitIds.size > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="text-sm text-green-800">
                              <span className="font-medium">{selectedUnitIds.size} unidad(es) seleccionada(s)</span>
                              <span className="text-green-600 ml-2">
                                • Total: {Array.from(selectedUnitIds).reduce((total, id) => {
                                  const unit = inventory.find(u => u.id === id);
                                  return total + (unit?.unit_price || 0);
                                }, 0).toFixed(2)} Bs.
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                ) : null}

                <Button
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={(isWeightFixed && inventory && inventory.length > 0 && selectedUnitIds.size === 0) || 
                           (isWeightCustom && (weight <= 0 || isNaN(weight))) ||
                           (!isWeightBased && quantity <= 0)}
                >
                  Añadir al carrito
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                disabled
              >
                Out of Stock
              </Button>
            )}
          </div>
        </div>
      </div>


    </div>
  );
} 