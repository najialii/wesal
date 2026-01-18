import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  BellIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { LanguageSelector } from '../LanguageSelector';
import { useTranslation } from '../../lib/i18n/TranslationProvider';
import { authService } from '../../services/auth';

function AppSidebar() {
  const location = useLocation();
  const { t, isRTL } = useTranslation('admin');

  const navigation = [
    { name: t('navigation.dashboard'), href: '/admin', icon: HomeIcon },
    { name: 'Organizations', href: '/admin/tenants', icon: BuildingOfficeIcon },
    { name: t('navigation.plans'), href: '/admin/plans', icon: CreditCardIcon },
    { name: t('navigation.users'), href: '/admin/users', icon: UsersIcon },
    { name: t('navigation.sessions') || 'Sessions', href: '/admin/sessions', icon: ComputerDesktopIcon },
    { name: t('navigation.analytics'), href: '/admin/analytics', icon: ChartBarIcon },
    { name: t('navigation.auditLogs') || 'Audit Logs', href: '/admin/audit-logs', icon: DocumentTextIcon },
    { name: t('navigation.reports') || 'Reports', href: '/admin/reports', icon: ClipboardDocumentListIcon },
    { name: t('navigation.settings'), href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-16 items-center justify-center px-4">
          <img 
            src="/1.svg" 
            alt="WesalTech Logo" 
            className="h-16 w-auto"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4">
          <UserMenu />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function UserMenu() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t, isRTL } = useTranslation('admin');

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'AD';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`w-full gap-3 p-2 ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&color=7F9CF5&background=EBF4FF`}
              alt={user?.name || 'Admin'} 
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className={`flex flex-col text-sm ${isRTL ? 'items-end' : 'items-start'}`}>
            <span className="font-medium">{user?.name || 'Admin'}</span>
            <span className="text-muted-foreground">{user?.email || 'admin@wesaltech.com'}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleLogout}>
          <ArrowRightStartOnRectangleIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          <span>{t('actions.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppBreadcrumb() {
  const location = useLocation();
  const { t } = useTranslation('admin');
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin">{t('navigation.dashboard')}</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.slice(1).map((segment, index) => (
          <div key={segment} className="flex items-center">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === pathSegments.length - 2 ? (
                <BreadcrumbPage className="capitalize">{segment}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink 
                  href={`/${pathSegments.slice(0, index + 2).join('/')}`}
                  className="capitalize"
                >
                  {segment}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function AdminLayout() {
  const { isRTL } = useTranslation();

  return (
    <SidebarProvider key={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex min-h-screen w-full" dir={isRTL ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className={isRTL ? '-mr-1' : '-ml-1'} />
            <Separator orientation="vertical" className={`h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <AppBreadcrumb />
            
            <div className={`flex items-center gap-2 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
              <LanguageSelector variant="dropdown" showFlags={true} />
              <Button variant="ghost" size="icon">
                <BellIcon className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>
            </div>
          </header>
          
          {/* Main Content */}
          <main id="main-content" className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}