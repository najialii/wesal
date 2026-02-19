<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $user = auth()->user();
        
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if (!$user->tenant_id) {
            return response()->json([
                'message' => 'No tenant associated with this user.'
            ], 403);
        }

        if (!$user->tenant || !$user->tenant->isActive()) {
            return response()->json([
                'message' => 'Tenant is not active.'
            ], 403);
        }

        return $next($request);
    }
}