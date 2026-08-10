<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProgressRequest;
use App\Jobs\ApplyWatermarkJob;
use App\Models\Book;
use App\Models\ReadingProgress;
use App\Services\PdfWatermarkService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class BookController extends Controller
{
    /**
     * Get newest books (paginated).
     */
    public function new(Request $request)
    {
        $page = $request->get('page', 1);
        try {
            $books = Cache::remember("books:new:page:{$page}", 3600, function () {
                return Book::orderBy('published_at', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->paginate(15);
            });
        } catch (\Throwable $e) {
            Log::warning('BookController::new: Cache unavailable, falling back to DB.', ['error' => $e->getMessage()]);
            $books = Book::orderBy('published_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate(15);
        }

        return response()->json($books);
    }

    /**
     * Get popular books based on popularity score.
     */
    public function popular(Request $request)
    {
        $page = $request->get('page', 1);
        try {
            $books = Cache::remember("books:popular:page:{$page}", 3600, function () {
                return Book::orderBy('popularity_score', 'desc')->paginate(15);
            });
        } catch (\Throwable $e) {
            Log::warning('BookController::popular: Cache unavailable, falling back to DB.', ['error' => $e->getMessage()]);
            $books = Book::orderBy('popularity_score', 'desc')->paginate(15);
        }

        return response()->json($books);
    }

    /**
     * Get active reading list for the authenticated user.
     */
    public function myReads(Request $request)
    {
        $user = $request->user();

        $reads = ReadingProgress::with('book')
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->paginate(15);

        // Overlay real-time values from Redis when available. Redis is a
        // performance cache here, not the source of truth — the DB row
        // already holds the last-synced values, so an outage should degrade
        // gracefully instead of 500ing the reading list.
        try {
            $collection = $reads->getCollection();

            // Batch all page/percentage lookups into a single MGET instead of
            // two Redis round-trips per row (was up to 30 round-trips for a
            // 15-item page).
            $keys = [];
            foreach ($collection as $item) {
                $keys[] = "user:{$user->id}:book:{$item->book_id}:page";
                $keys[] = "user:{$user->id}:book:{$item->book_id}:percentage";
            }

            if (! empty($keys)) {
                $values = Redis::mget($keys);
                $collection->values()->each(function ($item, $index) use ($values) {
                    $cachedPage = $values[$index * 2] ?? null;
                    $cachedPercentage = $values[$index * 2 + 1] ?? null;

                    if ($cachedPage !== null && $cachedPage !== false) {
                        $item->last_read_page = (int) $cachedPage;
                    }
                    if ($cachedPercentage !== null && $cachedPercentage !== false) {
                        $item->progress_percentage = (float) $cachedPercentage;
                    }
                });
            }
        } catch (\Throwable $e) {
            Log::warning('BookController::myReads: Redis unavailable, serving DB-only progress values.', [
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json($reads);
    }

    /**
     * Search books by title or author.
     */
    public function search(Request $request)
    {
        $query = $request->query('q', '');
        $page = $request->get('page', 1);
        $cacheKey = 'books:search:'.md5($query).":page:{$page}";

        try {
            $books = Cache::remember($cacheKey, 1800, function () use ($query) {
                if (trim($query) === '') {
                    return Book::orderBy('popularity_score', 'desc')->paginate(15);
                } else {
                    return Book::where('title', 'like', "%{$query}%")
                        ->orWhere('author', 'like', "%{$query}%")
                        ->paginate(15);
                }
            });
        } catch (\Throwable $e) {
            Log::warning('BookController::search: Cache unavailable, falling back to DB.', ['error' => $e->getMessage()]);
            if (trim($query) === '') {
                $books = Book::orderBy('popularity_score', 'desc')->paginate(15);
            } else {
                $books = Book::where('title', 'like', "%{$query}%")
                    ->orWhere('author', 'like', "%{$query}%")
                    ->paginate(15);
            }
        }

        return response()->json($books);
    }

    /**
     * Fetch recently updated books (cached sidebar feed).
     */
    public function recentlyUpdated()
    {
        $books = Cache::remember('books:recently_updated', 3600, function () {
            return Book::orderBy('updated_at', 'desc')->limit(5)->get();
        });

        return response()->json($books);
    }

    /**
     * Stream secure, watermarked PDF in chunks.
     */
    public function stream(int $id, Request $request, PdfWatermarkService $watermarkService)
    {
        $user = $request->user();

        // Security check: Must have standard or premium subscription
        if (! in_array($user->subscription_status, ['standard', 'premium'])) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Active subscription (Standard or Premium) is required to stream books.',
            ], 403);
        }

        $book = Book::findOrFail($id);

        // Standard users: enforce series restriction
        if ($user->subscription_status === 'standard') {
            $profileInfo = $user->profile_info ?? [];
            $allowedSeries = $profileInfo['allowed_series'] ?? null;

            // If a series restriction is set and the book's category doesn't match, deny access
            if ($allowedSeries !== null && (string) $book->category_id !== (string) $allowedSeries) {
                return response()->json([
                    'error' => 'Access Denied',
                    'message' => 'Your Standard plan only covers one book series. Upgrade to Premium for unlimited access, or change your allowed series in your profile.',
                ], 403);
            }
        }

        // Increment popularity score
        $book->increment('popularity_score');

        $cachePath = "private/watermarked_cache/{$user->id}_{$book->id}.pdf";
        $absoluteCachePath = storage_path('app/'.$cachePath);

        // 1. Stream from cache if it already exists
        if (file_exists($absoluteCachePath)) {
            return response()->stream(function () use ($absoluteCachePath) {
                $file = fopen($absoluteCachePath, 'rb');
                while (! feof($file)) {
                    echo fread($file, 1024 * 8); // Stream 8KB chunks
                    flush();
                }
                fclose($file);
            }, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="secure-'.basename($book->file_path).'"',
                'Cache-Control' => 'no-cache, private',
            ]);
        }

        // 2. Otherwise watermark on-the-fly and queue a job to write the cache file
        $originalPath = storage_path('app/private/'.$book->file_path);

        if (! file_exists($originalPath)) {
            return response()->json([
                'error' => 'Not Found',
                'message' => 'Original book file not found.',
            ], 404);
        }

        try {
            $pdfContent = $watermarkService->watermark($originalPath, $user->email);

            // Queue background caching job for future fast streams
            ApplyWatermarkJob::dispatch($user, $book);

            return response()->stream(function () use ($pdfContent) {
                echo $pdfContent;
            }, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="secure-'.basename($book->file_path).'"',
                'Cache-Control' => 'no-cache, private',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'Failed to apply security watermark: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Track user reading progress inside Redis.
     */
    public function updateProgress(int $id, UpdateProgressRequest $request)
    {
        $user = $request->user();
        $book = Book::findOrFail($id);

        $page = $request->input('last_read_page');
        $percentage = $request->input('progress_percentage');
        $syncImmediately = (bool) $request->input('sync_immediately', false);
        $redisAvailable = true;

        // Write real-time progress to Redis. Redis is a hot-path cache/queue
        // here, not the durable store — if it's unavailable, fall back to
        // writing straight to the DB so progress is never silently lost.
        try {
            Redis::set("user:{$user->id}:book:{$book->id}:page", $page);
            Redis::set("user:{$user->id}:book:{$book->id}:percentage", $percentage);
        } catch (\Throwable $e) {
            Log::warning('BookController::updateProgress: Redis unavailable, writing progress directly to DB.', [
                'error' => $e->getMessage(),
            ]);
            $redisAvailable = false;
            $syncImmediately = true;
        }

        if ($syncImmediately) {
            // Write directly to SQLite DB (e.g. on explicit tab closure / manual
            // save, or as a fallback when Redis is unavailable)
            ReadingProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'book_id' => $book->id,
                ],
                [
                    'last_read_page' => (int) $page,
                    'progress_percentage' => (float) $percentage,
                ]
            );

            if ($redisAvailable) {
                // Remove from dirty list since it is persisted
                Redis::srem('reading_progress:dirty', "{$user->id}:{$book->id}");
            }
        } elseif ($redisAvailable) {
            // Flag record as dirty to be synchronized by the scheduler
            Redis::sadd('reading_progress:dirty', "{$user->id}:{$book->id}");
        }

        return response()->json([
            'message' => 'Reading progress saved successfully.',
            'last_read_page' => (int) $page,
            'progress_percentage' => (float) $percentage,
            'cached' => $redisAvailable && ! $syncImmediately,
        ]);
    }

    /**
     * Get the user's favorite books.
     */
    public function getFavorites(Request $request)
    {
        $favorites = $request->user()->favorites()->paginate(15);

        return response()->json($favorites);
    }

    /**
     * Toggle a book's favorite status.
     */
    public function toggleFavorite(int $id, Request $request)
    {
        $user = $request->user();
        $book = Book::findOrFail($id);

        if ($user->favorites()->where('book_id', $book->id)->exists()) {
            $user->favorites()->detach($book->id);
            $favorited = false;
            $message = 'Book removed from favorites.';
        } else {
            $user->favorites()->attach($book->id);
            $favorited = true;
            $message = 'Book added to favorites.';
        }

        return response()->json([
            'message' => $message,
            'favorited' => $favorited,
        ]);
    }

    /**
     * Get suggested books.
     */
    public function getSuggestedBooks(Request $request)
    {
        $user = $request->user();

        // Find most read category
        $latestRead = ReadingProgress::with('book')
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->first();

        // Computed once and reused below instead of being re-queried.
        $readBookIds = ReadingProgress::where('user_id', $user->id)->pluck('book_id')->toArray();

        $query = Book::query();

        if ($latestRead && $latestRead->book) {
            // Prioritize the same category but exclude already read books
            $query->where('category_id', $latestRead->book->category_id)
                ->whereNotIn('id', $readBookIds);
        }

        // Get 4 suggestions
        $suggestions = $query->orderBy('popularity_score', 'desc')->limit(4)->get();

        // If not enough suggestions, fill with other popular books
        if ($suggestions->count() < 4) {
            $excludeIds = array_merge($suggestions->pluck('id')->toArray(), $readBookIds);

            $extra = Book::whereNotIn('id', $excludeIds)
                ->orderBy('popularity_score', 'desc')
                ->limit(4 - $suggestions->count())
                ->get();

            $suggestions = $suggestions->merge($extra);
        }

        return response()->json($suggestions);
    }

    /**
     * Get active notifications.
     */
    public function getNotifications()
    {
        $notifications = DB::table('notifications')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    /**
     * Add a book to the user's tracked shelf with a given status.
     * Body: { "status": "want_to_read" | "reading" | "finished" }
     */
    public function trackBook(Request $request, int $id)
    {
        $request->validate(['status' => 'required|in:want_to_read,reading,finished']);
        $user = $request->user();
        $book = Book::findOrFail($id);

        $progress = ReadingProgress::updateOrCreate(
            ['user_id' => $user->id, 'book_id' => $book->id],
            ['reading_status' => $request->status]
        );

        return response()->json([
            'message' => 'Book added to your shelf.',
            'reading_status' => $progress->reading_status,
            'book' => $book,
        ], 201);
    }

    /**
     * Change the reading status of a tracked book.
     */
    public function updateTrackStatus(Request $request, int $id)
    {
        $request->validate(['status' => 'required|in:want_to_read,reading,finished']);
        $user = $request->user();

        $progress = ReadingProgress::where('user_id', $user->id)
            ->where('book_id', $id)
            ->firstOrFail();

        $progress->reading_status = $request->status;
        $progress->save();

        return response()->json([
            'message' => 'Status updated.',
            'reading_status' => $progress->reading_status,
        ]);
    }

    /**
     * Remove a book from the user's tracked shelf.
     */
    public function untrackBook(Request $request, int $id)
    {
        $user = $request->user();

        ReadingProgress::where('user_id', $user->id)
            ->where('book_id', $id)
            ->delete();

        return response()->json(['message' => 'Book removed from shelf.']);
    }

    /**
     * Get tracked books grouped by reading_status.
     */
    public function myReadsByStatus(Request $request)
    {
        $user = $request->user();

        $grouped = ReadingProgress::with('book')
            ->where('user_id', $user->id)
            ->get()
            ->groupBy('reading_status');

        return response()->json([
            'reading' => $grouped->get('reading', collect())->values(),
            'want_to_read' => $grouped->get('want_to_read', collect())->values(),
            'finished' => $grouped->get('finished', collect())->values(),
        ]);
    }
}
