<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request with comprehensive super admin authentication.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!Auth::check()) {
            return $this->unauthorizedResponse('Authentication required. Please log in.');
        }

        $user = Auth::user();

        // Verify super admin privileges
        if (!$user->isSuperAdmin()) {
            Log::warning('Unauthorized super admin access attempt', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip(),
                'route' => $request->route()?->getName(),
                'url' => $request->fullUrl(),
                'user_agent' => $request->userAgent(),
            ]);

            return $this->unauthorizedResponse('Insufficient privileges. Super admin access required.');
        }

        // Check session timeout (configurable, default 2 hours)
        $sessionTimeout = config('auth.session_timeout', 7200); // 2 hours in seconds
        
        // Only check session timeout if session is available (not in API-only context)
        if ($request->hasSession()) {
            $lastActivity = $request->session()->get('last_activity');
            
            if ($lastActivity && (time() - $lastActivity) > $sessionTimeout) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return response()->json([
                    'message' => 'Session expired. Please log in again.',
                    'error_code' => 'SESSION_EXPIRED',
                    'redirect_to' => '/login'
                ], 401);
            }

            // Update last activity timestamp
            $request->session()->put('last_activity', time());
        }

        // Log successful admin access for audit trail
        Log::info('Super admin access granted', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
            'route' => $request->route()?->getName(),
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'user_agent' => $request->userAgent(),
            'timestamp' => Carbon::now()->toISOString(),
        ]);

        // Add user context to request for downstream middleware
        $request->attributes->set('admin_user', $user);

        return $next($request);
    }

    /**
     * Generate standardized unauthorized response.
     */
    private function unauthorizedResponse(string $message): Response
    {
        return response()->json([
            'message' => $message,
            'error_code' => 'UNAUTHORIZED',
            'timestamp' => Carbon::now()->toISOString(),
        ], 403);
    }
}