import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { apiCall } from '../services/api';
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, MapPin, 
  FileText, ExternalLink, ArrowRight, ShieldCheck, User, Activity, TrendingUp, Navigation
} from 'lucide-react';

export const EmployeeDashboardView = ({ onNavigate }) => {
  const { user } = useAuth();
  const [officeSettings, setOfficeSettings] = useState({ latitude: 13.0853, longitude: 80.0179, radiusMeters: 200 });
  const { location, distanceMeters, isInsideGeofence } = useGeolocation(officeSettings);
  const [attendance, setAttendance] = useState([]);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [stats, setStats] = useState({ presentDays: 18, hoursLogged: 144, pendingApprovals: 1 });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const res = await apiCall('getAttendance', { employee_id: user.employee_id });
    if (res.success && res.records) {
      setAttendance(res.records);
      const active = res.records.find(r => !r.check_out);
      setActiveCheckIn(active || null);

      const presentCount = res.records.filter(r => r.status === 'Present').length;
      const pendingCount = res.records.filter(r => r.status === 'Pending').length;
      setStats({
        presentDays: presentCount || 18,
        hoursLogged: (presentCount || 18) * 8,
        pendingApprovals: pendingCount || 1
      });
    }
  };

  const latDisplay = location?.latitude ? location.latitude.toFixed(4) : '13.0853';
  const lngDisplay = location?.longitude ? location.longitude.toFixed(4) : '80.0179';
  const formattedDistance = distanceMeters !== null ? `${distanceMeters}m` : 'Calculating...';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-orange-600 font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span>Employee Overview Portal</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Welcome back, {user?.full_name || 'Harivasan V'}!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Employee ID: <strong className="text-slate-900">{user?.employee_id || 'EMP836121'}</strong> | Dept: {user?.department || 'Engineering'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate && onNavigate('attendance')}
            className="px-6 py-3 rounded-full font-extrabold text-xs text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>{activeCheckIn ? 'Active Shift Check-In' : 'Go to Attendance Clock-In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Present Days (This Month)</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{stats.presentDays} Days</span>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> 94% Shift Adherence Rate
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Hours Logged</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{stats.hoursLogged} hrs</span>
            <span className="text-[11px] text-slate-500 mt-1 block">8.0 hrs/day average</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pending Verifications</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{stats.pendingApprovals} Record</span>
            <span className="text-[11px] text-orange-600 font-bold mt-1 block">Requires HR review</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => onNavigate && onNavigate('attendance')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Clock In / Out Portal</h3>
          <p className="text-xs text-slate-500 mt-1">WebRTC live selfie capture with real-time geofence validation.</p>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('attendance')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Submit Work Proof</h3>
          <p className="text-xs text-slate-500 mt-1">Upload client onsite visit proofs or field task documentation.</p>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('timesheet')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Monthly Timesheet</h3>
          <p className="text-xs text-slate-500 mt-1">View monthly attendance summary, duty hours, and geofence logs.</p>
        </div>
      </div>

      {/* Embedded Google Map Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span>Live Geolocation & Boundary Radar</span>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            isInsideGeofence ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {isInsideGeofence ? 'Inside Zone' : `Outside Zone (${formattedDistance} away)`}
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video md:aspect-[21/9]">
          <iframe
            title="Dashboard Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://maps.google.com/maps?q=${latDisplay},${lngDisplay}&z=15&output=embed`}
            className="w-full h-full"
          />
          <div className="absolute top-4 left-4 bg-slate-900/90 text-white text-xs font-mono font-semibold px-3 py-1.5 rounded-full shadow-md">
            Lat: {latDisplay}, Lon: {lngDisplay}
          </div>
        </div>
      </div>
    </div>
  );
};
