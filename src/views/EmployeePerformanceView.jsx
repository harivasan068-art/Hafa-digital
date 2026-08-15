import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';
import { 
  TrendingUp, Film, CheckCircle2, Clock, Award, 
  Search, Filter, RefreshCw, AlertTriangle, FileSpreadsheet, Calendar
} from 'lucide-react';

const MOCK_TASKS = [
  {
    id: 'idx_prod_101',
    item_name: 'Client Promo Reel - Hafa Digital',
    cameraman: 'basith',
    shoot_date: '2026-08-01',
    editor: 'aslam',
    edit_date: '2026-08-03',
    delivery_date: '2026-08-04',
    upload_date: '2026-08-05',
    status: 'Delivered',
    remarks: 'Client approved v2 edit with zero revisions.'
  },
  {
    id: 'idx_prod_102',
    item_name: 'Product Launch Teaser',
    cameraman: 'Harivasan',
    shoot_date: '2026-08-05',
    editor: 'basith',
    edit_date: '2026-08-07',
    delivery_date: '2026-08-08',
    upload_date: '2026-08-09',
    status: 'Uploaded',
    remarks: 'Uploaded to YouTube (4K) & Instagram Reels.'
  },
  {
    id: 'idx_prod_103',
    item_name: 'Corporate HQ Tour Video',
    cameraman: 'aslam',
    shoot_date: '2026-08-10',
    editor: 'Harivasan',
    edit_date: '2026-08-12',
    delivery_date: '2026-08-14',
    upload_date: '',
    status: 'Editing Completed',
    remarks: 'Color grading finalized, awaiting upload approval.'
  },
  {
    id: 'idx_prod_104',
    item_name: 'HR Training Video Series #2',
    cameraman: 'basith',
    shoot_date: '2026-08-13',
    editor: 'aslam',
    edit_date: '',
    delivery_date: '',
    upload_date: '',
    status: 'In Progress',
    remarks: 'A-roll shot; pending B-roll overlay editing.'
  },
  {
    id: 'idx_prod_105',
    item_name: 'Customer Testimonial - Tech Corp',
    cameraman: 'Harivasan',
    shoot_date: '',
    editor: 'Harivasan',
    edit_date: '',
    delivery_date: '',
    upload_date: '',
    status: 'Pending',
    remarks: 'Awaiting client location scheduling.'
  }
];

export const EmployeePerformanceView = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiCall('getProductionTasks');
      if (res?.tasks && Array.isArray(res.tasks) && res.tasks.length > 0) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.warn("[Employee Performance] Using local fallback tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const myName = (user?.full_name || 'Harivasan').toLowerCase();

  // Filter tasks assigned to logged-in user
  const myAssignedTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isCam = String(t.cameraman || '').toLowerCase().includes(myName) || String(t.cameraman || '').toLowerCase() === myName;
      const isEd = String(t.editor || '').toLowerCase().includes(myName) || String(t.editor || '').toLowerCase() === myName;
      return isCam || isEd;
    });
  }, [tasks, myName]);

  // Compute Personal Metrics
  const metrics = useMemo(() => {
    const total = myAssignedTasks.length > 0 ? myAssignedTasks.length : 3;

    const completed = myAssignedTasks.filter((t) => 
      ['delivered', 'uploaded', 'editing completed'].includes(String(t.status || '').toLowerCase())
    ).length;

    const pending = myAssignedTasks.filter((t) => 
      ['pending', 'in progress'].includes(String(t.status || '').toLowerCase())
    ).length;

    const score = total > 0 ? Math.round((completed / total) * 100) : 100;

    return {
      total,
      completed,
      pending,
      score
    };
  }, [myAssignedTasks]);

  // Filtered List for Table
  const filteredMyTasks = useMemo(() => {
    return myAssignedTasks.filter((t) => {
      const matchesSearch = !searchTerm || t.item_name.toLowerCase().includes(searchTerm.toLowerCase());
      const isCam = String(t.cameraman || '').toLowerCase().includes(myName);
      const isEd = String(t.editor || '').toLowerCase().includes(myName);

      const matchesRole = 
        selectedRoleFilter === 'ALL' ||
        (selectedRoleFilter === 'Cameraman' && isCam) ||
        (selectedRoleFilter === 'Editor' && isEd);

      return matchesSearch && matchesRole;
    });
  }, [myAssignedTasks, searchTerm, selectedRoleFilter, myName]);

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'delivered') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s === 'uploaded') return 'bg-teal-100 text-teal-800 border-teal-300';
    if (s === 'editing completed') return 'bg-purple-100 text-purple-800 border-purple-300';
    if (s === 'shoot completed') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (s === 'in progress') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-extrabold text-[11px] uppercase tracking-wider border border-orange-200">
              Personal Performance Dashboard
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-orange-500" />
            <span>My Production & Task Performance</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track your assigned shoot & editing tasks, completion rate, and turnarounds.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          disabled={loading}
          className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border border-slate-200 flex items-center space-x-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Tasks Assigned</span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-xs font-bold text-slate-500">Assigned Items</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Completed Tasks</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-emerald-600">{metrics.completed}</span>
            <span className="text-xs font-bold text-emerald-700">Delivered / Uploaded</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">Pending / In-Progress</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-600">{metrics.pending}</span>
            <span className="text-xs font-bold text-amber-700">Active Workflow</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-orange-100 uppercase tracking-wider">Completion Score</span>
            <Award className="w-6 h-6 text-white" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black">{metrics.score}%</span>
            <span className="text-xs font-bold text-orange-100">Efficiency</span>
          </div>
        </div>
      </div>

      {/* ASSIGNED TASKS GRID */}
      <div className="space-y-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search my assigned tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-2xl border border-slate-200 shrink-0">
            <Filter className="w-3.5 h-3.5 text-orange-500" />
            <span>My Role:</span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="Cameraman">Cameraman</option>
              <option value="Editor">Editor</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-orange-400" />
              <span className="font-extrabold text-xs uppercase">My Assigned Production Workflow Items</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Showing {filteredMyTasks.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Item / Project</th>
                  <th className="p-4">My Role</th>
                  <th className="p-4">Shoot Date</th>
                  <th className="p-4">Edit Date</th>
                  <th className="p-4">Delivery Date</th>
                  <th className="p-4">Upload Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-medium">
                {filteredMyTasks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-semibold bg-slate-50">
                      No tasks currently assigned to your account.
                    </td>
                  </tr>
                ) : (
                  filteredMyTasks.map((t) => {
                    const isCam = String(t.cameraman || '').toLowerCase().includes(myName);
                    const isEd = String(t.editor || '').toLowerCase().includes(myName);
                    const roleLabel = isCam && isEd ? 'Cameraman & Editor' : isCam ? 'Cameraman' : 'Editor';

                    return (
                      <tr key={t.id} className="hover:bg-orange-50/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{t.item_name}</td>
                        <td className="p-4 font-bold text-orange-600">{roleLabel}</td>
                        <td className="p-4 font-mono text-slate-700">{t.shoot_date || '—'}</td>
                        <td className="p-4 font-mono text-slate-700">{t.edit_date || '—'}</td>
                        <td className="p-4 font-mono text-slate-700">{t.delivery_date || '—'}</td>
                        <td className="p-4 font-mono text-slate-700">{t.upload_date || '—'}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 max-w-xs truncate">{t.remarks || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
