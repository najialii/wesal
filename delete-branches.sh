#!/bin/bash

echo "🗑️ Deleting seeded branches from database..."

mysql -u root -p112235813nJ wesaltech_db << 'EOF'
-- Delete seeded branches
DELETE FROM branches WHERE name IN ('Downtown Branch', 'North Branch', 'South Branch');

-- Show remaining branches
SELECT COUNT(*) as total_branches FROM branches;
SELECT tenant_id, name, is_default FROM branches ORDER BY tenant_id;
EOF

echo "✅ Seeded branches deleted!"