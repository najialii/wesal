<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        App\Providers\AuthServiceProvider::class,
        App\Providers\MaintenanceServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'super_admin' => \App\Http\Middleware\SuperAdminMiddleware::class,
            'tenant' => \App\Http\Middleware\TenantMiddleware::class,
            'locale' => \App\Http\Middleware\LocaleMiddleware::class,
            'audit' => \App\Http\Middleware\AuditLogMiddleware::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
        
        // REMOVED: EnsureFrontendRequestsAreStateful for token-based API auth
        // This was causing CSRF 422 errors on login
        // $middleware->api(prepend: [
        //     \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // ]);
        
        // Apply locale middleware to API routes
        $middleware->group('api', [
            \App\Http\Middleware\LocaleMiddleware::class,
        ]);
        
        // Apply audit logging to admin routes
        $middleware->group('admin', [
            \App\Http\Middleware\AuditLogMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
