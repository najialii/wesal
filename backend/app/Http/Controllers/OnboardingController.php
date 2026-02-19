<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class OnboardingController extends Controller
{
    /**
     * Get current onboarding status for authenticated user
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'onboarding_completed' => $user->onboarding_completed,
            'current_step' => $user->onboarding_step,
            'tenant' => $user->tenant ? [
                'id' => $user->tenant->id,
                'name' => $user->tenant->name,
                'logo' => $user->tenant->logo,
            ] : null,
        ]);
    }

    /**
     * Update business setup (logo, type, branches)
     */
    public function updateBusinessSetup(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant associated with user',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'logo' => 'nullable|image|max:5120', // 5MB max
            'business_type' => 'required|in:small,medium,large',
            'branch_name' => 'nullable|string|max:255',
            'branch_address' => 'nullable|string|max:500',
            'branch_phone' => 'nullable|string|max:20',
        ]);

        // Debug: Log the business setup request
        \Log::info('Business setup request:', [
            'all_data' => $request->all(),
            'business_type' => $request->input('business_type'),
            'has_business_type' => $request->has('business_type'),
            'user_id' => $user->id,
            'tenant_id' => $user->tenant_id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $data = [];
            
            // Handle logo upload
            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($user->tenant->logo) {
                    Storage::disk('public')->delete($user->tenant->logo);
                }
                
                $logoPath = $request->file('logo')->store('logos', 'public');
                $data['logo'] = $logoPath;
            }

            // Store business type in tenant settings
            $data['business_type'] = $request->input('business_type');

            // Update tenant
            $user->tenant->update($data);

            // Create first branch if branch data is provided
            if ($request->filled('branch_name') || $request->filled('branch_address') || $request->filled('branch_phone')) {
                // Generate a unique branch code
                $branchName = $request->input('branch_name', 'Main Branch');
                $baseCode = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', substr($branchName, 0, 4)));
                if (strlen($baseCode) < 2) {
                    $baseCode = 'MAIN';
                }
                $branchCode = $baseCode . '-001';
                
                // Ensure code is unique
                $counter = 1;
                while (\App\Models\Branch::where('tenant_id', $user->tenant_id)->where('code', $branchCode)->exists()) {
                    $counter++;
                    $branchCode = $baseCode . '-' . str_pad($counter, 3, '0', STR_PAD_LEFT);
                }

                $branchData = [
                    'tenant_id' => $user->tenant_id,
                    'name' => $branchName,
                    'code' => $branchCode,
                    'address' => $request->input('branch_address'),
                    'phone' => $request->input('branch_phone'),
                    'is_active' => true,
                    'is_default' => true,
                ];

                // Check if main branch already exists
                $existingMainBranch = \App\Models\Branch::where('tenant_id', $user->tenant_id)
                    ->where('is_default', true)
                    ->first();

                if (!$existingMainBranch) {
                    \App\Models\Branch::create($branchData);
                    Log::info('Main branch created during business setup', [
                        'tenant_id' => $user->tenant_id,
                        'branch_name' => $branchData['name']
                    ]);
                }
            }

            // Mark onboarding as complete
            $user->onboarding_completed = true;
            $user->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Business setup completed',
                'onboarding_completed' => true,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Business setup failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Business setup failed. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update business profile (Step 1)
     */
    public function updateBusinessProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant associated with user',
            ], 400);
        }

        // Debug: Log incoming request data
        \Log::info('Onboarding request data:', [
            'all' => $request->all(),
            'files' => $request->allFiles(),
            'has_name' => $request->has('name'),
            'name_value' => $request->input('name'),
            'user_id' => $user->id,
            'user_tenant_id' => $user->tenant_id,
            'has_tenant' => !!$user->tenant,
        ]);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'logo' => 'nullable|image|max:5120', // 5MB max
            'phone' => 'required|string|max:20',
            // 'email' => 'required|email|max:255',
            'address' => 'required|string|max:500',
            'tax_number' => 'nullable|string|max:50',
            'cr_number' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed:', [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        
        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($user->tenant->logo) {
                Storage::disk('public')->delete($user->tenant->logo);
            }
            
            $logoPath = $request->file('logo')->store('logos', 'public');
            $data['logo'] = $logoPath;
        }

        // Update tenant
        $user->tenant->update($data);

        // Mark onboarding as complete - use direct property assignment
        $user->onboarding_completed = true;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Business profile updated',
            'onboarding_completed' => true,
        ]);
    }

    /**
     * Create first product (Step 2)
     */
    public function createFirstProduct(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant associated with user',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        
        // Create product
        $product = $user->tenant->products()->create([
            'name' => $data['name'],
            'sku' => $data['sku'],
            'selling_price' => $data['price'],
            'stock_quantity' => $data['stock_quantity'],
            'unit' => $data['unit'],
            'is_active' => true,
        ]);

        // Update user's onboarding step
        $user->update(['onboarding_step' => 3]);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
            ],
            'next_step' => 3,
        ]);
    }

    /**
     * Create first technician (Step 3)
     */
    public function createFirstTechnician(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user->tenant) {
            return response()->json([
                'success' => false,
                'message' => 'No tenant associated with user',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        
        // Generate random password
        $password = \Illuminate\Support\Str::random(12);
        
        // Create technician user
        $technician = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => Hash::make($password),
            'tenant_id' => $user->tenant_id,
            'email_verified_at' => now(),
        ]);

        // Assign technician role
        $technician->assignRole('technician');

        // TODO: Send welcome email with credentials
        // This would typically use Laravel's Mail facade
        // Mail::to($technician->email)->send(new WelcomeTechnicianMail($technician, $password));

        // Mark onboarding as complete
        $user->update([
            'onboarding_completed' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Technician account created',
            'technician' => [
                'id' => $technician->id,
                'name' => $technician->name,
                'email' => $technician->email,
            ],
            'onboarding_completed' => true,
        ]);
    }
}
