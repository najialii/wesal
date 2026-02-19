<?php

namespace App\Services;

use App\Models\SystemSetting;
use App\Models\SystemSettingHistory;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Notification;
use Illuminate\Http\UploadedFile;

class SettingsService
{
    public function getSettings(array $filters = []): array
    {
        $query = SystemSetting::with(['updatedBy']);

        if (!empty($filters['category'])) {
            $query->byCategory($filters['category']);
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        $settings = $query->orderBy('category')->orderBy('key')->get();

        return [
            'settings' => $settings->groupBy('category'),
            'categories' => $this->getCategories(),
        ];
    }

    public function getSetting(string $key): ?SystemSetting
    {
        return SystemSetting::where('key', $key)->with(['updatedBy', 'histories.changedBy'])->first();
    }

    public function updateSettings(array $settings, int $userId): array
    {
        $updatedSettings = [];

        foreach ($settings as $settingData) {
            $setting = SystemSetting::where('key', $settingData['key'])->first();
            
            if (!$setting) {
                continue;
            }

            $oldValue = $setting->value;
            $newValue = $this->castValue($settingData['value'], $setting->type);

            if ($oldValue !== $newValue) {
                // Create history record
                SystemSettingHistory::create([
                    'setting_key' => $setting->key,
                    'old_value' => $oldValue,
                    'new_value' => $newValue,
                    'changed_by' => $userId,
                    'change_reason' => 'Admin update',
                ]);

                // Update setting
                $setting->update([
                    'value' => $newValue,
                    'updated_by' => $userId,
                ]);

                $updatedSettings[] = $setting->fresh();

                // Clear cache
                $this->clearSettingCache($setting->key);

                // Notify affected tenants if needed
                $this->notifyTenantsOfChange($setting);
            }
        }

        return $updatedSettings;
    }

    public function createSetting(array $data, int $userId): SystemSetting
    {
        $data['value'] = $this->castValue($data['value'], $data['type']);
        $data['updated_by'] = $userId;

        $setting = SystemSetting::create($data);

        // Create initial history record
        SystemSettingHistory::create([
            'setting_key' => $setting->key,
            'old_value' => null,
            'new_value' => $setting->value,
            'changed_by' => $userId,
            'change_reason' => 'Setting created',
        ]);

        return $setting;
    }

    public function deleteSetting(string $key, int $userId): bool
    {
        $setting = SystemSetting::where('key', $key)->first();

        if (!$setting) {
            return false;
        }

        // Create history record for deletion
        SystemSettingHistory::create([
            'setting_key' => $setting->key,
            'old_value' => $setting->value,
            'new_value' => null,
            'changed_by' => $userId,
            'change_reason' => 'Setting deleted',
        ]);

        $this->clearSettingCache($key);
        
        return $setting->delete();
    }

    public function getSettingHistory(string $key): array
    {
        return SystemSettingHistory::where('setting_key', $key)
            ->with(['changedBy'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function rollbackSetting(string $key, int $historyId, int $userId): SystemSetting
    {
        $history = SystemSettingHistory::findOrFail($historyId);
        $setting = SystemSetting::where('key', $key)->firstOrFail();

        $currentValue = $setting->value;
        $rollbackValue = $history->old_value;

        // Create new history record for rollback
        SystemSettingHistory::create([
            'setting_key' => $key,
            'old_value' => $currentValue,
            'new_value' => $rollbackValue,
            'changed_by' => $userId,
            'change_reason' => "Rollback to version {$historyId}",
        ]);

        // Update setting
        $setting->update([
            'value' => $rollbackValue,
            'updated_by' => $userId,
        ]);

        $this->clearSettingCache($key);
        $this->notifyTenantsOfChange($setting);

        return $setting->fresh();
    }

    public function getCategories(): array
    {
        return Cache::remember('system_settings.categories', 3600, function () {
            return SystemSetting::distinct()
                ->pluck('category')
                ->filter()
                ->sort()
                ->values()
                ->toArray();
        });
    }

    public function exportSettings(array $categories = [], string $format = 'json'): array
    {
        $query = SystemSetting::query();

        if (!empty($categories)) {
            $query->whereIn('category', $categories);
        }

        $settings = $query->get();
        $filename = 'settings_export_' . now()->format('Y-m-d_H-i-s');

        $data = $settings->mapWithKeys(function ($setting) {
            return [$setting->key => $setting->formatted_value];
        })->toArray();

        $content = match ($format) {
            'json' => json_encode($data, JSON_PRETTY_PRINT),
            'yaml' => yaml_emit($data),
            'env' => $this->convertToEnvFormat($data),
            default => json_encode($data, JSON_PRETTY_PRINT),
        };

        $filename .= '.' . $format;
        $path = "exports/settings/{$filename}";
        
        Storage::put($path, $content);

        return [
            'filename' => $filename,
            'content' => $content,
            'url' => Storage::url($path),
        ];
    }

    public function importSettings(UploadedFile $file, string $mergeStrategy, int $userId): array
    {
        $content = $file->get();
        $extension = $file->getClientOriginalExtension();

        $data = match ($extension) {
            'json' => json_decode($content, true),
            'yaml', 'yml' => yaml_parse($content),
            'env', 'txt' => $this->parseEnvFormat($content),
            default => throw new \InvalidArgumentException('Unsupported file format'),
        };

        if (!is_array($data)) {
            throw new \InvalidArgumentException('Invalid file format or content');
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($data as $key => $value) {
            try {
                $existingSetting = SystemSetting::where('key', $key)->first();

                if ($existingSetting && $mergeStrategy === 'skip_existing') {
                    $skipped++;
                    continue;
                }

                if ($existingSetting) {
                    $this->updateSettings([['key' => $key, 'value' => $value]], $userId);
                } else {
                    // Try to infer type from value
                    $type = $this->inferType($value);
                    
                    $this->createSetting([
                        'key' => $key,
                        'value' => $value,
                        'category' => 'imported',
                        'type' => $type,
                        'description' => "Imported setting",
                        'is_public' => false,
                    ], $userId);
                }

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Failed to import {$key}: " . $e->getMessage();
            }
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    public function validateSettings(array $settings): array
    {
        $results = [];

        foreach ($settings as $settingData) {
            $key = $settingData['key'];
            $value = $settingData['value'];
            $type = $settingData['type'];

            $validation = [
                'key' => $key,
                'valid' => true,
                'errors' => [],
            ];

            try {
                $this->castValue($value, $type);
            } catch (\Exception $e) {
                $validation['valid'] = false;
                $validation['errors'][] = $e->getMessage();
            }

            // Additional validation rules can be added here
            if ($type === 'boolean' && !is_bool($value) && !in_array($value, ['true', 'false', '1', '0', 1, 0])) {
                $validation['valid'] = false;
                $validation['errors'][] = 'Boolean value must be true, false, 1, or 0';
            }

            if ($type === 'number' && !is_numeric($value)) {
                $validation['valid'] = false;
                $validation['errors'][] = 'Number value must be numeric';
            }

            $results[] = $validation;
        }

        return $results;
    }

    public function getSettingValue(string $key, $default = null)
    {
        return Cache::remember("setting.{$key}", 3600, function () use ($key, $default) {
            $setting = SystemSetting::where('key', $key)->first();
            return $setting ? $setting->formatted_value : $default;
        });
    }

    // Private helper methods

    private function castValue($value, string $type)
    {
        return match ($type) {
            'boolean' => is_bool($value) ? $value : in_array($value, ['true', '1', 1], true),
            'number' => is_numeric($value) ? (float) $value : $value,
            'json', 'array' => is_array($value) ? $value : json_decode($value, true),
            default => (string) $value,
        };
    }

    private function clearSettingCache(string $key): void
    {
        Cache::forget("setting.{$key}");
        Cache::forget('system_settings.categories');
    }

    private function notifyTenantsOfChange(SystemSetting $setting): void
    {
        // Only notify for public settings that affect tenants
        if (!$setting->is_public) {
            return;
        }

        $affectedTenants = Tenant::where('status', 'active')->get();

        foreach ($affectedTenants as $tenant) {
            // In a real implementation, you would send notifications here
            // For now, we'll just log the change
            \Log::info("Setting {$setting->key} changed, notifying tenant {$tenant->id}");
        }
    }

    private function convertToEnvFormat(array $data): string
    {
        $lines = [];
        
        foreach ($data as $key => $value) {
            $envKey = strtoupper(str_replace('.', '_', $key));
            $envValue = is_array($value) ? json_encode($value) : (string) $value;
            
            // Escape values that contain spaces or special characters
            if (preg_match('/\s/', $envValue) || preg_match('/[#"\'\\\\]/', $envValue)) {
                $envValue = '"' . addslashes($envValue) . '"';
            }
            
            $lines[] = "{$envKey}={$envValue}";
        }

        return implode("\n", $lines);
    }

    private function parseEnvFormat(string $content): array
    {
        $data = [];
        $lines = explode("\n", $content);

        foreach ($lines as $line) {
            $line = trim($line);
            
            // Skip empty lines and comments
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }

            if (str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);

                // Remove quotes if present
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }

                // Convert env key back to dot notation
                $key = strtolower(str_replace('_', '.', $key));
                
                $data[$key] = $value;
            }
        }

        return $data;
    }

    private function inferType($value): string
    {
        if (is_bool($value)) {
            return 'boolean';
        }

        if (is_numeric($value)) {
            return 'number';
        }

        if (is_array($value)) {
            return 'array';
        }

        // Try to parse as JSON
        if (is_string($value) && json_decode($value) !== null) {
            return 'json';
        }

        return 'string';
    }
}