import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Clock, History, User, ShieldCheck, 
  Users, Settings, MapPin, LogOut, FileSpreadsheet, Compass, TrendingUp
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout, isAdmin } = useAuth();

  const employeeMenuItems = [
    {
      id: 'dashboard',
      label: 'Operational Hub',
      icon: Compass,
      description: 'Overview & Navigation'
    },
    {
      id: 'attendance',
      label: 'Daily Task Status',
      icon: Clock,
      description: 'Submit Field Log & Photo'
    },
    {
      id: 'employee-performance',
      label: 'My Performance',
      icon: TrendingUp,
      description: 'Personal Tasks & Metrics'
    },
    {
      id: 'history',
      label: 'Submitted Field Logs',
      icon: History,
      description: 'Past Shift Logs'
    },
    {
      id: 'employee-profile',
      label: 'My Profile',
      icon: User,
      description: 'Personal Account Info'
    }
  ];

  const adminMenuItems = [
    {
      id: 'dashboard',
      label: 'Operational Hub',
      icon: Compass,
      description: 'Central Command Center'
    },
    {
      id: 'admin-dashboard',
      label: 'Operations Manager Portal',
      icon: LayoutDashboard,
      description: 'KPI Metrics & Grid'
    },
    {
      id: 'performance-report',
      label: 'Performance & Production',
      icon: TrendingUp,
      description: 'Task Ledger & KPIs'
    },
    {
      id: 'geotag-verification',
      label: 'Location & Attendance Log',
      icon: ShieldCheck,
      description: 'Review Field Dispatches'
    },
    {
      id: 'spreadsheet',
      label: 'Live Master Data',
      icon: FileSpreadsheet,
      description: 'Master Sheet Integration'
    },
    {
      id: 'employee-management',
      label: 'Employee Directory',
      icon: Users,
      description: 'Staff Records CRUD'
    },
    {
      id: 'admin-profile',
      label: 'Admin Profile',
      icon: User,
      description: 'Account & HQ Settings'
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      description: 'Geofence HQ & GAS Config'
    }
  ];

  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems;

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between shadow-sm text-zinc-100">
      <div className="space-y-4">
        {/* Top Sidebar Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-2 border-b border-zinc-800 pb-3">
          <img src="/logo.png" alt="HafA DIGITAL" className="w-10 h-10 object-contain rounded-full" />
          <div>
            <span className="font-black text-sm text-white block leading-tight">HafA DIGITAL</span>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block">
              {isAdmin ? 'Operations Manager' : 'Field Operations'}
            </span>
          </div>
        </div>

        {/* Menu Items List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'employee-profile' && activeTab === 'profile');

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-colors text-left font-medium text-xs ${
                  isActive
                    ? 'bg-orange-500 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <div>
                  <span className="block font-bold">{item.label}</span>
                  <span className={`text-[10px] block ${isActive ? 'text-orange-100' : 'text-zinc-500'}`}>
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Card */}
      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs">
          <div className="flex items-center space-x-1.5 text-orange-500 font-bold mb-1">
            <MapPin className="w-4 h-4" />
            <span>GPS Tracking Active</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Haversine GPS verification active for field operations.
          </p>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <img
              src={user?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
              alt={user?.full_name}
              className="w-9 h-9 rounded-xl object-cover border border-zinc-700 shadow-sm shrink-0"
            />
            <div className="truncate">
              <span className="font-bold text-xs text-white block truncate">{user?.full_name || 'Harivasan V'}</span>
              <span className="text-[10px] text-zinc-400 font-medium block">{user?.employee_id || 'EMP836121'}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

