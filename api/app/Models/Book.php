<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'author',
        'category_id',
        'file_path',
        'published_at',
        'popularity_score',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'popularity_score' => 'integer',
    ];

    protected static function booted(): void
    {
        static::saved(function ($book) {
            \Illuminate\Support\Facades\Cache::forget('books:recently_updated');
        });

        static::deleted(function ($book) {
            \Illuminate\Support\Facades\Cache::forget('books:recently_updated');
        });
    }

    public function readingProgresses()
    {
        return $this->hasMany(ReadingProgress::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'reading_progress')
                    ->withPivot('last_read_page', 'progress_percentage')
                    ->withTimestamps();
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }
}
