-- Add selling_method column to products table
-- This supports the three selling methods: unit, weight_custom, weight_fixed

-- First, create the enum type for selling methods
DO $$ BEGIN
    CREATE TYPE selling_method_enum AS ENUM ('unit', 'weight_custom', 'weight_fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add selling_method column to products table with default value 'unit'
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS selling_method selling_method_enum DEFAULT 'unit' NOT NULL;

-- Add index for better query performance when filtering by selling method
CREATE INDEX IF NOT EXISTS idx_products_selling_method ON products(selling_method);

-- Update any existing products to have a default selling method if needed
UPDATE products 
SET selling_method = 'unit' 
WHERE selling_method IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN products.selling_method IS 'Defines how the product is sold: unit (by quantity), weight_custom (customer chooses weight), weight_fixed (pre-packaged units with fixed weights)'; 