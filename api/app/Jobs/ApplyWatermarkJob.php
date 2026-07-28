<?php

namespace App\Jobs;

use App\Models\Book;
use App\Models\User;
use App\Services\PdfWatermarkService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ApplyWatermarkJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected User $user;

    protected Book $book;

    public function __construct(User $user, Book $book)
    {
        $this->user = $user;
        $this->book = $book;
    }

    public function handle(PdfWatermarkService $watermarkService): void
    {
        $originalPath = storage_path('app/private/'.$this->book->file_path);

        if (! file_exists($originalPath)) {
            \Log::error("ApplyWatermarkJob: Original book file not found at {$originalPath}");

            return;
        }

        try {
            $watermarkedContent = $watermarkService->watermark($originalPath, $this->user->email);

            // Secure cache directory
            $cacheDir = 'private/watermarked_cache';
            if (! Storage::exists($cacheDir)) {
                Storage::makeDirectory($cacheDir);
            }

            $cachePath = "{$cacheDir}/{$this->user->id}_{$this->book->id}.pdf";
            Storage::put($cachePath, $watermarkedContent);

            \Log::info("ApplyWatermarkJob: Watermarked PDF cached at {$cachePath} for User ID: {$this->user->id}");
        } catch (\Exception $e) {
            \Log::error('ApplyWatermarkJob failed: '.$e->getMessage());
        }
    }
}
