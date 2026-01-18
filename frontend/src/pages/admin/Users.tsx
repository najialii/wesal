import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import api from '../../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  tenant_id?: number;
  tenant?: {
    id: number;
    name: string;
  };
  is_super_admin: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  super_admins: number;
  tenant_admins: number;
}

const RoleBadge = ({ user }: { user: User }) => {
  const { t } = useTranslation('admin');
  
  if (user.is_super_admin) {
    return <Badge variant="destructive">{t('users.super_admin')}</Badge>;
  }
  
  if (user.tenant_id) {
    return <Badge variant="default">{t('users.tenant_admin')}</Badge>;
  }
  
  return <Badge variant="secondary">{t('users.user')}</Badge>;
};

const StatusBadge = ({ lastLogin }: { lastLogin?: string }) => {
  const { t } = useTranslation('admin');
  
  if (!lastLogin) {
    return <Badge variant="outline">Never logged in</Badge>;
  }
  
  const daysSinceLogin = Math.floor(
    (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLogin <= 7) {
    return <Badge variant="default">{t('status.active')}</Badge>;
  } else if (daysSinceLogin <= 30) {
    return <Badge variant="secondary">Recently active</Badge>;
  } else {
    return <Badge variant="outline">{t('status.inactive')}</Badge>;
  }
};

export default function Users() {
  const [users, setUsers] = useState<PaginatedResponse<User> | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const { t } = useTranslation('admin');

  useEffect(() => {
    fetchUsers();
    fetchUserAnalytics();
  }, [search, roleFilter, tenantFilter]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(tenantFilter !== 'all' && { tenant_id: tenantFilter }),
      });
      
      // Mock API call - in real implementation this would be a proper endpoint
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Mock data for demonstration
      setUsers({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics/users');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      // Mock data
      setAnalytics({
        total_users: 0,
        active_users: 0,
        new_users_today: 0,
        new_users_week: 0,
        new_users_month: 0,
        super_admins: 1,
        tenant_admins: 0,
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('users.title')}</h1>
        <p className="text-muted-foreground">{t('users.subtitle')}</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.total_users')}</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_users}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.active_users')}</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.active_users}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('users.new_users_today')}</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.new_users_today}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.super_admins}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tenants.filters')}</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">{t('users.super_admin')}</SelectItem>
                <SelectItem value="tenant_admin">{t('users.tenant_admin')}</SelectItem>
                <SelectItem value="user">{t('users.user')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                <SelectItem value="no_tenant">No Tenant</SelectItem>
                {/* In real implementation, this would be populated with actual tenants */}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('users.user_list')}</CardTitle>
          <CardDescription>
            {users ? `${users.total} total users` : 'Loading users...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!users || users.data.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Alert className="max-w-md">
                <AlertDescription>
                  {users?.data.length === 0 ? t('messages.no_data') : t('messages.error_occurred')}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.user_name')}</TableHead>
                  <TableHead>{t('users.email')}</TableHead>
                  <TableHead>{t('users.tenant')}</TableHead>
                  <TableHead>{t('users.role')}</TableHead>
                  <TableHead>{t('users.last_login')}</TableHead>
                  <TableHead>{t('users.status')}</TableHead>
                  <TableHead className="text-right">{t('tenants.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&color=7F9CF5&background=EBF4FF`}
                            alt={user.name} 
                          />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.tenant ? (
                        <div className="space-y-1">
                          <div className="font-medium">{user.tenant.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.tenant.id}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No tenant</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RoleBadge user={user} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login_at 
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <StatusBadge lastLogin={user.last_login_at} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {t('tenants.actions')}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            {t('actions.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {t('users.session_management')}
                          </DropdownMenuItem>
                          {!user.is_super_admin && (
                            <DropdownMenuItem className="text-destructive">
                              {t('users.force_logout')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {users && users.last_page > 1 && (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="text-sm text-muted-foreground">
              Showing {users.from} to {users.to} of {users.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(users.current_page - 1)}
                disabled={users.current_page === 1}
              >
                {t('actions.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(users.current_page + 1)}
                disabled={users.current_page === users.last_page}
              >
                {t('actions.next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}