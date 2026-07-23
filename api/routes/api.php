<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

// --- Public Routes ---
Route::prefix('auth')->group(function () {
    // Tight per-route throttle on top of the blanket "api" group limiter —
    // these endpoints are brute-force/credential-stuffing targets.
    Route::middleware('throttle:6,1')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword']);
        Route::post('reset-password', [PasswordResetController::class, 'resetPassword']);
    });
});

Route::get('subscriptions', [SubscriptionController::class, 'index']);
Route::post('webhooks/payment', [WebhookController::class, 'handlePayment']);

// --- Protected Routes (Requires Sanctum Token) ---
Route::middleware('auth:sanctum')->group(function () {
    // User Profile & Account
    Route::get('user/profile', [AuthController::class, 'profile']);
    Route::put('user/profile', [AuthController::class, 'updateProfile']);
    Route::get('user/payments', [AuthController::class, 'payments']);
    Route::get('user/sessions', [AuthController::class, 'sessions']);
    Route::delete('user/sessions', [AuthController::class, 'logoutAllDevices']);
    Route::post('user/deactivate', [AuthController::class, 'deactivate']);
    Route::delete('user/account', [AuthController::class, 'deleteAccount']);
    Route::get('user/export', [AuthController::class, 'exportData']);

    // Books & Discovery
    Route::prefix('books')->group(function () {
        Route::get('new', [BookController::class, 'new']);
        Route::get('popular', [BookController::class, 'popular']);
        Route::get('my-reads', [BookController::class, 'myReads']);
        Route::get('search', [BookController::class, 'search']);
        Route::get('recently-updated', [BookController::class, 'recentlyUpdated']);
        Route::get('favorites', [BookController::class, 'getFavorites']);
        Route::post('{id}/favorite', [BookController::class, 'toggleFavorite']);
        Route::get('suggested', [BookController::class, 'getSuggestedBooks']);
        Route::get('{id}/stream', [BookController::class, 'stream']);
        Route::post('{id}/progress', [BookController::class, 'updateProgress']);
        // Book tracking (library shelf)
        Route::get('my-shelf', [BookController::class, 'myReadsByStatus']);
        Route::post('{id}/track', [BookController::class, 'trackBook']);
        Route::patch('{id}/track', [BookController::class, 'updateTrackStatus']);
        Route::delete('{id}/track', [BookController::class, 'untrackBook']);
    });

    // Notifications
    Route::get('notifications', [BookController::class, 'getNotifications']);

    // Subscriptions Checkouts
    Route::post('subscriptions/subscribe', [SubscriptionController::class, 'subscribe']);
    Route::delete('subscriptions/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('books/{id}/notify', [SubscriptionController::class, 'notifyRelease']);

    // Admin Operations
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('stats', [\App\Http\Controllers\AdminController::class, 'stats']);
        Route::get('users', [\App\Http\Controllers\AdminController::class, 'users']);
        Route::post('users/{id}/toggle-deactivate', [\App\Http\Controllers\AdminController::class, 'toggleDeactivate']);
        Route::put('users/{id}/subscription', [\App\Http\Controllers\AdminController::class, 'updateSubscription']);
        Route::get('payments', [\App\Http\Controllers\AdminController::class, 'payments']);
    });
});

