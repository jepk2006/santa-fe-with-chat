-- Add inventory_id to order_items and cart_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS inventory_id UUID;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS inventory_id UUID;
 
-- Foreign key for order_items
ALTER TABLE order_items
  ADD CONSTRAINT order_items_inventory_fk FOREIGN KEY (inventory_id) REFERENCES product_inventory(id) ON DELETE SET NULL; 