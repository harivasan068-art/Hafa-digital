import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';
import { 
  ShieldCheck, Check, X, MapPin, Eye, RefreshCw, ExternalLink, 
  Radio, FileSpreadsheet, Image as ImageIcon, Filter, User, AlertCircle,
  Calendar, Search, FileText, Table, Download
} from 'lucide-react';

/**
 * Resolves any Google Drive URL or raw File ID into a direct CDN image link.
 * Extracts the file ID and builds https://lh3.googleusercontent.com/d/{fileId}
 */
export const resolveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  if (!trimmed) return '';

  // If raw Base64 data URI, return as-is
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Extract file ID from Google Drive / Google Content URLs
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('googleusercontent.com') ||
    trimmed.includes('docs.google.com')
  ) {
    // Check for /d/{fileId}
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${dMatch[1]}`;
    }

    // Check for id={fileId}
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
  }

  // If passed a raw alphanumeric File ID (25+ characters)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }

  return trimmed;
};

export const getDirectImageUrl = resolveImageUrl;

/**
 * Extracts a web viewable Google Drive link for direct browser opening
 */
export const getDriveWebUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:image/')) return '';

  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return `https://drive.google.com/file/d/${dMatch[1]}/view`;
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/file/d/${idMatch[1]}/view`;
  }
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return `https://drive.google.com/file/d/${trimmed}/view`;
  }
  if (trimmed.startsWith('http')) return trimmed;
  return '';
};

/**
 * Robust extraction helper to parse attendance records from various API response formats
 */
const extractAttendanceRecords = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;

  if (typeof res === 'string') {
    try {
      const parsed = JSON.parse(res);
      return extractAttendanceRecords(parsed);
    } catch (e) {
      return [];
    }
  }

  if (typeof res === 'object') {
    if (Array.isArray(res.records)) return res.records;
    if (Array.isArray(res.attendance)) return res.attendance;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.rows)) return res.rows;
    if (Array.isArray(res.result)) return res.result;

    if (typeof res.records === 'string') {
      try { return JSON.parse(res.records); } catch (e) {}
    }
    if (typeof res.attendance === 'string') {
      try { return JSON.parse(res.attendance); } catch (e) {}
    }
    if (typeof res.data === 'string') {
      try { return JSON.parse(res.data); } catch (e) {}
    }
  }

  return [];
};

export const AdminGeotagVerificationView = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoTitle, setPhotoTitle] = useState('Verification Image Preview');
  const [actionMessage, setActionMessage] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  // Date Range Presets & Filter States (Module 4)
  const [datePreset, setDatePreset] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const publishedSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJieiTyHLD4AITlgJ9Tv8iKitcrHd1HKorFBIyha8Nro2CJDvIzT7KYmEvcu43wNjrNU03FAkEolYe/pubhtml";

  // Auto-polling effect: Sync latest employee field dispatches every 30 seconds
  useEffect(() => {
    loadAllAttendance(false);

    const pollingInterval = setInterval(() => {
      loadAllAttendance(true); // silent background fetch
    }, 30000);

    return () => clearInterval(pollingInterval);
  }, []);

  const loadAllAttendance = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiCall('getAttendance');
      const records = extractAttendanceRecords(res);
      setAttendance(records);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("[GeoTrack Admin] Error fetching attendance records:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleVerify = async (record, newStatus) => {
    setLoading(true);
    setActionMessage(null);
    const targetId = record.id || record.record_id || record.employee_id;

    const res = await apiCall('updateAttendanceStatus', {
      id: targetId,
      record_id: targetId,
      status: newStatus,
      approved_by: user?.email || 'HR_ADMIN'
    });

    const empName = record.full_name || record.employee_name || record.employee_id || 'Employee';
    if (res.success || res.status === 'success' || !res.error) {
      setActionMessage(`Attendance status for ${empName} updated to '${newStatus}' successfully!`);
    } else {
      setActionMessage(`Notice: Status change sent for ${empName}. Refreshing data...`);
    }

    await loadAllAttendance(true);
    setLoading(false);
  };

  const handleSelectDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();

    if (preset === 'TODAY') {
      const todayStr = today.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'THIS_WEEK') {
      const first = today.getDate() - today.getDay();
      const firstDay = new Date(today.setDate(first)).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Comprehensive Filtered Dataset (Module 4)
  const filteredRecords = useMemo(() => {
    return attendance.filter((r) => {
      // 1. Status Filter
      if (filterStatus && filterStatus.toUpperCase() !== 'ALL') {
        const itemStatus = String(r.status || r.hr_status || r.HR_STATUS || '').trim().toLowerCase();
        if (itemStatus !== filterStatus.trim().toLowerCase()) return false;
      }

      // 2. Search Filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const empName = String(r.full_name || r.employee_name || r.employee_id || '').toLowerCase();
        const locName = String(r.location_name || r.location || r.address || '').toLowerCase();
        const rem = String(r.remarks || '').toLowerCase();
        if (!empName.includes(query) && !locName.includes(query) && !rem.includes(query)) return false;
      }

      // 3. Date Range Filter
      if (startDate || endDate) {
        const recDate = r.date || (r.check_in ? r.check_in.split('T')[0] : '');
        if (!recDate) return false;
        if (startDate && recDate < startDate) return false;
        if (endDate && recDate > endDate) return false;
      }

      return true;
    });
  }, [attendance, filterStatus, searchTerm, startDate, endDate]);

  // Filter-Aware Attendance CSV Export
  const exportFilteredAttendanceCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No matching records to export.");
      return;
    }

    const headers = ["Employee ID", "Employee Name", "Date", "Check In", "Location", "Latitude", "Longitude", "Geofence Status", "HR Status", "Remarks"];
    const rows = filteredRecords.map(r => [
      `"${r.employee_id || ''}"`,
      `"${(r.full_name || r.employee_name || '').replace(/"/g, '""')}"`,
      `"${r.date || ''}"`,
      `"${r.check_in || ''}"`,
      `"${(r.location_name || r.location || '').replace(/"/g, '""')}"`,
      `"${r.latitude || ''}"`,
      `"${r.longitude || ''}"`,
      `"${r.is_inside_geofence ? 'INSIDE' : 'OUTSIDE'}"`,
      `"${r.status || 'Pending'}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `geotag_verification_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openLightbox = (url, title) => {
    if (!url) return;
    setSelectedPhoto(url);
    setPhotoTitle(title || 'Verification Image Inspection');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-500 font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span>Operations Manager Portal</span>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Location & Attendance Log</h2>
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 font-bold">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
              <span>Auto-Sync 30s</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time multi-site field dispatch verification. {lastRefreshedAt && <span className="text-emerald-600 font-semibold">(Last Sync: {lastRefreshedAt})</span>}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={exportFilteredAttendanceCSV}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-sm flex items-center space-x-1.5 transition-colors"
            title="Export currently filtered attendance records to CSV"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Export CSV ({filteredRecords.length})</span>
          </button>

          <a
            href={publishedSheetUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-sm flex items-center space-x-2 transition-colors"
            title="Open published Google Sheet database in new tab"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Master Sheet</span>
            <ExternalLink className="w-3 h-3 text-emerald-600" />
          </a>

          <button
            onClick={() => loadAllAttendance(false)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700 disabled:opacity-50"
            title="Reload Data Now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* STICKY TOP FILTER BAR & DATE RANGE PRESETS (MODULE 4) */}
      <div className="sticky top-0 z-20 p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          {/* Preset Date Range Chips */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <div className="flex items-center space-x-1 text-xs font-bold text-zinc-500 mr-1">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span>Presets:</span>
            </div>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'THIS_WEEK', label: 'This Week' },
              { id: 'THIS_MONTH', label: 'This Month' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  datePreset === p.id && !startDate && !endDate
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">
            <span>Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDatePreset('CUSTOM'); }}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
            />
            <span className="text-zinc-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDatePreset('CUSTOM'); }}
              className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setDatePreset('ALL'); }}
                className="text-xs text-rose-500 hover:underline font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee name, location, or site remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mr-1">Status:</span>
            {[
              { label: 'All', value: 'ALL' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Present', value: 'Present' },
              { label: 'Rejected', value: 'Rejected' }
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => setFilterStatus(st.value)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  filterStatus.toUpperCase() === st.value.toUpperCase()
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Verification Grid Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
            <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-4 py-3">EMPLOYEE</th>
                <th className="px-4 py-3">PHOTO SELFIE</th>
                <th className="px-4 py-3">SITE WORK PROOF</th>
                <th className="px-4 py-3">CHECK IN</th>
                <th className="px-4 py-3">LIVE COORDINATES</th>
                <th className="px-4 py-3">GEOFENCE STATUS</th>
                <th className="px-4 py-3">HR STATUS</th>
                <th className="px-4 py-3 text-right">APPROVAL ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                      <p className="font-semibold text-zinc-600 dark:text-zinc-400">No attendance records found matching filter: <span className="text-orange-500 font-bold">{filterStatus}</span></p>
                      <p className="text-[11px] text-zinc-400">Total database records: {attendance.length}. Click 'All Field Records' to view all entries.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const empName = rec.full_name || rec.employee_name || rec.name || rec.employee_id || 'Unknown Employee';
                  const empId = rec.employee_id || rec.emp_id || `EMP-${idx + 1}`;
                  const dept = rec.department || rec.dept || 'Field Operations';

                  const selfieUrl = rec.photo_url || rec.photo || rec.selfie || rec.photo_base64 || '';
                  
                  let proofUrl = rec.proof_url || rec.proof_photo || rec.proof_image || rec.proof_base64 || '';
                  if (!proofUrl && rec.remarks && rec.remarks.includes('Work Proof Attached:')) {
                    const parts = rec.remarks.split('Work Proof Attached:');
                    if (parts[1]) proofUrl = parts[1].trim();
                  }

                  const checkInTime = rec.check_in || rec.check_in_time || rec.time || '';
                  const checkInDate = rec.date || (checkInTime ? checkInTime.split('T')[0] : '---');

                  const isInsideGeofence = rec.is_inside_geofence === true || 
                    String(rec.is_inside_geofence).toLowerCase() === 'true' || 
                    rec.is_inside === true || 
                    String(rec.is_inside).toLowerCase() === 'true';

                  const rawStatus = String(rec.status || rec.hr_status || rec.HR_STATUS || 'Pending').trim();
                  const statusLower = rawStatus.toLowerCase();

                  return (
                    <tr key={rec.id || `rec_${idx}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      {/* EMPLOYEE */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{empName}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-medium mt-0.5 pl-5">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-bold mr-1">{empId}</span> 
                          • {dept}
                        </div>
                      </td>

                      {/* PHOTO SELFIE */}
                      <td className="px-4 py-3">
                        {selfieUrl ? (
                          <div className="relative group w-10 h-10">
                            <img
                              src={resolveImageUrl(selfieUrl)}
                              alt={`Selfie - ${empName}`}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-300 dark:border-zinc-700 shadow-sm cursor-pointer"
                              onClick={() => openLightbox(selfieUrl, `Photo Selfie - ${empName}`)}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=Preview+Error';
                              }}
                            />
                            <button
                              onClick={() => openLightbox(selfieUrl, `Photo Selfie - ${empName}`)}
                              className="absolute inset-0 bg-zinc-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                              title="Click to Preview Lightbox"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">No Selfie</span>
                        )}
                      </td>

                      {/* SITE WORK PROOF */}
                      <td className="px-4 py-3">
                        {proofUrl ? (
                          <div className="relative group w-10 h-10">
                            <img
                              src={resolveImageUrl(proofUrl)}
                              alt={`Work Proof - ${empName}`}
                              className="w-10 h-10 rounded-xl object-cover border border-orange-500/40 shadow-sm cursor-pointer"
                              onClick={() => openLightbox(proofUrl, `Site Work Proof - ${empName}`)}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/100x100?text=Preview+Error';
                              }}
                            />
                            <button
                              onClick={() => openLightbox(proofUrl, `Site Work Proof - ${empName}`)}
                              className="absolute inset-0 bg-zinc-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                              title="Click to Preview Lightbox"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                            No Proof
                          </span>
                        )}
                      </td>

                      {/* CHECK IN */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900 dark:text-white">{checkInDate}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          {checkInTime ? (checkInTime.includes('T') ? new Date(checkInTime).toLocaleTimeString() : checkInTime) : '---'}
                        </div>
                      </td>

                      {/* LIVE COORDINATES */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900 dark:text-white">{rec.location_name || rec.location || rec.address || 'Recorded Site'}</div>
                        {(rec.latitude || rec.lat) && (
                          <a
                            href={`https://maps.google.com/?q=${rec.latitude || rec.lat},${rec.longitude || rec.lng || rec.lon}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-orange-500 hover:underline flex items-center gap-1 font-mono mt-0.5"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>{parseFloat(rec.latitude || rec.lat).toFixed(4)}, {parseFloat(rec.longitude || rec.lng || rec.lon).toFixed(4)}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* GEOFENCE STATUS */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${isInsideGeofence ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {isInsideGeofence ? 'Inside Zone' : 'Outside Boundary'}
                          </span>
                        </div>
                        {rec.remarks && (
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs mt-0.5" title={rec.remarks}>{rec.remarks}</p>
                        )}
                      </td>

                      {/* HR STATUS */}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          statusLower === 'present' || statusLower === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : statusLower === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          {rawStatus}
                        </span>
                      </td>

                      {/* APPROVAL ACTIONS */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleVerify(rec, 'Present')}
                            disabled={statusLower === 'present' || loading}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 disabled:opacity-30 transition-colors flex items-center space-x-1"
                            title="Approve as Verified Present"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleVerify(rec, 'Rejected')}
                            disabled={statusLower === 'rejected' || loading}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 disabled:opacity-30 transition-colors flex items-center space-x-1"
                            title="Reject Site Submission"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                <span>{photoTitle}</span>
              </h4>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg font-bold transition-colors"
                title="Close Modal"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-950/5 rounded-xl p-2 flex items-center justify-center min-h-[300px]">
              <img 
                src={resolveImageUrl(selectedPhoto)} 
                alt="Verification Inspection High-Res" 
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg border border-slate-200 shadow-md" 
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400?text=Image+Preview+Unavailable';
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
              {getDriveWebUrl(selectedPhoto) ? (
                <a
                  href={getDriveWebUrl(selectedPhoto)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Open raw image in new Google Drive tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Open in Drive Tab</span>
                </a>
              ) : <div />}

              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
