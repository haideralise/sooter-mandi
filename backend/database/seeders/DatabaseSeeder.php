<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            AgencySeeder::class,
            ThreadSeeder::class,
            RateSeeder::class,
            ClientSeeder::class,
        ]);
    }
}
