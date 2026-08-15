import React from 'react';
import { MapPin, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const GeofenceStatusBadge = ({ isInside, distanceMeters, radiusMeters = 200, onRefresh, loading }) => {
  return (
    <div className={`p-4 rounded-xl backdrop-blur-md border transition-all duration-300 ${
      isInside 
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg ${isInside ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
            {isInside ? <CheckCircle2 className="w-6 h-6 animate-pulse" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-sm tracking-wide uppercase">
                {isInside ? 'Inside Office Geofence' : 'Outside Geofence Boundary'}
              </h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isInside ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isInside ? 'AUTO VERIFIED' : 'NEEDS HR APPROVAL'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 opacity-70" />
              <span>
                Distance to HQ: <strong className="text-white">{distanceMeters !== null ? `${distanceMeters}m` : 'Calculating...'}</strong> (Allowed Radius: {radiusMeters}m)
              </span>
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 disabled:opacity-50"
            title="Recalculate GPS Location"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
