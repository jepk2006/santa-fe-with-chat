-- Update unique constraint to allow multiple weight variants per product/location
ALTER TABLE product_inventory
  DROP CONSTRAINT IF EXISTS product_inventory_product_id_location_id_key;
 
-- Add new unique constraint including unit_weight
ALTER TABLE product_inventory
  ADD CONSTRAINT product_inventory_product_loc_weight_unique UNIQUE (product_id, location_id, unit_weight); 