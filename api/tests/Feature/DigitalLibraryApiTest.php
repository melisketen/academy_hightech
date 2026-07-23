<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\ReadingProgress;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Payment;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class DigitalLibraryApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Auth Registration.
     */
    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'newuser@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'access_token',
                'token_type',
                'user' => ['id', 'email', 'subscription_status']
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
        ]);
    }

    /**
     * Test Auth Login.
     */
    public function test_user_can_login(): void
    {
        User::factory()->create([
            'email' => 'loginuser@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'loginuser@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'access_token',
                'token_type',
                'user'
            ]);
    }

    /**
     * Full forgot-password -> reset-password round trip.
     */
    public function test_password_reset_flow(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'reset-me@example.com',
            'password' => Hash::make('old-password'),
        ]);
        $token = $user->createToken('to-be-revoked')->plainTextToken;

        // 1. Request the link — always generic, doesn't leak whether the email exists.
        $this->postJson('/api/auth/forgot-password', ['email' => 'reset-me@example.com'])
            ->assertStatus(200);
        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertStatus(200);

        Notification::assertSentTo($user, ResetPassword::class);

        // 2. Pull the real token out of the notification that was "sent".
        $capturedToken = null;
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$capturedToken) {
            $capturedToken = $notification->token;
            return true;
        });

        // 3. Wrong token is rejected.
        $this->postJson('/api/auth/reset-password', [
            'email' => 'reset-me@example.com',
            'token' => 'not-the-real-token',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertStatus(422);

        // 4. Correct token resets the password and revokes existing tokens.
        $this->postJson('/api/auth/reset-password', [
            'email' => 'reset-me@example.com',
            'token' => $capturedToken,
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertStatus(200);

        $user->refresh();
        $this->assertTrue(Hash::check('brand-new-password', $user->password));
        $this->assertCount(0, $user->tokens);

        // 5. Can log in with the new password.
        $this->postJson('/api/auth/login', [
            'email' => 'reset-me@example.com',
            'password' => 'brand-new-password',
        ])->assertStatus(200);
    }

    /**
     * Test Fetch Profile.
     */
    public function test_authenticated_user_can_access_profile_and_update_it(): void
    {
        $user = User::factory()->create();

        // 1. Get profile (Unauthenticated should fail)
        $this->getJson('/api/user/profile')->assertStatus(401);

        // Authenticated access
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/user/profile');
        $response->assertStatus(200)
            ->assertJsonPath('user.email', $user->email);

        // 2. Update profile
        $updateResponse = $this->actingAs($user, 'sanctum')->putJson('/api/user/profile', [
            'profile_info' => ['name' => 'John Doe', 'bio' => 'Developer']
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('user.profile_info.name', 'John Doe');
    }

    /**
     * A user must not be able to self-grant is_verified / twofa_enabled via
     * profile PATCH, whether via the flat-field shortcut or the bulk profile_info block.
     */
    public function test_user_cannot_self_verify_or_set_twofa_via_profile_update(): void
    {
        $user = User::factory()->create();

        // Attempt via flat-field shortcuts — silently ignored, not applied
        $this->actingAs($user, 'sanctum')->putJson('/api/user/profile', [
            'is_verified' => true,
            'twofa_enabled' => 'totp',
        ])->assertStatus(200);

        $user->refresh();
        $this->assertArrayNotHasKey('is_verified', $user->profile_info ?? []);
        $this->assertArrayNotHasKey('twofa_enabled', $user->profile_info ?? []);

        // Attempt via the bulk profile_info block
        $response = $this->actingAs($user, 'sanctum')->putJson('/api/user/profile', [
            'profile_info' => ['is_verified' => true, 'twofa_enabled' => 'sms', 'bio' => 'Hi'],
        ]);

        $response->assertStatus(200);
        $user->refresh();
        $this->assertArrayNotHasKey('is_verified', $user->profile_info ?? []);
        $this->assertArrayNotHasKey('twofa_enabled', $user->profile_info ?? []);
        $this->assertEquals('Hi', $user->profile_info['bio']);
    }

    /**
     * Changing the account email must require the current password.
     */
    public function test_changing_email_requires_current_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct-password')]);

        // Missing current_password entirely
        $this->actingAs($user, 'sanctum')->putJson('/api/user/profile', [
            'email' => 'new@example.com',
        ])->assertStatus(422);

        // Wrong current_password
        $this->actingAs($user, 'sanctum')->putJson('/api/user/profile', [
            'email' => 'new@example.com',
            'current_password' => 'totally-wrong',
        ])->assertStatus(403);

        $user->refresh();
        $this->assertNotEquals('new@example.com', $user->email);

        // Correct current_password
        $this->actingAs($user, 'sanctum')->putJson('/api/user/profile', [
            'email' => 'new@example.com',
            'current_password' => 'correct-password',
        ])->assertStatus(200);

        $user->refresh();
        $this->assertEquals('new@example.com', $user->email);
    }

    /**
     * Test Subscription Endpoints & Payment Checkouts.
     */
    public function test_subscription_and_checkout_endpoints(): void
    {
        $user = User::factory()->create();
        $subscription = Subscription::create([
            'name' => 'Premium',
            'price' => 19.99,
            'features' => json_encode(['all' => true]),
        ]);

        // List pricing tiers
        $this->getJson('/api/subscriptions')
            ->assertStatus(200)
            ->assertJsonCount(1);

        // Initiate subscribe session (Stripe)
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/subscriptions/subscribe', [
            'subscription_id' => $subscription->id,
            'gateway' => 'stripe'
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'checkout' => [
                    'transaction_id',
                    'amount',
                    'gateway',
                    'checkout_url'
                ]
            ]);

        $this->assertDatabaseHas('payments', [
            'user_id' => $user->id,
            'amount' => 19.99,
            'gateway' => 'stripe',
            'status' => 'pending'
        ]);
    }

    /**
     * Sign a webhook payload the same way WebhookController expects, for tests.
     */
    private function signedWebhookHeaders(array $payload): array
    {
        $secret = config('services.payment_webhook.secret');
        $body = json_encode($payload);

        return ['X-Webhook-Signature' => hash_hmac('sha256', $body, $secret)];
    }

    /**
     * Test Webhook integration.
     */
    public function test_payment_webhook_updates_status(): void
    {
        $user = User::factory()->create(['subscription_status' => 'free']);
        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => 19.99,
            'gateway' => 'stripe',
            'transaction_id' => 'stripe_test_txn_123',
            'status' => 'pending'
        ]);

        $payload = [
            'gateway' => 'stripe',
            'transaction_id' => 'stripe_test_txn_123',
            'status' => 'success',
            'subscription_name' => 'Premium'
        ];

        // Send correctly-signed success webhook
        $response = $this->postJson('/api/webhooks/payment', $payload, $this->signedWebhookHeaders($payload));

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('payments', [
            'transaction_id' => 'stripe_test_txn_123',
            'status' => 'success'
        ]);

        $user->refresh();
        $this->assertEquals('premium', $user->subscription_status);
    }

    /**
     * A webhook with no signature header must be rejected before touching payment state.
     */
    public function test_payment_webhook_rejects_missing_signature(): void
    {
        $user = User::factory()->create(['subscription_status' => 'free']);
        Payment::create([
            'user_id' => $user->id,
            'amount' => 19.99,
            'gateway' => 'stripe',
            'transaction_id' => 'stripe_unsigned_txn',
            'status' => 'pending'
        ]);

        $response = $this->postJson('/api/webhooks/payment', [
            'gateway' => 'stripe',
            'transaction_id' => 'stripe_unsigned_txn',
            'status' => 'success',
            'subscription_name' => 'Premium'
        ]);

        $response->assertStatus(401);

        $this->assertDatabaseHas('payments', [
            'transaction_id' => 'stripe_unsigned_txn',
            'status' => 'pending' // unchanged — spoofed request never reached PaymentService
        ]);

        $user->refresh();
        $this->assertEquals('free', $user->subscription_status);
    }

    /**
     * A webhook with a forged/incorrect signature must be rejected.
     */
    public function test_payment_webhook_rejects_invalid_signature(): void
    {
        $user = User::factory()->create(['subscription_status' => 'free']);
        Payment::create([
            'user_id' => $user->id,
            'amount' => 19.99,
            'gateway' => 'stripe',
            'transaction_id' => 'stripe_forged_txn',
            'status' => 'pending'
        ]);

        $response = $this->postJson('/api/webhooks/payment', [
            'gateway' => 'stripe',
            'transaction_id' => 'stripe_forged_txn',
            'status' => 'success',
            'subscription_name' => 'Premium'
        ], ['X-Webhook-Signature' => 'not-the-real-signature']);

        $response->assertStatus(401);

        $user->refresh();
        $this->assertEquals('free', $user->subscription_status);
    }

    /**
     * Test Book Discovery feeds.
     */
    public function test_book_discovery_endpoints(): void
    {
        $user = User::factory()->create();
        Book::create([
            'title' => 'Design Patterns',
            'author' => 'Gang of Four',
            'category_id' => 1,
            'file_path' => 'books/design-patterns.pdf',
            'popularity_score' => 150,
            'published_at' => now()->subDays(2)
        ]);

        Book::create([
            'title' => 'Refactoring',
            'author' => 'Martin Fowler',
            'category_id' => 1,
            'file_path' => 'books/refactoring.pdf',
            'popularity_score' => 80,
            'published_at' => now()
        ]);

        // Get newest books
        $this->actingAs($user, 'sanctum')->getJson('/api/books/new')
            ->assertStatus(200)
            ->assertJsonPath('data.0.title', 'Refactoring');

        // Get popular books
        $this->actingAs($user, 'sanctum')->getJson('/api/books/popular')
            ->assertStatus(200)
            ->assertJsonPath('data.0.title', 'Design Patterns');

        // Search books
        $this->actingAs($user, 'sanctum')->getJson('/api/books/search?q=Fowler')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Refactoring');
    }

    /**
     * Test secure streaming with watermark.
     */
    public function test_secure_book_streaming(): void
    {
        // 1. Create user with free subscription (stream should fail)
        $freeUser = User::factory()->create(['subscription_status' => 'free']);
        
        $book = Book::create([
            'title' => 'Test Secure Book',
            'author' => 'Author',
            'category_id' => 1,
            'file_path' => 'books/test-book.pdf', // points to the mock PDF generated in setup
            'published_at' => now(),
        ]);

        $this->actingAs($freeUser, 'sanctum')
            ->getJson("/api/books/{$book->id}/stream")
            ->assertStatus(403);

        // 2. Premium user (stream should succeed)
        $premiumUser = User::factory()->create([
            'email' => 'premium@example.com',
            'subscription_status' => 'premium'
        ]);

        $response = $this->actingAs($premiumUser, 'sanctum')
            ->get('/api/books/' . $book->id . '/stream');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
        $response->assertHeader('Cache-Control', 'no-cache, private');
    }

    /**
     * Test Redis reading progress caching.
     */
    public function test_reading_progress_caches_to_redis(): void
    {
        $user = User::factory()->create();
        $book = Book::create([
            'title' => 'Redis Book',
            'author' => 'Redis Author',
            'category_id' => 2,
            'file_path' => 'books/redis.pdf',
        ]);

        // Mock Redis calls
        Redis::shouldReceive('set')
            ->once()
            ->with("user:{$user->id}:book:{$book->id}:page", '12')
            ->andReturn(true);

        Redis::shouldReceive('set')
            ->once()
            ->with("user:{$user->id}:book:{$book->id}:percentage", '24.5')
            ->andReturn(true);

        Redis::shouldReceive('sadd')
            ->once()
            ->with('reading_progress:dirty', "{$user->id}:{$book->id}")
            ->andReturn(true);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/books/{$book->id}/progress", [
            'last_read_page' => 12,
            'progress_percentage' => 24.5,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Reading progress saved successfully.',
                'last_read_page' => 12,
                'progress_percentage' => 24.5,
                'cached' => true
            ]);
    }

    /**
     * If Redis is unavailable, progress must still be saved (falls back to a
     * direct DB write) instead of the request failing outright.
     */
    public function test_reading_progress_falls_back_to_db_when_redis_is_down(): void
    {
        $user = User::factory()->create();
        $book = Book::create([
            'title' => 'Redis Down Book',
            'author' => 'Author',
            'category_id' => 2,
            'file_path' => 'books/redis-down.pdf',
        ]);

        Redis::shouldReceive('set')
            ->once()
            ->andThrow(new \Predis\Connection\ConnectionException(
                \Mockery::mock(\Predis\Connection\NodeConnectionInterface::class),
                'Connection refused'
            ));

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/books/{$book->id}/progress", [
            'last_read_page' => 7,
            'progress_percentage' => 10.0,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'last_read_page' => 7,
                'progress_percentage' => 10.0,
                'cached' => false, // Redis was down, so this was written straight to the DB
            ]);

        $this->assertDatabaseHas('reading_progress', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'last_read_page' => 7,
        ]);
    }

    /**
     * If Redis is unavailable, my-reads must still return the DB-backed list
     * instead of 500ing.
     */
    public function test_my_reads_falls_back_to_db_when_redis_is_down(): void
    {
        $user = User::factory()->create();
        $book = Book::create([
            'title' => 'Redis Down Book 2',
            'author' => 'Author',
            'category_id' => 2,
            'file_path' => 'books/redis-down-2.pdf',
        ]);
        ReadingProgress::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'last_read_page' => 3,
            'progress_percentage' => 5.0,
        ]);

        Redis::shouldReceive('get')
            ->andThrow(new \Predis\Connection\ConnectionException(
                \Mockery::mock(\Predis\Connection\NodeConnectionInterface::class),
                'Connection refused'
            ));

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/books/my-reads');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.last_read_page', 3);
    }

    /**
     * Test favorites features.
     */
    public function test_user_can_view_and_toggle_favorites(): void
    {
        $user = User::factory()->create();
        $book = Book::create([
            'title' => 'Favorite Book',
            'author' => 'Author',
            'category_id' => 1,
            'file_path' => 'books/fav.pdf',
        ]);

        // Toggle on
        $response = $this->actingAs($user, 'sanctum')->postJson("/api/books/{$book->id}/favorite");
        $response->assertStatus(200)
            ->assertJsonPath('favorited', true);

        $this->assertDatabaseHas('favorites', [
            'user_id' => $user->id,
            'book_id' => $book->id,
        ]);

        // Retrieve favorites
        $favListResponse = $this->actingAs($user, 'sanctum')->getJson('/api/books/favorites');
        $favListResponse->assertStatus(200)
            ->assertJsonPath('data.0.id', $book->id);

        // Toggle off
        $response = $this->actingAs($user, 'sanctum')->postJson("/api/books/{$book->id}/favorite");
        $response->assertStatus(200)
            ->assertJsonPath('favorited', false);

        $this->assertDatabaseMissing('favorites', [
            'user_id' => $user->id,
            'book_id' => $book->id,
        ]);
    }

    /**
     * Tracking a book must persist the requested reading_status on creation,
     * not silently fall back to the reading_status column's DB default.
     */
    public function test_tracking_a_book_persists_the_requested_status(): void
    {
        $user = User::factory()->create();
        $book = Book::create([
            'title' => 'Shelf Book',
            'author' => 'Author',
            'category_id' => 1,
            'file_path' => 'books/shelf.pdf',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/books/{$book->id}/track", [
            'status' => 'want_to_read',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('reading_status', 'want_to_read');

        $this->assertDatabaseHas('reading_progress', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'reading_status' => 'want_to_read',
        ]);
    }

    /**
     * Test suggested books.
     */
    public function test_user_can_get_suggested_books(): void
    {
        $user = User::factory()->create();
        for ($i = 1; $i <= 5; $i++) {
            Book::create([
                'title' => 'Book ' . $i,
                'author' => 'Author',
                'category_id' => 1,
                'file_path' => 'books/book' . $i . '.pdf',
                'popularity_score' => $i * 10
            ]);
        }

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/books/suggested');
        $response->assertStatus(200)
            ->assertJsonCount(4); // returns top 4 suggestions
    }

    /**
     * Test notifications list.
     */
    public function test_user_can_get_notifications(): void
    {
        $user = User::factory()->create();
        \Illuminate\Support\Facades\DB::table('notifications')->insert([
            'title' => 'Announce',
            'message' => 'New release',
            'type' => 'info',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/notifications');
        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Announce');
    }

    /**
     * Test payment history retrieval.
     */
    public function test_user_can_get_payment_history(): void
    {
        $user = User::factory()->create();
        Payment::create([
            'user_id' => $user->id,
            'amount' => 9.99,
            'gateway' => 'stripe',
            'transaction_id' => 'tx_123',
            'status' => 'success'
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/user/payments');
        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.transaction_id', 'tx_123');
    }
}
