<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\ProfileUpdateRequest;
use App\Http\Requests\Business\PasswordChangeRequest;
use App\Http\Requests\Business\BusinessUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class SettingsController extends Controller
{
    /**
     * Get authenticated user's profile information
     */
    public function getProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'language' => $user->language ?? 'en',
        ]);
    }

    /**
     * Update authenticated user's profile
     */
    public function updateProfile(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        
        $user->update($request->validated());
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'language' => $user->language,
            ]
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(PasswordChangeRequest $request): JsonResponse
    {
        $user = $request->user();
        
        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'The current password is incorrect',
                'errors' => [
                    'current_password' => ['The current password is incorrect']
                ]
            ], 422);
        }
        
        // Update password
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);
        
        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Get business information for authenticated user's tenant
     */
    public function getBusinessInfo(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenant = $user->tenant;
        
        if (!$tenant) {
            return response()->json([
                'message' => 'Business information not found'
            ], 404);
        }
        
        return response()->json([
            'name' => $tenant->name,
            'email' => $tenant->email,
            'phone' => $tenant->phone,
            'address' => $tenant->address,
            'city' => $tenant->city,
            'country' => $tenant->country,
            'tax_id' => $tenant->tax_id,
            'currency' => $tenant->currency ?? 'SAR',
            'timezone' => $tenant->timezone ?? 'Asia/Riyadh',
            'logo' => $tenant->logo,
            'logo_url' => $tenant->logo_url,
        ]);
    }

    /**
     * Update business information (business owners only)
     */
    public function updateBusinessInfo(BusinessUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        
        // Check if user is business owner using Spatie roles
        if (!$user->hasRole('business_owner')) {
            return response()->json([
                'message' => 'Unauthorized. Only business owners can update business information.'
            ], 403);
        }
        
        $tenant = $user->tenant;
        
        if (!$tenant) {
            return response()->json([
                'message' => 'Business information not found'
            ], 404);
        }
        
        $tenant->update($request->validated());
        
        return response()->json([
            'message' => 'Business information updated successfully',
            'data' => [
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'address' => $tenant->address,
                'city' => $tenant->city,
                'country' => $tenant->country,
                'tax_id' => $tenant->tax_id,
                'currency' => $tenant->currency,
                'timezone' => $tenant->timezone,
            ]
        ]);
    }
}
