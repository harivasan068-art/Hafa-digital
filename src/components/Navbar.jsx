import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getGasUrl, setGasUrl } from '../services/api';
import { ThemeToggle } from './ThemeToggle';
import { Shield, LogOut, Settings, Server, CheckCircle2, User, ChevronDown, Menu } from 'lucide-react';

export const Navbar = ({ onOpenSettings, onToggleMobileMenu }) => {
  const { user, logout, isAdmin } = useAuth();
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState(() => getGasUrl());
  const [saveStatus, setSaveStatus] = useState('');

  const currentGasUrl = getGasUrl();

  const handleSaveGasUrl = (e) => {
    e.preventDefault();
    setGasUrl(scriptUrlInput);
    setSaveStatus('GAS Deployment URL updated successfully!');
    setTimeout(() => {
      setSaveStatus('');
      setShowUrlModal(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-3 sm:px-6 py-3 flex items-center justify-between transition-colors duration-300">
        {/* Left Side: Mobile Hamburger Menu Toggle + Brand Logo & Title */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Mobile Hamburger Drawer Menu Toggle Button */}
          {user && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-700 active:scale-95 transition-all cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-orange-500" />
            </button>
          )}

          <div className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="HafA DIGITAL" className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-full shadow-sm" />
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="font-black text-sm sm:text-lg text-slate-900 dark:text-white tracking-tight">HafA DIGITAL</h1>
                <span className="text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full font-extrabold uppercase bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  Operations
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:block">
                Field & Production Operations Portal
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Theme Toggle, GAS Connection & User Badge */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Light/Dark Mode Theme Toggle */}
          <ThemeToggle />

          {/* GAS Connection Indicator Button */}
          <button
            onClick={() => setShowUrlModal(true)}
            className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] ${
              currentGasUrl 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
            title="Configure Deployed Google Apps Script URL"
          >
            <Server className="w-3.5 h-3.5" />
            <span>{currentGasUrl ? 'Google Apps Script Connected' : 'Local Engine'}</span>
            <div className={`w-2 h-2 rounded-full ${currentGasUrl ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
          </button>

          {/* User Profile Badge */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-3 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-zinc-800">
              <img
                src={user.photo && !user.photo.includes('unsplash') ? user.photo : "/logo.png"}
                alt={user.full_name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-300 dark:border-zinc-700 shadow-sm"
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
              />
              <div className="hidden lg:block text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">{user.full_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    isAdmin 
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' 
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">{user.email}</span>
              </div>

              <button
                onClick={logout}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* GAS Endpoint Config Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 dark:bg-zinc-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-base">Google Apps Script Web App Endpoint</h3>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGasUrl} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                Paste your deployed Google Apps Script Web App Executable URL (`https://script.google.com/macros/s/.../exec`). Leave empty to run in local offline mode.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                  Deployed Script Executable URL
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {saveStatus && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{saveStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGasUrl('');
                    setScriptUrlInput('');
                    setSaveStatus('Switched to local standalone engine.');
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 min-h-[44px]"
                >
                  Use Local Engine
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all cursor-pointer min-h-[44px]"
                >
                  Save & Connect GAS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
