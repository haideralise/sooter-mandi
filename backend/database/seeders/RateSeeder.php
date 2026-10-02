<?php

namespace Database\Seeders;

use App\Models\Rate;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Database\Seeder;

class RateSeeder extends Seeder
{
    public function run(): void
    {
        $broker = User::where('role', 'broker')->first();

        foreach (Thread::with('agency')->get() as $index => $thread) {
            // Seed 6 hourly data points so trend charts have something to draw.
            $price = 1000 + ($index * 25);
            $previous = null;

            for ($hoursAgo = 5; $hoursAgo >= 0; $hoursAgo--) {
                $timestamp = now()->subHours($hoursAgo);

                Rate::create([
                    'thread_id' => $thread->id,
                    'agency_id' => $thread->agency_id,
                    'price_pkr' => $price,
                    'previous_price' => $previous,
                    'updated_by' => $broker?->id,
                    'godown_address' => $thread->agency?->godown_address,
                    'notes' => $hoursAgo === 0 ? 'Latest hourly update' : null,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ]);

                $previous = $price;
                $price += ($hoursAgo % 2 === 0) ? 15 : -10;
            }
        }
    }
}
