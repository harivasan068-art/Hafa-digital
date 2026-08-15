import React from 'react';
import { LayoutDashboard, MapPin, BarChart3, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  const { user, isAdmin } = useAuth();

  if (!user) return null;

  const navItems = [
    {
      id: 'common-dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'attendance',
      label: 'Check-In',
      icon: MapPin,
      highlight: true,
    },
    {
      id: isAdmin ? 'performance-report' : 'employee-performance',
      label: isAdmin ? 'Reports' : 'Performance',
      icon: BarChart3,
    },
    {
      id: isAdmin ? 'admin-profile' : 'employee-profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl transition-colors duration-300 select-none"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || (item.id === 'attendance' && (activeTab === 'history' || activeTab === 'checkin'));

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`min-h-[44px] min-w-[44px] px-3 py-1 flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 cursor-pointer ${
              isActive
                ? 'text-orange-600 dark:text-orange-400 font-black'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-semibold'
            }`}
          >
            <div className={`relative p-1.5 rounded-xl ${isActive ? 'bg-orange-500/10 border border-orange-500/20' : ''}`}>
              <Icon className="w-5 h-5" />
              {item.highlight && !isActive && (
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse border-2 border-white dark:border-zinc-900" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
