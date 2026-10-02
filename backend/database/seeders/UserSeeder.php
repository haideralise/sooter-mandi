<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@sootermandi.local'],
            [
                'name' => 'Market Admin',
                'password' => 'password',
                'role' => 'admin',
                'phone' => '03001234567',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'broker@sootermandi.local'],
            [
                'name' => 'Field Broker',
                'password' => 'password',
                'role' => 'broker',
                'phone' => '03007654321',
                'is_active' => true,
            ]
        );
    }
}
