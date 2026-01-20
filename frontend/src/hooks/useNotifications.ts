import { useState, useCallback } from 'react';
import { api } from '../services/api';

export interface SystemNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await api.post(`/notifications/${notificationId}/mark-read`);
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read_at: new Date().toISOString() }
              : notification
          )
        );
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.post('/notifications/mark-all-read');
      if (response.data.success) {
        // Update local state
        const now = new Date().toISOString();
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read_at: now }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }, []);

  const registerFCMToken = useCallback(async (token: string) => {
    try {
      const response = await api.post('/notifications/fcm-token', { token });
      return response.data.success;
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      return false;
    }
  }, []);

  const removeFCMToken = useCallback(async (token: string) => {
    try {
      const response = await api.delete('/notifications/fcm-token', { data: { token } });
      return response.data.success;
    } catch (error) {
      console.error('Failed to remove FCM token:', error);
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    registerFCMToken,
    removeFCMToken,
  };
};