<?php

namespace App\Traits;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToBranch
{
    protected static function bootBelongsToBranch()
    {
        // Automatically scope queries to the current user's active branch
        static::addGlobalScope('branch', function (Builder $builder) {
            $branchId = self::getCurrentBranchId();
            
            // Only apply branch scope if user is not a business owner and branch context exists
            if ($branchId && auth()->check() && !auth()->user()->isTenantAdmin()) {
                $builder->where('branch_id', $branchId);
            }
        });

        // Automatically set branch_id when creating records
        static::creating(function ($model) {
            if (!isset($model->branch_id)) {
                $branchId = self::getCurrentBranchId();
                if ($branchId) {
                    $model->branch_id = $branchId;
                }
            }
        });
    }

    /**
     * Get the branch that owns the model
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Scope query to a specific branch
     */
    public function scopeForBranch(Builder $query, int $branchId): Builder
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Scope query without branch scope
     */
    public function scopeWithoutBranchScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('branch');
    }

    /**
     * Get the current branch ID from session or user context
     */
    protected static function getCurrentBranchId(): ?int
    {
        // Try to get from session first
        if (session()->has('active_branch_id')) {
            return session('active_branch_id');
        }

        // Try to get from authenticated user's token
        if (auth()->check() && auth()->user()->currentAccessToken()) {
            $token = auth()->user()->currentAccessToken();
            if ($token && isset($token->abilities['branch_id'])) {
                return $token->abilities['branch_id'];
            }
        }

        // Try to get user's default branch
        if (auth()->check()) {
            $user = auth()->user();
            $branch = $user->branches()->first();
            if ($branch) {
                return $branch->id;
            }
        }

        return null;
    }
}
