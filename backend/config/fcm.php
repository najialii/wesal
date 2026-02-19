<?php

return [
    /*
    |--------------------------------------------------------------------------
    | FCM Server Key
    |--------------------------------------------------------------------------
    |
    | Your Firebase Cloud Messaging server key from the Firebase Console.
    |
    */
    'server_key' => env('FCM_SERVER_KEY'),

    /*
    |--------------------------------------------------------------------------
    | FCM Sender ID
    |--------------------------------------------------------------------------
    |
    | Your Firebase project sender ID.
    |
    */
    'sender_id' => env('FCM_SENDER_ID'),

    /*
    |--------------------------------------------------------------------------
    | FCM API URL
    |--------------------------------------------------------------------------
    |
    | The Firebase Cloud Messaging API endpoint.
    |
    */
    'api_url' => 'https://fcm.googleapis.com/fcm/send',

    /*
    |--------------------------------------------------------------------------
    | Default Notification Settings
    |--------------------------------------------------------------------------
    |
    | Default settings for FCM notifications.
    |
    */
    'default' => [
        'sound' => 'default',
        'badge' => 1,
        'priority' => 'high',
        'content_available' => true,
    ],
];