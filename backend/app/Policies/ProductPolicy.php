<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view_products');
    }

    public function view(User $user, Product $product): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('view_products');
    }

    public function create(User $user): bool
    {
        return $user->can('create_products');
    }

    public function update(User $user, Product $product): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('edit_products');
    }

    public function delete(User $user, Product $product): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('delete_products');
    }
}