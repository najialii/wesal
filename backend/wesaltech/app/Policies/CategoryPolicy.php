<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('manage_categories') || $user->can('view_products');
    }

    public function view(User $user, Category $category): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('manage_categories') || $user->can('view_products');
    }

    public function create(User $user): bool
    {
        return $user->can('manage_categories');
    }

    public function update(User $user, Category $category): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('manage_categories');
    }

    public function delete(User $user, Category $category): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('manage_categories');
    }
}