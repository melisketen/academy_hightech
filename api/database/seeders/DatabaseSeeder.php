<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Book;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(SubscriptionSeeder::class);

        User::factory()->create([
            'email' => 'admin@example.com',
            'password' => bcrypt('adminpassword'),
            'subscription_status' => 'premium',
            'is_admin' => true,
            'profile_info' => [
                'name' => 'Admin User',
                'username' => 'adminuser',
                'avatar' => null,
                'is_verified' => true,
            ]
        ]);

        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'subscription_status' => 'premium',
            'is_admin' => false,
            'profile_info' => [
                'name' => 'Test User',
                'username' => 'testuser',
                'avatar' => null,
                'is_verified' => true,
            ]
        ]);

        // Developer Series (Category ID 1)
        Book::create([
            'title' => 'Git for Teams',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 1,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subDays(10),
            'popularity_score' => 85,
        ]);
        Book::create([
            'title' => 'React + TypeScript',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 1,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subDays(5),
            'popularity_score' => 95,
        ]);
        Book::create([
            'title' => 'Docker & DevOps',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 1,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subDays(30),
            'popularity_score' => 60,
        ]);
        Book::create([
            'title' => 'Local LLMs in Production',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 1,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subDays(2),
            'popularity_score' => 110,
        ]);

        // Academic Series (Category ID 2)
        Book::create([
            'title' => 'Java\'nın Temelleri',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 2,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subMonths(6),
            'popularity_score' => 45,
        ]);
        Book::create([
            'title' => 'Nesneye Yönelik Programlama',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 2,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subMonths(5),
            'popularity_score' => 50,
        ]);
        Book::create([
            'title' => 'Veri Yapıları ve Algoritmalar',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 2,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subMonths(4),
            'popularity_score' => 75,
        ]);
        Book::create([
            'title' => 'Yapay Zekâ ve Veri Madenciliği',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 2,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subMonths(3),
            'popularity_score' => 90,
        ]);

        // AI & Data Series (Category ID 3)
        Book::create([
            'title' => 'Python for Data Analysis',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 3,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subDays(12),
            'popularity_score' => 80,
        ]);
        Book::create([
            'title' => 'Agentic AI for Engineers',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 3,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subDays(1),
            'popularity_score' => 125,
        ]);
        Book::create([
            'title' => 'AI + IoT in Agriculture',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 3,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subMonths(2),
            'popularity_score' => 40,
        ]);
        Book::create([
            'title' => 'Retrieval-Augmented Systems',
            'author' => 'Prof. Dr. İsmail KIRBAŞ',
            'category_id' => 3,
            'file_path' => 'books/test-book.pdf',
            'published_at' => now()->subDays(15),
            'popularity_score' => 70,
        ]);

        // Seed notifications
        \Illuminate\Support\Facades\DB::table('notifications')->insert([
            [
                'title' => 'New Release!',
                'message' => 'Agentic AI for Engineers has been published! Read the latest on AI agents.',
                'type' => 'new_book',
                'book_id' => 10,
                'version' => '1.0.0',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Book Update',
                'message' => 'Git for Teams has been updated to v1.0.2 with additional real-world case studies.',
                'type' => 'version_update',
                'book_id' => 1,
                'version' => '1.0.2',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }
}
