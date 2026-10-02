<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Thread;
use Illuminate\Database\Seeder;

class ThreadSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            ['type' => 'Cotton', 'color' => 'White', 'packaging_type' => 'Carton', 'weight_value' => 100, 'weight_unit' => 'lbs'],
            ['type' => 'Cotton', 'color' => 'Black', 'packaging_type' => 'Bag', 'weight_value' => 50, 'weight_unit' => 'kg'],
            ['type' => 'Polyester', 'color' => 'White', 'packaging_type' => 'Carton', 'weight_value' => 100, 'weight_unit' => 'lbs'],
            ['type' => 'Polyester', 'color' => 'Navy', 'packaging_type' => 'Carton', 'weight_value' => 100, 'weight_unit' => 'lbs'],
            ['type' => 'Viscose', 'color' => 'Cream', 'packaging_type' => 'Bag', 'weight_value' => 25, 'weight_unit' => 'kg'],
        ];

        foreach (Agency::all() as $agency) {
            foreach ($catalog as $thread) {
                Thread::updateOrCreate(
                    [
                        'agency_id' => $agency->id,
                        'type' => $thread['type'],
                        'color' => $thread['color'],
                        'packaging_type' => $thread['packaging_type'],
                    ],
                    $thread + [
                        'agency_id' => $agency->id,
                        'description' => "{$thread['type']} thread, {$thread['color']}",
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
