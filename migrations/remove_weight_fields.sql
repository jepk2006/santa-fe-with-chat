-- Remove weight-related fields from products table
ALTER TABLE products
DROP COLUMN IF EXISTS selling_method,
DROP COLUMN IF EXISTS weight_unit,
DROP COLUMN IF EXISTS min_weight;

-- Update product_inventory table to use only kilograms
ALTER TABLE product_inventory
DROP COLUMN IF EXISTS weight_unit;

-- Update order_items table to use only kilograms
ALTER TABLE order_items
DROP COLUMN IF EXISTS weight_unit;

-- Update cart_items table to use only kilograms
ALTER TABLE cart_items
DROP COLUMN IF EXISTS weight_unit; 