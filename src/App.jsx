import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { BackgroundWatermark } from './components/BackgroundWatermark';
import { LandingPageView } from './views/LandingPageView';
import { LoginView } from './views/LoginView';
import { CommonDashboardView } from './views/CommonDashboardView';
import { EmployeeAttendanceView } from './views/EmployeeAttendanceView';
import { EmployeeProfileView } from './views/EmployeeProfileView';
import { EmployeePerformanceView } from './views/EmployeePerformanceView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminPerformanceReportView } from './views/AdminPerformanceReportView';
import { AdminGeotagVerificationView } from './views/AdminGeotagVerificationView';
import { AdminSpreadsheetView } from './views/AdminSpreadsheetView';
import { AdminEmployeeManagementView } from './views/AdminEmployeeManagementView';
import { AdminProfileView } from './views/AdminProfileView';
import { SettingsView } from './views/SettingsView';

const MainLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authView, setAuthView] = useState('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is not logged in, render public landing or login page
  if (!user) {
    if (authView === 'landing') {
      return <LandingPageView onOpenLogin={(role) => setAuthView('login')} />;
    }
    return <LoginView onBack={() => setAuthView('landing')} />;
  }

  // Render view based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CommonDashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'attendance':
      case 'history':
      case 'checkin':
        return <EmployeeAttendanceView />;
      case 'employee-performance':
        return <EmployeePerformanceView />;
      case 'employee-profile':
      case 'admin-profile':
      case 'profile':
        return <EmployeeProfileView />;
      case 'admin-dashboard':
        return <AdminDashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'performance-report':
        return <AdminPerformanceReportView />;
      case 'geotag-verification':
        return <AdminGeotagVerificationView />;
      case 'spreadsheet':
        return <AdminSpreadsheetView />;
      case 'employee-management':
        return <AdminEmployeeManagementView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <CommonDashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-orange-500 selection:text-white relative transition-colors duration-300 w-full max-w-full overflow-x-hidden">
      {/* Root Centered Background Watermark */}
      <BackgroundWatermark />

      <div className="relative z-10 flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
        <Navbar 
          onOpenSettings={() => setActiveTab('settings')} 
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        />
        
        <div className="flex flex-1 w-full max-w-full overflow-x-hidden relative">
          {/* Responsive Sidebar Shell (Desktop Fixed + Mobile Overlay Drawer) */}
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />

          {/* Full Screen Width Main Content Container on Mobile */}
          <main className="w-full flex-1 min-w-0 p-3 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto overflow-x-hidden pb-28 md:pb-12">
            {renderContent()}
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
