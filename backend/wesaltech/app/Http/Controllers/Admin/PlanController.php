<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Plan::withCount(['tenants', 'subscriptions']);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $plans = $query->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,yearly,lifetime',
            'features' => 'nullable|array',
            'limits' => 'nullable|array',
            'trial_days' => 'nullable|integer|min:0|max:365',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['sort_order'] = $validated['sort_order'] ?? Plan::max('sort_order') + 1;

        $plan = Plan::create($validated);

        return response()->json([
            'message' => 'Plan created successfully',
            'plan' => $plan
        ], 201);
    }

    public function show(Plan $plan): JsonResponse
    {
        return response()->json(
            $plan->loadCount(['tenants', 'subscriptions'])
        );
    }

    public function update(Request $request, Plan $plan): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'billing_cycle' => 'sometimes|in:monthly,yearly,lifetime',
            'features' => 'nullable|array',
            'limits' => 'nullable|array',
            'trial_days' => 'nullable|integer|min:0|max:365',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $plan->update($validated);

        return response()->json([
            'message' => 'Plan updated successfully',
            'plan' => $plan->fresh()
        ]);
    }

    public function destroy(Plan $plan): JsonResponse
    {
        if ($plan->tenants()->exists()) {
            return response()->json([
                'message' => 'Cannot delete plan with active tenants'
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'message' => 'Plan deleted successfully'
        ]);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plans' => 'required|array',
            'plans.*.id' => 'required|exists:plans,id',
            'plans.*.sort_order' => 'required|integer',
        ]);

        foreach ($validated['plans'] as $planData) {
            Plan::where('id', $planData['id'])
                ->update(['sort_order' => $planData['sort_order']]);
        }

        return response()->json([
            'message' => 'Plans reordered successfully'
        ]);
    }

    public function analytics(Plan $plan): JsonResponse
    {
        $analytics = [
            'plan_id' => $plan->id,
            'plan_name' => $plan->name,
            'total_tenants' => $plan->tenants()->count(),
            'active_tenants' => $plan->tenants()->where('status', 'active')->count(),
            'total_revenue' => $plan->subscriptions()->sum('amount'),
            'monthly_revenue' => $plan->subscriptions()
                ->where('created_at', '>=', now()->startOfMonth())
                ->sum('amount'),
            'growth_rate' => $this->calculateGrowthRate($plan),
            'churn_rate' => $this->calculateChurnRate($plan),
            'usage_metrics' => $this->getUsageMetrics($plan),
        ];

        return response()->json($analytics);
    }

    public function tenants(Plan $plan): JsonResponse
    {
        $tenants = $plan->tenants()
            ->with(['plan'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($tenants);
    }

    private function calculateGrowthRate(Plan $plan): float
    {
        $currentMonth = $plan->tenants()
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
        
        $lastMonth = $plan->tenants()
            ->whereBetween('created_at', [
                now()->subMonth()->startOfMonth(),
                now()->subMonth()->endOfMonth()
            ])
            ->count();

        if ($lastMonth === 0) {
            return $currentMonth > 0 ? 100.0 : 0.0;
        }

        return (($currentMonth - $lastMonth) / $lastMonth) * 100;
    }

    private function calculateChurnRate(Plan $plan): float
    {
        $totalTenants = $plan->tenants()->count();
        $cancelledThisMonth = $plan->tenants()
            ->where('status', 'cancelled')
            ->where('updated_at', '>=', now()->startOfMonth())
            ->count();

        if ($totalTenants === 0) {
            return 0.0;
        }

        return ($cancelledThisMonth / $totalTenants) * 100;
    }

    private function getUsageMetrics(Plan $plan): array
    {
        // This would typically aggregate usage data from tenant analytics
        // For now, return sample data based on plan limits
        $metrics = [];
        
        foreach ($plan->limits as $key => $limit) {
            // Simulate usage data - in real implementation, this would query actual usage
            $usage = rand(0, $limit);
            $metrics[$key] = $usage;
        }

        return $metrics;
    }
}