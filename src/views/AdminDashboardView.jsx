import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';
import { 
  Users, CheckCircle2, XCircle, AlertTriangle, Radio, RefreshCw, 
  MapPin, Eye, ExternalLink, ShieldCheck, Check, X
} from 'lucide-react';

export const AdminDashboardView = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Auto-polling effect: Sync latest data every 30 seconds
  useEffect(() => {
    loadDashboardData(false);
    const interval = setInterval(() => loadDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    const [attRes, empRes] = await Promise.all([
      apiCall('getAttendance'),
      apiCall('getEmployees')
    ]);

    if (attRes.success && attRes.records) {
      setAttendance(attRes.records);
    }
    if (empRes.success && empRes.employees) {
      setEmployees(empRes.employees);
    }
    setLastRefreshedAt(new Date().toLocaleTimeString());
    if (!silent) setLoading(false);
  };

  const handleVerify = async (recordId, newStatus) => {
    setLoading(true);
    setActionMessage(null);
    const res = await apiCall('verifyAttendance', {
      record_id: recordId,
      status: newStatus,
      approved_by: user?.email || 'HR_ADMIN'
    });

    if (res.success) {
      setActionMessage(`Attendance status updated to ${newStatus}`);
      await loadDashboardData(false);
    }
    setLoading(false);
  };

  // KPI Calculations
  const totalEmployeesCount = employees.length || 12;
  const presentTodayCount = attendance.filter(r => r.status === 'Present').length;
  const pendingCount = attendance.filter(r => r.status === 'Pending').length;
  const geofenceViolationsCount = attendance.filter(r => !r.is_inside_geofence).length;
  const absentCount = Math.max(0, totalEmployeesCount - presentTodayCount - pendingCount);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-orange-600 font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span>Executive Control Dashboard</span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <h2 className="text-2xl font-black text-slate-900">Admin Live Command Center</h2>
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-bold">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
              <span>Auto-Sync 30s</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            System overview and live geotag verification grid. {lastRefreshedAt && <span className="text-emerald-700 font-semibold">(Synced at {lastRefreshedAt})</span>}
          </p>
        </div>

        <button
          onClick={() => loadDashboardData(false)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh All Data</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          ✓ {actionMessage}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Staff</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalEmployeesCount}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Active accounts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Present Today</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{presentTodayCount}</span>
          <span className="text-[10px] text-emerald-600 mt-1 block">Verified inside HQ</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">Pending HR</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{pendingCount}</span>
          <span className="text-[10px] text-amber-600 mt-1 block">Outside boundary</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">Geofence Flags</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{geofenceViolationsCount}</span>
          <span className="text-[10px] text-rose-600 mt-1 block">Outside radius check-ins</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Absent Today</span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">{absentCount}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">No check-in record</span>
        </div>
      </div>

      {/* Live Geotag Verification Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Live Attendance Verification Grid</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Photo Selfie</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">Live Coordinates</th>
                <th className="px-4 py-3">Geofence Status</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No active shift check-ins recorded yet today.
                  </td>
                </tr>
              ) : (
                attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{rec.employee_name}</div>
                      <div className="text-[10px] text-slate-500">{rec.employee_id} • {rec.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      {rec.photo_url ? (
                        <div className="relative group w-10 h-10">
                          <img
                            src={rec.photo_url}
                            alt="Selfie"
                            className="w-10 h-10 rounded-xl object-cover border border-slate-300 shadow-sm"
                          />
                          <button
                            onClick={() => setSelectedPhoto(rec.photo_url)}
                            className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                            title="Inspect Image"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Photo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-emerald-700 font-bold">{rec.check_in ? new Date(rec.check_in).toLocaleTimeString() : '---'}</div>
                      <div className="text-[10px] text-slate-400">{rec.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{rec.location_name || 'Recorded'}</div>
                      {rec.latitude && (
                        <a
                          href={`https://maps.google.com/?q=${rec.latitude},${rec.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-orange-600 hover:underline flex items-center gap-1 mt-0.5 font-mono"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{parseFloat(rec.latitude).toFixed(4)}, {parseFloat(rec.longitude).toFixed(4)}</span>
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${rec.is_inside_geofence ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                        <span className="font-bold text-slate-900">
                          {rec.is_inside_geofence ? 'Inside Zone' : 'Outside Boundary'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">{rec.remarks}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        rec.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : rec.status === 'Pending'
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleVerify(rec.id, 'Present')}
                          disabled={rec.status === 'Present' || loading}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 disabled:opacity-30 transition-colors flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleVerify(rec.id, 'Rejected')}
                          disabled={rec.status === 'Rejected' || loading}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 disabled:opacity-30 transition-colors flex items-center space-x-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Preview Modal Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-2xl w-full p-4 rounded-2xl bg-white border border-slate-200 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 text-white bg-slate-800 hover:bg-slate-700 rounded-full"
            >
              ✕
            </button>
            <img src={selectedPhoto} alt="Verification Selfie" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
