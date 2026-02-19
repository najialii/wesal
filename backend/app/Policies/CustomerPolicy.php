<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('manage_customers') || $user->can('view_customers');
    }

    public function view(User $user, Customer $customer): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('manage_customers') || $user->can('view_customers');
    }

    public function create(User $user): bool
    {
        return $user->can('manage_customers');
    }

    public function update(User $user, Customer $customer): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('manage_customers');
    }

    public function delete(User $user, Customer $customer): bool
    {
        // Tenant scoping is handled by global scope in BelongsToTenant trait
        return $user->can('manage_customers');
    }
}