// Lazy-loaded maintenance pages for code splitting
import { lazy } from 'react';

// Main maintenance pages
export const Maintenance = lazy(() => import('../business/Maintenance'));
export const MaintenanceContracts = lazy(() => import('../business/MaintenanceContracts'));
export const MaintenanceContractView = lazy(() => import('../business/MaintenanceContractView'));
export const MaintenanceContractForm = lazy(() => import('../business/MaintenanceContractForm'));
export const MaintenanceVisitView = lazy(() => import('../business/MaintenanceVisitView'));
export const MaintenanceContractSchedule = lazy(() => import('../business/MaintenanceContractSchedule'));

// Technician pages
export const TechnicianDashboard = lazy(() => import('../technician/Dashboard'));
export const TechnicianMyVisits = lazy(() => import('../technician/MyVisits'));
export const TechnicianVisitDetails = lazy(() => import('../technician/VisitDetails'));
export const TechnicianVisitHistory = lazy(() => import('../technician/VisitHistory'));
export const TechnicianPartsInventory = lazy(() => import('../technician/PartsInventory'));

// Components
export const MaintenanceScheduleModal = lazy(() => import('../../components/modals/MaintenanceScheduleModal'));
export const MaintenanceDetailModal = lazy(() => import('../../components/modals/MaintenanceDetailModal'));
export const CompleteVisitModal = lazy(() => import('../../components/technician/CompleteVisitModal'));