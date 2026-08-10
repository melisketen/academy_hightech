<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reading_progress', function (Blueprint $table) {
            // Filtered by AdminController::stats and grouped by BookController::myReadsByStatus.
            $table->index('reading_status');
        });

        Schema::table('payments', function (Blueprint $table) {
            // Filtered by AdminController::stats (sum of successful payments).
            $table->index('status');
        });

        Schema::table('books', function (Blueprint $table) {
            // Sorted on by BookController::popular / new / recentlyUpdated.
            $table->index('popularity_score');
            $table->index('published_at');
            $table->index('updated_at');
        });

        Schema::table('users', function (Blueprint $table) {
            // Filtered by AdminController::stats (active subscriber count).
            $table->index('subscription_status');
        });
    }

    public function down(): void
    {
        Schema::table('reading_progress', function (Blueprint $table) {
            $table->dropIndex(['reading_status']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['popularity_score']);
            $table->dropIndex(['published_at']);
            $table->dropIndex(['updated_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['subscription_status']);
        });
    }
};
