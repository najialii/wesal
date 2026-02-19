<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    private NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get user's notifications with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->get('per_page', 20);
        
        $notifications = $this->notificationService->getUserNotifications($user, $perPage);
        
        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Get unread notifications count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = $this->notificationService->getUnreadCount($user);
        
        return response()->json([
            'success' => true,
            'data' => ['count' => $count],
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        // Ensure user can only mark their own notifications as read
        if ($notification->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $this->notificationService->markAsRead($notification);
        
        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = $this->notificationService->markAllAsRead($user);
        
        return response()->json([
            'success' => true,
            'message' => "Marked {$count} notifications as read",
            'data' => ['count' => $count],
        ]);
    }

    /**
     * Register FCM token for the user.
     */
    public function registerFCMToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string|min:140',
        ]);

        $user = $request->user();
        $token = $request->input('token');

        // Validate token format
        $fcmService = app(\App\Services\FCMService::class);
        if (!$fcmService->isValidToken($token)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid FCM token format',
            ], 400);
        }

        $user->addFCMToken($token);
        
        return response()->json([
            'success' => true,
            'message' => 'FCM token registered successfully',
        ]);
    }

    /**
     * Remove FCM token for the user.
     */
    public function removeFCMToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $user = $request->user();
        $token = $request->input('token');

        $user->removeFCMToken($token);
        
        return response()->json([
            'success' => true,
            'message' => 'FCM token removed successfully',
        ]);
    }
}