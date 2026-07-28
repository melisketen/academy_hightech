<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\ReadingProgress;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get system-wide statistics for the admin dashboard.
     */
    public function stats(Request $request)
    {
        $totalUsers = User::count();
        $activeSubscribers = User::whereIn('subscription_status', ['standard', 'premium'])->count();
        $totalRevenue = Payment::where('status', 'success')->sum('amount');
        $activeReadings = ReadingProgress::where('reading_status', 'reading')->count();

        return response()->json([
            'total_users' => $totalUsers,
            'active_subscribers' => $activeSubscribers,
            'total_revenue' => round($totalRevenue, 2),
            'active_readings' => $activeReadings,
        ]);
    }

    /**
     * List all users.
     */
    public function users(Request $request)
    {
        $users = User::orderBy('id', 'desc')->get();

        return response()->json($users);
    }

    /**
     * Toggle deactivation status of a user.
     */
    public function toggleDeactivate(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent self-deactivation
        if ($request->user()->id === $user->id) {
            return response()->json([
                'error' => 'Bad Request',
                'message' => 'You cannot deactivate your own administrator account.',
            ], 400);
        }

        $user->update([
            'is_deactivated' => ! $user->is_deactivated,
        ]);

        return response()->json([
            'message' => $user->is_deactivated ? 'User deactivated.' : 'User reactivated.',
            'user' => $user,
        ]);
    }

    /**
     * Update subscription status of a user manually.
     */
    public function updateSubscription(Request $request, $id)
    {
        $request->validate([
            'subscription_status' => 'required|string|in:free,standard,premium',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'subscription_status' => strtolower($request->subscription_status),
        ]);

        return response()->json([
            'message' => 'User subscription status updated.',
            'user' => $user,
        ]);
    }

    /**
     * Get all payment transactions.
     */
    public function payments(Request $request)
    {
        $payments = Payment::with('user')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'user_email' => $payment->user ? $payment->user->email : 'Deleted User',
                    'amount' => $payment->amount,
                    'gateway' => $payment->gateway,
                    'transaction_id' => $payment->transaction_id,
                    'status' => $payment->status,
                    'created_at' => $payment->created_at,
                ];
            });

        return response()->json($payments);
    }
}
