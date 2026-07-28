<?php

namespace App\Http\Controllers;

use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Capture asynchronous payment success/failure signals from gateways.
     */
    public function handlePayment(Request $request, PaymentService $paymentService)
    {
        if (! $this->hasValidSignature($request)) {
            Log::warning('WebhookController: Rejected webhook with missing/invalid signature.', [
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Missing or invalid webhook signature.',
            ], 401);
        }

        $gateway = $request->input('gateway');

        if (! $gateway) {
            return response()->json([
                'error' => 'Bad Request',
                'message' => 'Gateway parameter is required.',
            ], 400);
        }

        $payload = $request->all();

        $success = $paymentService->handleWebhook($gateway, $payload);

        if ($success) {
            return response()->json([
                'status' => 'success',
                'message' => 'Webhook received and payment status synchronized.',
            ], 200);
        }

        return response()->json([
            'error' => 'Unprocessable Entity',
            'message' => 'Webhook could not be processed.',
        ], 422);
    }

    /**
     * Verify the X-Webhook-Signature header against an HMAC-SHA256 of the raw
     * request body, keyed with PAYMENT_WEBHOOK_SECRET. A real gateway (Stripe,
     * Iyzico, ...) signs its callbacks the same way; this stands in for that
     * verification so a spoofed POST can't upgrade a user's subscription.
     */
    private function hasValidSignature(Request $request): bool
    {
        // For local simulation, bypass signature verification if app environment is local and signature header is missing
        if (app()->environment('local') && ! $request->hasHeader('X-Webhook-Signature')) {
            Log::info('WebhookController: Bypassing signature verification in local environment.');

            return true;
        }

        $secret = config('services.payment_webhook.secret');

        if (! $secret) {
            Log::error('WebhookController: PAYMENT_WEBHOOK_SECRET is not configured.');

            return false;
        }

        $signature = $request->header('X-Webhook-Signature');

        if (! $signature) {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $signature);
    }
}
