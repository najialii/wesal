<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SimpleAuthController extends Controller
{
    /**
     * Simple registration without complex relationships
     */
    public function register(Request $request): JsonResponse
    {
        Log::info('Simple register endpoint called', $request->all());
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'company_name' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            // Create tenant with minimal data
            $tenant = new Tenant();
            $tenant->name = $request->company_name ?: $request->name . "'s Business";
            $tenant->domain = strtolower(str_replace([' ', "'", '.', '@'], ['-', '', '-', '-'], $request->email)) . '-' . time();
            $tenant->status = 'active';
            $tenant->save();

            // Create user
            $user = new User();
            $user->name = $request->name;
            $user->email = $request->email;
            $user->password = Hash::make($request->password);
            $user->tenant_id = $tenant->id;
            $user->is_super_admin = false;
            $user->email_verified_at = now();
            $user->onboarding_completed = false;
            $user->onboarding_step = 1;
            $user->save();

            // Update tenant with admin user
            $tenant->admin_user_id = $user->id;
            $tenant->save();

            DB::commit();

            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            Log::info('User registered successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'tenant_id' => $tenant->id,
            ]);

            return response()->json([
                'user' => $user->load('tenant'),
                'token' => $token,
                'message' => 'Registration successful',
                'expires_at' => now()->addHours(24)->toISOString(),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Registration failed', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}