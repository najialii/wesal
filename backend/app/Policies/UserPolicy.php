<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view_staff');
    }

    public function view(User $user, User $model): bool
    {
        // Tenant scoping is handled by checking tenant_id in controller
        return $user->can('view_staff') && $user->tenant_id === $model->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->can('create_staff');
    }

    public function update(User $user, User $model): bool
    {
        // Tenant scoping is handled by checking tenant_id in controller
        return $user->can('edit_staff') && $user->tenant_id === $model->tenant_id;
    }

    public function delete(User $user, User $model): bool
    {
        return $user->can('delete_staff') && 
               $user->tenant_id === $model->tenant_id && 
               $user->id !== $model->id; // Can't delete yourself
    }
}