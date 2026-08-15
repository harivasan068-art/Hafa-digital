import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-sm border ${
        isDark
          ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-zinc-700 hover:border-amber-400/50'
          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-orange-400/50'
      } ${className}`}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle Dark/Light Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20 animate-spin-slow" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 fill-slate-700/20" />
      )}
      {showLabel && (
        <span className="text-xs font-bold capitalize">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
