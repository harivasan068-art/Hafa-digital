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
import { AdminProfileView } from './views/AdminProfileView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminPerformanceReportView } from './views/AdminPerformanceReportView';
import { AdminGeotagVerificationView } from './views/AdminGeotagVerificationView';
import { AdminSpreadsheetView } from './views/AdminSpreadsheetView';
import { AdminEmployeeManagementView } from './views/AdminEmployeeManagementView';
import { SettingsView } from './views/SettingsView';
import { ArrowLeft, MapPin } from 'lucide-react';

const MainLayout = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('common-dashboard');

  // Unauthenticated Flow: Landing Page by default, Login View on toggle
  if (!user) {
    if (showLogin) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col relative transition-colors duration-300">
          {/* Centered Circular Background Watermark */}
          <BackgroundWatermark />

          {/* Top Return to Company Home Bar */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between relative z-20 transition-colors">
            <button
              onClick={() => setShowLogin(false)}
              className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-orange-500" />
              <span>Back to Company Home</span>
            </button>

            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xs">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>hafa digital • GeoTrack HRMS</span>
            </div>
          </div>

          <div className="flex-1 relative z-10">
            <LoginView />
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <BackgroundWatermark />
        <div className="relative z-10">
          <LandingPageView onOpenLogin={() => setShowLogin(true)} />
        </div>
      </div>
    );
  }

  // Authenticated Portal Views
  const renderContent = () => {
    switch (activeTab) {
      case 'common-dashboard':
      case 'dashboard':
        return <CommonDashboardView onNavigate={(tab) => setActiveTab(tab)} />;
      case 'attendance':
      case 'history':
        return <EmployeeAttendanceView />;
      case 'employee-profile':
      case 'profile':
        return <EmployeeProfileView />;
      case 'employee-performance':
        return <EmployeePerformanceView />;
      case 'admin-profile':
        return <AdminProfileView />;
      case 'admin-dashboard':
        return <AdminDashboardView />;
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-orange-500 selection:text-white relative transition-colors duration-300">
      {/* Root Centered Background Watermark */}
      <BackgroundWatermark />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar onOpenSettings={() => setActiveTab('settings')} />
        <div className="flex flex-1">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl">
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
