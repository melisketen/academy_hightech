<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

class BearerExemptCsrf extends ValidateCsrfToken
{
    /**
     * A request carrying an explicit Bearer token isn't CSRF-vulnerable —
     * unlike a cookie, a browser never attaches an Authorization header to a
     * cross-site request automatically, so there's nothing for a forged
     * request to ride on. Only cookie/session-authenticated (Sanctum SPA)
     * requests need the token handshake.
     */
    protected function inExceptArray($request)
    {
        return $request->bearerToken() !== null || parent::inExceptArray($request);
    }
}
