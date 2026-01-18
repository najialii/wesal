<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class StaffController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::where('tenant_id', auth()->user()->tenant_id)
            ->where('is_super_admin', false)
            ->with(['roles', 'branches']);
        
        // Filter by branch if provided
        if ($request->has('branch_id') && $request->get('branch_id')) {
            $branchId = $request->get('branch_id');
            $query->whereHas('branches', function ($q) use ($branchId) {
                $q->where('branches.id', $branchId);
            });
        }
        
        $staff = $query->when($request->get('search'), function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->get('role'), function ($query, $role) {
                return $query->whereHas('roles', function ($q) use ($role) {
                    $q->where('name', $role);
                });
            })
            ->orderBy('name')
            ->paginate($request->get('per_page', 15));

        return response()->json($staff);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:tenant_admin,manager,salesman,technician,business_owner',
            'branch_ids' => 'nullable|array',
            'branch_ids.*' => 'integer|exists:branches,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'tenant_id' => auth()->user()->tenant_id,
            'email_verified_at' => now(),
            'onboarding_completed' => true, // Staff members don't need onboarding
        ]);

        $user->assignRole($validated['role']);

        // Assign branches if provided
        if (!empty($validated['branch_ids'])) {
            // Verify all branches belong to the same tenant
            $branches = \App\Models\Branch::whereIn('id', $validated['branch_ids'])
                                          ->where('tenant_id', auth()->user()->tenant_id)
                                          ->pluck('id');
            
            if ($branches->count() > 0) {
                $user->branches()->attach($branches);
            }
        }

        return response()->json([
            'message' => 'Staff member created successfully',
            'user' => $user->load(['roles', 'branches'])
        ], 201);
    }

    public function show($userId): JsonResponse
    {
        $user = User::where('tenant_id', auth()->user()->tenant_id)
                   ->where('id', $userId)
                   ->firstOrFail();
                   
        $this->authorize('view', $user);
        
        return response()->json($user->load(['roles', 'branches']));
    }

    public function update(Request $request, $userId): JsonResponse
    {
        $user = User::where('tenant_id', auth()->user()->tenant_id)
                   ->where('id', $userId)
                   ->firstOrFail();
                   
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|in:tenant_admin,manager,salesman,technician,business_owner',
            'branch_ids' => 'nullable|array',
            'branch_ids.*' => 'integer|exists:branches,id',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Remove branch_ids from validated data before updating user
        $branchIds = $validated['branch_ids'] ?? null;
        unset($validated['branch_ids']);

        $user->update($validated);

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        // Update branch assignments if provided
        if ($branchIds !== null) {
            // Verify all branches belong to the same tenant
            $branches = \App\Models\Branch::whereIn('id', $branchIds)
                                          ->where('tenant_id', auth()->user()->tenant_id)
                                          ->pluck('id');
            
            $user->branches()->sync($branches);
        }

        return response()->json([
            'message' => 'Staff member updated successfully',
            'user' => $user->fresh(['roles', 'branches'])
        ]);
    }

    public function destroy($userId): JsonResponse
    {
        $user = User::where('tenant_id', auth()->user()->tenant_id)
                   ->where('id', $userId)
                   ->firstOrFail();
                   
        $this->authorize('delete', $user);

        // Don't allow deleting the last tenant admin
        if ($user->hasRole('tenant_admin')) {
            $adminCount = User::where('tenant_id', $user->tenant_id)
                ->whereHas('roles', function ($q) {
                    $q->where('name', 'tenant_admin');
                })->count();

            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot delete the last tenant administrator'
                ], 422);
            }
        }

        $user->delete();

        return response()->json([
            'message' => 'Staff member deleted successfully'
        ]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::whereIn('name', ['tenant_admin', 'manager', 'salesman', 'technician'])
            ->get(['name', 'id']);

        return response()->json($roles);
    }

    /**
     * Get staff member's branch assignments
     */
    public function getBranches($userId): JsonResponse
    {
        $user = User::where('tenant_id', auth()->user()->tenant_id)
                   ->where('id', $userId)
                   ->firstOrFail();

        $branches = $user->branches()->withPivot('is_manager')->get();

        return response()->json([
            'branches' => $branches,
            'total' => $branches->count()
        ]);
    }

    /**
     * Assign staff member to branches
     */
    public function assignBranches(Request $request, $userId): JsonResponse
    {
        $user = User::where('tenant_id', auth()->user()->tenant_id)
                   ->where('id', $userId)
                   ->firstOrFail();

        $validated = $request->validate([
            'branch_ids' => 'required|array',
            'branch_ids.*' => 'required|integer|exists:branches,id',
            'is_manager' => 'sometimes|array',
            'is_manager.*' => 'boolean',
        ]);

        // Verify all branches belong to the same tenant
        $branches = \App\Models\Branch::whereIn('id', $validated['branch_ids'])
                                      ->where('tenant_id', auth()->user()->tenant_id)
                                      ->pluck('id');

        if ($branches->count() !== count($validated['branch_ids'])) {
            return response()->json([
                'error' => 'INVALID_BRANCHES',
                'message' => 'Some branches do not belong to your tenant'
            ], 422);
        }

        // Prepare sync data with manager status
        $syncData = [];
        foreach ($validated['branch_ids'] as $index => $branchId) {
            $syncData[$branchId] = [
                'is_manager' => $validated['is_manager'][$index] ?? false
            ];
        }

        $user->branches()->sync($syncData);

        return response()->json([
            'message' => 'Branch assignments updated successfully',
            'branches' => $user->branches()->withPivot('is_manager')->get()
        ]);
    }

    /**
     * Remove staff member from a branch
     */
    public function removeBranch($userId, $branchId): JsonResponse
    {
        $user = User::where('tenant_id', auth()->user()->tenant_id)
                   ->where('id', $userId)
                   ->firstOrFail();

        // Verify branch belongs to tenant
        $branch = \App\Models\Branch::where('id', $branchId)
                                    ->where('tenant_id', auth()->user()->tenant_id)
                                    ->firstOrFail();

        $user->branches()->detach($branchId);

        return response()->json([
            'message' => 'Branch assignment removed successfully'
        ]);
    }

    /**
     * Get staff member's activity timeline
     */
    public function getActivities(Request $request, $userId): JsonResponse
    {
        $user = User::where('tenant_id', auth()->user()->tenant_id)
                   ->where('id', $userId)
                   ->firstOrFail();

        $perPage = $request->get('per_page', 10);
        
        // Get activities from audit logs
        $activities = \App\Models\AuditLog::where('user_id', $userId)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->orderBy('performed_at', 'desc')
            ->paginate($perPage);

        // Also get sales made by this staff member (using salesman_id)
        $salesCount = \App\Models\Sale::where('salesman_id', $userId)->count();
        $totalSalesAmount = \App\Models\Sale::where('salesman_id', $userId)->sum('total_amount') ?? 0;
        
        // Get maintenance visits if technician
        $maintenanceVisits = 0;
        if ($user->hasRole('technician')) {
            $maintenanceVisits = \App\Models\MaintenanceVisit::where('technician_id', $userId)->count();
        }

        return response()->json([
            'activities' => $activities,
            'summary' => [
                'total_sales' => $salesCount,
                'total_sales_amount' => $totalSalesAmount,
                'maintenance_visits' => $maintenanceVisits,
            ]
        ]);
    }

    /**
     * Generate staff report (single or multiple)
     */
    public function generateReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'staff_ids' => 'required|array|min:1',
            'staff_ids.*' => 'integer|exists:users,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? now()->toDateString();

        $staffMembers = User::where('tenant_id', $tenantId)
            ->whereIn('id', $validated['staff_ids'])
            ->with(['roles', 'branches'])
            ->get();

        $reports = [];

        foreach ($staffMembers as $staff) {
            // Get sales data (using salesman_id)
            $salesQuery = \App\Models\Sale::where('salesman_id', $staff->id);
            if ($dateFrom) {
                $salesQuery->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $salesQuery->whereDate('created_at', '<=', $dateTo);
            }
            
            $salesCount = (clone $salesQuery)->count();
            $totalSalesAmount = (clone $salesQuery)->sum('total_amount') ?? 0;
            $avgSaleAmount = $salesCount > 0 ? $totalSalesAmount / $salesCount : 0;

            // Get maintenance visits if technician
            $maintenanceVisits = 0;
            $completedVisits = 0;
            if ($staff->hasRole('technician')) {
                $visitsQuery = \App\Models\MaintenanceVisit::where('technician_id', $staff->id);
                if ($dateFrom) {
                    $visitsQuery->whereDate('created_at', '>=', $dateFrom);
                }
                if ($dateTo) {
                    $visitsQuery->whereDate('created_at', '<=', $dateTo);
                }
                $maintenanceVisits = (clone $visitsQuery)->count();
                $completedVisits = (clone $visitsQuery)->where('status', 'completed')->count();
            }

            // Get activity count
            $activityQuery = \App\Models\AuditLog::where('user_id', $staff->id)
                ->where('tenant_id', $tenantId);
            if ($dateFrom) {
                $activityQuery->whereDate('performed_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $activityQuery->whereDate('performed_at', '<=', $dateTo);
            }
            $activityCount = $activityQuery->count();

            // Get recent activities
            $recentActivities = \App\Models\AuditLog::where('user_id', $staff->id)
                ->where('tenant_id', $tenantId)
                ->orderBy('performed_at', 'desc')
                ->limit(10)
                ->get(['action', 'resource_type', 'resource_id', 'performed_at', 'request_data']);

            $reports[] = [
                'staff' => [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'email' => $staff->email,
                    'role' => $staff->roles->first()?->name ?? 'N/A',
                    'is_active' => $staff->is_active ?? true,
                    'joined_at' => $staff->created_at,
                    'branches' => $staff->branches->map(fn($b) => ['id' => $b->id, 'name' => $b->name]),
                ],
                'performance' => [
                    'total_sales' => $salesCount,
                    'total_sales_amount' => round((float)$totalSalesAmount, 2),
                    'average_sale_amount' => round((float)$avgSaleAmount, 2),
                    'maintenance_visits' => $maintenanceVisits,
                    'completed_visits' => $completedVisits,
                    'activity_count' => $activityCount,
                ],
                'recent_activities' => $recentActivities,
            ];
        }

        return response()->json([
            'reports' => $reports,
            'generated_at' => now()->toIso8601String(),
            'date_range' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ],
            'tenant' => [
                'id' => $tenantId,
                'name' => auth()->user()->tenant?->name ?? 'N/A',
            ],
        ]);
    }
}
