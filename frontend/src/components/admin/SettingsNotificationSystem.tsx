import { useEffect, useState } from 'react';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import api from '../../lib/api';
import { toast } from 'sonner';

interface SettingsNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  setting_key: string;
  old_value: any;
  new_value: any;
  affected_tenants: number;
  created_at: string;
  read_at?: string;
  dismissed_at?: string;
  created_by: {
    id: number;
    name: string;
  };
}

interface NotificationPreferences {
  email_notifications: boolean;
  browser_notifications: boolean;
  notification_frequency: 'immediate' | 'hourly' | 'daily';
  categories: string[];
  severity_levels: string[];
}

interface TenantNotification {
  id: number;
  tenant_id: number;
  tenant_name: string;
  notification_sent: boolean;
  notification_method: string;
  sent_at?: string;
  acknowledged_at?: string;
}

const NotificationIcon = ({ type }: { type: string }) => {
  const icons = {
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
  };
  
  const colors = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    error: 'text-red-500',
  };
  
  const Icon = icons[type as keyof typeof icons] || InformationCircleIcon;
  const colorClass = colors[type as keyof typeof colors] || 'text-gray-500';
  
  return <Icon className={`h-5 w-5 ${colorClass}`} />;
};

export default function SettingsNotificationSystem() {
  const [notifications, setNotifications] = useState<SettingsNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [tenantNotifications, setTenantNotifications] = useState<TenantNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<SettingsNotification | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showTenantNotifications, setShowTenantNotifications] = useState(false);
  const { t } = useTranslation('admin');

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/admin/settings/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error(t('messages.error_occurred'));
    }
  };

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/notification-preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantNotifications = async (notificationId: number) => {
    try {
      const response = await api.get(`/admin/settings/notifications/${notificationId}/tenants`);
      setTenantNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch tenant notifications:', error);
      toast.error(t('messages.error_occurred'));
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/admin/settings/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: number) => {
    try {
      await api.post(`/admin/settings/notifications/${notificationId}/dismiss`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, dismissed_at: new Date().toISOString() } : n)
      );
      toast.success('Notification dismissed');
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
      toast.error(t('messages.operation_failed'));
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const response = await api.put('/admin/settings/notification-preferences', newPreferences);
      setPreferences(response.data);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error(t('messages.operation_failed'));
    }
  };

  const sendTestNotification = async () => {
    try {
      await api.post('/admin/settings/notifications/test');
      toast.success('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error(t('messages.operation_failed'));
    }
  };

  const handleNotificationClick = (notification: SettingsNotification) => {
    setSelectedNotification(notification);
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    fetchTenantNotifications(notification.id);
  };

  const unreadCount = notifications.filter(n => !n.read_at && !n.dismissed_at).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Settings Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notifications
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={sendTestNotification}>
            Send Test
          </Button>
          <Button variant="outline" onClick={() => setShowPreferences(true)}>
            Preferences
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <BellIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                !notification.read_at && !notification.dismissed_at ? 'border-l-4 border-l-blue-500' : ''
              } ${notification.dismissed_at ? 'opacity-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <NotificationIcon type={notification.type} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{notification.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        {!notification.dismissed_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>Setting: {notification.setting_key}</span>
                        <span>Affected: {notification.affected_tenants} tenants</span>
                        <span>By: {notification.created_by.name}</span>
                      </div>
                      <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Notification Detail Modal */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedNotification && <NotificationIcon type={selectedNotification.type} />}
              <span>{selectedNotification?.title}</span>
            </DialogTitle>
            <DialogDescription>
              Settings change notification details
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-6">
              {/* Notification Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Setting Key</Label>
                  <p className="text-sm">{selectedNotification.setting_key}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Changed By</Label>
                  <p className="text-sm">{selectedNotification.created_by.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Change Date</Label>
                  <p className="text-sm">{new Date(selectedNotification.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Affected Tenants</Label>
                  <p className="text-sm">{selectedNotification.affected_tenants}</p>
                </div>
              </div>

              {/* Value Changes */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Value Changes</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Old Value</Label>
                    <div className="bg-muted p-3 rounded text-sm font-mono">
                      {JSON.stringify(selectedNotification.old_value, null, 2)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">New Value</Label>
                    <div className="bg-muted p-3 rounded text-sm font-mono">
                      {JSON.stringify(selectedNotification.new_value, null, 2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-medium">Message</Label>
                <p className="text-sm mt-1">{selectedNotification.message}</p>
              </div>

              {/* Tenant Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Tenant Notifications</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowTenantNotifications(!showTenantNotifications)}
                  >
                    {showTenantNotifications ? 'Hide' : 'Show'} Details
                  </Button>
                </div>
                
                {showTenantNotifications && (
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {tenantNotifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tenant notifications sent</p>
                    ) : (
                      <div className="space-y-2">
                        {tenantNotifications.map((tn) => (
                          <div key={tn.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <div>
                              <p className="text-sm font-medium">{tn.tenant_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Method: {tn.notification_method}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={tn.notification_sent ? 'default' : 'secondary'}>
                                {tn.notification_sent ? 'Sent' : 'Pending'}
                              </Badge>
                              {tn.sent_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(tn.sent_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preferences Modal */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>
              Configure how you receive settings change notifications
            </DialogDescription>
          </DialogHeader>
          
          {preferences && (
            <div className="space-y-6">
              {/* Notification Methods */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Notification Methods</Label>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.email_notifications}
                    onCheckedChange={(checked) => 
                      updatePreferences({ email_notifications: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="browser-notifications">Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">Show browser push notifications</p>
                  </div>
                  <Switch
                    id="browser-notifications"
                    checked={preferences.browser_notifications}
                    onCheckedChange={(checked) => 
                      updatePreferences({ browser_notifications: checked })
                    }
                  />
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <Label>Notification Frequency</Label>
                <Select 
                  value={preferences.notification_frequency} 
                  onValueChange={(value) => 
                    updatePreferences({ notification_frequency: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories to Monitor</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['application', 'security', 'email', 'features', 'billing'].map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Switch
                        id={`category-${category}`}
                        checked={preferences.categories.includes(category)}
                        onCheckedChange={(checked) => {
                          const newCategories = checked
                            ? [...preferences.categories, category]
                            : preferences.categories.filter(c => c !== category);
                          updatePreferences({ categories: newCategories });
                        }}
                      />
                      <Label htmlFor={`category-${category}`} className="capitalize">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Severity Levels */}
              <div className="space-y-2">
                <Label>Severity Levels</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['info', 'warning', 'error', 'success'].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Switch
                        id={`level-${level}`}
                        checked={preferences.severity_levels.includes(level)}
                        onCheckedChange={(checked) => {
                          const newLevels = checked
                            ? [...preferences.severity_levels, level]
                            : preferences.severity_levels.filter(l => l !== level);
                          updatePreferences({ severity_levels: newLevels });
                        }}
                      />
                      <Label htmlFor={`level-${level}`} className="capitalize">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}