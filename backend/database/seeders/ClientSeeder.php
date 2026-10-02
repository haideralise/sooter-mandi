<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ClientSubscription;
use App\Models\Thread;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $clients = [
            [
                'email' => 'loom.owner@example.com',
                'phone' => '03111111111',
                'name' => 'Asad Loom Works',
                'city' => 'Faisalabad',
                'organization_name' => 'Asad Loom Works',
            ],
            [
                'email' => 'weaver@example.com',
                'phone' => '03222222222',
                'name' => 'Bilal Weaving',
                'city' => 'Faisalabad',
                'organization_name' => 'Bilal Weaving Factory',
            ],
        ];

        foreach ($clients as $data) {
            $client = Client::updateOrCreate(
                ['email' => $data['email']],
                $data + ['password' => 'password', 'is_active' => true]
            );

            foreach (Thread::query()->limit(3)->get() as $thread) {
                ClientSubscription::updateOrCreate(
                    [
                        'client_id' => $client->id,
                        'thread_id' => $thread->id,
                        'agency_id' => $thread->agency_id,
                    ],
                    ['notification_type' => 'All', 'is_active' => true]
                );
            }

            $client->logActivity('seeded', 'Demo client created by ClientSeeder');
        }
    }
}
