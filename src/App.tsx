import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const DoctorSearch = lazy(() => import('./pages/DoctorSearch'));
const AppointmentManagement = lazy(() => import('./pages/AppointmentManagement'));
const PaymentManagement = lazy(() => import('./pages/PaymentManagement'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const SidebarDemo = lazy(() => import('./pages/SidebarDemo'));

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div className="p-6 text-gray-600">Loading...</div>}>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/doctor-search" element={<DoctorSearch />} />
              <Route path="/appointments" element={<AppointmentManagement />} />
              <Route path="/payments" element={<PaymentManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/support" element={<HelpSupport />} />
            </Route>
            <Route path="/sidebar-demo" element={<SidebarDemo />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}