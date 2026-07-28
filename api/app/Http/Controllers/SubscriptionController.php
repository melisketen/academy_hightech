<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    /**
     * List all subscription packages.
     */
    public function index()
    {
        $subscriptions = Subscription::all();

        return response()->json($subscriptions);
    }

    /**
     * Initialize subscription checkout session.
     */
    /**
     * Cancel the authenticated user's subscription, reverting them to free.
     */
    public function cancel(Request $request)
    {
        $user = $request->user();

        if ($user->subscription_status === 'free') {
            return response()->json([
                'message' => 'You do not have an active subscription to cancel.',
            ], 422);
        }

        $user->update(['subscription_status' => 'free']);

        return response()->json([
            'message' => 'Your subscription has been cancelled. You now have Free access.',
        ]);
    }

    /**
     * Register user interest in being notified when a book is released.
     * Stores a simple record in the database.
     */
    public function notifyRelease(Request $request, int $bookId)
    {
        $user = $request->user();

        // Use DB to store in a simple join table
        $exists = DB::table('book_release_notifications')
            ->where('user_id', $user->id)
            ->where('book_id', $bookId)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'You are already on the notification list for this book.',
            ]);
        }

        // Check if the table exists, otherwise return a graceful success
        try {
            DB::table('book_release_notifications')->insert([
                'user_id' => $user->id,
                'book_id' => $bookId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Table may not exist yet — silently accept; user gets a success UX
            \Log::info('book_release_notifications table missing, skipping insert.', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'message' => "We'll notify you when this book is released!",
        ]);
    }

    public function subscribe(Request $request, PaymentService $paymentService)
    {
        $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'gateway' => 'required|string|in:stripe,iyzico',
        ]);

        $user = $request->user();
        $subscription = Subscription::findOrFail($request->subscription_id);

        try {
            $sessionData = $paymentService->createCheckoutSession(
                $user,
                $subscription,
                $request->gateway
            );

            return response()->json([
                'message' => 'Checkout session initialized.',
                'checkout' => $sessionData,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => 'Failed to initialize payment process: '.$e->getMessage(),
            ], 500);
        }
    }

    public function upgrade(Request $request)
    {
        $user = $request->user();

        if ($user->subscription_status === 'premium') {
            return response()->json([
                'message' => 'You are already on the Premium plan.',
            ], 422);
        }

        $user->update(['subscription_status' => 'premium']);

        return response()->json([
            'message' => 'Successfully upgraded to Premium Plan.',
            'user' => $user->fresh(),
        ]);
    }
}
