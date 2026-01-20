<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TenantDataController;
use App\Http\Controllers\Api\LanguageController;

// Authentication Routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/google', [AuthController::class, 'googleAuth']);

// Debug endpoint to test request format
Route::post('/auth/test-login', function(Request $request) {
    \Log::info('Test login endpoint called', [
        'all_data' => $request->all(),
        'json_data' => $request->json()->all(),
        'input_email' => $request->input('email'),
        'input_password' => $request->input('password'),
        'content_type' => $request->header('Content-Type'),
        'method' => $request->method(),
    ]);
    
    return response()->json([
        'received' => $request->all(),
        'headers' => [
            'content_type' => $request->header('Content-Type'),
            'accept' => $request->header('Accept'),
        ],
    ]);
});

// Super simple test - no validation
Route::post('/auth/simple-test', function(Request $request) {
    return response()->json(['status' => 'ok', 'data' => $request->all()]);
});

// Test route for debugging
Route::post('/test-google', function(Request $request) {
    try {
        Log::info('Test Google endpoint called', $request->all());
        
        // Test basic validation
        $request->validate([
            'google_id' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string',
        ]);
        
        return response()->json([
            'message' => 'Test endpoint working',
            'received_data' => $request->all(),
            'timestamp' => now()->toISOString()
        ]);
    } catch (\Exception $e) {
        Log::error('Test endpoint error', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::post('/auth/logout-all', [AuthController::class, 'logoutAll'])->middleware('auth:sanctum');
Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::get('/auth/sessions', [AuthController::class, 'activeSessions'])->middleware('auth:sanctum');
Route::delete('/auth/sessions/{token_id}', [AuthController::class, 'revokeSession'])->middleware('auth:sanctum');
Route::get('/auth/session-status', [AuthController::class, 'sessionStatus'])->middleware('auth:sanctum');
Route::post('/auth/extend-session', [AuthController::class, 'extendSession'])->middleware('auth:sanctum');

// Language Routes
Route::get('/languages', [LanguageController::class, 'getAvailableLanguages']);

// Authenticated Language Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/language', [LanguageController::class, 'getUserLanguage']);
    Route::put('/user/language', [LanguageController::class, 'updateUserLanguage']);
    Route::delete('/user/language', [LanguageController::class, 'removeUserLanguage']);
    
    Route::get('/tenant/language', [LanguageController::class, 'getTenantLanguage']);
    Route::put('/tenant/language', [LanguageController::class, 'updateTenantLanguage']);
});

// Onboarding Routes
Route::middleware('auth:sanctum')->prefix('onboarding')->group(function () {
    Route::get('/status', [\App\Http\Controllers\OnboardingController::class, 'status']);
    Route::put('/business-profile', [\App\Http\Controllers\OnboardingController::class, 'updateBusinessProfile']);
    Route::put('/business-setup', [\App\Http\Controllers\OnboardingController::class, 'updateBusinessSetup']);
    Route::post('/first-product', [\App\Http\Controllers\OnboardingController::class, 'createFirstProduct']);
    Route::post('/first-technician', [\App\Http\Controllers\OnboardingController::class, 'createFirstTechnician']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Debug endpoint to check user status
Route::get('/debug/user-status', function(Request $request) {
    $user = $request->user();
    if (!$user) {
        return response()->json(['error' => 'Not authenticated'], 401);
    }
    
    return response()->json([
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'tenant_id' => $user->tenant_id,
            'is_super_admin' => $user->is_super_admin,
        ],
        'roles' => $user->getRoleNames(),
        'is_tenant_admin' => $user->isTenantAdmin(),
        'tenant' => $user->tenant ? [
            'id' => $user->tenant->id,
            'name' => $user->tenant->name,
            'created_by' => $user->tenant->created_by,
        ] : null,
        'assigned_branches' => $user->branches()->get()->map(function($branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'is_active' => $branch->is_active,
                'is_manager' => $branch->pivot->is_manager ?? false,
            ];
        }),
        'all_tenant_branches' => \App\Models\Branch::where('tenant_id', $user->tenant_id)->get()->map(function($branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'is_active' => $branch->is_active,
            ];
        }),
    ]);
})->middleware('auth:sanctum');

// Admin Routes (Super Admin only)
Route::prefix('admin')->middleware(['auth:sanctum', 'super_admin', 'audit'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/tenant-metrics', [DashboardController::class, 'tenantMetrics']);
    
    // Analytics
    Route::prefix('analytics')->group(function () {
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::get('/tenant-metrics', [AnalyticsController::class, 'tenantMetrics']);
        Route::get('/revenue', [AnalyticsController::class, 'revenueAnalytics']);
        Route::get('/users', [AnalyticsController::class, 'userAnalytics']);
        Route::post('/export', [AnalyticsController::class, 'exportReport']);
        Route::get('/system-health', [AnalyticsController::class, 'systemHealth']);
        Route::get('/real-time', [AnalyticsController::class, 'realTimeMetrics']);
    });
    
    // Settings Management
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingsController::class, 'index']);
        Route::post('/', [SettingsController::class, 'create']);
        Route::put('/', [SettingsController::class, 'update']);
        Route::get('/categories', [SettingsController::class, 'categories']);
        Route::post('/export', [SettingsController::class, 'export']);
        Route::post('/import', [SettingsController::class, 'import']);
        Route::post('/validate', [SettingsController::class, 'validateSettings']);
        Route::get('/{key}', [SettingsController::class, 'show']);
        Route::delete('/{key}', [SettingsController::class, 'destroy']);
        Route::get('/{key}/history', [SettingsController::class, 'history']);
        Route::post('/{key}/rollback', [SettingsController::class, 'rollback']);
    });
    
    // Tenant Management
    Route::apiResource('tenants', TenantController::class);
    Route::post('/organizations', [TenantController::class, 'storeOrganization']);
    Route::post('/tenants/{tenant}/suspend', [TenantController::class, 'suspend']);
    Route::post('/tenants/{tenant}/activate', [TenantController::class, 'activate']);
    Route::post('/tenants/{tenant}/reset-admin-password', [TenantController::class, 'resetAdminPassword']);
    Route::get('/tenants-stats', [TenantController::class, 'stats']);
    
    // Plan Management
    Route::apiResource('plans', PlanController::class);
    Route::post('/plans/reorder', [PlanController::class, 'reorder']);
    Route::get('/plans/{plan}/analytics', [PlanController::class, 'analytics']);
    Route::get('/plans/{plan}/tenants', [PlanController::class, 'tenants']);
    
    // Tenant Plan Assignment
    Route::post('/tenants/{tenant}/assign-plan', [TenantController::class, 'assignPlan']);
    Route::delete('/tenants/{tenant}/assign-plan', [TenantController::class, 'unassignPlan']);
    
    // Report Generation and Management
    Route::prefix('reports')->group(function () {
        Route::get('/templates', [ReportController::class, 'templates']);
        Route::post('/generate', [ReportController::class, 'generate']);
        Route::post('/export', [ReportController::class, 'export']);
        Route::post('/schedule', [ReportController::class, 'schedule']);
        Route::get('/scheduled', [ReportController::class, 'scheduled']);
        Route::get('/history', [ReportController::class, 'history']);
        Route::get('/statistics', [ReportController::class, 'statistics']);
        Route::post('/validate-parameters', [ReportController::class, 'validateParameters']);
    });
});

// Tenant Routes (Tenant-specific data)
Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
    // Notification Routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
        Route::get('/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount']);
        Route::post('/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
        Route::post('/{notification}/mark-read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::post('/fcm-token', [\App\Http\Controllers\NotificationController::class, 'registerFCMToken']);
        Route::delete('/fcm-token', [\App\Http\Controllers\NotificationController::class, 'removeFCMToken']);
    });
    
    // Tenant dashboard and stats
    Route::get('/tenant/stats', [TenantDataController::class, 'tenantStats']);
    
    // Category management (tenant admin only)
    Route::apiResource('/tenant/categories', \App\Http\Controllers\Tenant\CategoryController::class);
    Route::get('/tenant/categories-active', [\App\Http\Controllers\Tenant\CategoryController::class, 'active']);
    
    // Product management
    Route::apiResource('/tenant/products', \App\Http\Controllers\Tenant\ProductController::class);
    Route::get('/tenant/products-low-stock', [\App\Http\Controllers\Tenant\ProductController::class, 'lowStock']);
    Route::post('/tenant/products/bulk-assign-branch', [\App\Http\Controllers\Tenant\ProductController::class, 'bulkAssignBranch']);
    Route::get('/tenant/products/available-branches', [\App\Http\Controllers\Tenant\ProductController::class, 'availableBranches']);
    Route::get('/tenant/products/{id}/branch-details', [\App\Http\Controllers\Tenant\ProductController::class, 'branchDetails']);
    
    // Customer management
    Route::apiResource('/tenant/customers', \App\Http\Controllers\Tenant\CustomerController::class);
    Route::get('/tenant/customers-active', [\App\Http\Controllers\Tenant\CustomerController::class, 'active']);
    Route::get('/tenant/customers-search', [\App\Http\Controllers\Tenant\CustomerController::class, 'search']);
    Route::get('/tenant/customers/{customer}/check-credit', [\App\Http\Controllers\Tenant\CustomerController::class, 'checkCredit']);
    
    // Staff management (tenant admin and managers)
    Route::apiResource('/tenant/staff', \App\Http\Controllers\Tenant\StaffController::class);
    Route::get('/tenant/staff-roles', [\App\Http\Controllers\Tenant\StaffController::class, 'roles']);
    Route::get('/tenant/staff/{id}/branches', [\App\Http\Controllers\Tenant\StaffController::class, 'getBranches']);
    Route::post('/tenant/staff/{id}/branches', [\App\Http\Controllers\Tenant\StaffController::class, 'assignBranches']);
    Route::delete('/tenant/staff/{id}/branches/{branchId}', [\App\Http\Controllers\Tenant\StaffController::class, 'removeBranch']);
    Route::get('/tenant/staff/{id}/activities', [\App\Http\Controllers\Tenant\StaffController::class, 'getActivities']);
    Route::post('/tenant/staff/report', [\App\Http\Controllers\Tenant\StaffController::class, 'generateReport']);
    
    // POS System
    Route::get('/pos/products', [\App\Http\Controllers\Business\POSController::class, 'products']);
    Route::get('/pos/categories', [\App\Http\Controllers\Business\POSController::class, 'categories']);
    Route::get('/pos/maintenance-products', [\App\Http\Controllers\Business\POSController::class, 'getMaintenanceProducts']);
    Route::post('/pos/sales', [\App\Http\Controllers\Business\POSController::class, 'createSale']);
    Route::get('/pos/sales/{sale}', [\App\Http\Controllers\Business\POSController::class, 'getSale']);
    Route::get('/pos/daily-sales', [\App\Http\Controllers\Business\POSController::class, 'dailySales']);
    
    // Maintenance Management System
    Route::prefix('maintenance')->group(function () {
        // Dashboard and overview
        Route::get('/dashboard', [\App\Http\Controllers\Business\MaintenanceController::class, 'dashboard']);
        Route::get('/calendar', [\App\Http\Controllers\Business\MaintenanceController::class, 'calendar']);
        
        // Maintenance contracts
        Route::get('/contracts', [\App\Http\Controllers\Business\MaintenanceController::class, 'getContracts']);
        Route::post('/contracts', [\App\Http\Controllers\Business\MaintenanceController::class, 'storeContract']);
        Route::get('/contracts/{id}', [\App\Http\Controllers\Business\MaintenanceController::class, 'showContract']);
        Route::put('/contracts/{id}', [\App\Http\Controllers\Business\MaintenanceController::class, 'updateContract']);
        Route::delete('/contracts/{id}', [\App\Http\Controllers\Business\MaintenanceController::class, 'destroyContract']);
        
        // Contract expiration and renewal
        Route::post('/contracts/{id}/handle-expiration', [\App\Http\Controllers\Business\MaintenanceController::class, 'handleExpiration']);
        Route::post('/contracts/{id}/renew', [\App\Http\Controllers\Business\MaintenanceController::class, 'createRenewal']);
        Route::get('/contracts/expiring', [\App\Http\Controllers\Business\MaintenanceController::class, 'getExpiringContracts']);
        
        // Maintenance visits
        Route::get('/visits', [\App\Http\Controllers\Business\MaintenanceController::class, 'index']);
        Route::post('/visits', [\App\Http\Controllers\Business\MaintenanceController::class, 'store']);
        Route::get('/visits/{maintenanceVisit}', [\App\Http\Controllers\Business\MaintenanceController::class, 'show']);
        Route::put('/visits/{maintenanceVisit}', [\App\Http\Controllers\Business\MaintenanceController::class, 'update']);
        Route::post('/visits/{maintenanceVisit}/start', [\App\Http\Controllers\Business\MaintenanceController::class, 'startVisit']);
        Route::post('/visits/{maintenanceVisit}/complete', [\App\Http\Controllers\Business\MaintenanceController::class, 'completeVisit']);
        Route::post('/visits/{maintenanceVisit}/reschedule', [\App\Http\Controllers\Business\MaintenanceController::class, 'reschedule']);
        Route::post('/visits/{maintenanceVisit}/cancel', [\App\Http\Controllers\Business\MaintenanceController::class, 'cancel']);
        
        // Support data
        Route::get('/workers', [\App\Http\Controllers\Business\MaintenanceController::class, 'getWorkers']);
        Route::get('/products', [\App\Http\Controllers\Business\MaintenanceController::class, 'getMaintenanceProducts']);
    });
    
    // Business Settings
    Route::prefix('business/settings')->group(function () {
        Route::get('/profile', [\App\Http\Controllers\Business\SettingsController::class, 'getProfile']);
        Route::put('/profile', [\App\Http\Controllers\Business\SettingsController::class, 'updateProfile']);
        Route::post('/password', [\App\Http\Controllers\Business\SettingsController::class, 'changePassword']);
        Route::get('/business', [\App\Http\Controllers\Business\SettingsController::class, 'getBusinessInfo']);
        Route::put('/business', [\App\Http\Controllers\Business\SettingsController::class, 'updateBusinessInfo']);
    });
    
    // Branch Management
    Route::prefix('business/branches')->group(function () {
        Route::get('/', [\App\Http\Controllers\Business\BranchController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Business\BranchController::class, 'store']);
        Route::get('/current', [\App\Http\Controllers\Business\BranchController::class, 'current']);
        Route::post('/switch', [\App\Http\Controllers\Business\BranchController::class, 'switchBranch']);
        Route::get('/my-branches', [\App\Http\Controllers\Business\BranchController::class, 'myBranches']);
        Route::get('/summary', [\App\Http\Controllers\Business\BranchController::class, 'summary']);
        Route::get('/{id}', [\App\Http\Controllers\Business\BranchController::class, 'show']);
        Route::get('/{id}/summary', [\App\Http\Controllers\Business\BranchController::class, 'branchSummary']);
        Route::put('/{id}', [\App\Http\Controllers\Business\BranchController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Business\BranchController::class, 'destroy']);
        Route::post('/{id}/activate', [\App\Http\Controllers\Business\BranchController::class, 'activate']);
    });
    
    // Product Branch Management
    Route::prefix('business/products')->group(function () {
        Route::get('/{id}/branches', [\App\Http\Controllers\Business\ProductBranchController::class, 'index']);
        Route::post('/{id}/branches', [\App\Http\Controllers\Business\ProductBranchController::class, 'store']);
        Route::put('/{id}/branches/{branchId}', [\App\Http\Controllers\Business\ProductBranchController::class, 'update']);
        Route::delete('/{id}/branches/{branchId}', [\App\Http\Controllers\Business\ProductBranchController::class, 'destroy']);
    });
    
    // Stock Transfer Management
    Route::prefix('business/stock-transfers')->group(function () {
        Route::get('/', [\App\Http\Controllers\Business\StockTransferController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Business\StockTransferController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Business\StockTransferController::class, 'show']);
        Route::post('/{id}/complete', [\App\Http\Controllers\Business\StockTransferController::class, 'complete']);
        Route::post('/{id}/cancel', [\App\Http\Controllers\Business\StockTransferController::class, 'cancel']);
    });
    
    // Branch Analytics
    Route::prefix('business/analytics')->group(function () {
        Route::get('/branch/{id}', [\App\Http\Controllers\Business\BranchAnalyticsController::class, 'branchMetrics']);
        Route::get('/compare', [\App\Http\Controllers\Business\BranchAnalyticsController::class, 'compareBranches']);
        Route::get('/consolidated', [\App\Http\Controllers\Business\BranchAnalyticsController::class, 'consolidatedMetrics']);
    });
    
    // Technician Portal Routes
    Route::prefix('technician')->middleware('role:technician')->group(function () {
        // Dashboard
        Route::get('/dashboard', [\App\Http\Controllers\TechnicianController::class, 'dashboard']);
        Route::get('/metrics', [\App\Http\Controllers\TechnicianController::class, 'getMetrics']);
        
        // Visits Management
        Route::get('/visits', [\App\Http\Controllers\TechnicianController::class, 'getVisits']);
        Route::get('/visits/today', [\App\Http\Controllers\TechnicianController::class, 'getTodayVisits']);
        Route::get('/visits/{id}', [\App\Http\Controllers\TechnicianController::class, 'getVisit']);
        Route::post('/visits/{id}/start', [\App\Http\Controllers\TechnicianController::class, 'startVisit']);
        Route::post('/visits/{id}/complete', [\App\Http\Controllers\TechnicianController::class, 'completeVisit']);
        
        // Products/Parts
        Route::get('/products', [\App\Http\Controllers\TechnicianController::class, 'getProducts']);
        
        // History
        Route::get('/history', [\App\Http\Controllers\TechnicianController::class, 'getHistory']);
    });
    
    // Legacy tenant data management (automatically scoped)
    Route::get('/tenant/posts', [TenantDataController::class, 'posts']);
    Route::post('/tenant/posts', [TenantDataController::class, 'createPost']);
    
    Route::get('/tenant/projects', [TenantDataController::class, 'projects']);
    Route::post('/tenant/projects', [TenantDataController::class, 'createProject']);
    
    Route::get('/tenant/users', [TenantDataController::class, 'users']);
});

// Public Routes
Route::get('/plans', function () {
    return \App\Models\Plan::where('is_active', true)
        ->orderBy('sort_order')
        ->get();
});

// Model Translation Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('model-translations')->group(function () {
        Route::post('/', [App\Http\Controllers\Api\ModelTranslationController::class, 'store']);
        Route::get('/{modelType}/{modelId}', [App\Http\Controllers\Api\ModelTranslationController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\Api\ModelTranslationController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\Api\ModelTranslationController::class, 'destroy']);
        Route::post('/bulk', [App\Http\Controllers\Api\ModelTranslationController::class, 'bulkStore']);
        Route::get('/statistics', [App\Http\Controllers\Api\ModelTranslationController::class, 'statistics']);
        Route::get('/validate-integrity', [App\Http\Controllers\Api\ModelTranslationController::class, 'validateIntegrity']);
        Route::post('/sync', [App\Http\Controllers\Api\ModelTranslationController::class, 'sync']);
    });
});