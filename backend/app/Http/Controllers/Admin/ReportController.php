<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReportGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    protected ReportGenerationService $reportService;

    public function __construct(ReportGenerationService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Get available report templates.
     */
    public function templates(): JsonResponse
    {
        return response()->json([
            'templates' => $this->reportService->getAvailableTemplates(),
            'supported_formats' => $this->reportService->getSupportedFormats(),
        ]);
    }

    /**
     * Generate a report.
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'template' => 'required|string',
            'parameters' => 'array',
            'parameters.start_date' => 'nullable|date',
            'parameters.end_date' => 'nullable|date|after_or_equal:parameters.start_date',
            'parameters.format' => 'nullable|string|in:csv,json,pdf,xlsx',
            'parameters.limit' => 'nullable|integer|min:1|max:10000',
            'parameters.sort_by' => 'nullable|string',
            'parameters.sort_order' => 'nullable|string|in:asc,desc',
        ]);

        try {
            $template = $request->input('template');
            $parameters = $request->input('parameters', []);

            $report = $this->reportService->generateReport($template, $parameters);

            return response()->json([
                'success' => true,
                'report' => $report,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export a report to file.
     */
    public function export(Request $request): StreamedResponse|JsonResponse
    {
        $request->validate([
            'template' => 'required|string',
            'format' => 'required|string|in:csv,json,pdf,xlsx',
            'parameters' => 'array',
        ]);

        try {
            $template = $request->input('template');
            $format = $request->input('format');
            $parameters = $request->input('parameters', []);

            // Generate the report
            $report = $this->reportService->generateReport($template, $parameters);

            // Export to file
            $filePath = $this->reportService->exportReport($report, $format);

            // Stream the file download
            return Storage::download($filePath, basename($filePath), [
                'Content-Type' => $this->getContentType($format),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to export report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Schedule a report for automatic generation.
     */
    public function schedule(Request $request): JsonResponse
    {
        $request->validate([
            'template' => 'required|string',
            'schedule' => 'required|string', // cron format
            'parameters' => 'array',
            'parameters.format' => 'nullable|string|in:csv,json,pdf,xlsx',
        ]);

        try {
            $template = $request->input('template');
            $schedule = $request->input('schedule');
            $parameters = $request->input('parameters', []);

            $scheduledReport = $this->reportService->scheduleReport($template, $parameters, $schedule);

            return response()->json([
                'success' => true,
                'scheduled_report' => $scheduledReport,
                'message' => 'Report scheduled successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to schedule report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get scheduled reports.
     */
    public function scheduled(): JsonResponse
    {
        try {
            $scheduledReports = $this->reportService->getScheduledReports();

            return response()->json([
                'success' => true,
                'scheduled_reports' => $scheduledReports,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve scheduled reports: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get report history.
     */
    public function history(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => 'nullable|integer|min:1|max:100',
            'template' => 'nullable|string',
        ]);

        // Mock report history - in a real implementation, this would query a database
        $history = [
            [
                'id' => 'report_001',
                'template' => 'tenant_summary',
                'generated_at' => now()->subHours(2)->toISOString(),
                'parameters' => ['start_date' => '2024-01-01', 'end_date' => '2024-01-31'],
                'status' => 'completed',
                'file_size' => '2.5 MB',
                'download_count' => 3,
            ],
            [
                'id' => 'report_002',
                'template' => 'audit_log',
                'generated_at' => now()->subDays(1)->toISOString(),
                'parameters' => ['start_date' => '2024-01-01', 'risk_level' => 'high'],
                'status' => 'completed',
                'file_size' => '1.2 MB',
                'download_count' => 1,
            ],
            [
                'id' => 'report_003',
                'template' => 'revenue_analysis',
                'generated_at' => now()->subDays(3)->toISOString(),
                'parameters' => ['start_date' => '2023-12-01', 'end_date' => '2023-12-31'],
                'status' => 'completed',
                'file_size' => '856 KB',
                'download_count' => 5,
            ],
        ];

        // Apply filters
        $template = $request->input('template');
        if ($template) {
            $history = array_filter($history, fn($report) => $report['template'] === $template);
        }

        $limit = $request->input('limit', 20);
        $history = array_slice($history, 0, $limit);

        return response()->json([
            'success' => true,
            'history' => array_values($history),
            'total' => count($history),
        ]);
    }

    /**
     * Get report statistics.
     */
    public function statistics(): JsonResponse
    {
        // Mock statistics - in a real implementation, this would query actual data
        $stats = [
            'total_reports_generated' => 156,
            'reports_this_month' => 23,
            'most_popular_template' => 'tenant_summary',
            'total_downloads' => 342,
            'average_generation_time' => '2.3 seconds',
            'templates_usage' => [
                'tenant_summary' => 45,
                'audit_log' => 38,
                'user_activity' => 29,
                'revenue_analysis' => 25,
                'system_health' => 19,
            ],
            'format_preferences' => [
                'csv' => 58,
                'pdf' => 32,
                'json' => 7,
                'xlsx' => 3,
            ],
            'scheduled_reports_active' => 8,
            'last_generated' => now()->subMinutes(15)->toISOString(),
        ];

        return response()->json([
            'success' => true,
            'statistics' => $stats,
        ]);
    }

    /**
     * Validate report parameters.
     */
    public function validateParameters(Request $request): JsonResponse
    {
        $request->validate([
            'template' => 'required|string',
            'parameters' => 'array',
        ]);

        $template = $request->input('template');
        $parameters = $request->input('parameters', []);

        try {
            $templates = $this->reportService->getAvailableTemplates();
            
            if (!isset($templates[$template])) {
                return response()->json([
                    'valid' => false,
                    'errors' => ['template' => 'Invalid template specified'],
                ]);
            }

            $templateConfig = $templates[$template];
            $errors = [];

            // Validate date parameters
            if (isset($parameters['start_date']) && isset($parameters['end_date'])) {
                $startDate = \Carbon\Carbon::parse($parameters['start_date']);
                $endDate = \Carbon\Carbon::parse($parameters['end_date']);
                
                if ($startDate->gt($endDate)) {
                    $errors['date_range'] = 'Start date must be before end date';
                }
                
                if ($startDate->diffInDays($endDate) > 365) {
                    $errors['date_range'] = 'Date range cannot exceed 365 days';
                }
            }

            // Validate format
            if (isset($parameters['format'])) {
                $supportedFormats = $this->reportService->getSupportedFormats();
                if (!in_array($parameters['format'], $supportedFormats)) {
                    $errors['format'] = 'Unsupported export format';
                }
            }

            // Validate limit
            if (isset($parameters['limit'])) {
                $limit = (int)$parameters['limit'];
                if ($limit < 1 || $limit > 10000) {
                    $errors['limit'] = 'Limit must be between 1 and 10,000';
                }
            }

            return response()->json([
                'valid' => empty($errors),
                'errors' => $errors,
                'template_config' => $templateConfig,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'valid' => false,
                'errors' => ['general' => 'Parameter validation failed: ' . $e->getMessage()],
            ], 500);
        }
    }

    /**
     * Get content type for file format.
     */
    protected function getContentType(string $format): string
    {
        return match ($format) {
            'csv' => 'text/csv',
            'json' => 'application/json',
            'pdf' => 'application/pdf',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            default => 'application/octet-stream',
        };
    }
}