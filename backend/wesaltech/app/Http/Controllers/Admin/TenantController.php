<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::with(['plan', 'creator'])
            ->withCount(['subscriptions']);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('domain', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->get('plan_id'));
        }

        if ($request->boolean('without_plan')) {
            $query->whereNull('plan_id');
        }

        $tenants = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        // Add logo URLs to each tenant
        $tenants->getCollection()->transform(function ($tenant) {
            $tenant->logo_url = $tenant->getLogoUrlAttribute();
            return $tenant;
        });

        return response()->json($tenants);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'domain' => 'required|string|unique:tenants,domain|regex:/^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/',
            'plan_id' => 'required|exists:plans,id',
            'trial_days' => 'nullable|integer|min:0|max:365',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['created_by'] = auth()->id();
        $validated['status'] = 'active';

        if (isset($validated['trial_days']) && $validated['trial_days'] > 0) {
            $validated['trial_ends_at'] = now()->addDays($validated['trial_days']);
        }

        $tenant = Tenant::create($validated);

        return response()->json([
            'message' => 'Tenant created successfully',
            'tenant' => $tenant->load(['plan', 'creator'])
        ], 201);
    }

    public function storeOrganization(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'domain' => 'required|string|max:100|regex:/^[a-z0-9-]+$/|unique:tenants,domain',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'nullable|string|min:6',
            'plan_id' => 'required|exists:plans,id',
            'trial_days' => 'nullable|integer|min:0|max:365',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        \DB::beginTransaction();
        
        try {
            $tenantData = [
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']),
                'domain' => $validated['domain'], // Store subdomain as-is
                'plan_id' => $validated['plan_id'],
                'status' => 'active',
                'created_by' => auth()->id(),
                'trial_ends_at' => isset($validated['trial_days']) && $validated['trial_days'] > 0 
                    ? now()->addDays($validated['trial_days']) 
                    : null,
            ];

            // Handle logo upload
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('tenant-logos', 'public');
                $tenantData['logo'] = $logoPath;
            }

            // Create the tenant first
            $tenant = Tenant::create($tenantData);

            // Use custom password or default
            $password = $validated['admin_password'] ?? 'password123';

            // Create the admin user
            $adminUser = \App\Models\User::create([
                'name' => $validated['admin_name'],
                'email' => $validated['admin_email'],
                'password' => \Hash::make($password),
                'tenant_id' => $tenant->id,
                'is_super_admin' => false,
                'email_verified_at' => now(),
            ]);

            // Link the admin user to the tenant
            $tenant->update(['admin_user_id' => $adminUser->id]);

            // Assign admin role to the user (if using Spatie roles)
            if (method_exists($adminUser, 'assignRole') && class_exists('\Spatie\Permission\Models\Role')) {
                try {
                    // Check if tenant_admin role exists
                    $role = \Spatie\Permission\Models\Role::where('name', 'tenant_admin')->first();
                    if ($role) {
                        $adminUser->assignRole('tenant_admin');
                    }
                } catch (\Exception $e) {
                    // Role assignment failed, but continue - this is not critical
                    \Log::warning('Failed to assign role to admin user', [
                        'user_id' => $adminUser->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Create subscription if plan exists
            $plan = \App\Models\Plan::find($validated['plan_id']);
            if ($plan) {
                $tenant->subscriptions()->create([
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'amount' => $plan->price,
                    'billing_cycle' => $plan->billing_cycle,
                    'starts_at' => now(),
                    'ends_at' => $this->calculateSubscriptionEndDate($plan),
                ]);
            }

            \DB::commit();

            return response()->json([
                'message' => 'Organization created successfully',
                'id' => $tenant->id,
                'tenant' => $tenant->load(['plan', 'creator', 'admin']),
                'admin_user' => [
                    'name' => $adminUser->name,
                    'email' => $adminUser->email,
                    'default_password' => $password
                ]
            ], 201);

        } catch (\Exception $e) {
            \DB::rollback();
            \Log::error('Organization creation failed', [
                'error' => $e->getMessage(),
                'data' => $validated
            ]);
            
            return response()->json([
                'message' => 'Failed to create organization',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $tenant->load(['plan', 'creator', 'subscriptions.plan']);
        
        // Get admin user information
        $adminUser = $tenant->getAdminUser();
        if ($adminUser) {
            $tenant->admin = [
                'id' => $adminUser->id,
                'name' => $adminUser->name,
                'email' => $adminUser->email,
                'last_login_at' => $adminUser->last_login_at,
            ];
        }

        // Add logo URL
        $tenant->logo_url = $tenant->getLogoUrlAttribute();

        return response()->json($tenant);
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'domain' => [
                'sometimes',
                'string',
                Rule::unique('tenants', 'domain')->ignore($tenant->id),
                'regex:/^[a-z0-9-]+$/'
            ],
            'admin_name' => 'sometimes|string|max:255',
            'admin_email' => [
                'sometimes',
                'email',
                Rule::unique('users', 'email')->ignore($tenant->admin_user_id),
            ],
            'admin_password' => 'nullable|string|min:6',
            'plan_id' => 'sometimes|exists:plans,id',
            'status' => 'sometimes|in:active,suspended,cancelled',
            'settings' => 'sometimes|array',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'remove_logo' => 'sometimes|boolean',
        ]);

        \DB::beginTransaction();
        
        try {
            // Update tenant information
            $tenantData = collect($validated)->except(['admin_name', 'admin_email', 'admin_password', 'logo', 'remove_logo'])->toArray();
            
            if (isset($validated['name'])) {
                $tenantData['slug'] = Str::slug($validated['name']);
            }

            // Handle logo upload
            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($tenant->logo && \Storage::disk('public')->exists($tenant->logo)) {
                    \Storage::disk('public')->delete($tenant->logo);
                }
                
                $logoPath = $request->file('logo')->store('tenant-logos', 'public');
                $tenantData['logo'] = $logoPath;
            } elseif (isset($validated['remove_logo']) && $validated['remove_logo']) {
                // Remove logo if requested
                if ($tenant->logo && \Storage::disk('public')->exists($tenant->logo)) {
                    \Storage::disk('public')->delete($tenant->logo);
                }
                $tenantData['logo'] = null;
            }

            $tenant->update($tenantData);

            // Update admin user if admin fields are provided
            if (isset($validated['admin_name']) || isset($validated['admin_email']) || isset($validated['admin_password'])) {
                $adminUser = $tenant->getAdminUser();
                
                if ($adminUser) {
                    $adminData = [];
                    if (isset($validated['admin_name'])) {
                        $adminData['name'] = $validated['admin_name'];
                    }
                    if (isset($validated['admin_email'])) {
                        $adminData['email'] = $validated['admin_email'];
                    }
                    if (isset($validated['admin_password']) && !empty($validated['admin_password'])) {
                        $adminData['password'] = \Hash::make($validated['admin_password']);
                    }
                    
                    if (!empty($adminData)) {
                        $adminUser->update($adminData);
                    }
                } else {
                    // If no admin user exists and we have admin data, create one
                    if (isset($validated['admin_name']) && isset($validated['admin_email'])) {
                        $password = $validated['admin_password'] ?? 'password123';
                        $adminUser = \App\Models\User::create([
                            'name' => $validated['admin_name'],
                            'email' => $validated['admin_email'],
                            'password' => \Hash::make($password),
                            'tenant_id' => $tenant->id,
                            'is_super_admin' => false,
                            'email_verified_at' => now(),
                        ]);
                        
                        $tenant->update(['admin_user_id' => $adminUser->id]);
                        
                        if (method_exists($adminUser, 'assignRole') && class_exists('\Spatie\Permission\Models\Role')) {
                            try {
                                // Check if tenant_admin role exists
                                $role = \Spatie\Permission\Models\Role::where('name', 'tenant_admin')->first();
                                if ($role) {
                                    $adminUser->assignRole('tenant_admin');
                                }
                            } catch (\Exception $e) {
                                // Role assignment failed, but continue - this is not critical
                                \Log::warning('Failed to assign role to admin user', [
                                    'user_id' => $adminUser->id,
                                    'error' => $e->getMessage()
                                ]);
                            }
                        }
                    }
                }
            }

            \DB::commit();

            // Debug logging
            \Log::info('Tenant Update Debug', [
                'tenant_id' => $tenant->id,
                'original_name' => $tenant->name,
                'validated_data' => $validated,
                'request_data' => $request->all()
            ]);

            return response()->json([
                'message' => 'Organization updated successfully',
                'tenant' => $this->formatTenantResponse($tenant->fresh(['plan', 'creator']))
            ]);
            
        } catch (\Exception $e) {
            \DB::rollback();
            \Log::error('Organization update failed', [
                'error' => $e->getMessage(),
                'tenant_id' => $tenant->id,
                'data' => $validated
            ]);
            
            return response()->json([
                'message' => 'Failed to update organization',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Tenant $tenant): JsonResponse
    {
        $tenant->delete();

        return response()->json([
            'message' => 'Tenant deleted successfully'
        ]);
    }

    public function suspend(Tenant $tenant): JsonResponse
    {
        $tenant->update(['status' => 'suspended']);

        return response()->json([
            'message' => 'Tenant suspended successfully',
            'tenant' => $tenant->fresh()
        ]);
    }

    public function activate(Tenant $tenant): JsonResponse
    {
        $tenant->update(['status' => 'active']);

        return response()->json([
            'message' => 'Tenant activated successfully',
            'tenant' => $tenant->fresh()
        ]);
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::where('status', 'active')->count(),
            'suspended_tenants' => Tenant::where('status', 'suspended')->count(),
            'trial_tenants' => Tenant::whereNotNull('trial_ends_at')
                ->where('trial_ends_at', '>', now())->count(),
            'recent_tenants' => Tenant::where('created_at', '>=', now()->subDays(30))->count(),
        ];

        return response()->json($stats);
    }

    public function assignPlan(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
        ]);

        $plan = Plan::find($validated['plan_id']);
        
        $tenant->update([
            'plan_id' => $plan->id,
            'status' => 'active'
        ]);

        // Create subscription record if needed
        if (!$tenant->subscriptions()->where('plan_id', $plan->id)->where('status', 'active')->exists()) {
            $tenant->subscriptions()->create([
                'plan_id' => $plan->id,
                'status' => 'active',
                'amount' => $plan->price,
                'billing_cycle' => $plan->billing_cycle,
                'starts_at' => now(),
                'ends_at' => $this->calculateSubscriptionEndDate($plan),
            ]);
        }

        return response()->json([
            'message' => 'Plan assigned successfully',
            'tenant' => $tenant->fresh(['plan'])
        ]);
    }

    public function unassignPlan(Tenant $tenant): JsonResponse
    {
        // Cancel active subscriptions
        $tenant->subscriptions()
            ->where('status', 'active')
            ->update(['status' => 'cancelled', 'ends_at' => now()]);

        $tenant->update(['plan_id' => null]);

        return response()->json([
            'message' => 'Plan unassigned successfully',
            'tenant' => $tenant->fresh(['plan'])
        ]);
    }

    public function resetAdminPassword(Tenant $tenant): JsonResponse
    {
        $adminUser = $tenant->getAdminUser();
        
        if (!$adminUser) {
            return response()->json([
                'message' => 'No admin user found for this organization'
            ], 404);
        }

        // Generate a new temporary password
        $newPassword = 'temp' . rand(1000, 9999);
        $adminUser->update([
            'password' => \Hash::make($newPassword)
        ]);

        \Log::info('Admin password reset', [
            'tenant_id' => $tenant->id,
            'admin_user_id' => $adminUser->id,
            'reset_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Admin password reset successfully',
            'admin_email' => $adminUser->email,
            'new_password' => $newPassword
        ]);
    }

    private function calculateSubscriptionEndDate(Plan $plan): \Carbon\Carbon
    {
        return match ($plan->billing_cycle) {
            'monthly' => now()->addMonth(),
            'yearly' => now()->addYear(),
            'lifetime' => now()->addYears(100), // Effectively lifetime
            default => now()->addMonth(),
        };
    }
}