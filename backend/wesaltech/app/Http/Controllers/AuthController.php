<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use App\Services\BranchContextService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Str;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AuthController extends Controller
{
    protected BranchContextService $branchContext;

    public function __construct(BranchContextService $branchContext)
    {
        $this->branchContext = $branchContext;
    }

    /**
     * Get branch context for user
     */
    private function getBranchContext(User $user): array
    {
        $branches = $this->branchContext->getUserBranches($user);
        $currentBranch = $this->branchContext->getCurrentBranch($user);

        return [
            'branches' => $branches,
            'current_branch' => $currentBranch,
            'has_multiple_branches' => $branches->count() > 1,
        ];
    }

    /**
     * Handle Google OAuth authentication - Simplified for debugging.
     */
    public function googleAuth(Request $request): JsonResponse
    {
        try {
            Log::info('Google OAuth endpoint called', $request->all());
            
            $request->validate([
                'google_id' => 'required|string',
                'email' => 'required|email',
                'name' => 'required|string',
                'avatar' => 'nullable|url',
                'given_name' => 'nullable|string',
                'family_name' => 'nullable|string',
            ]);

            Log::info('Validation passed');

            // Check if user exists by email
            $user = User::where('email', $request->email)->first();
            $isNewUser = false;

            if ($user) {
                Log::info('Existing user found', ['user_id' => $user->id]);
                // Update existing user with Google info
                $user->update([
                    'google_id' => $request->google_id,
                    'avatar' => $request->avatar,
                    'last_login_at' => now(),
                ]);
            } else {
                Log::info('Creating new user and tenant');
                $isNewUser = true;
                
                DB::beginTransaction();
                
                try {
                    // First create tenant
                    $tenant = Tenant::create([
                        'name' => $request->name . "'s Business",
                        'domain' => strtolower(str_replace([' ', "'"], ['-', ''], $request->name)) . '-' . time(),
                        'status' => 'active',
                        'plan_id' => null, // Will be assigned later
                    ]);
                    
                    Log::info('Tenant created', ['tenant_id' => $tenant->id]);

                    // Create user
                    $user = User::create([
                        'name' => $request->name,
                        'email' => $request->email,
                        'google_id' => $request->google_id,
                        'avatar' => $request->avatar,
                        'tenant_id' => $tenant->id,
                        'is_super_admin' => false,
                        'email_verified_at' => now(), // Auto-verify Google users
                        'password' => Hash::make(Str::random(32)), // Random password for Google users
                    ]);
                    
                    Log::info('User created', ['user_id' => $user->id]);

                    // Assign business owner role to the user
                    $user->assignRole('business_owner');
                    
                    Log::info('Business owner role assigned');

                    // Update tenant with owner
                    $tenant->update(['admin_user_id' => $user->id]);
                    
                    Log::info('Tenant updated with admin user');
                    
                    DB::commit();
                    
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Transaction failed', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            }

            // Create token
            $deviceName = $this->getDeviceName($request);
            $token = $user->createToken($deviceName, ['*'], now()->addHours(24))->plainTextToken;
            
            Log::info('Token created successfully');

            // Log successful Google authentication
            Log::info('Google OAuth authentication successful', [
                'user_id' => $user->id,
                'email' => $user->email,
                'google_id' => $request->google_id,
                'is_new_user' => $isNewUser,
                'tenant_id' => $user->tenant_id,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => Carbon::now()->toISOString(),
            ]);

            return response()->json([
                'user' => $user->load(['tenant', 'roles']),
                'token' => $token,
                'message' => 'Google authentication successful',
                'session_timeout' => config('auth.session_timeout', 7200),
                'expires_at' => now()->addHours(24)->toISOString(),
                'branch_context' => $this->getBranchContext($user),
            ]);

        } catch (\Exception $e) {
            Log::error('Google OAuth authentication failed', [
                'email' => $request->email ?? 'unknown',
                'google_id' => $request->google_id ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
                'timestamp' => Carbon::now()->toISOString(),
            ]);

            return response()->json([
                'message' => 'Google authentication failed. Please try again.',
                'error' => $e->getMessage(),
                'debug' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Register a new user and create their tenant.
     */
    public function register(Request $request): JsonResponse
    {
        // Debug logging
        Log::info('Register endpoint called', [
            'all_data' => $request->all(),
            'has_name' => $request->has('name'),
            'has_email' => $request->has('email'),
            'name_value' => $request->input('name'),
            'content_type' => $request->header('Content-Type'),
        ]);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'company_name' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            // Create tenant first
            $tenant = Tenant::create([
                'name' => $request->company_name ?: $request->name . "'s Business",
                'domain' => strtolower(str_replace([' ', "'"], ['-', ''], $request->company_name ?: $request->name)) . '-' . time(),
                'status' => 'active',
                'plan_id' => null, // Will be assigned later
            ]);

            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'tenant_id' => $tenant->id,
                'is_super_admin' => false,
                'email_verified_at' => now(), // Auto-verify for now
                'onboarding_completed' => false,
                'onboarding_step' => 1,
            ]);

            // Try to assign business owner role, but don't fail if it doesn't exist
            try {
                $user->assignRole('business_owner');
                Log::info('Business owner role assigned successfully');
            } catch (\Exception $roleException) {
                Log::warning('Failed to assign business_owner role, user will still be created', [
                    'error' => $roleException->getMessage(),
                    'user_id' => $user->id
                ]);
                // Don't fail the registration if role assignment fails
            }

            // Update tenant with owner
            $tenant->update(['admin_user_id' => $user->id]);

            DB::commit();

            // Create token
            $deviceName = $this->getDeviceName($request);
            $token = $user->createToken($deviceName, ['*'], now()->addHours(24))->plainTextToken;

            // Log successful registration
            Log::info('User registered successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => Carbon::now()->toISOString(),
            ]);

            return response()->json([
                'user' => $user->load(['tenant', 'roles']),
                'token' => $token,
                'message' => 'Registration successful',
                'session_timeout' => config('auth.session_timeout', 7200),
                'expires_at' => now()->addHours(24)->toISOString(),
                'branch_context' => $this->getBranchContext($user),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Registration failed', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
                'timestamp' => Carbon::now()->toISOString(),
            ]);

            return response()->json([
                'message' => 'Registration failed. Please try again.',
                'error' => $e->getMessage(),
                'debug' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Authenticate user and create session with comprehensive logging.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Log failed login attempt
            Log::warning('Failed login attempt', [
                'email' => $request->email,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'timestamp' => Carbon::now()->toISOString(),
            ]);

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last login and create token with device info
        $user->update(['last_login_at' => now()]);

        $deviceName = $this->getDeviceName($request);
        $token = $user->createToken($deviceName, ['*'], now()->addHours(24))->plainTextToken;

        // Initialize session activity tracking (if session is available)
        if ($request->hasSession()) {
            $request->session()->put('last_activity', time());
            $request->session()->put('login_time', time());
        }

        // Log successful login
        Log::info('Successful login', [
            'user_id' => $user->id,
            'email' => $user->email,
            'is_super_admin' => $user->isSuperAdmin(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device_name' => $deviceName,
            'timestamp' => Carbon::now()->toISOString(),
        ]);

        return response()->json([
            'user' => $user->load(['tenant', 'roles']),
            'token' => $token,
            'session_timeout' => config('auth.session_timeout', 7200),
            'expires_at' => now()->addHours(24)->toISOString(),
            'branch_context' => $this->getBranchContext($user),
        ]);
    }

    /**
     * Logout user and revoke current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $tokenId = $request->user()->currentAccessToken()->id;

        // Log logout
        Log::info('User logout', [
            'user_id' => $user->id,
            'email' => $user->email,
            'token_id' => $tokenId,
            'ip' => $request->ip(),
            'timestamp' => Carbon::now()->toISOString(),
        ]);

        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        // Clear session data (if session is available)
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Logout from all devices by revoking all tokens.
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $user = $request->user();

        // Log logout from all devices
        Log::info('User logout from all devices', [
            'user_id' => $user->id,
            'email' => $user->email,
            'active_tokens_count' => $user->tokens()->count(),
            'ip' => $request->ip(),
            'timestamp' => Carbon::now()->toISOString(),
        ]);

        // Revoke all tokens
        $user->tokens()->delete();

        // Clear session data (if session is available)
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Logged out from all devices successfully'
        ]);
    }

    /**
     * Get current authenticated user with session info.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentToken = $user->currentAccessToken();

        return response()->json([
            'user' => $user->load(['tenant', 'roles']),
            'session_info' => [
                'token_name' => $currentToken->name,
                'created_at' => $currentToken->created_at,
                'last_used_at' => $currentToken->last_used_at,
                'expires_at' => $currentToken->expires_at,
            ],
            'active_sessions_count' => $user->tokens()->count(),
            'branch_context' => $this->getBranchContext($user),
        ]);
    }

    /**
     * Get all active sessions for the current user.
     */
    public function activeSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()->id;

        $sessions = $user->tokens()->get()->map(function ($token) use ($currentTokenId) {
            return [
                'id' => $token->id,
                'name' => $token->name,
                'created_at' => $token->created_at,
                'last_used_at' => $token->last_used_at,
                'expires_at' => $token->expires_at,
                'is_current' => $token->id === $currentTokenId,
            ];
        });

        return response()->json([
            'sessions' => $sessions,
            'total_count' => $sessions->count(),
        ]);
    }

    /**
     * Revoke a specific session/token.
     */
    public function revokeSession(Request $request, $tokenId): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()->id;

        // Prevent revoking current session
        if ($tokenId == $currentTokenId) {
            return response()->json([
                'message' => 'Cannot revoke current session. Use logout instead.'
            ], 400);
        }

        $token = $user->tokens()->find($tokenId);

        if (!$token) {
            return response()->json([
                'message' => 'Session not found.'
            ], 404);
        }

        // Log session revocation
        Log::info('Session revoked', [
            'user_id' => $user->id,
            'email' => $user->email,
            'revoked_token_id' => $tokenId,
            'revoked_token_name' => $token->name,
            'ip' => $request->ip(),
            'timestamp' => Carbon::now()->toISOString(),
        ]);

        $token->delete();

        return response()->json([
            'message' => 'Session revoked successfully'
        ]);
    }

    /**
     * Check session status and refresh if needed.
     */
    public function sessionStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // If no session is available, return API-only status
        if (!$request->hasSession()) {
            return response()->json([
                'is_active' => true,
                'time_remaining' => null,
                'session_timeout' => config('auth.session_timeout', 7200),
                'last_activity' => null,
                'session_type' => 'api_only',
            ]);
        }

        $lastActivity = $request->session()->get('last_activity');
        $sessionTimeout = config('auth.session_timeout', 7200);

        $timeRemaining = $lastActivity ? $sessionTimeout - (time() - $lastActivity) : $sessionTimeout;

        return response()->json([
            'is_active' => $timeRemaining > 0,
            'time_remaining' => max(0, $timeRemaining),
            'session_timeout' => $sessionTimeout,
            'last_activity' => $lastActivity ? Carbon::createFromTimestamp($lastActivity)->toISOString() : null,
            'session_type' => 'web',
        ]);
    }

    /**
     * Extend current session.
     */
    public function extendSession(Request $request): JsonResponse
    {
        $user = $request->user();

        // If no session is available, return API-only response
        if (!$request->hasSession()) {
            return response()->json([
                'message' => 'API session extended successfully',
                'session_type' => 'api_only',
                'new_expiry' => null,
            ]);
        }

        // Update session activity
        $request->session()->put('last_activity', time());

        // Log session extension
        Log::info('Session extended', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
            'timestamp' => Carbon::now()->toISOString(),
        ]);

        return response()->json([
            'message' => 'Session extended successfully',
            'session_type' => 'web',
            'new_expiry' => Carbon::now()->addSeconds(config('auth.session_timeout', 7200))->toISOString(),
        ]);
    }

    /**
     * Generate device name from request information.
     */
    private function getDeviceName(Request $request): string
    {
        $userAgent = $request->userAgent();
        $ip = $request->ip();

        // Extract browser and OS info
        $browser = 'Unknown Browser';
        $os = 'Unknown OS';

        if (str_contains($userAgent, 'Chrome')) {
            $browser = 'Chrome';
        } elseif (str_contains($userAgent, 'Firefox')) {
            $browser = 'Firefox';
        } elseif (str_contains($userAgent, 'Safari')) {
            $browser = 'Safari';
        } elseif (str_contains($userAgent, 'Edge')) {
            $browser = 'Edge';
        }

        if (str_contains($userAgent, 'Windows')) {
            $os = 'Windows';
        } elseif (str_contains($userAgent, 'Mac')) {
            $os = 'macOS';
        } elseif (str_contains($userAgent, 'Linux')) {
            $os = 'Linux';
        } elseif (str_contains($userAgent, 'Android')) {
            $os = 'Android';
        } elseif (str_contains($userAgent, 'iOS')) {
            $os = 'iOS';
        }

        return "{$browser} on {$os} ({$ip})";
    }
}