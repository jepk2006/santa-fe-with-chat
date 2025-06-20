-- Ensure created_at column exists on product_inventory
ALTER TABLE product_inventory
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
 
-- Backfill nulls if any
UPDATE product_inventory SET created_at = timezone('utc', now()) WHERE created_at IS NULL; 