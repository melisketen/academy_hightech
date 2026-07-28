<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'subscription_status' => 'standard',
        ]);

        auth()->login($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // For stateful requests, log user into session
        auth()->login($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 200);
    }

    public function logout(Request $request)
    {
        auth()->guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ], 200);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();

        if ($request->has('email')) {
            if (! Hash::check($request->input('current_password', ''), $user->password)) {
                return response()->json(['message' => 'Incorrect password.'], 403);
            }
            $user->email = $request->email;
        }
        if ($request->has('password') && ! empty($request->password)) {
            $user->password = Hash::make($request->password);
        }

        $info = $user->profile_info ?? [];
        if ($request->has('profile_info')) {
            // Strip trust/security flags even from the bulk block — otherwise
            // it would bypass the same restriction enforced on the flat fields below.
            $info = array_merge($info, Arr::except($request->profile_info, ['is_verified', 'twofa_enabled']));
        }
        // Flat field shortcuts. is_verified and twofa_enabled are deliberately
        // excluded — see UpdateProfileRequest for why.
        foreach (['name', 'first_name', 'last_name', 'username', 'bio', 'avatar',
            'language', 'timezone', 'allowed_series',
            'notification_email_marketing', 'notification_email_activity',
            'notification_email_system', 'notification_push', 'notification_sms',
            'privacy_visibility'] as $field) {

            if ($request->has($field)) {
                $info[$field] = $request->input($field);
            }
        }

        $user->profile_info = $info;
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user,
        ], 200);
    }

    public function payments(Request $request)
    {
        $payments = $request->user()->payments()->orderBy('created_at', 'desc')->get();

        return response()->json($payments);
    }

    /**
     * Return active sessions (mock + real token metadata).
     */
    public function sessions(Request $request)
    {
        $user = $request->user();
        $tokens = $user->tokens()->orderBy('last_used_at', 'desc')->get();

        $sessions = $tokens->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'last_used' => $t->last_used_at?->toDateTimeString() ?? 'Active now',
            'created_at' => $t->created_at->toDateTimeString(),
            'is_current' => $t->id === $request->user()->currentAccessToken()->id,
        ]);

        return response()->json($sessions);
    }

    /**
     * Revoke all tokens except the current one.
     */
    public function logoutAllDevices(Request $request)
    {
        $user = $request->user();
        $currentId = $user->currentAccessToken()->id;
        $user->tokens()->where('id', '!=', $currentId)->delete();

        return response()->json(['message' => 'All other sessions revoked.']);
    }

    /**
     * Deactivate the account (soft disable).
     */
    public function deactivate(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();
        if (! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Incorrect password.'], 403);
        }

        $user->is_deactivated = true;
        $user->save();
        $user->tokens()->delete();

        return response()->json(['message' => 'Account deactivated.']);
    }

    /**
     * Permanently delete the account.
     */
    public function deleteAccount(Request $request)
    {
        $request->validate(['password' => 'required|string']);

        $user = $request->user();
        if (! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Incorrect password.'], 403);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Account permanently deleted.']);
    }

    /**
     * Export user data as JSON (GDPR/KVKK).
     */
    public function exportData(Request $request)
    {
        $user = $request->user()->load('payments', 'favorites');
        $readings = $user->readingProgress()->with('book')->get();

        $export = [
            'exported_at' => now()->toIso8601String(),
            'account' => [
                'email' => $user->email,
                'subscription_status' => $user->subscription_status,
                'created_at' => $user->created_at->toIso8601String(),
            ],
            'profile' => $user->profile_info ?? [],
            'payments' => $user->payments->toArray(),
            'favorites' => $user->favorites->pluck('title')->toArray(),
            'reading_history' => $readings->map(fn ($r) => [
                'book' => $r->book->title ?? 'Unknown',
                'page' => $r->last_read_page,
                'progress' => $r->progress_percentage,
                'status' => $r->reading_status,
                'updated_at' => $r->updated_at->toIso8601String(),
            ])->toArray(),
        ];

        return response()->json($export)
            ->header('Content-Disposition', 'attachment; filename="my-data-export.json"');
    }
}
