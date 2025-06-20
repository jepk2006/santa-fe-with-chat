# Database Migration Guide for Selling Methods Feature

## Overview

To support the three different selling methods (unit, weight_custom, weight_fixed), several database changes are required. This guide explains what needs to be changed and how to apply the migrations.

## Required Database Changes

### 1. **Products Table**
- Add `selling_method` column with enum type
- Default value: `'unit'`
- Possible values: `'unit'`, `'weight_custom'`, `'weight_fixed'`

### 2. **Cart Items Table**  
- Add `selling_method` column
- Add `weight_unit` column (TEXT)
- Add `locked` column (BOOLEAN)

### 3. **Order Items Table**
- Add `selling_method` column  
- Add `weight_unit` column (TEXT)
- Add `locked` column (BOOLEAN)
- Add `inventory_id` column (UUID, references product_inventory)

## Migration Files

Apply these migration files in order:

1. **`migrations/add_selling_method_to_products.sql`**
   - Creates the enum type for selling methods
   - Adds selling_method column to products table
   - Sets default values for existing products

2. **`migrations/update_cart_items_for_selling_methods.sql`**
   - Adds selling_method, weight_unit, and locked columns to cart_items
   - Creates indexes for performance
   - Updates existing cart items

3. **`migrations/update_order_items_for_selling_methods.sql`**
   - Adds selling_method, weight_unit, locked, and inventory_id columns to order_items
   - Creates indexes for performance  
   - Updates existing order items

## How to Apply Migrations

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each migration file content
4. Run them one by one in the order listed above

### Option 2: Supabase CLI
```bash
# Apply migrations using Supabase CLI
supabase db push
```

### Option 3: Direct SQL Connection
If you have direct database access:
```bash
# Connect to your database and run each migration
psql "your-database-connection-string" -f migrations/add_selling_method_to_products.sql
psql "your-database-connection-string" -f migrations/update_cart_items_for_selling_methods.sql  
psql "your-database-connection-string" -f migrations/update_order_items_for_selling_methods.sql
```

## Verification

After applying the migrations, verify the changes:

```sql
-- Check products table structure
\d products;

-- Check cart_items table structure  
\d cart_items;

-- Check order_items table structure
\d order_items;

-- Verify enum type exists
\dT selling_method_enum;

-- Check existing data has default values
SELECT selling_method, COUNT(*) FROM products GROUP BY selling_method;
```

## Data Migration Notes

### Existing Products
- All existing products will be set to `selling_method = 'unit'` by default
- You can manually update specific products to use weight-based methods:

```sql
-- Example: Update specific products to weight_custom
UPDATE products 
SET selling_method = 'weight_custom' 
WHERE category = 'Meat' OR category = 'Produce';

-- Example: Update specific products to weight_fixed  
UPDATE products 
SET selling_method = 'weight_fixed'
WHERE name LIKE '%pre-packaged%';
```

### Existing Cart/Order Items
- All existing cart and order items will be set to `selling_method = 'unit'`
- `locked = false` and `weight_unit = NULL` by default
- This ensures backward compatibility

## Feature Behavior After Migration

### Unit Products (`selling_method = 'unit'`)
- Normal quantity-based sales
- No weight information needed
- Standard shopping cart behavior

### Weight Custom Products (`selling_method = 'weight_custom'`)  
- Customer enters desired weight
- Price calculated as `base_price * weight`
- Weight is editable in cart (`locked = false`)
- Requires `weight_unit` (usually 'kg')
+- **Behaves like unit products for inventory** - no location-specific inventory needed
+- Simple stock management like traditional products

### Weight Fixed Products (`selling_method = 'weight_fixed'`)
- Admin defines specific inventory units with fixed weights
- Customer selects from available pre-packaged units
- Weight is not editable in cart (`locked = true`)
- `inventory_id` tracks which specific unit was purchased

## Rollback Plan

If you need to rollback these changes:

```sql
-- Remove added columns (careful - this will lose data!)
ALTER TABLE products DROP COLUMN IF EXISTS selling_method;
ALTER TABLE cart_items DROP COLUMN IF EXISTS selling_method;
ALTER TABLE cart_items DROP COLUMN IF EXISTS weight_unit; 
ALTER TABLE cart_items DROP COLUMN IF EXISTS locked;
ALTER TABLE order_items DROP COLUMN IF EXISTS selling_method;
ALTER TABLE order_items DROP COLUMN IF EXISTS weight_unit;
ALTER TABLE order_items DROP COLUMN IF EXISTS locked;  
ALTER TABLE order_items DROP COLUMN IF EXISTS inventory_id;

-- Drop enum type
DROP TYPE IF EXISTS selling_method_enum;
```

## Post-Migration Steps

1. **Update your application code** - The frontend changes have already been implemented
2. **Test the functionality** - Create products with different selling methods and test cart/checkout flow
3. **Update existing products** - Set appropriate selling methods for your existing products
4. **Train your staff** - Ensure admin users understand the new selling method options

## Troubleshooting

### Common Issues

1. **Permission errors**: Ensure your database user has ALTER TABLE permissions
2. **Enum conflicts**: If the enum already exists, the migration will handle it gracefully
3. **Index conflicts**: All index creation uses `IF NOT EXISTS` to avoid conflicts

### Support

If you encounter issues during migration, check:
- Database logs for specific error messages
- Your database user permissions
- Whether you're running the migrations in the correct order
- That your database supports the required PostgreSQL features (enums, UUID) 