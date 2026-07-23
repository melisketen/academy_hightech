<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Str;

class PaymentService
{
    /**
     * Initialize a payment session.
     *
     * A real gateway integration (Stripe, Iyzico, ...) signs its async webhook
     * callbacks with a per-account secret; WebhookController verifies that
     * signature before calling handleWebhook() below, so this sandbox URL is
     * never trusted on its own to change a user's subscription status.
     *
     * @param User $user
     * @param Subscription $subscription
     * @param string $gateway (stripe or iyzico)
     * @return array Contains redirection URL and transaction metadata
     */
    public function createCheckoutSession(User $user, Subscription $subscription, string $gateway): array
    {
        $gateway = strtolower($gateway);
        if (!in_array($gateway, ['stripe', 'iyzico'])) {
            throw new \InvalidArgumentException("Unsupported payment gateway: {$gateway}");
        }

        $transactionId = $gateway . '_' . Str::random(16);

        // Create the pending payment record
        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => $subscription->price,
            'gateway' => $gateway,
            'transaction_id' => $transactionId,
            'status' => 'pending',
        ]);

        // Simulating redirect URLs for integration
        $checkoutUrl = "https://checkout.sandbox.{$gateway}.com/pay/" . $transactionId;

        return [
            'transaction_id' => $transactionId,
            'amount' => $subscription->price,
            'gateway' => $gateway,
            'checkout_url' => $checkoutUrl,
            'subscription_name' => $subscription->name,
        ];
    }

    /**
     * Process gateway webhook notification.
     *
     * @param string $gateway
     * @param array $payload
     * @return bool
     */
    public function handleWebhook(string $gateway, array $payload): bool
    {
        $gateway = strtolower($gateway);
        $transactionId = $payload['transaction_id'] ?? null;
        $status = $payload['status'] ?? 'failed'; // success, failed

        if (!$transactionId) {
            \Log::warning("PaymentService: Webhook received with missing transaction_id.");
            return false;
        }

        $payment = Payment::where('transaction_id', $transactionId)->first();

        if (!$payment) {
            \Log::warning("PaymentService: Webhook transaction not found in database: {$transactionId}");
            return false;
        }

        if ($payment->status !== 'pending') {
            \Log::info("PaymentService: Webhook transaction {$transactionId} has already been processed (Status: {$payment->status}).");
            return true;
        }

        // Update payment state
        $payment->update([
            'status' => $status === 'success' ? 'success' : 'failed'
        ]);

        $user = $payment->user;

        if ($status === 'success') {
            // Find subscription by price/name to match user status
            // For simplicity, we match subscription name or use a default
            $subscriptionName = $payload['subscription_name'] ?? 'standard';
            $user->update([
                'subscription_status' => strtolower($subscriptionName)
            ]);
            
            \Log::info("PaymentService: Payment succeeded. User ID {$user->id} upgraded to subscription '{$subscriptionName}'.");
        } else {
            $user->update([
                'subscription_status' => 'free'
            ]);
            
            \Log::info("PaymentService: Payment failed/cancelled. User ID {$user->id} set to 'free'.");
        }

        return true;
    }
}
