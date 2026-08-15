import React from 'react';

export const SkeletonLoader = ({ type = 'table', count = 4, className = '' }) => {
  const renderItems = () => {
    switch (type) {
      case 'table':
        return Array.from({ length: count }).map((_, idx) => (
          <tr key={idx} className="animate-pulse border-b border-slate-200 dark:border-zinc-800">
            <td className="px-4 py-3.5">
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-md w-28 mb-1.5" />
              <div className="h-3 bg-slate-200/70 dark:bg-zinc-800/70 rounded-md w-20" />
            </td>
            <td className="px-4 py-3.5">
              <div className="w-10 h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            </td>
            <td className="px-4 py-3.5">
              <div className="w-10 h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            </td>
            <td className="px-4 py-3.5">
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-md w-36 mb-1" />
              <div className="h-3 bg-slate-200/70 dark:bg-zinc-800/70 rounded-md w-24" />
            </td>
            <td className="px-4 py-3.5">
              <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-md w-40" />
            </td>
            <td className="px-4 py-3.5">
              <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded-full w-20" />
            </td>
          </tr>
        ));

      case 'card':
        return Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="animate-pulse p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
              <div className="w-20 h-6 rounded-full bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-md w-3/4" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-200/70 dark:bg-zinc-800/70 rounded-md w-full" />
              <div className="h-3 bg-slate-200/70 dark:bg-zinc-800/70 rounded-md w-5/6" />
            </div>
          </div>
        ));

      case 'profile':
        return (
          <div className="animate-pulse p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-zinc-800" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-md w-1/2" />
                <div className="h-3 bg-slate-200/70 dark:bg-zinc-800/70 rounded-md w-1/3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-10 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            </div>
          </div>
        );

      case 'stats':
        return Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="animate-pulse p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-md w-1/2" />
            <div className="h-7 bg-slate-200 dark:bg-zinc-800 rounded-md w-3/4" />
          </div>
        ));

      default:
        return null;
    }
  };

  return <>{renderItems()}</>;
};
