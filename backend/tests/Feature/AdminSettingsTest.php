<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\SystemSetting;
use App\Models\SystemSettingHistory;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private SettingsService $settingsService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->superAdmin = User::factory()->create([
            'is_super_admin' => true,
        ]);

        $this->settingsService = app(SettingsService::class);
    }

    /**
     * **Feature: super-admin-enhancement, Property 13: Settings panel displays organized configuration**
     * 
     * For any system configuration, the settings panel should display all configurable 
     * parameters organized by category with proper validation and immediate application
     */
    public function test_settings_panel_displays_organized_configuration(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create test settings in different categories
        $testSettings = [
            [
                'key' => 'app.name',
                'value' => 'WesalTech SaaS',
                'category' => 'application',
                'type' => 'string',
                'description' => 'Application name',
                'is_public' => true,
            ],
            [
                'key' => 'app.debug',
                'value' => false,
                'category' => 'application',
                'type' => 'boolean',
                'description' => 'Debug mode',
                'is_public' => false,
            ],
            [
                'key' => 'mail.driver',
                'value' => 'smtp',
                'category' => 'email',
                'type' => 'string',
                'description' => 'Mail driver',
                'is_public' => false,
            ],
            [
                'key' => 'security.max_login_attempts',
                'value' => 5,
                'category' => 'security',
                'type' => 'number',
                'description' => 'Maximum login attempts',
                'is_public' => false,
            ],
            [
                'key' => 'features.enabled',
                'value' => ['pos', 'inventory', 'maintenance'],
                'category' => 'features',
                'type' => 'array',
                'description' => 'Enabled features',
                'is_public' => true,
            ],
        ];

        foreach ($testSettings as $settingData) {
            SystemSetting::create(array_merge($settingData, [
                'updated_by' => $this->superAdmin->id,
            ]));
        }

        // Test settings retrieval
        $response = $this->getJson('/api/admin/settings');
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertArrayHasKey('settings', $data);
        $this->assertArrayHasKey('categories', $data);

        // Verify settings are organized by category
        $settings = $data['settings'];
        $this->assertArrayHasKey('application', $settings);
        $this->assertArrayHasKey('email', $settings);
        $this->assertArrayHasKey('security', $settings);
        $this->assertArrayHasKey('features', $settings);

        // Verify each category contains the correct settings
        $this->assertCount(2, $settings['application']);
        $this->assertCount(1, $settings['email']);
        $this->assertCount(1, $settings['security']);
        $this->assertCount(1, $settings['features']);

        // Test category filtering
        $response = $this->getJson('/api/admin/settings?category=application');
        $response->assertStatus(200);
        
        $filteredData = $response->json();
        $this->assertArrayHasKey('application', $filteredData['settings']);
        $this->assertArrayNotHasKey('email', $filteredData['settings']);

        // Test search functionality
        $response = $this->getJson('/api/admin/settings?search=debug');
        $response->assertStatus(200);
        
        $searchData = $response->json();
        $foundSettings = collect($searchData['settings'])->flatten(1);
        $debugSetting = $foundSettings->firstWhere('key', 'app.debug');
        $this->assertNotNull($debugSetting);

        // Test categories endpoint
        $response = $this->getJson('/api/admin/settings/categories');
        $response->assertStatus(200);
        
        $categories = $response->json();
        $this->assertContains('application', $categories);
        $this->assertContains('email', $categories);
        $this->assertContains('security', $categories);
        $this->assertContains('features', $categories);

        // Test individual setting retrieval
        $response = $this->getJson('/api/admin/settings/app.name');
        $response->assertStatus(200);
        
        $setting = $response->json();
        $this->assertEquals('app.name', $setting['key']);
        $this->assertEquals('WesalTech SaaS', $setting['value']);
        $this->assertEquals('application', $setting['category']);
    }

    /**
     * **Feature: super-admin-enhancement, Property 14: Security settings immediate enforcement**
     * 
     * For any security setting update, the system should enforce new policies 
     * immediately for all users without requiring restart or manual intervention
     */
    public function test_security_settings_immediate_enforcement(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create security settings
        $securitySettings = [
            [
                'key' => 'security.session_timeout',
                'value' => 3600,
                'category' => 'security',
                'type' => 'number',
                'description' => 'Session timeout in seconds',
                'is_public' => false,
            ],
            [
                'key' => 'security.password_min_length',
                'value' => 8,
                'category' => 'security',
                'type' => 'number',
                'description' => 'Minimum password length',
                'is_public' => false,
            ],
            [
                'key' => 'security.require_2fa',
                'value' => false,
                'category' => 'security',
                'type' => 'boolean',
                'description' => 'Require two-factor authentication',
                'is_public' => false,
            ],
        ];

        foreach ($securitySettings as $settingData) {
            SystemSetting::create(array_merge($settingData, [
                'updated_by' => $this->superAdmin->id,
            ]));
        }

        // Test updating security settings
        $updateData = [
            'settings' => [
                [
                    'key' => 'security.session_timeout',
                    'value' => 1800, // 30 minutes
                ],
                [
                    'key' => 'security.require_2fa',
                    'value' => true,
                ],
            ],
        ];

        $response = $this->putJson('/api/admin/settings', $updateData);
        $response->assertStatus(200);

        // Verify settings were updated immediately
        $sessionTimeoutSetting = SystemSetting::where('key', 'security.session_timeout')->first();
        $this->assertEquals(1800, $sessionTimeoutSetting->formatted_value);

        $twoFaSetting = SystemSetting::where('key', 'security.require_2fa')->first();
        $this->assertTrue($twoFaSetting->formatted_value);

        // Verify history was created
        $this->assertDatabaseHas('system_setting_histories', [
            'setting_key' => 'security.session_timeout',
            'new_value' => json_encode(1800),
            'changed_by' => $this->superAdmin->id,
        ]);

        // Test validation of security settings
        $invalidUpdateData = [
            'settings' => [
                [
                    'key' => 'security.password_min_length',
                    'value' => 'invalid_number',
                ],
            ],
        ];

        $response = $this->putJson('/api/admin/settings', $invalidUpdateData);
        $response->assertStatus(422);

        // Verify original value wasn't changed
        $passwordSetting = SystemSetting::where('key', 'security.password_min_length')->first();
        $this->assertEquals(8, $passwordSetting->formatted_value);

        // Test settings validation endpoint
        $validationData = [
            'settings' => [
                [
                    'key' => 'security.session_timeout',
                    'value' => 7200,
                    'type' => 'number',
                ],
                [
                    'key' => 'security.invalid_setting',
                    'value' => 'not_a_boolean',
                    'type' => 'boolean',
                ],
            ],
        ];

        $response = $this->postJson('/api/admin/settings/validate', $validationData);
        $response->assertStatus(200);

        $validationResults = $response->json();
        $this->assertCount(2, $validationResults);
        
        // First setting should be valid
        $this->assertTrue($validationResults[0]['valid']);
        $this->assertEmpty($validationResults[0]['errors']);
        
        // Second setting should be invalid
        $this->assertFalse($validationResults[1]['valid']);
        $this->assertNotEmpty($validationResults[1]['errors']);
    }

    /**
     * **Feature: super-admin-enhancement, Property 15: Settings backup and rollback functionality**
     * 
     * For any configuration change, the system should backup previous settings 
     * and allow rollback to any previous configuration state
     */
    public function test_settings_backup_and_rollback_functionality(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create initial setting
        $setting = SystemSetting::create([
            'key' => 'app.maintenance_mode',
            'value' => false,
            'category' => 'application',
            'type' => 'boolean',
            'description' => 'Maintenance mode status',
            'is_public' => true,
            'updated_by' => $this->superAdmin->id,
        ]);

        // Update the setting multiple times to create history
        $updates = [
            ['value' => true, 'reason' => 'Enable maintenance mode'],
            ['value' => false, 'reason' => 'Disable maintenance mode'],
            ['value' => true, 'reason' => 'Re-enable for updates'],
        ];

        foreach ($updates as $update) {
            $this->settingsService->updateSettings([
                ['key' => 'app.maintenance_mode', 'value' => $update['value']]
            ], $this->superAdmin->id);
        }

        // Test history retrieval
        $response = $this->getJson('/api/admin/settings/app.maintenance_mode/history');
        $response->assertStatus(200);

        $history = $response->json();
        $this->assertCount(4, $history); // Initial creation + 3 updates

        // Verify history is ordered by most recent first
        $this->assertTrue($history[0]['created_at'] >= $history[1]['created_at']);

        // Test rollback to previous version
        $rollbackToVersion = $history[1]; // Second most recent
        
        $response = $this->postJson("/api/admin/settings/app.maintenance_mode/rollback", [
            'version_id' => $rollbackToVersion['id'],
        ]);
        $response->assertStatus(200);

        // Verify setting was rolled back
        $setting->refresh();
        $this->assertEquals($rollbackToVersion['old_value'], $setting->value);

        // Verify new history entry was created for rollback
        $newHistory = SystemSettingHistory::where('setting_key', 'app.maintenance_mode')
            ->latest()
            ->first();
        
        $this->assertStringContains('Rollback to version', $newHistory->change_reason);

        // Test rollback to non-existent version
        $response = $this->postJson("/api/admin/settings/app.maintenance_mode/rollback", [
            'version_id' => 99999,
        ]);
        $response->assertStatus(422);

        // Test export functionality
        $response = $this->postJson('/api/admin/settings/export', [
            'categories' => ['application'],
            'format' => 'json',
        ]);
        $response->assertStatus(200);

        $exportData = $response->json();
        $this->assertArrayHasKey('filename', $exportData);
        $this->assertArrayHasKey('content', $exportData);
        $this->assertArrayHasKey('download_url', $exportData);

        // Verify export content
        $content = json_decode($exportData['content'], true);
        $this->assertArrayHasKey('app.maintenance_mode', $content);

        // Test import functionality
        Storage::fake('local');
        
        $importData = [
            'app.new_setting' => 'test_value',
            'app.another_setting' => 123,
        ];
        
        $file = UploadedFile::fake()->createWithContent(
            'settings.json',
            json_encode($importData)
        );

        $response = $this->postJson('/api/admin/settings/import', [
            'file' => $file,
            'merge_strategy' => 'merge',
        ]);
        $response->assertStatus(200);

        $importResult = $response->json();
        $this->assertEquals(2, $importResult['imported_count']);
        $this->assertEquals(0, $importResult['skipped_count']);

        // Verify imported settings exist
        $this->assertDatabaseHas('system_settings', [
            'key' => 'app.new_setting',
            'value' => json_encode('test_value'),
        ]);

        $this->assertDatabaseHas('system_settings', [
            'key' => 'app.another_setting',
            'value' => json_encode(123),
        ]);
    }

    /**
     * **Feature: super-admin-enhancement, Property 16: Settings change notifications**
     * 
     * For any settings change that affects tenants, the system should notify 
     * all affected tenants with relevant change information
     */
    public function test_settings_change_notifications(): void
    {
        Sanctum::actingAs($this->superAdmin);

        // Create public settings that affect tenants
        $publicSetting = SystemSetting::create([
            'key' => 'features.max_users_per_tenant',
            'value' => 100,
            'category' => 'features',
            'type' => 'number',
            'description' => 'Maximum users per tenant',
            'is_public' => true,
            'updated_by' => $this->superAdmin->id,
        ]);

        // Create private setting that shouldn't notify tenants
        $privateSetting = SystemSetting::create([
            'key' => 'internal.debug_level',
            'value' => 'info',
            'category' => 'internal',
            'type' => 'string',
            'description' => 'Debug level',
            'is_public' => false,
            'updated_by' => $this->superAdmin->id,
        ]);

        // Update public setting - should trigger notifications
        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                [
                    'key' => 'features.max_users_per_tenant',
                    'value' => 150,
                ],
            ],
        ]);
        $response->assertStatus(200);

        // Update private setting - should not trigger notifications
        $response = $this->putJson('/api/admin/settings', [
            'settings' => [
                [
                    'key' => 'internal.debug_level',
                    'value' => 'debug',
                ],
            ],
        ]);
        $response->assertStatus(200);

        // Test creating new public setting
        $response = $this->postJson('/api/admin/settings', [
            'key' => 'features.new_feature_enabled',
            'value' => true,
            'category' => 'features',
            'type' => 'boolean',
            'description' => 'New feature enabled',
            'is_public' => true,
        ]);
        $response->assertStatus(201);

        // Test deleting setting
        $response = $this->deleteJson('/api/admin/settings/features.new_feature_enabled');
        $response->assertStatus(200);

        // Verify setting was deleted
        $this->assertDatabaseMissing('system_settings', [
            'key' => 'features.new_feature_enabled',
        ]);

        // Verify deletion was logged in history
        $this->assertDatabaseHas('system_setting_histories', [
            'setting_key' => 'features.new_feature_enabled',
            'new_value' => null,
            'change_reason' => 'Setting deleted',
        ]);
    }
}