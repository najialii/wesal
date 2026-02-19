<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    /**
     * Get audit logs for the business owner's tenant
     * Only business owners can access this
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Only business owners can view audit logs
        if (!$user->isTenantAdmin()) {
            return response()->json([
                'error' => 'UNAUTHORIZED',
                'message' => 'Only business owners can view audit logs'
            ], 403);
        }

        $perPage = $request->input('per_page', 50);
        $search = $request->input('search');
        $action = $request->input('action');
        $userId = $request->input('user_id');

        // Query audit logs for this tenant
        $query = DB::table('audit_logs')
            ->where('tenant_id', $user->tenant_id)
            ->select(
                'id',
                'user_id',
                'user_name',
                'user_email',
                'action',
                'resource_type as entity_type',
                'resource_id as entity_id',
                DB::raw("CONCAT(action, ' ', COALESCE(resource_type, ''), ' ', COALESCE(resource_id, '')) as description"),
                'ip_address',
                'user_agent',
                'performed_at as created_at'
            )
            ->orderBy('performed_at', 'desc');

        // Apply filters
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('resource_type', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%");
            });
        }

        if ($action) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get audit log statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isTenantAdmin()) {
            return response()->json([
                'error' => 'UNAUTHORIZED',
                'message' => 'Only business owners can view audit log statistics'
            ], 403);
        }

        // Get total logs count
        $totalLogs = DB::table('audit_logs')
            ->where('tenant_id', $user->tenant_id)
            ->count();

        // Get logs by action type
        $logsByAction = DB::table('audit_logs')
            ->where('tenant_id', $user->tenant_id)
            ->select('action', DB::raw('count(*) as count'))
            ->groupBy('action')
            ->get();

        // Get most active users
        $mostActiveUsers = DB::table('audit_logs')
            ->where('tenant_id', $user->tenant_id)
            ->whereNotNull('user_id')
            ->select('user_id', 'user_name', 'user_email', DB::raw('count(*) as action_count'))
            ->groupBy('user_id', 'user_name', 'user_email')
            ->orderBy('action_count', 'desc')
            ->limit(10)
            ->get();

        // Get recent activity (last 7 days)
        $recentActivity = DB::table('audit_logs')
            ->where('tenant_id', $user->tenant_id)
            ->where('performed_at', '>=', now()->subDays(7))
            ->select(DB::raw('DATE(performed_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'total_logs' => $totalLogs,
            'logs_by_action' => $logsByAction,
            'most_active_users' => $mostActiveUsers,
            'recent_activity' => $recentActivity,
        ]);
    }
}
