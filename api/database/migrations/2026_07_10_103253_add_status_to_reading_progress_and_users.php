<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reading_progress', function (Blueprint $table) {
            $table->string('reading_status')->default('reading')
                ->comment('want_to_read | reading | finished')
                ->after('progress_percentage');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_deactivated')->default(false)->after('subscription_status');
        });
    }

    public function down(): void
    {
        Schema::table('reading_progress', function (Blueprint $table) {
            $table->dropColumn('reading_status');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_deactivated');
        });
    }
};
