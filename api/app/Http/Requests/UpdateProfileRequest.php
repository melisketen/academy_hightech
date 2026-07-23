<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;
        return [
            // Core identity
            'name'       => 'nullable|string|max:255',
            'first_name' => 'nullable|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'username'   => 'nullable|string|max:255',
            'bio'        => 'nullable|string|max:1000',
            'avatar'     => 'nullable|string',
            // Auth
            // current_password is required whenever the email is being changed,
            // to prevent an attacker with a hijacked session from silently
            // rerouting account-recovery email to an address they control.
            'current_password' => 'required_with:email|string',
            'email'      => 'nullable|email|unique:users,email,' . $userId,
            'password'   => 'nullable|string|min:6',
            // NOTE: is_verified and twofa_enabled are intentionally NOT accepted
            // here. Both are trust/security flags; a user must never be able to
            // self-grant them via a profile PATCH. They can only be changed by
            // dedicated, separately-secured flows (e.g. email verification,
            // a proper 2FA enrollment endpoint) if/when those are built.
            // Notifications
            'notification_email_marketing' => 'nullable|boolean',
            'notification_email_activity'  => 'nullable|boolean',
            'notification_email_system'    => 'nullable|boolean',
            'notification_push'            => 'nullable|boolean',
            'notification_sms'             => 'nullable|boolean',
            // Privacy
            'privacy_visibility' => 'nullable|string|in:public,private,hidden',
            // Preferences
            'language' => 'nullable|string|max:10',
            'timezone' => 'nullable|string|max:100',
            // Bulk JSON block (legacy/test)
            'profile_info' => 'nullable|array',
        ];
    }
}
