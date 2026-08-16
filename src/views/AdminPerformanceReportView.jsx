import React, { useState, useEffect, useMemo } from 'react';
import { apiCall } from '../services/api';
import { AssignTaskModal } from '../components/AssignTaskModal';
import { 
  TrendingUp, BarChart3, Users, CheckCircle2, Clock, AlertTriangle, 
  Plus, Search, Filter, Film, Video, Edit3, Upload, X, 
  RefreshCw, Award, Flame, FileSpreadsheet, Check, Download, FileText, Table, Calendar, ArrowRight
} from 'lucide-react';

const SPREADSHEET_ID = "1S9zlXs6piahSsaTbKEFui1AwKuEGPLEEcb83opRwGA8";
const EXCEL_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;
const PDF_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=pdf`;

const DEFAULT_PRODUCTION_TASKS = [];

// Status Sequence & Pill Colors for Quick-Toggles
const STATUS_SEQUENCE = ['Shoot Done', 'Editing', 'Ready for Review', 'Uploaded'];

const getStatusPillConfig = (status) => {
  const s = String(status || '').trim().toLowerCase();

  if (s === 'shoot done' || s === 'shoot completed') {
    return {
      label: 'Shoot Done',
      next: 'Editing',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
    };
  }
  if (s === 'editing' || s === 'in progress' || s === 'editing completed') {
    return {
      label: 'Editing',
      next: 'Ready for Review',
      badgeClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
    };
  }
  if (s === 'ready for review') {
    return {
      label: 'Ready for Review',
      next: 'Uploaded',
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
    };
  }
  if (s === 'uploaded' || s === 'delivered') {
    return {
      label: s === 'delivered' ? 'Delivered' : 'Uploaded',
      next: 'Shoot Done',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
    };
  }

  // Fallback for Pending or unassigned
  return {
    label: status || 'Pending',
    next: 'Shoot Done',
    badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/20'
  };
};

export const AdminPerformanceReportView = () => {
  const [tasks, setTasks] = useState(DEFAULT_PRODUCTION_TASKS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Date Range Filter States
  const [datePreset, setDatePreset] = useState('ALL'); // ALL | TODAY | YESTERDAY | THIS_WEEK | THIS_MONTH
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Assign Task Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchProductionTasks();
  }, []);

  const fetchProductionTasks = async () => {
    setLoading(true);
    try {
      const res = await apiCall('getProductionTasks');
      if (res?.tasks && Array.isArray(res.tasks) && res.tasks.length > 0) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.warn("[GeoTrack Production] Using local fallback tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Status Quick-Toggle Handler (Module 3)
  const handleQuickStatusToggle = async (task) => {
    const currentConfig = getStatusPillConfig(task.status);
    const nextStatus = currentConfig.next;

    // Optimistic UI Update
    setTasks((prevTasks) =>
      prevTasks.map((t) => (String(t.id) === String(task.id) ? { ...t, status: nextStatus } : t))
    );

    setNotification({
      type: 'success',
      message: `Updated status of "${task.item_name}" to '${nextStatus}'`
    });
    setTimeout(() => setNotification(null), 3000);

    // Background Endpoint API Dispatch
    try {
      await apiCall('updateTaskStatus', {
        taskId: task.id,
        id: task.id,
        status: nextStatus
      });
    } catch (err) {
      console.warn('[GeoTrack Production] Quick-toggle API update failed:', err);
    }
  };

  const handleOpenAssignModal = (task = null) => {
    setEditingTask(task);
    setShowAssignModal(true);
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => {
      const index = prev.findIndex((t) => String(t.id) === String(newTask.id));
      if (index !== -1) {
        const copy = [...prev];
        copy[index] = newTask;
        return copy;
      }
      return [newTask, ...prev];
    });

    setNotification({
      type: 'success',
      message: editingTask ? 'Task updated successfully!' : `New task "${newTask.item_name}" assigned successfully!`
    });

    setTimeout(() => setNotification(null), 3500);
    fetchProductionTasks();
  };

  const uniqueStaff = useMemo(() => {
    const staffSet = new Set();
    tasks.forEach((t) => {
      if (t.cameraman && t.cameraman !== 'Unassigned') staffSet.add(t.cameraman);
      if (t.editor && t.editor !== 'Unassigned') staffSet.add(t.editor);
    });
    return Array.from(staffSet);
  }, [tasks]);

  // Date Preset Helper Logic
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

  const kpis = useMemo(() => {
    const totalProcessed = tasks.length;
    const shootCount = tasks.filter((t) => t.shoot_date || (t.cameraman && t.cameraman !== 'Unassigned')).length;
    const editCount = tasks.filter((t) => t.edit_date || (t.editor && t.editor !== 'Unassigned')).length;

    const pendingOverdueCount = tasks.filter((t) => {
      const isPending = String(t.status).toLowerCase() === 'pending';
      const isMissingCam = !t.cameraman || t.cameraman === 'Unassigned';
      const isMissingEd = !t.editor || t.editor === 'Unassigned';
      const isMissingShootDate = !t.shoot_date;
      return isPending || isMissingCam || isMissingEd || isMissingShootDate;
    }).length;

    let totalDays = 0;
    let turnaroundCount = 0;

    tasks.forEach((t) => {
      if (t.shoot_date && t.delivery_date) {
        const sDate = new Date(t.shoot_date);
        const dDate = new Date(t.delivery_date);
        const diff = (dDate - sDate) / (1000 * 60 * 60 * 24);
        if (diff >= 0) {
          totalDays += diff;
          turnaroundCount++;
        }
      }
    });

    const avgTurnaround = turnaroundCount > 0 ? (totalDays / turnaroundCount).toFixed(1) : '--';

    const scores = {};
    tasks.forEach((t) => {
      const isCompleted = ['delivered', 'uploaded', 'editing completed', 'ready for review', 'shoot completed'].includes(String(t.status).toLowerCase());
      if (isCompleted) {
        if (t.cameraman && t.cameraman !== 'Unassigned') {
          scores[t.cameraman] = (scores[t.cameraman] || 0) + 1;
        }
        if (t.editor && t.editor !== 'Unassigned') {
          scores[t.editor] = (scores[t.editor] || 0) + 1;
        }
      }
    });

    const sortedLeaderboard = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => ({ name, score }));

    const topPerformer = sortedLeaderboard.length > 0 ? sortedLeaderboard[0] : null;

    return {
      totalProcessed,
      shootCount,
      editCount,
      pendingOverdueCount,
      avgTurnaround,
      topPerformer,
      sortedLeaderboard
    };
  }, [tasks]);

  const employeeBreakdown = useMemo(() => {
    return uniqueStaff.map((staffName) => {
      const camTasks = tasks.filter((t) => String(t.cameraman).toLowerCase() === staffName.toLowerCase());
      const edTasks = tasks.filter((t) => String(t.editor).toLowerCase() === staffName.toLowerCase());
      const allEmpTasks = tasks.filter(
        (t) =>
          String(t.cameraman).toLowerCase() === staffName.toLowerCase() ||
          String(t.editor).toLowerCase() === staffName.toLowerCase()
      );

      const completed = allEmpTasks.filter((t) =>
        ['delivered', 'uploaded', 'editing completed', 'ready for review'].includes(String(t.status).toLowerCase())
      ).length;

      const inProgress = allEmpTasks.filter((t) => ['in progress', 'editing', 'shoot done'].includes(String(t.status).toLowerCase())).length;
      const pendingUpload = allEmpTasks.filter(
        (t) => String(t.status).toLowerCase() === 'ready for review' && !t.upload_date
      ).length;

      return {
        name: staffName,
        totalAssigned: allEmpTasks.length,
        camCount: camTasks.length,
        editorCount: edTasks.length,
        completed,
        inProgress,
        pendingUpload
      };
    });
  }, [tasks, uniqueStaff]);

  // Dynamic Filtered Dataset
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !searchTerm ||
        t.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cameraman.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.editor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.remarks.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEmp =
        selectedEmployeeFilter === 'ALL' ||
        String(t.cameraman).toLowerCase() === selectedEmployeeFilter.toLowerCase() ||
        String(t.editor).toLowerCase() === selectedEmployeeFilter.toLowerCase();

      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        (selectedRoleFilter === 'Cameraman' && t.cameraman && t.cameraman !== 'Unassigned') ||
        (selectedRoleFilter === 'Editor' && t.editor && t.editor !== 'Unassigned');

      const matchesStatus =
        selectedStatusFilter === 'ALL' || String(t.status).toLowerCase() === selectedStatusFilter.toLowerCase();

      // Date Range Filtering
      let matchesDate = true;
      if (startDate || endDate) {
        const taskDate = t.shoot_date || t.edit_date || t.delivery_date || t.upload_date;
        if (!taskDate) {
          matchesDate = false;
        } else {
          if (startDate && taskDate < startDate) matchesDate = false;
          if (endDate && taskDate > endDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesEmp && matchesRole && matchesStatus && matchesDate;
    });
  }, [tasks, searchTerm, selectedEmployeeFilter, selectedRoleFilter, selectedStatusFilter, startDate, endDate]);

  // Filter-Aware Export CSV Helper (Module 4)
  const exportFilteredCSV = () => {
    if (filteredTasks.length === 0) {
      alert("No matching tasks to export for current filter criteria.");
      return;
    }

    const headers = ["ID", "Item / Project", "Cameraman", "Shoot Date", "Editor", "Edit Date", "Delivery Date", "Upload Date", "Status", "Remarks"];
    const rows = filteredTasks.map(t => [
      `"${t.id || ''}"`,
      `"${(t.item_name || '').replace(/"/g, '""')}"`,
      `"${t.cameraman || 'Unassigned'}"`,
      `"${t.shoot_date || ''}"`,
      `"${t.editor || 'Unassigned'}"`,
      `"${t.edit_date || ''}"`,
      `"${t.delivery_date || ''}"`,
      `"${t.upload_date || ''}"`,
      `"${t.status || 'Pending'}"`,
      `"${(t.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hafa_production_report_filtered_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter-Aware Export Excel Helper (Module 4)
  const exportFilteredExcel = () => {
    if (filteredTasks.length === 0) {
      alert("No matching tasks to export for current filter criteria.");
      return;
    }

    let tableHtml = `
      <table border="1">
        <thead>
          <tr style="background-color: #F97316; color: white;">
            <th>ID</th><th>Item Name</th><th>Cameraman</th><th>Shoot Date</th>
            <th>Editor</th><th>Edit Date</th><th>Delivery Date</th><th>Upload Date</th>
            <th>Status</th><th>Remarks</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredTasks.forEach(t => {
      tableHtml += `
        <tr>
          <td>${t.id || ''}</td>
          <td>${t.item_name || ''}</td>
          <td>${t.cameraman || ''}</td>
          <td>${t.shoot_date || ''}</td>
          <td>${t.editor || ''}</td>
          <td>${t.edit_date || ''}</td>
          <td>${t.delivery_date || ''}</td>
          <td>${t.upload_date || ''}</td>
          <td>${t.status || ''}</td>
          <td>${t.remarks || ''}</td>
        </tr>
      `;
    });

    tableHtml += `</tbody></table>`;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hafa_production_report_filtered_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* HEADER BANNER & EXPORT TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 font-extrabold text-[11px] uppercase tracking-wider border border-orange-500/20">
              Operations Ledger
            </span>
            <span className="text-zinc-400 text-xs">• Production Pipeline</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mt-1.5 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-orange-500" />
            <span>Employee Performance & Production Report</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
            Real-time tracking of Cameraman & Editor task turnarounds, shoot pipelines, and delivery schedules.
          </p>
        </div>

        {/* DYNAMIC FILTER-AWARE SPREADSHEET EXPORT TOOLBAR + ASSIGN TASK BUTTON */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={exportFilteredExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold text-xs border border-emerald-500/20 transition-colors flex items-center space-x-1.5"
            title="Export Currently Filtered Dataset to Excel (.xls)"
          >
            <Table className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel ({filteredTasks.length})</span>
          </button>

          <button
            onClick={exportFilteredCSV}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center space-x-1.5"
            title="Export Currently Filtered Dataset to CSV (.csv)"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>Export CSV ({filteredTasks.length})</span>
          </button>

          <a
            href={PDF_EXPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold text-xs border border-rose-500/20 transition-colors flex items-center space-x-1.5"
            title="Export Master Spreadsheet as PDF Document"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Export PDF</span>
          </a>

          <button
            onClick={() => handleOpenAssignModal()}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center space-x-1.5 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-zinc-600 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STICKY TOP FILTER BAR & DATE RANGE PRESETS (MODULE 4) */}
      <div className="sticky top-0 z-20 p-4 rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-md space-y-3">
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

        {/* Search & Staff/Role/Status Inputs */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search project title, cameraman, editor, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <Filter className="w-3.5 h-3.5 text-orange-500" />
              <span>Staff:</span>
              <select
                value={selectedEmployeeFilter}
                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                className="bg-transparent font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer capitalize"
              >
                <option value="ALL">All Staff</option>
                {uniqueStaff.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <span>Role:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-transparent font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="Cameraman">Cameraman</option>
                <option value="Editor">Editor</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <span>Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Shoot Done">Shoot Done</option>
                <option value="Editing">Editing</option>
                <option value="Ready for Review">Ready for Review</option>
                <option value="Uploaded">Uploaded</option>
                <option value="Delivered">Delivered</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Items Processed
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">{kpis.totalProcessed}</span>
            <span className="text-xs font-bold text-zinc-500">Pipeline Projects</span>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">
            <span className="flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-orange-500" /> Shoots: <strong>{kpis.shootCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Edits: <strong>{kpis.editCount}</strong>
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-extrabold text-orange-100 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-4 h-4" /> Top Performer
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              {kpis.topPerformer ? 'Leaderboard #1' : '--'}
            </span>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-2xl font-black capitalize tracking-tight flex items-center space-x-2">
              <span>{kpis.topPerformer ? kpis.topPerformer.name : 'None yet'}</span>
              {kpis.topPerformer && <Flame className="w-5 h-5 text-amber-200 fill-amber-200" />}
            </div>
            <p className="text-xs text-orange-100 font-medium mt-0.5">
              {kpis.topPerformer
                ? `Completed ${kpis.topPerformer.score} high-priority production tasks`
                : 'No completed production tasks recorded'}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-rose-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Pending / Overdue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-rose-600">{kpis.pendingOverdueCount}</span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 text-[10px] font-bold uppercase border border-rose-500/20">
              Action Required
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Avg. Turnaround Time
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">{kpis.avgTurnaround}</span>
            <span className="text-xs font-bold text-zinc-500">
              {kpis.avgTurnaround === '--' ? 'No data' : 'Days / Project'}
            </span>
          </div>
        </div>
      </div>

      {/* LIVE PRODUCTION TASKS GRID */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-4 bg-zinc-950 text-white flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-orange-500" />
              <span className="font-extrabold text-xs tracking-wider uppercase">
                Production Tasks Ledger
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                1-Click Status Quick-Toggles Active
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                Showing {filteredTasks.length} of {tasks.length} items
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="p-4">Item / Project</th>
                  <th className="p-4">Cameraman</th>
                  <th className="p-4">Shoot Date</th>
                  <th className="p-4">Editor</th>
                  <th className="p-4">Edit Date</th>
                  <th className="p-4">Delivery Date</th>
                  <th className="p-4">Upload Date</th>
                  <th className="p-4 text-center">Status Quick-Toggle</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-zinc-400 font-semibold bg-zinc-50 dark:bg-zinc-950">
                      No production tasks match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const isMissingCam = !t.cameraman || t.cameraman === 'Unassigned';
                    const isMissingEd = !t.editor || t.editor === 'Unassigned';
                    const isMissingShootDate = !t.shoot_date;
                    const pillConfig = getStatusPillConfig(t.status);

                    return (
                      <tr key={t.id} className="hover:bg-orange-500/5 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 dark:text-white max-w-[220px]">
                          <div className="truncate" title={t.item_name}>{t.item_name}</div>
                          {t.remarks && (
                            <span className="text-[10px] text-zinc-400 font-normal block truncate max-w-[200px]">
                              {t.remarks}
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold capitalize ${
                            isMissingCam ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 font-extrabold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                          }`}>
                            {t.cameraman || 'Unassigned'}
                          </span>
                        </td>

                        <td className={`p-4 font-mono ${isMissingShootDate ? 'text-rose-500 font-bold' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {t.shoot_date || '—'}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold capitalize ${
                            isMissingEd ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 font-extrabold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                          }`}>
                            {t.editor || 'Unassigned'}
                          </span>
                        </td>

                        <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">{t.edit_date || '—'}</td>
                        <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">{t.delivery_date || '—'}</td>
                        <td className="p-4 font-mono text-zinc-700 dark:text-zinc-300">{t.upload_date || '—'}</td>

                        {/* INTERACTIVE STATUS QUICK-TOGGLE PILL (MODULE 3) */}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(t)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm transition-all transform active:scale-95 flex items-center space-x-1 mx-auto cursor-pointer ${pillConfig.badgeClass}`}
                            title={`Click to quick-toggle status to '${pillConfig.next}'`}
                          >
                            <span>{pillConfig.label}</span>
                            <ArrowRight className="w-3 h-3 text-current opacity-70" />
                          </button>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenAssignModal(t)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors flex items-center space-x-1 ml-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ASSIGN TASK MODAL COMPONENT */}
      <AssignTaskModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onTaskCreated={handleTaskCreated}
        initialTask={editingTask}
      />
    </div>
  );
};
