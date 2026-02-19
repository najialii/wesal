<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ResetSuperAdminPassword extends Command
{
    protected $signature = 'admin:reset-password {email=admin@wesaltech.com}';
    protected $description = 'Reset super admin password with proper bcrypt hashing';

    public function handle()
    {
        $email = $this->argument('email');
        $password = '11235813nJ';

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found!");
            return 1;
        }

        $user->password = Hash::make($password);
        $user->save();

        $this->info('Password reset successfully!');
        $this->info("Email: {$email}");
        $this->info("Password: {$password}");
        
        return 0;
    }
}
