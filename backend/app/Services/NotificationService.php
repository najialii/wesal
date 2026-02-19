<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    private FCMService $fcmService;

    public function __construct(FCMService $fcmService)
    {
        $this->fcmService = $fcmService;
    }

    /**
     * Create and send a system notification.
     */
    public function createSystemNotification(
        User $user,
        string $type,
        string $title,
        string $message,
        array $data = []
    ): Notification {
        // Validate notification type
        $this->validateNotificationType($type);

        // Create notification in database
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        // Send FCM push notification
        $this->sendPushNotification($user, $notification);

        return $notification;
    }

    /**
     * Create billing notification.
     */
    public function createBillingNotification(User $user, string $title, string $message, array $data = []): Notification
    {
        return $this->createSystemNotification($user, 'billing', $title, $message, $data);
    }

    /**
     * Create payment notification.
     */
    public function createPaymentNotification(User $user, string $title, string $message, array $data = []): Notification
    {
        return $this->createSystemNotification($user, 'payment', $title, $message, $data);
    }

    /**
     * Create subscription notification.
     */
    public function createSubscriptionNotification(User $user, string $title, string $message, array $data = []): Notification
    {
        return $this->createSystemNotification($user, 'subscription', $title, $message, $data);
    }

    /**
     * Create admin message notification.
     */
    public function createAdminMessageNotification(User $user, string $title, string $message, array $data = []): Notification
    {
        return $this->createSystemNotification($user, 'admin_message', $title, $message, $data);
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return Notification::where('user_id', $user->id)
            ->unread()
            ->count();
    }

    /**
     * Get notifications for a user with pagination.
     */
    public function getUserNotifications(User $user, int $perPage = 20)
    {
        return Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Send FCM push notification.
     */
    private function sendPushNotification(User $user, Notification $notification): void
    {
        try {
            // Get user's FCM tokens (assuming they're stored in user profile or separate table)
            $fcmTokens = $this->getUserFCMTokens($user);

            if (empty($fcmTokens)) {
                Log::info('No FCM tokens found for user', ['user_id' => $user->id]);
                return;
            }

            $fcmNotification = [
                'title' => $notification->title,
                'body' => $notification->message,
            ];

            $fcmData = [
                'notification_id' => (string) $notification->id,
                'type' => $notification->type,
                'created_at' => $notification->created_at->toISOString(),
            ];

            // Add custom data if provided
            if (!empty($notification->data)) {
                $fcmData = array_merge($fcmData, $notification->data);
            }

            $this->fcmService->sendToTokens($fcmTokens, $fcmNotification, $fcmData);
        } catch (\Exception $e) {
            Log::error('Failed to send FCM notification', [
                'notification_id' => $notification->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get FCM tokens for a user.
     */
    private function getUserFCMTokens(User $user): array
    {
        return $user->getFCMTokens();
    }

    /**
     * Validate notification type.
     */
    private function validateNotificationType(string $type): void
    {
        $allowedTypes = ['billing', 'payment', 'subscription', 'admin_message'];
        
        if (!in_array($type, $allowedTypes)) {
            throw new \InvalidArgumentException("Invalid notification type: {$type}");
        }
    }
}