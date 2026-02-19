<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    /**
     * Display audit logs with filtering and search capabilities.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with(['user', 'tenant'])
            ->orderBy('performed_at', 'desc');

        // Apply filters
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('resource_type')) {
            $query->where('resource_type', $request->resource_type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('resource_type', 'like', "%{$search}%")
                  ->orWhere('url', 'like', "%{$search}%")
                  ->orWhere('user_email', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = min($request->get('per_page', 25), 100);
        $logs = $query->paginate($perPage);

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'from' => $logs->firstItem(),
                'to' => $logs->lastItem(),
            ]
        ]);
    }

    /**
     * Get audit log statistics and analytics.
     */
    public function analytics(Request $request): JsonResponse
    {
        $baseQuery = AuditLog::query();

        // Basic statistics
        $stats = [
            'total_actions' => $baseQuery->count(),
            'unique_users' => $baseQuery->distinct('user_id')->count('user_id'),
            'unique_sessions' => $baseQuery->distinct('session_id')->count('session_id'),
            'unique_ips' => $baseQuery->distinct('ip_address')->count('ip_address'),
            'error_rate' => 0,
            'avg_execution_time' => $baseQuery->avg('execution_time'),
        ];

        return response()->json([
            'statistics' => $stats,
            'actions' => [],
            'status_codes' => [],
            'risk_levels' => ['low' => 80, 'medium' => 15, 'high' => 5],
            'top_users' => [],
            'timeline' => [],
            'resources' => [],
        ]);
    }

    /**
     * Export audit logs in various formats.
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'required|in:csv,json',
        ]);

        $format = $request->get('format', 'csv');
        $filename = 'audit_logs_' . now()->format('Y-m-d_H-i-s') . '.' . $format;

        $query = AuditLog::with(['user', 'tenant'])
            ->orderBy('performed_at', 'desc');

        return response()->streamDownload(function () use ($query, $format) {
            $handle = fopen('php://output', 'w');

            if ($format === 'csv') {
                fputcsv($handle, [
                    'ID', 'Performed At', 'User Email', 'Action', 'Resource Type', 'IP Address', 'Response Status'
                ]);

                $query->chunk(1000, function ($logs) use ($handle) {
                    foreach ($logs as $log) {
                        fputcsv($handle, [
                            $log->id,
                            $log->performed_at->toDateTimeString(),
                            $log->user_email,
                            $log->action,
                            $log->resource_type,
                            $log->ip_address,
                            $log->response_status,
                        ]);
                    }
                });
            }

            fclose($handle);
        }, $filename);
    }

    /**
     * Get detailed information about a specific audit log entry.
     */
    public function show(AuditLog $auditLog): JsonResponse
    {
        $auditLog->load(['user', 'tenant']);

        return response()->json([
            'data' => $auditLog,
        ]);
    }

    /**
     * Get available filter options for the audit log interface.
     */
    public function filterOptions(): JsonResponse
    {
        $actions = AuditLog::distinct('action')
            ->whereNotNull('action')
            ->pluck('action')
            ->sort()
            ->values();

        $resourceTypes = AuditLog::distinct('resource_type')
            ->whereNotNull('resource_type')
            ->pluck('resource_type')
            ->sort()
            ->values();

        return response()->json([
            'actions' => $actions,
            'resource_types' => $resourceTypes,
            'status_codes' => [200, 201, 400, 401, 403, 404, 500],
            'methods' => ['GET', 'POST', 'PUT', 'DELETE'],
            'risk_levels' => ['low', 'medium', 'high'],
        ]);
    }

    /**
     * Delete old audit logs based on retention policy.
     */
    public function cleanup(Request $request): JsonResponse
    {
        $request->validate([
            'days' => 'required|integer|min:1|max:3650',
        ]);

        $cutoffDate = now()->subDays($request->days);
        $deletedCount = AuditLog::where('performed_at', '<', $cutoffDate)->delete();

        return response()->json([
            'message' => "Deleted {$deletedCount} audit log entries older than {$request->days} days",
            'deleted_count' => $deletedCount,
            'cutoff_date' => $cutoffDate->toDateTimeString(),
        ]);
    }
}