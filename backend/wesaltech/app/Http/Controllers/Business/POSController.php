<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\MaintenanceContract;
use App\Models\MaintenanceVisit;
use App\Models\MaintenanceProduct;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class POSController extends Controller
{
    public function products(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        // Get current branch from request or session
        $branchId = $request->get('branch_id') ?: session('active_branch_id');
        
        $query = Product::active()
            ->regularProducts(); // Only show regular products, not spare parts
        
        // Always filter by branch (for both owners and staff)
        if ($branchId) {
            $query->whereHas('branches', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->where('branch_product.is_active', true);
            });
        } elseif (!$user->hasRole('owner')) {
            // For non-owners without a branch set, get their first assigned branch
            $userBranch = $user->branches()->first();
            if ($userBranch) {
                $query->whereHas('branches', function ($q) use ($userBranch) {
                    $q->where('branch_id', $userBranch->id)
                      ->where('branch_product.is_active', true);
                });
            }
        }
        
        $products = $query
            ->when($request->get('search'), function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%")
                      ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($request->get('category'), function ($query, $category) {
                return $query->where('category', $category);
            })
            ->select('id', 'name', 'sku', 'barcode', 'selling_price', 'stock_quantity', 'unit', 'tax_rate', 'image', 'is_active')
            ->orderBy('name')
            ->get();

        return response()->json($products);
    }

    public function createSale(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'customer_email' => 'nullable|email|max:255',
            'customer_address' => 'nullable|string',
            'customer_tax_id' => 'nullable|string|max:50',
            'payment_method' => 'required|in:cash,card,bank_transfer,credit',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.include_maintenance' => 'nullable|boolean',
            'items.*.maintenance_config' => 'nullable|array',
            'items.*.maintenance_config.frequency' => 'required_if:items.*.include_maintenance,true|in:weekly,monthly,quarterly,semi_annual,annual,custom',
            'items.*.maintenance_config.frequency_value' => 'nullable|integer|min:1',
            'items.*.maintenance_config.frequency_unit' => 'nullable|in:days,weeks,months,years',
            'items.*.maintenance_config.start_date' => 'required_if:items.*.include_maintenance,true|date|after_or_equal:today',
            'items.*.maintenance_config.end_date' => 'nullable|date|after:items.*.maintenance_config.start_date',
            'items.*.maintenance_config.contract_value' => 'nullable|numeric|min:0',
            'items.*.maintenance_config.maintenance_products' => 'nullable|array',
            'items.*.maintenance_config.special_instructions' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Get or create customer
            $customer = null;
            if (!empty($validated['customer_id'])) {
                $customer = \App\Models\Customer::findOrFail($validated['customer_id']);
            } elseif (!empty($validated['customer_phone'])) {
                // Try to find existing customer by phone
                $customer = \App\Models\Customer::where('phone', $validated['customer_phone'])->first();
                
                // If not found, create new customer
                if (!$customer) {
                    $customer = \App\Models\Customer::create([
                        'tenant_id' => auth()->user()->tenant_id,
                        'name' => $validated['customer_name'],
                        'phone' => $validated['customer_phone'],
                        'email' => $validated['customer_email'] ?? null,
                        'address' => $validated['customer_address'] ?? null,
                        'tax_number' => $validated['customer_tax_id'] ?? null,
                        'type' => 'individual',
                        'credit_limit' => 0,
                        'current_balance' => 0,
                        'is_active' => true,
                    ]);
                }
                
                $validated['customer_id'] = $customer->id;
            }
            
            // Check credit limit if payment method is credit
            if ($customer && $validated['payment_method'] === 'credit') {
                $totalAmount = $this->calculateTotalAmount($validated['items'], $validated['discount_amount'] ?? 0);
                if (!$customer->canPurchase($totalAmount)) {
                    throw new \Exception("Customer credit limit exceeded. Available credit: {$customer->getAvailableCreditAttribute()}");
                }
            }

            // Get branch_id - from request first, then session, then user's assigned branch
            $branchId = $request->get('branch_id') ?: session('active_branch_id');
            if (!$branchId) {
                // For staff without branch selector, get their first assigned branch
                $userBranch = auth()->user()->branches()->first();
                if ($userBranch) {
                    $branchId = $userBranch->id;
                } else {
                    // Fallback to default branch for the tenant
                    $defaultBranch = \App\Models\Branch::where('tenant_id', auth()->user()->tenant_id)
                        ->where('is_default', true)
                        ->first();
                    if ($defaultBranch) {
                        $branchId = $defaultBranch->id;
                    }
                }
            }
            
            if (!$branchId) {
                throw new \Exception('No branch available. Please contact your administrator.');
            }

            // Create the sale
            $sale = Sale::create([
                'tenant_id' => auth()->user()->tenant_id,
                'branch_id' => $branchId,
                'customer_id' => $validated['customer_id'] ?? null,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'] ?? null,
                'customer_tax_id' => $validated['customer_tax_id'] ?? null,
                'salesman_id' => auth()->id(),
                'subtotal' => 0,
                'tax_amount' => 0,
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'total_amount' => 0,
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_method'] === 'credit' ? 'pending' : 'paid',
                'notes' => $validated['notes'] ?? null,
                'sale_date' => now(),
            ]);

            $subtotal = 0;
            $totalTax = 0;

            // Create sale items and maintenance contracts
            foreach ($validated['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                
                // Check stock availability
                if ($product->stock_quantity < $itemData['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}. Available: {$product->stock_quantity}");
                }

                $quantity = $itemData['quantity'];
                $unitPrice = $itemData['unit_price'];
                $itemDiscount = $itemData['discount_amount'] ?? 0;
                $taxRate = $product->tax_rate;

                $itemSubtotal = ($quantity * $unitPrice) - $itemDiscount;
                $itemTax = $itemSubtotal * ($taxRate / 100);
                $itemTotal = $itemSubtotal + $itemTax;

                $saleItem = SaleItem::create([
                    'tenant_id' => auth()->user()->tenant_id,
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'tax_rate' => $taxRate,
                    'discount_amount' => $itemDiscount,
                    'total_amount' => $itemTotal,
                ]);

                // Create maintenance contract if requested
                if (!empty($itemData['include_maintenance']) && !empty($itemData['maintenance_config'])) {
                    $maintenanceConfig = $itemData['maintenance_config'];
                    
                    $contract = MaintenanceContract::create([
                        'tenant_id' => auth()->user()->tenant_id,
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                        'customer_name' => $validated['customer_name'],
                        'customer_phone' => $validated['customer_phone'],
                        'customer_email' => $validated['customer_email'] ?? null,
                        'customer_address' => $validated['customer_address'] ?? null,
                        'frequency' => $maintenanceConfig['frequency'],
                        'frequency_value' => $maintenanceConfig['frequency_value'] ?? null,
                        'frequency_unit' => $maintenanceConfig['frequency_unit'] ?? null,
                        'start_date' => $maintenanceConfig['start_date'],
                        'end_date' => $maintenanceConfig['end_date'] ?? null,
                        'contract_value' => $maintenanceConfig['contract_value'] ?? null,
                        'maintenance_products' => $maintenanceConfig['maintenance_products'] ?? null,
                        'special_instructions' => $maintenanceConfig['special_instructions'] ?? null,
                        'status' => 'active',
                    ]);

                    // Create first maintenance visit
                    $firstVisitDate = $contract->calculateNextVisitDate($maintenanceConfig['start_date']);
                    
                    MaintenanceVisit::create([
                        'tenant_id' => auth()->user()->tenant_id,
                        'maintenance_contract_id' => $contract->id,
                        'scheduled_date' => $firstVisitDate,
                        'status' => 'scheduled',
                        'priority' => 'medium',
                    ]);
                }

                // Create stock movement
                StockMovement::create([
                    'tenant_id' => auth()->user()->tenant_id,
                    'branch_id' => $branchId,
                    'product_id' => $product->id,
                    'type' => 'out',
                    'quantity' => $quantity,
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                    'notes' => "Sale #{$sale->sale_number}",
                    'user_id' => auth()->id(),
                ]);

                $subtotal += $itemSubtotal;
                $totalTax += $itemTax;
            }

            $finalTotal = $subtotal + $totalTax - $sale->discount_amount;

            // Update sale totals
            $sale->update([
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'total_amount' => $finalTotal,
            ]);

            // Update customer balance if credit sale
            if ($customer && $validated['payment_method'] === 'credit') {
                $customer->increment('current_balance', $finalTotal);
            }

            return response()->json([
                'message' => 'Sale completed successfully',
                'sale' => $sale->load(['items.product', 'salesman', 'customer']),
                'maintenance_contracts' => $sale->maintenanceContracts()->with('visits')->get(),
                'tax_invoice' => $sale->generateTaxInvoice(),
            ], 201);
        });
    }

    private function calculateTotalAmount(array $items, float $discount = 0): float
    {
        $subtotal = 0;
        $totalTax = 0;

        foreach ($items as $itemData) {
            $product = Product::findOrFail($itemData['product_id']);
            $quantity = $itemData['quantity'];
            $unitPrice = $itemData['unit_price'];
            $itemDiscount = $itemData['discount_amount'] ?? 0;
            $taxRate = $product->tax_rate;

            $itemSubtotal = ($quantity * $unitPrice) - $itemDiscount;
            $itemTax = $itemSubtotal * ($taxRate / 100);

            $subtotal += $itemSubtotal;
            $totalTax += $itemTax;
        }

        return $subtotal + $totalTax - $discount;
    }

    public function getSale(Sale $sale): JsonResponse
    {
        return response()->json([
            'sale' => $sale->load(['items.product', 'salesman']),
            'maintenance_contracts' => $sale->maintenanceContracts()->with('visits')->get(),
            'tax_invoice' => $sale->generateTaxInvoice(),
        ]);
    }

    public function dailySales(Request $request): JsonResponse
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $branchId = $request->get('branch_id');
        
        $query = Sale::whereDate('sale_date', $date)
            ->with(['items.product', 'salesman', 'branch']);
        
        // Filter by branch if provided
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        
        $sales = $query->orderBy('sale_date', 'desc')->get();

        $summary = [
            'total_sales' => $sales->count(),
            'total_amount' => $sales->sum('total_amount'),
            'total_tax' => $sales->sum('tax_amount'),
            'payment_methods' => $sales->groupBy('payment_method')->map->count(),
        ];

        return response()->json([
            'sales' => $sales,
            'summary' => $summary,
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Product::select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json($categories);
    }

    public function getMaintenanceProducts(): JsonResponse
    {
        $products = MaintenanceProduct::active()
            ->select('id', 'name', 'sku', 'cost_price', 'unit', 'type', 'compatible_products')
            ->orderBy('name')
            ->get();

        return response()->json(['products' => $products]);
    }
}