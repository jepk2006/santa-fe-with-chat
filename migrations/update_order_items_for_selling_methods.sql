-- Update order_items table to support different selling methods
-- This allows order items to store selling method information for proper fulfillment

-- Add selling_method column to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS selling_method selling_method_enum DEFAULT 'unit';

-- Add weight_unit column to order_items table  
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS weight_unit TEXT;

-- Add locked column to indicate if this was a fixed weight item
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;

-- Add inventory_id column to track which specific inventory unit was sold (for weight_fixed items)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS inventory_id UUID REFERENCES product_inventory(id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_selling_method ON order_items(selling_method);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON order_items(inventory_id);

-- Update existing order items to have default values
UPDATE order_items 
SET selling_method = 'unit' 
WHERE selling_method IS NULL;

-- Add comments to document the columns
COMMENT ON COLUMN order_items.selling_method IS 'How the item was sold: unit, weight_custom, or weight_fixed';
COMMENT ON COLUMN order_items.weight_unit IS 'Unit of weight measurement for weight-based items';
COMMENT ON COLUMN order_items.locked IS 'Whether this was a fixed weight item that could not be modified';
COMMENT ON COLUMN order_items.inventory_id IS 'Reference to specific inventory unit for weight_fixed items'; 