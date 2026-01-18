<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Worker;
use App\Models\Product;
use App\Models\Category;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\MaintenanceSchedule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class BusinessSeeder extends Seeder
{
    public function run(): void
    {
        // Update existing tenants with business info
        $tenants = Tenant::all();
        
        $businessTypes = [
            [
                'type' => 'Automotive Shop',
                'address' => 'King Fahd Road, Riyadh 12345, Saudi Arabia',
                'phone' => '+966-11-123-4567',
                'email' => 'info@acme-corp.com',
                'tax_number' => '300123456789003',
                'cr_number' => '1010123456',
                'categories' => ['Engine Parts', 'Brake System', 'Electrical', 'Filters', 'Fluids'],
            ],
            [
                'type' => 'Electronics Store',
                'address' => 'Prince Sultan Street, Jeddah 21456, Saudi Arabia', 
                'phone' => '+966-12-987-6543',
                'email' => 'contact@techstart.com',
                'tax_number' => '300987654321003',
                'cr_number' => '2020987654',
                'categories' => ['Smartphones', 'Laptops', 'Accessories', 'Gaming', 'Audio'],
            ],
            [
                'type' => 'Grocery Store',
                'address' => 'Al Olaya District, Riyadh 11564, Saudi Arabia',
                'phone' => '+966-11-555-0123',
                'email' => 'hello@enterprise-solutions.com',
                'tax_number' => '300555123456003',
                'cr_number' => '3030555123',
                'categories' => ['Fresh Produce', 'Dairy', 'Beverages', 'Snacks', 'Household'],
            ]
        ];

        foreach ($tenants as $index => $tenant) {
            if (isset($businessTypes[$index])) {
                $businessData = $businessTypes[$index];
                
                // Update tenant with business info
                $tenant->update([
                    'address' => $businessData['address'],
                    'phone' => $businessData['phone'],
                    'email' => $businessData['email'],
                    'tax_number' => $businessData['tax_number'],
                    'cr_number' => $businessData['cr_number'],
                    'settings' => [
                        'business_type' => $businessData['type'],
                        'currency' => 'SAR',
                        'timezone' => 'Asia/Riyadh',
                    ]
                ]);

                // Create categories for this tenant
                $this->createCategories($tenant, $businessData['categories']);
                
                // Create tenant admin and staff
                $this->createTenantStaff($tenant);
                
                // Create workers for each tenant
                $this->createWorkers($tenant);
                
                // Create products for each tenant
                $this->createProducts($tenant);
                
                // Create maintenance schedules
                $this->createMaintenanceSchedules($tenant);
                
                // Create sample sales
                $this->createSales($tenant);
            }
        }
        
        // Handle the Arabic business (4th tenant)
        $arabicTenant = $tenants->where('slug', 'riyadh-tech')->first();
        if ($arabicTenant) {
            $this->createArabicBusiness($arabicTenant);
        }
    }

    private function createWorkers(Tenant $tenant): void
    {
        // Skip if workers already exist for this tenant
        if ($tenant->workers()->exists()) {
            return;
        }
        
        $baseId = $tenant->id * 1000; // Ensure unique national IDs
        
        $workers = [
            [
                'name' => 'Ahmed Al-Rashid',
                'phone' => '+966-50-123-4567',
                'email' => 'ahmed@' . str_replace('.wesaltech.com', '.com', $tenant->domain),
                'national_id' => (string)($baseId + 1),
                'job_title' => 'Senior Technician',
                'salary' => 5000.00,
                'hire_date' => now()->subMonths(12),
                'skills' => ['mechanic', 'electrician'],
            ],
            [
                'name' => 'Fatima Al-Zahra',
                'phone' => '+966-55-987-6543',
                'email' => 'fatima@' . str_replace('.wesaltech.com', '.com', $tenant->domain),
                'national_id' => (string)($baseId + 2),
                'job_title' => 'Maintenance Specialist',
                'salary' => 4500.00,
                'hire_date' => now()->subMonths(8),
                'skills' => ['plumber', 'hvac'],
            ],
            [
                'name' => 'Mohammed Al-Saud',
                'phone' => '+966-56-555-1234',
                'email' => 'mohammed@' . str_replace('.wesaltech.com', '.com', $tenant->domain),
                'national_id' => (string)($baseId + 3),
                'job_title' => 'Junior Technician',
                'salary' => 3500.00,
                'hire_date' => now()->subMonths(3),
                'skills' => ['general_maintenance'],
            ],
        ];

        foreach ($workers as $workerData) {
            Worker::create([
                'tenant_id' => $tenant->id,
                ...$workerData
            ]);
        }
    }

    private function createProducts(Tenant $tenant): void
    {
        // Skip if products already exist for this tenant
        if ($tenant->products()->exists()) {
            return;
        }
        
        $categories = $tenant->categories()->get();
        if ($categories->isEmpty()) return;
        
        $tenantPrefix = strtoupper(substr($tenant->slug, 0, 3));
        
        // Create different products based on business type
        $businessType = $tenant->settings['business_type'] ?? 'General Store';
        
        if (str_contains($businessType, 'Automotive')) {
            $this->createAutomotiveProducts($tenant, $categories, $tenantPrefix);
        } elseif (str_contains($businessType, 'Electronics')) {
            $this->createElectronicsProducts($tenant, $categories, $tenantPrefix);
        } else {
            $this->createGroceryProducts($tenant, $categories, $tenantPrefix);
        }
    }

    private function createAutomotiveProducts(Tenant $tenant, $categories, string $tenantPrefix): void
    {
        $products = [
            [
                'category' => 'Engine Parts',
                'name' => 'Engine Oil 5W-30',
                'description' => 'Premium synthetic engine oil',
                'cost_price' => 25.00,
                'selling_price' => 45.00,
                'stock_quantity' => 100,
                'min_stock_level' => 20,
                'unit' => 'bottle',
                'image' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop&crop=center',
            ],
            [
                'category' => 'Brake System',
                'name' => 'Brake Pads Set',
                'description' => 'High-performance ceramic brake pads',
                'cost_price' => 80.00,
                'selling_price' => 150.00,
                'stock_quantity' => 50,
                'min_stock_level' => 10,
                'unit' => 'set',
                'image' => 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300&h=300&fit=crop&crop=center',
            ],
            [
                'category' => 'Filters',
                'name' => 'Air Filter',
                'description' => 'High-efficiency air filter',
                'cost_price' => 15.00,
                'selling_price' => 30.00,
                'stock_quantity' => 75,
                'min_stock_level' => 15,
                'unit' => 'piece',
                'image' => 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop&crop=center',
            ],
        ];

        $this->createProductsFromArray($tenant, $categories, $tenantPrefix, $products);
    }

    private function createElectronicsProducts(Tenant $tenant, $categories, string $tenantPrefix): void
    {
        $products = [
            [
                'category' => 'Smartphones',
                'name' => 'Samsung Galaxy S24',
                'description' => 'Latest Samsung flagship smartphone',
                'cost_price' => 800.00,
                'selling_price' => 1200.00,
                'stock_quantity' => 25,
                'min_stock_level' => 5,
                'unit' => 'piece',
                'image' => 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop&crop=center',
            ],
            [
                'category' => 'Laptops',
                'name' => 'MacBook Air M3',
                'description' => 'Apple MacBook Air with M3 chip',
                'cost_price' => 1200.00,
                'selling_price' => 1800.00,
                'stock_quantity' => 15,
                'min_stock_level' => 3,
                'unit' => 'piece',
                'image' => 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop&crop=center',
            ],
            [
                'category' => 'Accessories',
                'name' => 'Wireless Charger',
                'description' => 'Fast wireless charging pad',
                'cost_price' => 20.00,
                'selling_price' => 45.00,
                'stock_quantity' => 100,
                'min_stock_level' => 20,
                'unit' => 'piece',
                'image' => 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=300&fit=crop&crop=center',
            ],
        ];

        $this->createProductsFromArray($tenant, $categories, $tenantPrefix, $products);
    }

    private function createGroceryProducts(Tenant $tenant, $categories, string $tenantPrefix): void
    {
        $products = [
            [
                'category' => 'Fresh Produce',
                'name' => 'Fresh Bananas',
                'description' => 'Organic fresh bananas',
                'cost_price' => 3.00,
                'selling_price' => 5.50,
                'stock_quantity' => 200,
                'min_stock_level' => 50,
                'unit' => 'kg',
                'image' => 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop&crop=center',
            ],
            [
                'category' => 'Dairy',
                'name' => 'Fresh Milk',
                'description' => 'Full fat fresh milk',
                'cost_price' => 4.00,
                'selling_price' => 7.00,
                'stock_quantity' => 150,
                'min_stock_level' => 30,
                'unit' => 'liter',
                'image' => 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop&crop=center',
            ],
            [
                'category' => 'Beverages',
                'name' => 'Orange Juice',
                'description' => '100% pure orange juice',
                'cost_price' => 6.00,
                'selling_price' => 12.00,
                'stock_quantity' => 80,
                'min_stock_level' => 15,
                'unit' => 'bottle',
                'image' => 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=300&fit=crop&crop=center',
            ],
        ];

        $this->createProductsFromArray($tenant, $categories, $tenantPrefix, $products);
    }

    private function createProductsFromArray(Tenant $tenant, $categories, string $tenantPrefix, array $products): void
    {
        foreach ($products as $index => $productData) {
            $category = $categories->where('name', $productData['category'])->first();
            if (!$category) continue;

            Product::create([
                'tenant_id' => $tenant->id,
                'category_id' => $category->id,
                'name' => $productData['name'],
                'sku' => $tenantPrefix . '-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                'barcode' => $tenant->id . str_pad($index + 1, 12, '0', STR_PAD_LEFT),
                'description' => $productData['description'],
                'cost_price' => $productData['cost_price'],
                'selling_price' => $productData['selling_price'],
                'stock_quantity' => $productData['stock_quantity'],
                'min_stock_level' => $productData['min_stock_level'],
                'unit' => $productData['unit'],
                'tax_rate' => 15.00, // Saudi VAT
                'is_active' => true,
                'image' => $productData['image'] ?? null,
            ]);
        }
    }

    private function createMaintenanceSchedules(Tenant $tenant): void
    {
        $workers = $tenant->workers;
        if ($workers->isEmpty()) return;

        $schedules = [
            [
                'title' => 'Monthly Equipment Inspection',
                'description' => 'Routine inspection of all workshop equipment',
                'equipment_name' => 'Hydraulic Lift #1',
                'maintenance_type' => 'preventive',
                'priority' => 'medium',
                'scheduled_date' => now()->addDays(3),
                'estimated_duration' => 2.0,
            ],
            [
                'title' => 'Air Compressor Service',
                'description' => 'Service and oil change for main air compressor',
                'equipment_name' => 'Air Compressor Unit',
                'maintenance_type' => 'preventive',
                'priority' => 'high',
                'scheduled_date' => now()->addDays(7),
                'estimated_duration' => 3.5,
            ],
            [
                'title' => 'Emergency Brake System Repair',
                'description' => 'Urgent repair needed for brake testing equipment',
                'equipment_name' => 'Brake Testing Machine',
                'maintenance_type' => 'emergency',
                'priority' => 'critical',
                'scheduled_date' => now()->addHours(4),
                'estimated_duration' => 1.5,
                'status' => 'in_progress',
            ],
            [
                'title' => 'Tire Balancing Machine Calibration',
                'description' => 'Annual calibration of tire balancing equipment',
                'equipment_name' => 'Tire Balancer #2',
                'maintenance_type' => 'preventive',
                'priority' => 'low',
                'scheduled_date' => now()->addDays(14),
                'estimated_duration' => 4.0,
            ],
        ];

        foreach ($schedules as $scheduleData) {
            MaintenanceSchedule::create([
                'tenant_id' => $tenant->id,
                'assigned_worker_id' => $workers->random()->id,
                ...$scheduleData
            ]);
        }
    }

    private function createSales(Tenant $tenant): void
    {
        $products = $tenant->products;
        $users = $tenant->users;
        
        if ($products->isEmpty() || $users->isEmpty()) return;

        // Create 5 sample sales
        for ($i = 1; $i <= 5; $i++) {
            $saleNumber = 'INV-' . $tenant->id . '-' . date('Y') . '-' . str_pad($i, 6, '0', STR_PAD_LEFT);
            
            $sale = Sale::create([
                'tenant_id' => $tenant->id,
                'sale_number' => $saleNumber,
                'customer_name' => 'Customer ' . $i,
                'customer_phone' => '+966-50-' . rand(100, 999) . '-' . rand(1000, 9999),
                'salesman_id' => $users->random()->id,
                'subtotal' => 0, // Will be calculated
                'tax_amount' => 0, // Will be calculated
                'total_amount' => 0, // Will be calculated
                'payment_method' => ['cash', 'card', 'bank_transfer'][array_rand(['cash', 'card', 'bank_transfer'])],
                'payment_status' => 'paid',
                'sale_date' => now()->subDays(rand(1, 30)),
            ]);

            // Add 2-4 items per sale
            $itemCount = rand(2, 4);
            $subtotal = 0;
            $taxAmount = 0;

            for ($j = 1; $j <= $itemCount; $j++) {
                $product = $products->random();
                $quantity = rand(1, 3);
                $unitPrice = $product->selling_price;
                $taxRate = $product->tax_rate;
                
                $itemSubtotal = $quantity * $unitPrice;
                $itemTax = $itemSubtotal * ($taxRate / 100);
                $itemTotal = $itemSubtotal + $itemTax;

                SaleItem::create([
                    'tenant_id' => $tenant->id,
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'tax_rate' => $taxRate,
                    'total_amount' => $itemTotal,
                ]);

                $subtotal += $itemSubtotal;
                $taxAmount += $itemTax;

                // Create stock movement for the sale
                StockMovement::create([
                    'tenant_id' => $tenant->id,
                    'product_id' => $product->id,
                    'type' => 'out',
                    'quantity' => $quantity,
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                    'notes' => 'Sale #' . $sale->sale_number,
                    'user_id' => $sale->salesman_id,
                ]);
            }

            // Update sale totals
            $sale->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $subtotal + $taxAmount,
            ]);
        }
    }

    private function createCategories(Tenant $tenant, array $categoryNames): void
    {
        foreach ($categoryNames as $index => $name) {
            Category::create([
                'tenant_id' => $tenant->id,
                'name' => $name,
                'description' => "Category for {$name} products",
                'is_active' => true,
                'sort_order' => $index + 1,
            ]);
        }
    }

    private function createTenantStaff(Tenant $tenant): void
    {
        // Assign roles to existing users or create new ones
        $existingUsers = $tenant->users;
        
        if ($existingUsers->isNotEmpty()) {
            // Assign roles to existing users
            foreach ($existingUsers as $index => $user) {
                if ($index === 0) {
                    $user->assignRole('tenant_admin');
                } elseif ($index === 1) {
                    $user->assignRole('manager');
                } else {
                    $user->assignRole('salesman');
                }
            }
            return;
        }
        
        // Create tenant admin
        $admin = User::create([
            'name' => $tenant->name . ' Admin',
            'email' => 'admin@' . str_replace('.wesaltech.com', '.com', $tenant->domain),
            'password' => Hash::make('password'),
            'tenant_id' => $tenant->id,
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('tenant_admin');

        // Create manager
        $manager = User::create([
            'name' => $tenant->name . ' Manager',
            'email' => 'manager@' . str_replace('.wesaltech.com', '.com', $tenant->domain),
            'password' => Hash::make('password'),
            'tenant_id' => $tenant->id,
            'email_verified_at' => now(),
        ]);
        $manager->assignRole('manager');

        // Create salesmen
        for ($i = 1; $i <= 2; $i++) {
            $salesman = User::create([
                'name' => "Salesman {$i} - {$tenant->name}",
                'email' => "sales{$i}@" . str_replace('.wesaltech.com', '.com', $tenant->domain),
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
                'email_verified_at' => now(),
            ]);
            $salesman->assignRole('salesman');
        }
    }

    private function createArabicBusiness(Tenant $tenant): void
    {
        // Update tenant with Arabic business info
        $tenant->update([
            'address' => 'شارع الأمير سلطان، الرياض 11234، المملكة العربية السعودية',
            'phone' => '+966-11-777-8888',
            'email' => 'info@riyadh-tech.com',
            'tax_number' => '300777888999003',
            'cr_number' => '4040777888',
            'settings' => [
                'business_type' => 'متجر إلكترونيات',
                'currency' => 'SAR',
                'timezone' => 'Asia/Riyadh',
            ]
        ]);

        // Create Arabic categories
        $arabicCategories = ['الهواتف الذكية', 'أجهزة الكمبيوتر', 'الإكسسوارات', 'الألعاب', 'الصوتيات'];
        $this->createCategories($tenant, $arabicCategories);
        
        // Create Arabic workers
        $this->createArabicWorkers($tenant);
        
        // Create Arabic products
        $this->createArabicProducts($tenant);
        
        // Create Arabic staff with language preferences
        $this->createArabicStaff($tenant);
    }

    private function createArabicWorkers(Tenant $tenant): void
    {
        $baseId = $tenant->id * 1000;
        
        $workers = [
            [
                'name' => 'أحمد محمد الأحمد',
                'phone' => '+966-50-777-1111',
                'email' => 'ahmed@riyadh-tech.com',
                'national_id' => (string)($baseId + 1),
                'job_title' => 'فني أول',
                'salary' => 5500.00,
                'hire_date' => now()->subMonths(18),
                'skills' => ['mechanic', 'electrician'],
            ],
            [
                'name' => 'فاطمة علي السعد',
                'phone' => '+966-55-777-2222',
                'email' => 'fatima@riyadh-tech.com',
                'national_id' => (string)($baseId + 2),
                'job_title' => 'أخصائية صيانة',
                'salary' => 4800.00,
                'hire_date' => now()->subMonths(10),
                'skills' => ['electronics', 'software'],
            ],
        ];

        foreach ($workers as $workerData) {
            Worker::create([
                'tenant_id' => $tenant->id,
                ...$workerData
            ]);
        }
    }

    private function createArabicProducts(Tenant $tenant): void
    {
        $categories = $tenant->categories()->get();
        if ($categories->isEmpty()) return;
        
        $products = [
            [
                'category' => 'الهواتف الذكية',
                'name' => 'آيفون 15 برو',
                'description' => 'أحدث هاتف آيفون من أبل',
                'cost_price' => 1000.00,
                'selling_price' => 1500.00,
                'stock_quantity' => 20,
                'min_stock_level' => 5,
                'unit' => 'قطعة',
            ],
            [
                'category' => 'أجهزة الكمبيوتر',
                'name' => 'لابتوب ديل XPS',
                'description' => 'جهاز كمبيوتر محمول عالي الأداء',
                'cost_price' => 1200.00,
                'selling_price' => 1800.00,
                'stock_quantity' => 15,
                'min_stock_level' => 3,
                'unit' => 'قطعة',
            ],
            [
                'category' => 'الإكسسوارات',
                'name' => 'شاحن لاسلكي سريع',
                'description' => 'شاحن لاسلكي سريع للهواتف الذكية',
                'cost_price' => 25.00,
                'selling_price' => 50.00,
                'stock_quantity' => 100,
                'min_stock_level' => 20,
                'unit' => 'قطعة',
            ],
        ];

        foreach ($products as $index => $productData) {
            $category = $categories->where('name', $productData['category'])->first();
            if (!$category) continue;

            Product::create([
                'tenant_id' => $tenant->id,
                'category_id' => $category->id,
                'name' => $productData['name'],
                'sku' => 'RYD-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                'barcode' => $tenant->id . str_pad($index + 1, 12, '0', STR_PAD_LEFT),
                'description' => $productData['description'],
                'cost_price' => $productData['cost_price'],
                'selling_price' => $productData['selling_price'],
                'stock_quantity' => $productData['stock_quantity'],
                'min_stock_level' => $productData['min_stock_level'],
                'unit' => $productData['unit'],
                'tax_rate' => 15.00,
                'is_active' => true,
            ]);
        }
    }

    private function createArabicStaff(Tenant $tenant): void
    {
        // Create Arabic staff with Arabic language preference
        $admin = User::create([
            'name' => 'مدير شركة الرياض التقنية',
            'email' => 'admin@riyadh-tech.com',
            'password' => Hash::make('password'),
            'tenant_id' => $tenant->id,
            'email_verified_at' => now(),
            'language_preference' => 'ar',
        ]);
        $admin->assignRole('tenant_admin');

        $manager = User::create([
            'name' => 'مدير العمليات',
            'email' => 'manager@riyadh-tech.com',
            'password' => Hash::make('password'),
            'tenant_id' => $tenant->id,
            'email_verified_at' => now(),
            'language_preference' => 'ar',
        ]);
        $manager->assignRole('manager');

        $salesman = User::create([
            'name' => 'موظف المبيعات',
            'email' => 'sales@riyadh-tech.com',
            'password' => Hash::make('password'),
            'tenant_id' => $tenant->id,
            'email_verified_at' => now(),
            'language_preference' => 'ar',
        ]);
        $salesman->assignRole('salesman');
    }
}