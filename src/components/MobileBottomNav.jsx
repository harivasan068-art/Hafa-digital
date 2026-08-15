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
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl transition-colors duration-300">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || (item.id === 'attendance' && (activeTab === 'history' || activeTab === 'checkin'));

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-orange-500 font-extrabold scale-105'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className={`relative p-1.5 rounded-xl ${isActive ? 'bg-orange-500/10 border border-orange-500/20' : ''}`}>
              <Icon className="w-5 h-5" />
              {item.highlight && !isActive && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
