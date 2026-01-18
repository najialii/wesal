<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id',
        'is_super_admin',
        'avatar',
        'phone',
        'timezone',
        'last_login_at',
        'email_verified_at',
        'google_id',
        'onboarding_completed',
        'onboarding_step',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
            'onboarding_completed' => 'boolean',
            'onboarding_step' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function createdTenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'created_by');
    }

    /**
     * Get the branches assigned to this user
     */
    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'branch_user')
                    ->withPivot('is_manager')
                    ->withTimestamps();
    }

    /**
     * Check if user can access a specific branch
     */
    public function canAccessBranch(int $branchId): bool
    {
        if ($this->isSuperAdmin() || $this->isTenantAdmin()) {
            return Branch::where('id', $branchId)
                        ->where('tenant_id', $this->tenant_id)
                        ->exists();
        }

        return $this->branches()->where('branches.id', $branchId)->exists();
    }

    /**
     * Check if user is a manager of a specific branch
     */
    public function isManagerOf(int $branchId): bool
    {
        return $this->branches()
                    ->where('branches.id', $branchId)
                    ->wherePivot('is_manager', true)
                    ->exists();
    }

    /**
     * Get user's default branch (first assigned branch)
     */
    public function getDefaultBranch(): ?Branch
    {
        if ($this->isTenantAdmin()) {
            return Branch::where('tenant_id', $this->tenant_id)
                        ->where('is_default', true)
                        ->first();
        }

        return $this->branches()->first();
    }

    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin === true;
    }

    public function isTenantAdmin(): bool
    {
        // Check if user has any admin-level roles
        $adminRoles = ['admin', 'business_owner', 'business_admin', 'tenant_admin'];
        
        foreach ($adminRoles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }
        
        // Fallback: if user has no roles but has a tenant_id, they might be the original owner
        // This handles cases where roles weren't properly assigned during registration
        if (!$this->roles()->exists() && $this->tenant_id) {
            // Check if this user created the tenant (they would be the owner)
            if ($this->tenant && $this->tenant->created_by === $this->id) {
                return true;
            }
            
            // Check if this is the only user in the tenant (likely the owner)
            $tenantUserCount = User::where('tenant_id', $this->tenant_id)->count();
            if ($tenantUserCount === 1) {
                return true;
            }
        }
        
        return false;
    }

    public function canAccessTenant(Tenant $tenant): bool
    {
        return $this->isSuperAdmin() || $this->tenant_id === $tenant->id;
    }

    public function getAvatarUrlAttribute(): string
    {
        return $this->avatar 
            ? asset('storage/' . $this->avatar)
            : 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';
    }
}
