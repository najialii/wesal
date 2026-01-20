-- Delete seeded branches and related data
-- First, update sales to remove branch references
UPDATE sales SET branch_id = NULL WHERE branch_id IN (
    SELECT id FROM branches WHERE name IN ('Downtown Branch', 'North Branch', 'South Branch')
);

-- Delete stock transfers related to seeded branches
DELETE FROM stock_transfers WHERE from_branch_id IN (
    SELECT id FROM branches WHERE name IN ('Downtown Branch', 'North Branch', 'South Branch')
) OR to_branch_id IN (
    SELECT id FROM branches WHERE name IN ('Downtown Branch', 'North Branch', 'South Branch')
);

-- Delete branch-user relationships
DELETE FROM branch_user WHERE branch_id IN (
    SELECT id FROM branches WHERE name IN ('Downtown Branch', 'North Branch', 'South Branch')
);

-- Delete branch-product relationships
DELETE FROM branch_product WHERE branch_id IN (
    SELECT id FROM branches WHERE name IN ('Downtown Branch', 'North Branch', 'South Branch')
);

-- Finally, delete the seeded branches
DELETE FROM branches WHERE name IN ('Downtown Branch', 'North Branch', 'South Branch');

-- Show remaining branches
SELECT id, tenant_id, name, code, is_default FROM branches ORDER BY tenant_id, name;