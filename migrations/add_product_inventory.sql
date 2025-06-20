-- Create locations table with fixed IDs
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Insert fixed locations
INSERT INTO locations (id, name, address) VALUES
  ('fabrica', 'Fábrica', 'Km 17 Doble vía la Guardia'),
  ('agencia4', 'Carnes Express - Santa Fe', 'Avenida Banzer C/ Ochoo N° 2010'),
  ('agencia3', 'Agencia #3', '4to anillo Doble Vía la Guardia'),
  ('agencia6', 'Agencia #6', 'Av. Pilcomayo #242');

-- Create product_inventory table
CREATE TABLE product_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location_id TEXT REFERENCES locations(id) ON DELETE CASCADE,
  quantity_kg DECIMAL NOT NULL DEFAULT 0,
  price_per_kg DECIMAL NOT NULL,
  is_available BOOLEAN DEFAULT true,
  UNIQUE(product_id, location_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_product_inventory_product_id ON product_inventory(product_id);
CREATE INDEX idx_product_inventory_location_id ON product_inventory(location_id);
CREATE INDEX idx_product_inventory_availability ON product_inventory(is_available); 