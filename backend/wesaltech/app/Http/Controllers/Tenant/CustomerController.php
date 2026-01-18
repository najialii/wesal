<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CustomerController extends Controller
{
    use AuthorizesRequests;

    public function __construct()
    {
        // Authorization handled by policies
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);

        $customers = Customer::when($request->get('search'), function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->get('type'), function ($query, $type) {
                return $query->where('type', $type);
            })
            ->when($request->has('active_only'), function ($query) {
                return $query->active();
            })
            ->orderBy('name')
            ->paginate($request->get('per_page', 15));

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'secondary_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'type' => 'required|in:individual,business',
            'tax_number' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $validated['credit_limit'] = $validated['credit_limit'] ?? 0;

        $customer = Customer::create($validated);

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer
        ], 201);
    }

    public function show($customerId): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        $this->authorize('view', $customer);
        
        $customer->load(['sales' => function ($query) {
            $query->latest()->take(10);
        }]);
        
        $customer->loadCount('sales');
        $customer->total_purchases = $customer->getTotalPurchasesAttribute();
        $customer->last_purchase_date = $customer->getLastPurchaseDateAttribute();
        
        return response()->json($customer);
    }

    public function update(Request $request, $customerId): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        $this->authorize('update', $customer);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'secondary_phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'type' => 'sometimes|in:individual,business',
            'tax_number' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'current_balance' => 'nullable|numeric',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $customer->update($validated);

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer->fresh()
        ]);
    }

    public function destroy($customerId): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        $this->authorize('delete', $customer);

        if ($customer->sales()->exists()) {
            return response()->json([
                'message' => 'Cannot delete customer with existing sales records'
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully'
        ]);
    }

    public function active(): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);

        $customers = Customer::active()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'type', 'credit_limit', 'current_balance']);

        return response()->json($customers);
    }

    public function search(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);

        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $customers = Customer::active()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('phone', 'like', "%{$query}%");
            })
            ->orderBy('name')
            ->limit(10)
            ->get(['id', 'name', 'phone', 'type', 'credit_limit', 'current_balance']);

        return response()->json($customers);
    }

    public function checkCredit($customerId, Request $request): JsonResponse
    {
        $customer = Customer::findOrFail($customerId);
        $this->authorize('view', $customer);

        $amount = $request->get('amount', 0);
        
        return response()->json([
            'can_purchase' => $customer->canPurchase($amount),
            'credit_limit' => $customer->credit_limit,
            'current_balance' => $customer->current_balance,
            'available_credit' => $customer->getAvailableCreditAttribute(),
        ]);
    }
}