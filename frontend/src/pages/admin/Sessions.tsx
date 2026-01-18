import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/TranslationProvider';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Session {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  is_current: boolean;
}

interface SessionsResponse {
  sessions: Session[];
  total_count: number;
}

const Sessions: React.FC = () => {
  const { t, currentLanguage } = useTranslation('admin');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dateLocale = currentLanguage === 'ar' ? ar : enUS;

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data: SessionsResponse = await response.json();
      setSessions(data.sessions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: number) => {
    try {
      setRevoking(sessionId);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      // Remove the session from the list
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const logoutAllDevices = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to logout from all devices');
      }

      // Redirect to login since all sessions are revoked
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout from all devices');
    }
  };

  useEffect(() => {
    fetchSessions();
    
    // Refresh sessions every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSessionIcon = (deviceName: string) => {
    if (deviceName.includes('Chrome')) return '🌐';
    if (deviceName.includes('Firefox')) return '🦊';
    if (deviceName.includes('Safari')) return '🧭';
    if (deviceName.includes('Edge')) return '🔷';
    if (deviceName.includes('Android')) return '📱';
    if (deviceName.includes('iOS')) return '📱';
    if (deviceName.includes('Windows')) return '💻';
    if (deviceName.includes('Mac')) return '🖥️';
    if (deviceName.includes('Linux')) return '🐧';
    return '💻';
  };

  const getSessionStatus = (session: Session) => {
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    const lastUsed = new Date(session.last_used_at);
    
    if (expiresAt < now) {
      return { status: 'expired', color: 'text-red-600', bg: 'bg-red-100' };
    }
    
    const hoursSinceLastUse = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastUse < 1) {
      return { status: 'active', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (hoursSinceLastUse < 24) {
      return { status: 'recent', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { status: 'inactive', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('sessions.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('sessions.description')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchSessions}
            variant="outline"
            disabled={loading}
          >
            {t('sessions.refresh')}
          </Button>
          <Button
            onClick={logoutAllDevices}
            variant="destructive"
            disabled={loading}
          >
            {t('sessions.logoutAll')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {t('sessions.error')}
              </h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('sessions.activeSessions')} ({sessions.length})
          </h2>
        </div>

        {sessions.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('sessions.noSessions')}
            </h3>
            <p className="text-gray-600">
              {t('sessions.noSessionsDescription')}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const sessionStatus = getSessionStatus(session);
              return (
                <Card key={session.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getSessionIcon(session.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {session.name}
                          </h3>
                          {session.is_current && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {t('sessions.current')}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sessionStatus.bg} ${sessionStatus.color}`}>
                            {t(`sessions.status.${sessionStatus.status}`)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">
                              {t('sessions.created')}:
                            </span>{' '}
                            {formatDistanceToNow(new Date(session.created_at), { 
                              addSuffix: true, 
                              locale: dateLocale 
                            })}
                          </div>
                          <div>
                            <span className="font-medium">
                              {t('sessions.lastUsed')}:
                            </span>{' '}
                            {formatDistanceToNow(new Date(session.last_used_at), { 
                              addSuffix: true, 
                              locale: dateLocale 
                            })}
                          </div>
                          <div>
                            <span className="font-medium">
                              {t('sessions.expires')}:
                            </span>{' '}
                            {formatDistanceToNow(new Date(session.expires_at), { 
                              addSuffix: true, 
                              locale: dateLocale 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!session.is_current && (
                        <Button
                          onClick={() => revokeSession(session.id)}
                          variant="destructive"
                          size="sm"
                          disabled={revoking === session.id}
                        >
                          {revoking === session.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {t('sessions.revoking')}
                            </div>
                          ) : (
                            t('sessions.revoke')
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-400 text-xl">ℹ️</div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              {t('sessions.securityTip')}
            </h3>
            <div className="mt-2 text-sm text-blue-800">
              <p>
                {t('sessions.securityTipDescription')}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Sessions;