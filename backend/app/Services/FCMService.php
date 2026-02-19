<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FCMService
{
    private string $serverKey;
    private string $apiUrl;

    public function __construct()
    {
        $this->serverKey = config('fcm.server_key');
        $this->apiUrl = config('fcm.api_url');
    }

    /**
     * Send notification to a single device token.
     */
    public function sendToToken(string $token, array $notification, array $data = []): bool
    {
        return $this->sendNotification([
            'to' => $token,
            'notification' => $notification,
            'data' => $data,
        ]);
    }

    /**
     * Send notification to multiple device tokens.
     */
    public function sendToTokens(array $tokens, array $notification, array $data = []): bool
    {
        if (empty($tokens)) {
            return false;
        }

        return $this->sendNotification([
            'registration_ids' => $tokens,
            'notification' => $notification,
            'data' => $data,
        ]);
    }

    /**
     * Send notification to a topic.
     */
    public function sendToTopic(string $topic, array $notification, array $data = []): bool
    {
        return $this->sendNotification([
            'to' => "/topics/{$topic}",
            'notification' => $notification,
            'data' => $data,
        ]);
    }

    /**
     * Send the actual FCM request.
     */
    private function sendNotification(array $payload): bool
    {
        try {
            // Skip if no server key configured (for development)
            if (empty($this->serverKey)) {
                Log::info('FCM server key not configured, skipping notification', $payload);
                return true;
            }

            // Add default settings
            $payload = array_merge($payload, [
                'priority' => config('fcm.default.priority'),
                'content_available' => config('fcm.default.content_available'),
            ]);

            // Add default notification settings if notification exists
            if (isset($payload['notification'])) {
                $payload['notification'] = array_merge([
                    'sound' => config('fcm.default.sound'),
                    'badge' => config('fcm.default.badge'),
                ], $payload['notification']);
            }

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($this->apiUrl, $payload);

            if ($response->successful()) {
                $result = $response->json();
                
                // Log success
                Log::info('FCM notification sent successfully', [
                    'success' => $result['success'] ?? 0,
                    'failure' => $result['failure'] ?? 0,
                ]);

                return ($result['success'] ?? 0) > 0;
            }

            // Log error
            Log::error('FCM notification failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('FCM notification exception', [
                'message' => $e->getMessage(),
                'payload' => $payload,
            ]);

            return false;
        }
    }

    /**
     * Validate FCM token format.
     */
    public function isValidToken(string $token): bool
    {
        // FCM tokens are typically 152+ characters long
        return strlen($token) >= 140 && preg_match('/^[a-zA-Z0-9_-]+$/', $token);
    }
}