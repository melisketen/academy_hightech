<?php

namespace App\Console\Commands;

use App\Models\ReadingProgress;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class SyncReadingProgress extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-reading-progress';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync reading progress from Redis to the relational database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting reading progress synchronization...');

        // Fetch all dirty user-book progress markers from the Redis set
        $dirtyKeys = Redis::smembers('reading_progress:dirty');

        if (empty($dirtyKeys)) {
            $this->info('No dirty progress records to sync.');

            return 0;
        }

        $count = 0;
        foreach ($dirtyKeys as $keyPair) {
            // keyPair is in format "user_id:book_id"
            $parts = explode(':', $keyPair);
            if (count($parts) !== 2) {
                continue;
            }

            [$userId, $bookId] = $parts;

            // Fetch cached page and percentage
            $page = Redis::get("user:{$userId}:book:{$bookId}:page");
            $percentage = Redis::get("user:{$userId}:book:{$bookId}:percentage");

            if ($page !== null && $percentage !== null) {
                ReadingProgress::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'book_id' => $bookId,
                    ],
                    [
                        'last_read_page' => (int) $page,
                        'progress_percentage' => (float) $percentage,
                    ]
                );

                $count++;
            }

            // Remove from dirty set
            Redis::srem('reading_progress:dirty', $keyPair);
        }

        $this->info("Successfully synchronized {$count} reading progress record(s).");

        return 0;
    }
}
