<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ReportGenerationService
{
    protected array $reportTemplates = [
        'tenant_summary' => [
            'name' => 'Tenant Summary Report',
            'description' => 'Overview of all tenants with key metrics',
            'data_source' => 'tenants',
            'fields' => ['name', 'status', 'created_at', 'plan', 'users_count'],
        ],
        'user_activity' => [
            'name' => 'User Activity Report',
            'description' => 'User login and activity patterns',
            'data_source' => 'users',
            'fields' => ['name', 'email', 'last_login_at', 'login_count', 'tenant'],
        ],
        'audit_log' => [
            'name' => 'Audit Log Report',
            'description' => 'Administrative actions and security events',
            'data_source' => 'audit_logs',
            'fields' => ['performed_at', 'user_email', 'action', 'resource_type', 'ip_address', 'response_status'],
        ],
        'revenue_analysis' => [
            'name' => 'Revenue Analysis Report',
            'description' => 'Financial performance and subscription metrics',
            'data_source' => 'subscriptions',
            'fields' => ['tenant', 'plan', 'amount', 'payment_status', 'created_at'],
        ],
        'system_health' => [
            'name' => 'System Health Report',
            'description' => 'System performance and error analysis',
            'data_source' => 'audit_logs',
            'fields' => ['performed_at', 'response_status', 'execution_time', 'error_count'],
        ],
    ];

    protected array $supportedFormats = ['csv', 'json', 'pdf', 'xlsx'];

    /**
     * Get available report templates.
     */
    public function getAvailableTemplates(): array
    {
        return $this->reportTemplates;
    }

    /**
     * Get supported export formats.
     */
    public function getSupportedFormats(): array
    {
        return $this->supportedFormats;
    }

    /**
     * Generate a report based on template and parameters.
     */
    public function generateReport(string $template, array $parameters = []): array
    {
        if (!isset($this->reportTemplates[$template])) {
            throw new \InvalidArgumentException("Unknown report template: {$template}");
        }

        $templateConfig = $this->reportTemplates[$template];
        $cacheKey = $this->generateCacheKey($template, $parameters);

        // Check cache first (cache for 5 minutes)
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $data = $this->fetchReportData($template, $parameters);
        $processedData = $this->processReportData($data, $templateConfig, $parameters);

        $report = [
            'template' => $template,
            'template_config' => $templateConfig,
            'parameters' => $parameters,
            'generated_at' => now()->toISOString(),
            'data_count' => count($processedData),
            'data' => $processedData,
            'summary' => $this->generateSummary($processedData, $template),
        ];

        // Cache the report
        Cache::put($cacheKey, $report, now()->addMinutes(5));

        return $report;
    }

    /**
     * Export report to specified format.
     */
    public function exportReport(array $report, string $format): string
    {
        if (!in_array($format, $this->supportedFormats)) {
            throw new \InvalidArgumentException("Unsupported export format: {$format}");
        }

        $filename = $this->generateFilename($report['template'], $format);
        $filePath = "reports/{$filename}";

        switch ($format) {
            case 'csv':
                $content = $this->exportToCsv($report);
                break;
            case 'json':
                $content = $this->exportToJson($report);
                break;
            case 'pdf':
                $content = $this->exportToPdf($report);
                break;
            case 'xlsx':
                $content = $this->exportToXlsx($report);
                break;
            default:
                throw new \InvalidArgumentException("Unsupported format: {$format}");
        }

        Storage::disk('local')->put($filePath, $content);

        return $filePath;
    }

    /**
     * Schedule a report for generation.
     */
    public function scheduleReport(string $template, array $parameters, string $schedule): array
    {
        $scheduledReport = [
            'id' => uniqid('report_'),
            'template' => $template,
            'parameters' => $parameters,
            'schedule' => $schedule, // cron format
            'created_at' => now()->toISOString(),
            'next_run' => $this->calculateNextRun($schedule),
            'status' => 'scheduled',
        ];

        // In a real implementation, this would be stored in a database
        // and processed by a queue worker or scheduler
        Cache::put("scheduled_report_{$scheduledReport['id']}", $scheduledReport, now()->addDays(30));

        return $scheduledReport;
    }

    /**
     * Get scheduled reports.
     */
    public function getScheduledReports(): array
    {
        // In a real implementation, this would query a database
        // For now, we'll return a mock response
        return [
            [
                'id' => 'report_daily_summary',
                'template' => 'tenant_summary',
                'schedule' => '0 9 * * *', // Daily at 9 AM
                'next_run' => now()->addDay()->setHour(9)->setMinute(0)->toISOString(),
                'status' => 'scheduled',
            ],
            [
                'id' => 'report_weekly_audit',
                'template' => 'audit_log',
                'schedule' => '0 10 * * 1', // Weekly on Monday at 10 AM
                'next_run' => now()->next('Monday')->setHour(10)->setMinute(0)->toISOString(),
                'status' => 'scheduled',
            ],
        ];
    }

    /**
     * Fetch raw data for report generation.
     */
    protected function fetchReportData(string $template, array $parameters): \Illuminate\Support\Collection
    {
        $startDate = isset($parameters['start_date']) ? Carbon::parse($parameters['start_date']) : now()->subMonth();
        $endDate = isset($parameters['end_date']) ? Carbon::parse($parameters['end_date']) : now();

        switch ($template) {
            case 'tenant_summary':
                return $this->fetchTenantData($startDate, $endDate, $parameters);
            
            case 'user_activity':
                return $this->fetchUserActivityData($startDate, $endDate, $parameters);
            
            case 'audit_log':
                return $this->fetchAuditLogData($startDate, $endDate, $parameters);
            
            case 'revenue_analysis':
                return $this->fetchRevenueData($startDate, $endDate, $parameters);
            
            case 'system_health':
                return $this->fetchSystemHealthData($startDate, $endDate, $parameters);
            
            default:
                throw new \InvalidArgumentException("Unknown template: {$template}");
        }
    }

    /**
     * Fetch tenant data for reports.
     */
    protected function fetchTenantData(Carbon $startDate, Carbon $endDate, array $parameters): \Illuminate\Support\Collection
    {
        $query = Tenant::with(['plan', 'users'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if (isset($parameters['status'])) {
            $query->where('status', $parameters['status']);
        }

        if (isset($parameters['plan_id'])) {
            $query->where('plan_id', $parameters['plan_id']);
        }

        return $query->get()->map(function ($tenant) {
            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'domain' => $tenant->domain,
                'status' => $tenant->status,
                'plan' => $tenant->plan?->name ?? 'No Plan',
                'users_count' => $tenant->users->count(),
                'created_at' => $tenant->created_at->toDateString(),
                'trial_ends_at' => $tenant->trial_ends_at?->toDateString(),
            ];
        });
    }

    /**
     * Fetch user activity data for reports.
     */
    protected function fetchUserActivityData(Carbon $startDate, Carbon $endDate, array $parameters): \Illuminate\Support\Collection
    {
        $query = User::with(['tenant'])
            ->whereBetween('created_at', [$startDate, $endDate]);

        if (isset($parameters['tenant_id'])) {
            $query->where('tenant_id', $parameters['tenant_id']);
        }

        if (isset($parameters['is_super_admin'])) {
            $query->where('is_super_admin', $parameters['is_super_admin']);
        }

        return $query->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'tenant' => $user->tenant?->name ?? 'No Tenant',
                'is_super_admin' => $user->is_super_admin ? 'Yes' : 'No',
                'last_login_at' => $user->last_login_at?->toDateTimeString() ?? 'Never',
                'created_at' => $user->created_at->toDateString(),
                'email_verified_at' => $user->email_verified_at?->toDateString() ?? 'Not Verified',
            ];
        });
    }

    /**
     * Fetch audit log data for reports.
     */
    protected function fetchAuditLogData(Carbon $startDate, Carbon $endDate, array $parameters): \Illuminate\Support\Collection
    {
        $query = AuditLog::with(['user', 'tenant'])
            ->whereBetween('performed_at', [$startDate, $endDate]);

        if (isset($parameters['user_id'])) {
            $query->where('user_id', $parameters['user_id']);
        }

        if (isset($parameters['action'])) {
            $query->where('action', $parameters['action']);
        }

        if (isset($parameters['risk_level'])) {
            // This would need to be implemented based on the risk level calculation
            switch ($parameters['risk_level']) {
                case 'high':
                    $query->where('response_status', '>=', 500);
                    break;
                case 'medium':
                    $query->whereBetween('response_status', [400, 499]);
                    break;
                case 'low':
                    $query->where('response_status', '<', 400);
                    break;
            }
        }

        return $query->orderBy('performed_at', 'desc')
            ->limit(10000) // Limit to prevent memory issues
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'performed_at' => $log->performed_at->toDateTimeString(),
                    'user_email' => $log->user_email,
                    'user_name' => $log->user_name,
                    'action' => $log->action,
                    'resource_type' => $log->resource_type,
                    'resource_id' => $log->resource_id,
                    'method' => $log->method,
                    'url' => $log->url,
                    'ip_address' => $log->ip_address,
                    'response_status' => $log->response_status,
                    'execution_time' => $log->execution_time,
                    'risk_level' => $log->risk_level,
                    'tenant' => $log->tenant?->name ?? 'System',
                ];
            });
    }

    /**
     * Fetch revenue data for reports.
     */
    protected function fetchRevenueData(Carbon $startDate, Carbon $endDate, array $parameters): \Illuminate\Support\Collection
    {
        // Mock revenue data since Subscription model might not have all fields
        return collect([
            [
                'tenant' => 'Example Tenant 1',
                'plan' => 'Premium Plan',
                'amount' => 99.99,
                'payment_status' => 'paid',
                'created_at' => now()->subDays(5)->toDateString(),
                'billing_cycle' => 'monthly',
            ],
            [
                'tenant' => 'Example Tenant 2',
                'plan' => 'Basic Plan',
                'amount' => 29.99,
                'payment_status' => 'paid',
                'created_at' => now()->subDays(10)->toDateString(),
                'billing_cycle' => 'monthly',
            ],
        ]);
    }

    /**
     * Fetch system health data for reports.
     */
    protected function fetchSystemHealthData(Carbon $startDate, Carbon $endDate, array $parameters): \Illuminate\Support\Collection
    {
        return AuditLog::whereBetween('performed_at', [$startDate, $endDate])
            ->select([
                DB::raw('DATE(performed_at) as date'),
                DB::raw('COUNT(*) as total_requests'),
                DB::raw('AVG(execution_time) as avg_execution_time'),
                DB::raw('COUNT(CASE WHEN response_status >= 400 THEN 1 END) as error_count'),
                DB::raw('COUNT(CASE WHEN response_status >= 500 THEN 1 END) as server_error_count'),
                DB::raw('MAX(execution_time) as max_execution_time'),
            ])
            ->groupBy(DB::raw('DATE(performed_at)'))
            ->orderBy('date')
            ->get()
            ->map(function ($row) {
                $errorRate = $row->total_requests > 0 ? ($row->error_count / $row->total_requests) * 100 : 0;
                
                return [
                    'date' => $row->date,
                    'total_requests' => $row->total_requests,
                    'avg_execution_time' => round($row->avg_execution_time, 2),
                    'max_execution_time' => $row->max_execution_time,
                    'error_count' => $row->error_count,
                    'server_error_count' => $row->server_error_count,
                    'error_rate' => round($errorRate, 2),
                    'health_status' => $errorRate < 1 ? 'Healthy' : ($errorRate < 5 ? 'Warning' : 'Critical'),
                ];
            });
    }

    /**
     * Process raw data according to template configuration.
     */
    protected function processReportData(\Illuminate\Support\Collection $data, array $templateConfig, array $parameters): array
    {
        // Apply any additional processing based on parameters
        $processedData = $data->toArray();

        // Apply sorting if specified
        if (isset($parameters['sort_by'])) {
            $sortBy = $parameters['sort_by'];
            $sortOrder = $parameters['sort_order'] ?? 'asc';
            
            usort($processedData, function ($a, $b) use ($sortBy, $sortOrder) {
                $aVal = $a[$sortBy] ?? '';
                $bVal = $b[$sortBy] ?? '';
                
                $comparison = $aVal <=> $bVal;
                return $sortOrder === 'desc' ? -$comparison : $comparison;
            });
        }

        // Apply limit if specified
        if (isset($parameters['limit'])) {
            $processedData = array_slice($processedData, 0, (int)$parameters['limit']);
        }

        return $processedData;
    }

    /**
     * Generate summary statistics for the report.
     */
    protected function generateSummary(array $data, string $template): array
    {
        $summary = [
            'total_records' => count($data),
            'generated_at' => now()->toDateTimeString(),
        ];

        switch ($template) {
            case 'tenant_summary':
                $summary['active_tenants'] = count(array_filter($data, fn($t) => $t['status'] === 'active'));
                $summary['total_users'] = array_sum(array_column($data, 'users_count'));
                break;
                
            case 'audit_log':
                $summary['error_count'] = count(array_filter($data, fn($l) => $l['response_status'] >= 400));
                $summary['avg_execution_time'] = count($data) > 0 ? 
                    round(array_sum(array_column($data, 'execution_time')) / count($data), 2) : 0;
                break;
                
            case 'revenue_analysis':
                $summary['total_revenue'] = array_sum(array_column($data, 'amount'));
                $summary['paid_subscriptions'] = count(array_filter($data, fn($s) => $s['payment_status'] === 'paid'));
                break;
                
            case 'system_health':
                if (count($data) > 0) {
                    $summary['avg_daily_requests'] = round(array_sum(array_column($data, 'total_requests')) / count($data));
                    $summary['overall_error_rate'] = round(array_sum(array_column($data, 'error_rate')) / count($data), 2);
                }
                break;
        }

        return $summary;
    }

    /**
     * Export report data to CSV format.
     */
    protected function exportToCsv(array $report): string
    {
        if (empty($report['data'])) {
            return "No data available\n";
        }

        $output = fopen('php://temp', 'r+');
        
        // Write header
        fputcsv($output, array_keys($report['data'][0]));
        
        // Write data rows
        foreach ($report['data'] as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }

    /**
     * Export report data to JSON format.
     */
    protected function exportToJson(array $report): string
    {
        return json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Export report data to PDF format.
     */
    protected function exportToPdf(array $report): string
    {
        // In a real implementation, this would use a PDF library like TCPDF or DomPDF
        // For now, we'll return a simple text representation
        $content = "Report: {$report['template_config']['name']}\n";
        $content .= "Generated: {$report['generated_at']}\n";
        $content .= "Records: {$report['data_count']}\n\n";
        
        $content .= "Summary:\n";
        foreach ($report['summary'] as $key => $value) {
            $content .= "- {$key}: {$value}\n";
        }
        
        $content .= "\nData:\n";
        foreach ($report['data'] as $index => $row) {
            $content .= "Record " . ($index + 1) . ":\n";
            foreach ($row as $key => $value) {
                $content .= "  {$key}: {$value}\n";
            }
            $content .= "\n";
        }
        
        return $content;
    }

    /**
     * Export report data to Excel format.
     */
    protected function exportToXlsx(array $report): string
    {
        // In a real implementation, this would use a library like PhpSpreadsheet
        // For now, we'll return CSV format as a placeholder
        return $this->exportToCsv($report);
    }

    /**
     * Generate cache key for report.
     */
    protected function generateCacheKey(string $template, array $parameters): string
    {
        return 'report_' . $template . '_' . md5(serialize($parameters));
    }

    /**
     * Generate filename for exported report.
     */
    protected function generateFilename(string $template, string $format): string
    {
        return $template . '_' . now()->format('Y-m-d_H-i-s') . '.' . $format;
    }

    /**
     * Calculate next run time for scheduled report.
     */
    protected function calculateNextRun(string $schedule): string
    {
        // Simple implementation - in reality, you'd use a cron parser
        switch ($schedule) {
            case '0 9 * * *': // Daily at 9 AM
                return now()->addDay()->setHour(9)->setMinute(0)->toISOString();
            case '0 10 * * 1': // Weekly on Monday at 10 AM
                return now()->next('Monday')->setHour(10)->setMinute(0)->toISOString();
            default:
                return now()->addHour()->toISOString();
        }
    }
}