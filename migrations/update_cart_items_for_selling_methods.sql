-- Update cart_items table to support different selling methods
-- This allows cart items to store selling method information and weight units

-- Add selling_method column to cart_items table
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS selling_method selling_method_enum DEFAULT 'unit';

-- Add weight_unit column to cart_items table  
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS weight_unit TEXT;

-- Add locked column to indicate if weight/quantity can be modified
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cart_items_selling_method ON cart_items(selling_method);

-- Update existing cart items to have default values
UPDATE cart_items 
SET selling_method = 'unit' 
WHERE selling_method IS NULL;

-- Add comments to document the columns
COMMENT ON COLUMN cart_items.selling_method IS 'How the item is sold: unit, weight_custom, or weight_fixed';
COMMENT ON COLUMN cart_items.weight_unit IS 'Unit of weight measurement (kg, g, lb, oz) for weight-based items';
COMMENT ON COLUMN cart_items.locked IS 'Whether the weight/quantity is fixed and cannot be modified by user'; 