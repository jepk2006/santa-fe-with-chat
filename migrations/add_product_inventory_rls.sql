-- Enable RLS on product_inventory table
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to available inventory
CREATE POLICY "Public can view available inventory"
  ON product_inventory
  FOR SELECT
  TO public
  USING (is_available = true);

-- Policy for admin users to manage inventory
CREATE POLICY "Admins can manage inventory"
  ON product_inventory
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT SELECT ON product_inventory TO anon;
GRANT SELECT ON product_inventory TO authenticated;
GRANT ALL ON product_inventory TO authenticated; 