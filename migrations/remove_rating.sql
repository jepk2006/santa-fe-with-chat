-- Remove rating-related columns from products table
ALTER TABLE products
DROP COLUMN IF EXISTS rating,
DROP COLUMN IF EXISTS num_reviews; 