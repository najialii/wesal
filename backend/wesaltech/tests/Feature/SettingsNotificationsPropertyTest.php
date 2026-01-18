<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\SystemSetting;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Event;
use App\Events\SettingChanged;
use App\Notifications\SettingChangeNotification;

class SettingsNotificationsPropertyTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private SettingsService $settingsService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
            'email' => 'admin@wesaltech.com'
        ]);
        
        $this->settingsService = app(SettingsService::class);
        
        Notification::fake();
        Event::fake();
    }

    /**
     * Property 16: Settings change notifications
     * 
     * @test
     */
    public function test_critical_settings_changes_notify_all_admins()
    {
        // Create additional admin users
        $admin1 = User::factory()->create(['role' => 'super_admin']);
        $admin2 = User::factory()->create(['role' => 'super_admin']);
        $regularUser = User::factory()->create(['role' => 'user']);

        // Property: Critical settings changes should notify all super admins
        $criticalSettings = [
            'security.max_login_attempts',
            'security.session_timeout',
            'system.maintenance_mode',
            'billing.default_currency'
        ];

        foreach ($criticalSettings as $settingKey) {
            $response = $this->actingAs($this->superAdmin)
                ->putJson('/api/admin/settings', [
                    'key' => $settingKey,
                    'value' => 'new_value',
                    'category' => explode('.', $settingKey)[0]
                ]);

            $response->assertStatus(200);

            // Should notify all super admins
            Notification::assertSentTo(
                [$this->superAdmin, $admin1, $admin2],
                SettingChangeNotification::class
            );

            // Should not notify regular users
            Notification::assertNotSentTo($regularUser, SettingChangeNotification::class);
            
            // Reset for next iteration
            Notification::fake();
        }
    }

    /**
     * @test
     */
    public function test_tenant_affecting_settings_notify_relevant_tenants()
    {
        $tenant1 = Tenant::factory()->create(['status' => 'active']);
        $tenant2 = Tenant::factory()->create(['status' => 'active']);
        $inactiveTenant = Tenant::factory()->create(['status' => 'inactive']);

        $tenantAdmin1 = User::factory()->create([
            'tenant_id' => $tenant1->id,
            'role' => 'tenant_admin'
        ]);
        $tenantAdmin2 = User::factory()->create([
            'tenant_id' => $tenant2->id,
            'role' => 'tenant_admin'
        ]);
        $inactiveTenantAdmin = User::factory()->create([
            'tenant_id' => $inactiveTenant->id,
            'role' => 'tenant_admin'
        ]);

        // Property: Settings affecting tenants should notify relevant tenant admins
        $tenantAffectingSettings = [
            'features.default_enabled_features',
            'limits.default_storage_limit',
            'billing.payment_grace_period'
        ];

        foreach ($tenantAffectingSettings as $settingKey) {
            $response = $this->actingAs($this->superAdmin)
                ->putJson('/api/admin/settings', [
                    'key' => $settingKey,
                    'value' => 'updated_value',
                    'category' => explode('.', $settingKey)[0],
                    'affects_tenants' => true
                ]);

            $response->assertStatus(200);

            // Should notify active tenant admins
            Notification::assertSentTo(
                [$tenantAdmin1, $tenantAdmin2],
                SettingChangeNotification::class
            );

            // Should not notify inactive tenant admins
            Notification::assertNotSentTo($inactiveTenantAdmin, SettingChangeNotification::class);
            
            Notification::fake();
        }
    }

    /**
     * @test
     */
    public function test_notification_content_includes_setting_details()
    {
        $settingKey = 'security.session_timeout';
        $oldValue = '3600';
        $newValue = '7200';

        // Create initial setting
        SystemSetting::create([
            'key' => $settingKey,
            'value' => $oldValue,
            'category' => 'security'
        ]);

        // Property: Notifications should include comprehensive setting change details
        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/settings', [
                'key' => $settingKey,
                'value' => $newValue,
                'category' => 'security'
            ]);

        $response->assertStatus(200);

        Notification::assertSentTo($this->superAdmin, SettingChangeNotification::class, function ($notification) use ($settingKey, $oldValue, $newValue) {
            $notificationData = $notification->toArray($this->superAdmin);
            
            return $notificationData['setting_key'] === $settingKey &&
                   $notificationData['old_value'] === $oldValue &&
                   $notificationData['new_value'] === $newValue &&
                   $notificationData['changed_by'] === $this->superAdmin->name &&
                   isset($notificationData['changed_at']);
        });
    }

    /**
     * @test
     */
    public function test_bulk_settings_changes_send_consolidated_notifications()
    {
        $admin1 = User::factory()->create(['role' => 'super_admin']);
        $admin2 = User::factory()->create(['role' => 'super_admin']);

        $bulkSettings = [
            ['key' => 'security.max_login_attempts', 'value' => '5', 'category' => 'security'],
            ['key' => 'security.password_min_length', 'value' => '10', 'category' => 'security'],
            ['key' => 'system.default_timezone', 'value' => 'UTC', 'category' => 'system']
        ];

        // Property: Bulk settings changes should send consolidated notifications
        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/settings/bulk', [
                'settings' => $bulkSettings
            ]);

        $response->assertStatus(200);

        // Should send one consolidated notification per admin
        Notification::assertSentTo(
            [$this->superAdmin, $admin1, $admin2],
            SettingChangeNotification::class,
            function ($notification) {
                $notificationData = $notification->toArray($this->superAdmin);
                return isset($notificationData['bulk_changes']) && 
                       count($notificationData['bulk_changes']) === 3;
            }
        );
    }

    /**
     * @test
     */
    public function test_notification_preferences_are_respected()
    {
        $admin1 = User::factory()->create([
            'role' => 'super_admin',
            'notification_preferences' => [
                'setting_changes' => true,
                'critical_only' => false
            ]
        ]);

        $admin2 = User::factory()->create([
            'role' => 'super_admin',
            'notification_preferences' => [
                'setting_changes' => true,
                'critical_only' => true
            ]
        ]);

        $admin3 = User::factory()->create([
            'role' => 'super_admin',
            'notification_preferences' => [
                'setting_changes' => false
            ]
        ]);

        // Property: Notification preferences should be respected
        
        // Test non-critical setting change
        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/settings', [
                'key' => 'ui.default_theme',
                'value' => 'dark',
                'category' => 'ui',
                'is_critical' => false
            ]);

        $response->assertStatus(200);

        // Admin1 should receive notification (all settings)
        Notification::assertSentTo($admin1, SettingChangeNotification::class);
        
        // Admin2 should not receive notification (critical only)
        Notification::assertNotSentTo($admin2, SettingChangeNotification::class);
        
        // Admin3 should not receive notification (disabled)
        Notification::assertNotSentTo($admin3, SettingChangeNotification::class);

        Notification::fake();

        // Test critical setting change
        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/settings', [
                'key' => 'security.max_login_attempts',
                'value' => '3',
                'category' => 'security',
                'is_critical' => true
            ]);

        $response->assertStatus(200);

        // Both admin1 and admin2 should receive critical notifications
        Notification::assertSentTo([$admin1, $admin2], SettingChangeNotification::class);
        
        // Admin3 should still not receive notification (disabled)
        Notification::assertNotSentTo($admin3, SettingChangeNotification::class);
    }

    /**
     * @test
     */
    public function test_settings_rollback_notifications()
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        // Create setting with history
        $setting = SystemSetting::create([
            'key' => 'security.session_timeout',
            'value' => '7200',
            'category' => 'security'
        ]);

        // Property: Settings rollback should notify admins
        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/admin/settings/{$setting->id}/rollback", [
                'target_version' => 1
            ]);

        $response->assertStatus(200);

        Notification::assertSentTo(
            [$this->superAdmin, $admin],
            SettingChangeNotification::class,
            function ($notification) {
                $notificationData = $notification->toArray($this->superAdmin);
                return $notificationData['action'] === 'rollback';
            }
        );
    }

    /**
     * @test
     */
    public function test_emergency_settings_bypass_notification_preferences()
    {
        $admin = User::factory()->create([
            'role' => 'super_admin',
            'notification_preferences' => [
                'setting_changes' => false // Disabled notifications
            ]
        ]);

        // Property: Emergency settings should bypass notification preferences
        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/settings', [
                'key' => 'system.maintenance_mode',
                'value' => 'true',
                'category' => 'system',
                'is_emergency' => true
            ]);

        $response->assertStatus(200);

        // Should notify even though preferences are disabled
        Notification::assertSentTo($admin, SettingChangeNotification::class, function ($notification) {
            $notificationData = $notification->toArray($admin);
            return $notificationData['is_emergency'] === true;
        });
    }

    /**
     * @test
     */
    public function test_notification_delivery_channels_based_on_setting_type()
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        // Property: Different setting types should use appropriate notification channels
        
        // Critical security setting - should use multiple channels
        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/settings', [
                'key' => 'security.two_factor_required',
                'value' => 'true',
                'category' => 'security',
                'is_critical' => true
            ]);

        $response->assertStatus(200);

        Notification::assertSentTo($admin, SettingChangeNotification::class, function ($notification) {
            // Should use email and database channels for critical settings
            return in_array('mail', $notification->via($admin)) &&
                   in_array('database', $notification->via($admin));
        });
    }

    /**
     * @test
     */
    public function test_notification_scheduling_for_future_effective_settings()
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $futureDate = now()->addDays(7);

        // Property: Settings with future effective dates should schedule notifications
        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/settings', [
                'key' => 'billing.price_increase',
                'value' => '10',
                'category' => 'billing',
                'effective_date' => $futureDate->toDateString()
            ]);

        $response->assertStatus(200);

        // Should send immediate notification about scheduled change
        Notification::assertSentTo($admin, SettingChangeNotification::class, function ($notification) use ($futureDate) {
            $notificationData = $notification->toArray($admin);
            return $notificationData['action'] === 'scheduled' &&
                   $notificationData['effective_date'] === $futureDate->toDateString();
        });
    }

    /**
     * @test
     */
    public function test_notification_failure_handling()
    {
        // Mock notification failure
        Notification::fake();
        
        $admin = User::factory()->create([
            'role' => 'super_admin',
            'email' => 'invalid-email' // This will cause notification failure
        ]);

        // Property: Notification failures should be logged and handled gracefully
        $response = $this->actingAs($this->superAdmin)
            ->putJson('/api/admin/settings', [
                'key' => 'security.session_timeout',
                'value' => '3600',
                'category' => 'security'
            ]);

        $response->assertStatus(200);

        // Setting should still be updated despite notification failure
        $this->assertDatabaseHas('system_settings', [
            'key' => 'security.session_timeout',
            'value' => '3600'
        ]);

        // Failure should be logged
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'notification_failed',
            'resource_type' => 'setting_change'
        ]);
    }
}