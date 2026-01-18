<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Plan;
use App\Models\User;
use App\Models\Subscription;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function dashboard(): JsonResponse
    {
        $stats = [
            'overview' => $this->analyticsService->getOverviewStats(),
            'revenue' => $this->analyticsService->getRevenueStats(),
            'growth' => $this->analyticsService->getGrowthStats(),
            'recent_activity' => $this->analyticsService->getRecentActivity(),
            'performance' => $this->analyticsService->getPerformanceMetrics(),
        ];

        return response()->json($stats);
    }

    public function tenantMetrics(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'plan_id' => 'nullable|exists:plans,id',
            'status' => 'nullable|in:active,suspended,cancelled',
        ]);

        $metrics = $this->analyticsService->getTenantMetrics($filters);

        return response()->json($metrics);
    }

    public function revenueAnalytics(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'required|in:7d,30d,90d,1y,all',
            'group_by' => 'nullable|in:day,week,month,year',
        ]);

        $analytics = $this->analyticsService->getRevenueAnalytics(
            $validated['period'],
            $validated['group_by'] ?? 'month'
        );

        return response()->json($analytics);
    }

    public function userAnalytics(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'tenant_id' => 'nullable|exists:tenants,id',
        ]);

        $analytics = $this->analyticsService->getUserAnalytics($filters);

        return response()->json($analytics);
    }

    public function exportReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:tenants,revenue,users,subscriptions',
            'format' => 'required|in:csv,excel,pdf',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'filters' => 'nullable|array',
        ]);

        $reportData = $this->analyticsService->generateReport(
            $validated['type'],
            $validated['format'],
            [
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
                'filters' => $validated['filters'] ?? [],
            ]
        );

        return response()->json([
            'download_url' => $reportData['url'],
            'filename' => $reportData['filename'],
            'expires_at' => $reportData['expires_at'],
        ]);
    }

    public function systemHealth(): JsonResponse
    {
        $health = $this->analyticsService->getSystemHealth();

        return response()->json($health);
    }

    public function realTimeMetrics(): JsonResponse
    {
        $metrics = $this->analyticsService->getRealTimeMetrics();

        return response()->json($metrics);
    }
}