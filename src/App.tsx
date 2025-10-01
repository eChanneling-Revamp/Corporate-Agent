import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import DoctorSearch from './pages/DoctorSearch';
import AppointmentManagement from './pages/AppointmentManagement';
import PaymentManagement from './pages/PaymentManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';
import SidebarDemo from './pages/SidebarDemo';
export function App() {
  return <BrowserRouter>
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
    </BrowserRouter>;
}