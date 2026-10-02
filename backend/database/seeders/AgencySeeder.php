<?php

namespace Database\Seeders;

use App\Models\Agency;
use Illuminate\Database\Seeder;

class AgencySeeder extends Seeder
{
    public function run(): void
    {
        $agencies = [
            [
                'name' => 'Faisalabad Cotton Mills',
                'city' => 'Faisalabad',
                'godown_address' => 'Godown 14, Sooter Mandi, Faisalabad',
                'contact_phone' => '0411234567',
                'contact_email' => 'sales@fcmills.local',
            ],
            [
                'name' => 'Chenab Thread Agency',
                'city' => 'Faisalabad',
                'godown_address' => 'Block B, Jhang Road, Faisalabad',
                'contact_phone' => '0412345678',
                'contact_email' => 'info@chenabthread.local',
            ],
            [
                'name' => 'Ravi Textiles',
                'city' => 'Lahore',
                'godown_address' => 'Shed 7, Badami Bagh, Lahore',
                'contact_phone' => '0423456789',
                'contact_email' => 'orders@ravitextiles.local',
            ],
            [
                'name' => 'Indus Yarn Traders',
                'city' => 'Karachi',
                'godown_address' => 'Plot 22, SITE Area, Karachi',
                'contact_phone' => '0213456789',
                'contact_email' => 'desk@indusyarn.local',
            ],
        ];

        foreach ($agencies as $agency) {
            Agency::updateOrCreate(['name' => $agency['name']], $agency + ['is_active' => true]);
        }
    }
}
