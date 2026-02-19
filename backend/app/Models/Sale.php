<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory, BelongsToTenant, BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'customer_id',
        'customer_name',
        'customer_phone',
        'sale_number',
        'customer_tax_id', // For B2B sales in Saudi
        'salesman_id',
        'subtotal',
        'tax_amount', // Saudi VAT
        'discount_amount',
        'total_amount',
        'payment_method',
        'payment_status',
        'notes',
        'sale_date',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'sale_date' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($sale) {
            if (empty($sale->sale_number)) {
                $sale->sale_number = static::generateUniqueSaleNumber($sale->tenant_id, $sale->branch_id);
            }
        });
    }

    protected static function generateUniqueSaleNumber($tenantId, $branchId = null)
    {
        $year = date('Y');
        $maxAttempts = 10;
        $attempt = 0;
        
        do {
            $attempt++;
            
            // Get the latest sale number for this tenant and year
            $latestSale = Sale::where('tenant_id', $tenantId)
                            ->whereYear('created_at', $year)
                            ->orderBy('id', 'desc')
                            ->first();
            
            if ($latestSale && preg_match('/INV-' . $year . '-(\d+)/', $latestSale->sale_number, $matches)) {
                $nextNumber = intval($matches[1]) + 1;
            } else {
                $nextNumber = 1;
            }
            
            // Include branch prefix if multi-branch
            $prefix = $branchId ? "INV-B{$branchId}-{$year}-" : "INV-{$year}-";
            $saleNumber = $prefix . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
            
            // Check if this number already exists
            $exists = Sale::where('tenant_id', $tenantId)
                        ->where('sale_number', $saleNumber)
                        ->exists();
            
            if (!$exists) {
                return $saleNumber;
            }
            
            // If it exists, add a small random delay and try again
            usleep(rand(1000, 5000)); // 1-5ms delay
            
        } while ($attempt < $maxAttempts);
        
        // Fallback with timestamp if all attempts failed
        return ($branchId ? "INV-B{$branchId}-" : "INV-") . $year . '-' . str_pad(time() % 1000000, 6, '0', STR_PAD_LEFT);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesman(): BelongsTo
    {
        return $this->belongsTo(User::class, 'salesman_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function maintenanceContracts(): HasMany
    {
        return $this->hasMany(MaintenanceContract::class);
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }

    // Generate Saudi tax invoice format
    public function generateTaxInvoice(): array
    {
        return [
            'invoice_number' => $this->sale_number,
            'date' => $this->sale_date->format('Y-m-d'),
            'supplier' => [
                'name' => $this->tenant->name,
                'tax_number' => $this->tenant->settings['tax_number'] ?? '',
                'cr_number' => $this->tenant->settings['cr_number'] ?? '',
            ],
            'customer' => [
                'name' => $this->customer_name,
                'tax_id' => $this->customer_tax_id,
            ],
            'items' => $this->items->map(function ($item) {
                return [
                    'description' => $item->product->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'tax_rate' => $item->tax_rate,
                    'total' => $item->total_amount,
                ];
            }),
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total' => $this->total_amount,
        ];
    }
}