<?php

namespace Database\Seeders;

use App\Models\Subscription;
use Illuminate\Database\Seeder;

class SubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        Subscription::updateOrCreate(
            ['name' => 'Standard'],
            [
                'price' => 9.99,
                'features' => json_encode([
                    'access_books' => true,
                    'watermark' => true,
                    'offline_reading' => false,
                ])
            ]
        );

        Subscription::updateOrCreate(
            ['name' => 'Premium'],
            [
                'price' => 19.99,
                'features' => json_encode([
                    'access_books' => true,
                    'watermark' => true,
                    'offline_reading' => true,
                    'priority_support' => true,
                ])
            ]
        );
    }
}
