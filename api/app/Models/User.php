<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'email',
        'password',
        'profile_info',
        'subscription_status',
        'is_deactivated',
        'is_admin',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'profile_info' => 'array',
            'is_deactivated' => 'boolean',
            'is_admin' => 'boolean',
        ];
    }

    public function readingProgresses()
    {
        return $this->hasMany(ReadingProgress::class);
    }

    /** Alias used by exportData */
    public function readingProgress()
    {
        return $this->hasMany(ReadingProgress::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function books()
    {
        return $this->belongsToMany(Book::class, 'reading_progress')
            ->withPivot('last_read_page', 'progress_percentage')
            ->withTimestamps();
    }

    public function favorites()
    {
        return $this->belongsToMany(Book::class, 'favorites')->withTimestamps();
    }
}
