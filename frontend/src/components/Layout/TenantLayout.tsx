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

// Function to detect Arabic text
const isArabicText = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
};

function BusinessSidebar() {
  const location = useLocation();
  const { t } = useTranslation('common');
  const { isRTL } = useDirectionClasses();
  const user = authService.getCurrentUser();
  
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
    { name: t('navigation.branches'), href: '/business/branches', icon: HomeIcon, roles: ['business_owner', 'tenant_admin', 'business_admin'] },
    { name: t('navigation.maintenance'), href: '/business/maintenance', icon: WrenchScrewdriverIcon, isBranchSpecific: true },
    { name: t('navigation.audit_logs'), href: '/business/audit-logs', icon: ChartBarIcon, roles: ['business_owner'] },
  ];

  const navigation = allNavigation.filter(item => {
    if (!item.roles) return true;
    if (user?.roles && Array.isArray(user.roles)) {
      return user.roles.some((r: any) => item.roles?.includes(r.name));
    }
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
      <SidebarHeader className="border-0 bg-transparent p-4 group-data-[collapsible=icon]:p-3">
        <div className="flex h-12 items-center justify-center group-data-[collapsible=icon]:h-8">
          <img 
            src={hasCustomLogo ? tenantLogo : '/1.svg'} 
            alt={tenantName}
            className="h-10 w-auto max-w-[140px] object-contain group-data-[collapsible=icon]:h-6"
            onError={(e) => { e.currentTarget.src = '/1.svg'; }}
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-400">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={{
                        children: item.name,
                        side: isRTL ? "left" : "right",
                      }}
                      className={cn(
                        "relative h-12 px-3 rounded-lg font-medium transition-all duration-200 group",
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-400 hover:bg-blue-100' 
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/50',
                        isRTL && isActive && "border-l-0 border-r-4"
                      )}
                    >
                      <Link to={item.href} className={cn(
                        "flex items-center gap-3 w-full",
                        isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'
                      )}>
                        <div className={cn(
                          "flex items-center justify-center w-5 h-5 flex-shrink-0 transition-colors",
                          isActive ? 'text-blue-400' : 'text-gray-500 dark:text-slate-400'
                        )}>
                          <item.icon className="w-full h-full" />
                        </div>
                        <span className={cn(
                          "text-sm font-medium truncate flex-1 group-data-[collapsible=icon]:sr-only",
                          isArabicText(item.name) ? "text-right" : "text-left"
                        )}>
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
      
      <SidebarFooter className="border-0 bg-transparent p-3 mt-auto">
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
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'US';

  const getRoleDisplay = () => {
    if (user?.roles && Array.isArray(user.roles)) {
      const role = user.roles[0]?.name;
      if (role === 'business_owner') return isRTL ? 'مالك العمل' : 'Business Owner';
      if (role === 'salesperson') return isRTL ? 'مندوب مبيعات' : 'Salesperson';
      if (role === 'technician') return isRTL ? 'فني' : 'Technician';
    }
    return isRTL ? 'موظف' : 'Staff';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full h-auto gap-3 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-100 dark:hover:border-slate-600",
            isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'
          )}
        >
          <Avatar className="h-9 w-9 ring-2 ring-blue-100 dark:ring-slate-600 flex-shrink-0">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={cn("flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden", isRTL ? 'items-end' : 'items-start')}>
            <span className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate w-full leading-none">
              {user?.name || 'User'}
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1.5 leading-none">
              {getRoleDisplay()}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? "start" : "end"} side={isRTL ? "left" : "right"} className="w-64 p-1.5 rounded-xl">
        <div className={cn("px-3 py-4 mb-1 border-b dark:border-slate-800", isRTL ? 'text-right' : 'text-left')}>
          <p className="font-bold text-sm truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate mt-1">{user?.email}</p>
        </div>
        <DropdownMenuItem onClick={() => navigate('/business/settings')} className={cn("flex gap-3 px-3 py-2.5 cursor-pointer", isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
          <Cog6ToothIcon className="h-4 w-4 text-gray-500" />
          <span className="flex-1">{isRTL ? 'الإعدادات' : 'Settings'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className={cn("flex gap-3 px-3 py-2.5 cursor-pointer text-red-600", isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
          <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
          <span className="flex-1">{t('auth.logout')}</span>
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
      'branches': t('navigation.branches'),
    };
    return translations[segment] || segment;
  };
  
  return (
    <Breadcrumb>
      <BreadcrumbList className={cn("flex items-center", isRTL ? 'flex-row-reverse' : 'flex-row')}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/business">{t('navigation.business')}</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.slice(1).map((segment, index) => (
          <React.Fragment key={segment}>
            <BreadcrumbSeparator className={cn("mx-1", isRTL && "rotate-180")} />
            <BreadcrumbItem>
              {index === pathSegments.length - 2 ? (
                <BreadcrumbPage className="capitalize">{translateSegment(segment)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/${pathSegments.slice(0, index + 2).join('/')}`} className="capitalize">
                  {translateSegment(segment)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function TenantLayout() {
  const { isRTL } = useDirectionClasses();
  const user = authService.getCurrentUser();
  
  const isBusinessOwner = user?.role === 'business_owner' || 
    (user?.roles && Array.isArray(user.roles) && user.roles.some((r: any) => 
      ['business_owner', 'admin', 'business_admin'].includes(r.name)
    ));

  return (
    <BranchProvider>
      <SidebarProvider key={isRTL ? 'rtl' : 'ltr'} defaultOpen={true}>
        <div 
          className={cn(
            "flex min-h-screen w-full bg-gradient-to-br from-gray-50/30 via-white to-blue-50/20 dark:from-slate-900 dark:to-slate-950",
            isRTL ? 'flex-row-reverse' : 'flex-row'
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <BusinessSidebar />
          <SidebarInset className="flex-1 w-full">
            <header className={cn(
              "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between px-4",
              "border-b border-gray-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm",
              isRTL ? 'flex-row-reverse' : 'flex-row'
            )}>
              <div className={cn("flex items-center gap-2", isRTL ? 'flex-row-reverse' : 'flex-row')}>
                <SidebarTrigger className="h-8 w-8" />
                <Separator orientation="vertical" className="h-4 mx-1" />
                <BusinessBreadcrumb />
              </div>
              
              <div className={cn("flex items-center gap-2", isRTL ? 'flex-row-reverse' : 'flex-row')}>
                {isBusinessOwner && <BranchSelector />}
                <SimpleLanguageToggle variant="button" size="sm" />
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                  <BellIcon className="h-4 w-4" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                </Button>
              </div>
            </header>
            
            <main id="main-content" className="flex-1 w-full p-4 overflow-auto">
              <Outlet />
            </main>         
          </SidebarInset>
        </div>
      </SidebarProvider>
    </BranchProvider>
  );
} 