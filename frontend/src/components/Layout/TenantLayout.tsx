import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import * as React from 'react';
import {
  HomeIcon,
  ShoppingBagIcon,
  CubeIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  BuildingStorefrontIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SimpleLanguageToggle } from '../SimpleLanguageToggle';
import BranchSelector from '../BranchSelector';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { authService } from '../../services/auth';
import { BranchProvider } from '../../contexts/BranchContext';
import { cn } from '../../lib/utils';

function BusinessSidebar() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const { isRTL } = useDirectionClasses();
  const user = authService.getCurrentUser();
  
  // DEBUG: Log RTL state
  // console.log('BusinessSidebar - isRTL:', isRTL, 'dir:', document.documentElement.getAttribute('dir'));
  
  // Get tenant logo
  const hasCustomLogo = user?.tenant?.logo ? true : false;
  const tenantLogo = hasCustomLogo
    ? (user?.tenant?.logo_url || `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'}/storage/${user?.tenant?.logo}`)
    : '/1.svg';
  const tenantName = user?.tenant?.name || 'WesalTech';

  interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: string[];
    isShared?: boolean;
    isBranchSpecific?: boolean;
  }

  const allNavigation: NavigationItem[] = [
    { name: t('navigation.dashboard'), href: '/business', icon: HomeIcon },
    { name: t('navigation.pos'), href: '/business/pos', icon: BuildingStorefrontIcon, isBranchSpecific: true },
    { name: t('navigation.products'), href: '/business/products', icon: CubeIcon, isBranchSpecific: true },
    { name: t('navigation.categories'), href: '/business/categories', icon: ShoppingBagIcon, isShared: true },
    { name: t('navigation.customers'), href: '/business/customers', icon: UsersIcon, isShared: true },
    { name: t('navigation.sales'), href: '/business/sales', icon: ChartBarIcon, isBranchSpecific: true },
    { name: t('navigation.staff'), href: '/business/staff', icon: UsersIcon, roles: ['business_owner', 'business_admin'] },
    { name: t('navigation.branches'), href: '/business/branches', icon: HomeIcon, roles: ['business_owner'] },
    { name: t('navigation.maintenance'), href: '/business/maintenance', icon: WrenchScrewdriverIcon, isBranchSpecific: true },
    { name: t('navigation.settings'), href: '/business/settings', icon: Cog6ToothIcon },
  ];

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => {
    // If no roles specified, show to everyone
    if (!item.roles) return true;
    
    // Check if user has any of the allowed roles
    // Support both user.role (string) and user.roles (array)
    if (user?.roles && Array.isArray(user.roles)) {
      return user.roles.some((r: any) => item.roles?.includes(r.name));
    }
    
    // Fallback to checking user.role string
    return item.roles.includes(user?.role || '');
  });

  return (
    <Sidebar 
      side={isRTL ? "right" : "left"}
      collapsible="icon"
      variant="sidebar"
      className={cn(
        "bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-0 shadow-lg",
        isRTL ? "border-l border-gray-200/50 dark:border-slate-800/50" : "border-r border-gray-200/50 dark:border-slate-800/50"
      )}
    >
      <SidebarHeader className="border-0 bg-transparent p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex h-8 items-center justify-center group-data-[collapsible=icon]:h-6">
          {hasCustomLogo ? (
            <img 
              src={tenantLogo} 
              alt={`${tenantName} Logo`}
              className="h-6 w-auto max-w-[120px] object-contain group-data-[collapsible=icon]:h-5"
              onError={(e) => {
                e.currentTarget.src = '/1.svg';
              }}
            />
          ) : (
            <img 
              src="/1.svg" 
              alt="WesalTech Logo" 
              className="h-6 w-auto group-data-[collapsible=icon]:h-5"
            />
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      size="default"
                      tooltip={{
                        children: item.name,
                        side: isRTL ? "left" : "right",
                        align: "center"
                      }}
                      className={cn(
                        "relative h-10 px-2.5 rounded-lg font-medium transition-all duration-200 group",
                        "hover:shadow-sm active:scale-[0.98]",
                        "group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-11 group-data-[collapsible=icon]:p-0",
                        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center",
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-700' 
                          : 'text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <Link to={item.href} className={cn(
                        "flex items-center gap-2.5 w-full",
                        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center",
                        isRTL ? 'flex-row-reverse' : ''
                      )}>
                        <div className={cn(
                          "flex items-center justify-center flex-shrink-0 transition-colors",
                          "w-5 h-5 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6",
                          isActive 
                            ? 'text-white' 
                            : 'text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300'
                        )}
                        style={{
                          // EMERGENCY FIX: Force icons to show in Arabic collapsed mode
                          display: 'flex !important',
                          alignItems: 'center !important',
                          justifyContent: 'center !important',
                          opacity: '1 !important',
                          visibility: 'visible !important'
                        }}
                        >
                          <item.icon 
                            className="w-full h-full" 
                            style={{
                              // EMERGENCY FIX: Force SVG icons to show
                              display: 'block !important',
                              opacity: '1 !important',
                              visibility: 'visible !important',
                              width: '100% !important',
                              height: '100% !important'
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium truncate flex-1 group-data-[collapsible=icon]:sr-only">
                          {item.name}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-0 bg-transparent p-2 mt-auto">
        <BusinessUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

function BusinessUserMenu() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { t } = useTranslation('common');
  const { isRTL } = useDirectionClasses();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'US';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full h-12 gap-2.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800",
            "transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-slate-700",
            "group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-1",
            isRTL ? 'justify-end flex-row-reverse' : 'justify-start'
          )}
        >
          <Avatar className="h-8 w-8 ring-2 ring-gray-200 dark:ring-slate-700 flex-shrink-0 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
            <AvatarImage 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&color=7F9CF5&background=EBF4FF`}
              alt={user?.name || 'User'} 
            />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex flex-col text-xs min-w-0 flex-1 group-data-[collapsible=icon]:hidden",
            isRTL ? 'items-end' : 'items-start'
          )}>
            <span className="font-semibold text-gray-900 dark:text-slate-100 truncate w-full">
              {user?.name || 'User'}
            </span>
            <span className="text-gray-500 dark:text-slate-400 text-xs">
              {t('auth.staff')}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 shadow-lg border border-gray-200 dark:border-slate-700"
        side={isRTL ? "left" : "right"}
      >
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
        >
          <ArrowRightStartOnRectangleIcon className={cn("h-4 w-4", isRTL ? 'ml-2' : 'mr-2')} />
          <span>{t('auth.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BusinessBreadcrumb() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const { isRTL } = useDirectionClasses();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Function to translate breadcrumb segments
  const translateSegment = (segment: string) => {
    const translations: Record<string, string> = {
      'business': t('navigation.business'),
      'dashboard': t('navigation.dashboard'),
      'pos': t('navigation.pos'),
      'products': t('navigation.products'),
      'categories': t('navigation.categories'),
      'customers': t('navigation.customers'),
      'sales': t('navigation.sales'),
      'staff': t('navigation.staff'),
      'maintenance': t('navigation.maintenance'),
      'settings': t('navigation.settings'),
      'add': t('breadcrumb.add'),
      'edit': t('breadcrumb.edit'),
      'create': t('breadcrumb.create'),
      'view': t('breadcrumb.view'),
      'calendar': t('breadcrumb.calendar'),
      'branches': t('navigation.branches'),
    };
    return translations[segment] || segment;
  };
  
  return (
    <Breadcrumb>
      <BreadcrumbList className={isRTL ? 'flex-row-reverse' : ''}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/business">{t('navigation.business')}</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.slice(1).map((segment, index) => (
          <div key={segment} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <BreadcrumbSeparator className={isRTL ? 'rotate-180' : ''} />
            <BreadcrumbItem>
              {index === pathSegments.length - 2 ? (
                <BreadcrumbPage className="capitalize">{translateSegment(segment)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink 
                  href={`/${pathSegments.slice(0, index + 2).join('/')}`}
                  className="capitalize"
                >
                  {translateSegment(segment)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function TenantLayout() {
  const { isRTL } = useDirectionClasses();
  const user = authService.getCurrentUser();
  
  // Check if user is business owner - check both role field and roles array
  const isBusinessOwner = user?.role === 'business_owner' || 
    user?.role === 'Business Owner' || // Handle display name
    (user?.roles && Array.isArray(user.roles) && user.roles.some((r: any) => 
      r.name === 'business_owner' || r.name === 'Business Owner' || r.name === 'admin' || r.name === 'business_admin'
    )) ||
    // Fallback: if user has tenant_id and no specific role restrictions, assume they're an owner
    (user?.tenant_id && !user?.roles?.length);

  return (
    <BranchProvider>
      <SidebarProvider key={isRTL ? 'rtl' : 'ltr'} defaultOpen={true}>
        <div 
          className={cn(
            "flex min-h-screen w-full bg-gradient-to-br from-gray-50/30 via-white to-blue-50/20 dark:from-slate-900 dark:to-slate-950",
            isRTL ? 'flex-row-reverse' : 'flex-row'
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
          lang={isRTL ? 'ar' : 'en'}
          data-sidebar-provider
          style={{
            '--sidebar-width': '16rem',
            '--sidebar-width-icon': '3.5rem'
          } as React.CSSProperties}
        >
          <BusinessSidebar />
          <SidebarInset className="flex-1 w-full">
            {/* Enhanced Header */}
            <header className={cn(
              "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between",
              "border-b border-gray-200/60 dark:border-slate-800/60",
              "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm",
              isRTL ? 'flex-row-reverse' : ''
            )}>
              {/* Left side - Sidebar trigger and breadcrumb */}
              <div className={cn("flex items-center gap-2", isRTL ? 'flex-row-reverse' : '')}>
                <SidebarTrigger className={cn(
                  "h-8 w-8 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-all duration-200",
                  "hover:scale-105 active:scale-95"
                )} />
                <Separator orientation="vertical" className="h-4 mx-1" />
                <BusinessBreadcrumb />
              </div>
              
              {/* Right side - Branch selector, language toggle, notifications */}
              <div className={cn("flex items-center gap-2", isRTL ? 'flex-row-reverse' : '')}>
                {isBusinessOwner && <BranchSelector />}
                <SimpleLanguageToggle variant="button" size="sm" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-8 w-8 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-all duration-200",
                    "hover:scale-105 active:scale-95 relative"
                  )}
                >
                  <BellIcon className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                  {/* Animated notification badge */}
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                </Button>
              </div>
            </header>
            
            {/* Main Content */}
            <main 
              id="main-content" 
              className="flex-1 w-full p-4 min-h-[calc(100vh-3.5rem)] overflow-auto"
            >
              <Outlet />
            </main>         
          </SidebarInset>
        </div>
      </SidebarProvider>
    </BranchProvider>
  );
}
