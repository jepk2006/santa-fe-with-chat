'use client';

import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { addProductInventory, getProductInventory, updateProductInventory } from '@/lib/actions/product.actions';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { LOCATIONS } from '@/lib/constants/locations';

interface InventoryUnit {
  id?: string;
  weight_kg: number;
  quantity: number;
  price: number;
  dateAdded?: string;
}

interface LocationInventory {
  [locationId: string]: {
    units: InventoryUnit[];
  };
}

// Form schema
const inventoryFormSchema = z.object({
  locations: z.record(z.object({
    units: z.array(z.object({
      id: z.string().optional(),
      weight_kg: z.number().positive("Weight must be greater than 0"),
      quantity: z.number().int().min(0, "Quantity must be positive"),
      price: z.number().min(0, "Price must be positive"),
      dateAdded: z.string().optional(),
    }))
  }))
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export interface InventoryFormHandle {
  saveInventory: () => Promise<void>;
}

interface ProductInventoryFormProps {
  productId: string;
  pricePerKg: number;
  showButton?: boolean;
  initialInventory?: any[];
  sellingMethod?: string;
}

export const ProductInventoryForm = forwardRef<InventoryFormHandle, ProductInventoryFormProps>(
  ({ productId, pricePerKg, showButton = true, initialInventory = [], sellingMethod = 'weight_custom' }, ref) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Check if this is weight_custom (customer chooses) or weight_fixed (pre-packaged units)
    const isWeightCustom = sellingMethod === 'weight_custom';
    const isWeightFixed = sellingMethod === 'weight_fixed';

    // Initialize form
    const form = useForm<InventoryFormValues>({
      resolver: zodResolver(inventoryFormSchema),
      defaultValues: {
        locations: LOCATIONS.reduce((acc, location) => {
          acc[location.id] = { units: [] };
          return acc;
        }, {} as Record<string, { units: InventoryUnit[] }>)
      }
    });

    // Load initial inventory from prop, then refetch on mount to stay fresh
    useEffect(() => {
      const loadInventory = (inventoryData: any[]) => {
        // Group inventory by location
        const groupedInventory = inventoryData.reduce((acc: LocationInventory, item: any) => {
          // Convert DB location_id (uuid) to our constant slug id
          const loc = LOCATIONS.find(l => l.id === item.location_id || l.name === item.locations?.name);
          const key = loc ? loc.id : item.location_id;

          if (!acc[key]) {
            acc[key] = { units: [] };
          }
          acc[key].units.push({
            id: item.id,
            weight_kg: item.unit_weight,
            quantity: item.quantity,
            price: item.unit_price,
            dateAdded: item.created_at,
          });
          return acc;
        }, {} as LocationInventory);

        // Ensure all locations exist in the inventory
        LOCATIONS.forEach(location => {
          if (!groupedInventory[location.id]) {
            groupedInventory[location.id] = { units: [] };
          }
        });

        form.reset({ locations: groupedInventory });
      };

      // First load
      loadInventory(initialInventory);

      const fetchLatest = async () => {
        try {
          const latest = await getProductInventory(productId);
          loadInventory(latest);
        } catch (error) {
          toast({ variant: 'destructive', description: 'Failed to load inventory data' });
        }
      };

      fetchLatest();
    }, [productId, toast, form, initialInventory]);

    const addUnit = (locationId: string) => {
      const currentUnits = form.getValues(`locations.${locationId}.units`) || [];
      const newUnit = { weight_kg: 0, quantity: 1, price: 0, dateAdded: new Date().toISOString() };
      form.setValue(`locations.${locationId}.units`, [...currentUnits, newUnit], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    };

    const removeUnit = (locationId: string, index: number) => {
      const currentUnits = form.getValues(`locations.${locationId}.units`) || [];
      form.setValue(
        `locations.${locationId}.units`,
        currentUnits.filter((_, i) => i !== index),
        {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        }
      );
    };

    // Update price when weight changes
    const updateWeight = (locationId: string, index: number, weight: number) => {
      if (isNaN(weight)) {
        form.setValue(`locations.${locationId}.units.${index}.weight_kg`, 0, {
          shouldValidate: true
        });
        form.setValue(`locations.${locationId}.units.${index}.price`, 0, {
          shouldValidate: true
        });
        return;
      }
      
      form.setValue(`locations.${locationId}.units.${index}.weight_kg`, weight, {
        shouldValidate: true
      });
      
      if (isWeightCustom) {
        // For weight_custom, price should remain as the base price per kg
        // Customer will choose weight at purchase time
        form.setValue(`locations.${locationId}.units.${index}.price`, pricePerKg, {
          shouldValidate: true
        });
      } else if (isWeightFixed) {
        // For weight_fixed, calculate final price for this specific unit
        const calculatedPrice = weight * pricePerKg;
        form.setValue(`locations.${locationId}.units.${index}.price`, calculatedPrice, {
          shouldValidate: true
        });
      }
    };

    const handleSave = async () => {
      // Validate form before proceeding
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          variant: 'destructive',
          description: 'Please fix validation errors before saving.',
        });
        return;
      }

      setIsLoading(true);
      try {
        const data = form.getValues();
        // Create array of all inventory updates
        const updates = Object.entries(data.locations).flatMap(([locationId, locationData]) =>
          locationData.units.map((unit) => {
            if (unit.id) {
              return updateProductInventory(unit.id, {
                quantity: unit.quantity,
                unit_price: unit.price,
                is_available: unit.quantity > 0,
              });
            }
            return addProductInventory({
              product_id: productId,
              location_id: locationId,
              unit_weight: unit.weight_kg,
              quantity: unit.quantity,
              unit_price: unit.price,
            });
          })
        );

        await Promise.all(updates);

        toast({
          description: 'Inventory updated successfully',
        });
      } catch (error) {
        console.error('Error updating inventory', error);
        toast({
          variant: 'destructive',
          description: 'An error occurred while saving inventory',
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Expose handleSave to parent via ref
    useImperativeHandle(ref, () => ({
      saveInventory: handleSave,
    }));

    return (
      <div className="space-y-6">
        {LOCATIONS.map((location) => (
          <div key={location.id} className="p-6 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium">
                {location.name}
                {(() => {
                  const units = form.watch(`locations.${location.id}.units`) || [];
                  if (units.length === 0) return null;
                  const totalQty = units.reduce((sum: number, u: any) => sum + (Number(u.quantity) || 0), 0);
                  return (
                    <span className="ml-2 text-sm text-muted-foreground font-normal">• {units.length} unidades / {totalQty} en total</span>
                  );
                })()}
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addUnit(location.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isWeightFixed ? 'Agregar unidad fija' : 'Configurar disponibilidad'}
              </Button>
            </div>

            <div className="space-y-4">
              {(form.watch(`locations.${location.id}.units`) || []).map((unit, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 items-start p-4 bg-gray-50 rounded-md">
                  <FormField
                    control={form.control}
                    name={`locations.${location.id}.units.${index}.weight_kg`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isWeightFixed ? 'Peso Fijo (kg)' : 'Peso Base (kg)'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => updateWeight(location.id, index, parseFloat(e.target.value))}
                            className="border-gray-300"
                            placeholder={isWeightFixed ? "ej: 2.5" : "ej: 1.0"}
                          />
                        </FormControl>
                        {isWeightCustom && (
                          <FormDescription className="text-xs">
                            Peso de referencia - el cliente elegirá la cantidad final
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`locations.${location.id}.units.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isWeightFixed ? 'Unidades Disponibles' : 'Stock Disponible'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))}
                            onBlur={(e) => {
                              if (e.target.value === '' || isNaN(parseInt(e.target.value))) {
                                field.onChange(0);
                              }
                            }}
                            className="border-gray-300"
                            placeholder={isWeightFixed ? "ej: 10" : "ej: 50"}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {isWeightFixed ? 'Cantidad de unidades de este peso' : 'Cantidad disponible para venta'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`locations.${location.id}.units.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {isWeightFixed ? 'Precio Final' : 'Precio/kg'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            disabled
                            className="border-gray-300"
                          />
                        </FormControl>
                        <FormDescription>
                          {isWeightFixed 
                            ? `Precio final: ${field.value.toFixed(2)} Bs.`
                            : `Precio base: ${field.value.toFixed(2)} Bs./kg`
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date added column */}
                  <div className="flex flex-col justify-center text-sm text-muted-foreground">
                    <span>Fecha de alta</span>
                    <span>{unit.dateAdded ? new Date(unit.dateAdded).toLocaleDateString() : '-'}</span>
                  </div>

                  <div className="pt-7 col-span-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeUnit(location.id, index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!form.watch(`locations.${location.id}.units`) || form.watch(`locations.${location.id}.units`).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  {isWeightFixed 
                    ? 'No hay unidades fijas registradas. Haz clic en "Agregar unidad fija" para añadir inventario.'
                    : 'No hay configuración de peso. Haz clic en "Configurar disponibilidad" para establecer el inventario.'
                  }
                </p>
              )}
            </div>
          </div>
        ))}

        {showButton && (
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar inventario
          </Button>
        )}
      </div>
    );
  }
); 