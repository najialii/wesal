import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
import SharedBadge from '../ui/SharedBadge';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { SimpleLanguageToggle } from '../SimpleLanguageToggle';
import BranchSelector from '../BranchSelector';
import { useTranslation, useDirectionClasses } from '../../lib/translation';
import { authService } from '../../services/auth';
import { BranchProvider } from '../../contexts/BranchContext';

function BusinessSidebar() {
  const location = useLocation();
  const { t } = useTranslation('common');
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
  
  // Check if business has uploaded a custom logo
  const hasCustomLogo = user?.tenant?.logo ? true : false;
  
  // Get tenant logo URL - handle both logo and logo_url fields
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
      className="border-r border-gray-200 dark:border-gray-800 bg-gradient-to-br from-secondary-50/10 via-white to-white dark:from-gray-950 dark:to-gray-950"
    >
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
        {hasCustomLogo ? (
          // Show only logo for businesses with custom logo
          <div className="flex h-20 items-center justify-center px-6">
            <img 
              src={tenantLogo} 
              alt={`${tenantName} Logo`}
              className="h-14 w-auto max-w-[180px] object-contain filter drop-shadow-sm"
              onError={(e) => {
                // Fallback to default logo if tenant logo fails to load
                e.currentTarget.src = '/1.svg';
              }}
            />
          </div>
        ) : (
          // Show default WesalTech logo with text for businesses without custom logo
          <div className="flex h-20 items-center justify-center px-6 gap-2">
            <img 
              src="/1.svg" 
              alt="WesalTech Logo" 
              className="h-40 w-auto filter drop-shadow-sm"
            />
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      size="lg"
                      className={`
                        relative h-12 px-4 rounded-xl font-medium transition-all duration-200 ease-in-out
                        ${isActive 
                          ? 'bg-white text-primary-600 shadow-md border border-gray-200' 
                          : 'hover:bg-white/60 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                        }
                        ${isRTL ? 'flex-row-reverse' : ''}
                      `}
                    >
                      <Link to={item.href} className={`flex items-center gap-4 w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`
                          icon-container flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200
                          ${isActive 
                            ? 'bg-primary-100 text-primary-600' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                          }
                        `}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                        {/* Only show badges for business owners */}
                        {isBusinessOwner && item.isShared && (
                          <SharedBadge type="general" size="sm" showTooltip={false} className="ml-1" />
                        )}
                        {isBusinessOwner && item.isBranchSpecific && (
                          <span 
                            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            title={t('branchSpecificTooltip') || 'This data belongs to a specific branch'}
                          >
                            {t('branch') || 'Branch'}
                          </span>
                        )}
                        {isActive && (
                          <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-full`} />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="p-4">
          <BusinessUserMenu />
        </div>
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
          className={`
            w-full h-14 gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 
            transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700
            ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'}
          `}
        >
          <Avatar className="h-10 w-10 ring-2 ring-gray-200 dark:ring-gray-700">
            <AvatarImage 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&color=7F9CF5&background=EBF4FF`}
              alt={user?.name || 'User'} 
            />
            <AvatarFallback className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={`flex flex-col text-sm ${isRTL ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate w-full">
              {user?.name || 'User'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {t('auth.staff')}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 shadow-lg border border-gray-200 dark:border-gray-700">
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
        >
          <ArrowRightStartOnRectangleIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
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
    
  // Debug log for troubleshooting
  console.log('TenantLayout - Business owner check:', {
    role: user?.role,
    roles: user?.roles,
    tenant_id: user?.tenant_id,
    isBusinessOwner
  });

  return (
    <BranchProvider>
      <SidebarProvider key={isRTL ? 'rtl' : 'ltr'}>
        <div 
          className={`flex min-h-screen w-full bg-gradient-to-br from-secondary-50/20 via-white to-secondary-50/30 dark:from-gray-900 dark:to-gray-950 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
          dir={isRTL ? 'rtl' : 'ltr'}
          lang={isRTL ? 'ar' : 'en'}
          data-sidebar-provider
        >
          <BusinessSidebar />
          <SidebarInset className="flex-1 min-w-0">
            {/* Header */}
            <header className={`sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm px-4 shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Left side - Sidebar trigger and breadcrumb */}
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <SidebarTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" />
                <Separator orientation="vertical" className="h-4" />
                <BusinessBreadcrumb />
              </div>
              
              {/* Right side - Branch selector (only for business owners), language toggle, notifications */}
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {isBusinessOwner && <BranchSelector />}
                <SimpleLanguageToggle variant="button" size="sm" />
                <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <BellIcon className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </div>
            </header>
            
            {/* Main Content */}
            <main id="main-content" className="flex-1 p-6 min-h-[calc(100vh-4rem)]">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </BranchProvider>
  );
}
