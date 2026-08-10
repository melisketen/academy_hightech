<?php

use Illuminate\Support\Facades\Route;

// This is an API-only backend; the actual frontend is the static site at
// the repo root. This root route just confirms the API is up.
Route::get('/', function () {
    return response()->json(['name' => 'Academy Hightech API', 'status' => 'ok']);
});
