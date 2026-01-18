import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import AdminLayout from './components/Layout/AdminLayout';
import TenantLayout from './components/Layout/TenantLayout';
import TechnicianLayout from './components/Layout/TechnicianLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/admin/Dashboard';
import Tenants from './pages/admin/Tenants';
import OrganizationView from './pages/admin/OrganizationView';
import OrganizationEdit from './pages/admin/OrganizationEdit';
import OrganizationCreate from './pages/admin/OrganizationCreate';
import Sessions from './pages/admin/Sessions';
import AuditLogs from './pages/admin/AuditLogs';
import Reports from './pages/admin/Reports';
import Analytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import BusinessSettings from './pages/business/Settings';
import Branches from './pages/business/Branches';
import BranchView from './pages/business/BranchView';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import BusinessDashboard from './pages/business/Dashboard';
import POS from './pages/business/POS';
import Products from './pages/business/Products';
import AddProduct from './pages/business/AddProduct';
import EditProduct from './pages/business/EditProduct';
import Categories from './pages/business/Categories';
import Customers from './pages/business/Customers';
import Sales from './pages/business/Sales';
import Staff from './pages/business/Staff';
import StaffCreate from './pages/business/StaffCreate';
import StaffEdit from './pages/business/StaffEdit';
import StaffView from './pages/business/StaffView';
import MaintenanceContracts from './pages/business/MaintenanceContracts';
import MaintenanceContractForm from './pages/business/MaintenanceContractForm';
import MaintenanceContractView from './pages/business/MaintenanceContractView';
import Maintenance from './pages/business/Maintenance';
import MaintenanceVisitView from './pages/business/MaintenanceVisitView';
import MaintenanceContractSchedule from './pages/business/MaintenanceContractSchedule';
import TechnicianDashboard from './pages/technician/Dashboard';
import MyVisits from './pages/technician/MyVisits';
import VisitDetails from './pages/technician/VisitDetails';
import PartsInventory from './pages/technician/PartsInventory';
import VisitHistory from './pages/technician/VisitHistory';
import { authService } from './services/auth';
import { initializeAccessibility } from './lib/accessibility';
import { initializeFonts } from './lib/fonts';
import { TranslationProvider } from './lib/i18n/TranslationProvider';
import { BranchProvider } from './contexts/BranchContext';
import { Toaster } from './components/ui/sonner';
import './styles/rtl.css'; // Import enhanced RTL styles
import './App.css';

// Protected Route Component for Super Admin
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (!authService.isSuperAdmin()) {
    return <Navigate to="/business" replace />;
  }
  
  return <>{children}</>;
}

// Protected Route Component for Business Users
function BusinessRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  const user = authService.getCurrentUser();
  
  // Super admins should be redirected to admin panel, not business routes
  if (authService.isSuperAdmin()) {
    return <Navigate to="/admin" replace />;
  }
  
  if (!user?.tenant_id) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600">No business associated with your account.</p>
      </div>
    </div>;
  }
  
  // Check if user is business owner and needs onboarding
  // Only business owners go through onboarding, staff members skip it
  let isBusinessOwner = false;
  if (user.roles && Array.isArray(user.roles)) {
    isBusinessOwner = user.roles.some((r: any) => r.name === 'business_owner');
  } else if (user.role) {
    isBusinessOwner = user.role === 'business_owner';
  }
  
  if (isBusinessOwner && user.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

// Role-based Route Protection
function RoleRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/business" replace />;
  }
  
  // Check if user has any of the allowed roles
  // Support both user.role (string) and user.roles (array)
  let hasRole = false;
  
  if (user.roles && Array.isArray(user.roles)) {
    hasRole = user.roles.some((r: any) => allowedRoles.includes(r.name));
  } else if (user.role) {
    hasRole = allowedRoles.includes(user.role);
  }
  
  if (!hasRole) {
    return <Navigate to="/business" replace />;
  }
  
  return <>{children}</>;
}

// Technician Route Protection
function TechnicianRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  const user = authService.getCurrentUser();
  
  // Check if user is a technician
  let isTechnician = false;
  if (user?.roles && Array.isArray(user.roles)) {
    isTechnician = user.roles.some((r: any) => r.name === 'technician');
  } else if (user?.role) {
    isTechnician = user.role === 'technician';
  }
  
  if (!isTechnician) {
    return <Navigate to="/business" replace />;
  }
  
  return <>{children}</>;
}

// Protected Route Component for Onboarding
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    // Initialize accessibility features
    initializeAccessibility();
    
    // Initialize font loading
    initializeFonts();
  }, []);

  return (
    <ErrorBoundary>
      <TranslationProvider>
        <BranchProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground">
              {/* Skip link for keyboard navigation */}
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
            
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Onboarding Route */}
              <Route path="/onboarding" element={
                <OnboardingRoute>
                  <Onboarding />
                </OnboardingRoute>
              } />
              
              {/* Super Admin Routes */}
              <Route path="/admin" element={
                <SuperAdminRoute>
                  <AdminLayout />
                </SuperAdminRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="organizations/create" element={<OrganizationCreate />} />
                <Route path="organizations/:id" element={<OrganizationView />} />
                <Route path="organizations/:id/edit" element={<OrganizationEdit />} />
                <Route path="plans" element={<div className="p-6">Plans Management (Coming Soon)</div>} />
                <Route path="users" element={<div className="p-6">Users Management (Coming Soon)</div>} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Business/Tenant Routes */}
              <Route path="/business" element={
                <BusinessRoute>
                  <TenantLayout />
                </BusinessRoute>
              }>
                <Route index element={<BusinessDashboard />} />
                <Route path="pos" element={<POS />} />
                <Route path="products" element={<Products />} />
                <Route path="products/add" element={<AddProduct />} />
                <Route path="products/edit/:id" element={<EditProduct />} />
                <Route path="categories" element={<Categories />} />
                <Route path="customers" element={<Customers />} />
                <Route path="sales" element={<Sales />} />
                <Route path="staff" element={
                  <RoleRoute allowedRoles={['business_owner', 'business_admin']}>
                    <Staff />
                  </RoleRoute>
                } />
                <Route path="staff/create" element={
                  <RoleRoute allowedRoles={['business_owner', 'business_admin']}>
                    <StaffCreate />
                  </RoleRoute>
                } />
                <Route path="staff/view/:id" element={
                  <RoleRoute allowedRoles={['business_owner', 'business_admin']}>
                    <StaffView />
                  </RoleRoute>
                } />
                <Route path="staff/edit/:id" element={
                  <RoleRoute allowedRoles={['business_owner', 'business_admin']}>
                    <StaffEdit />
                  </RoleRoute>
                } />
                <Route path="maintenance" element={<MaintenanceContracts />} />
                <Route path="maintenance/create" element={<MaintenanceContractForm />} />
                <Route path="maintenance/edit/:id" element={<MaintenanceContractForm />} />
                <Route path="maintenance/view/:id" element={<MaintenanceContractView />} />
                <Route path="maintenance/schedule/:id" element={<MaintenanceContractSchedule />} />
                <Route path="maintenance/calendar" element={<Maintenance />} />
                <Route path="maintenance/view/:id" element={<MaintenanceVisitView />} />
                <Route path="branches" element={
                  <RoleRoute allowedRoles={['business_owner']}>
                    <Branches />
                  </RoleRoute>
                } />
                <Route path="branches/:id" element={
                  <RoleRoute allowedRoles={['business_owner']}>
                    <BranchView />
                  </RoleRoute>
                } />
                <Route path="settings" element={<BusinessSettings />} />
              </Route>

              {/* Technician Routes */}
              <Route path="/technician" element={
                <TechnicianRoute>
                  <TechnicianLayout />
                </TechnicianRoute>
              }>
                <Route index element={<TechnicianDashboard />} />
                <Route path="visits" element={<MyVisits />} />
                <Route path="visits/:id" element={<VisitDetails />} />
                <Route path="parts" element={<PartsInventory />} />
                <Route path="history" element={<VisitHistory />} />
              </Route>
            </Routes>
          </div>
          
          {/* Global toast notifications */}
          <Toaster />
        </Router>
      </BranchProvider>
      </TranslationProvider>
    </ErrorBoundary>
  );
}

export default App;
