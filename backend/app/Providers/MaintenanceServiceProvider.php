<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Maintenance\ContractService;
use App\Services\Maintenance\VisitSchedulingService;
use App\Services\Maintenance\VisitExecutionService;
use App\Services\Maintenance\MaintenanceAnalyticsService;
use App\Services\BranchContextService;

class MaintenanceServiceProvider extends ServiceProvider
{
    /**
     * Register maintenance services
     */
    public function register(): void
    {
        // Register ContractService as singleton
        $this->app->singleton(ContractService::class, function ($app) {
            return new ContractService(
                $app->make(BranchContextService::class),
                $app->make(\App\Services\MaintenanceLoggerService::class)
            );
        });

        // Register VisitSchedulingService as singleton
        $this->app->singleton(VisitSchedulingService::class, function ($app) {
            return new VisitSchedulingService($app->make(BranchContextService::class));
        });

        // Register VisitExecutionService as singleton with dependency injection
        $this->app->singleton(VisitExecutionService::class, function ($app) {
            return new VisitExecutionService($app->make(BranchContextService::class));
        });

        // Register MaintenanceAnalyticsService as singleton
        $this->app->singleton(MaintenanceAnalyticsService::class, function ($app) {
            return new MaintenanceAnalyticsService($app->make(BranchContextService::class));
        });
    }

    /**
     * Bootstrap maintenance services
     */
    public function boot(): void
    {
        // Any bootstrapping logic can go here
        // For example, event listeners, observers, etc.
    }

    /**
     * Get the services provided by the provider
     */
    public function provides(): array
    {
        return [
            ContractService::class,
            VisitSchedulingService::class,
            VisitExecutionService::class,
            MaintenanceAnalyticsService::class,
        ];
    }
}