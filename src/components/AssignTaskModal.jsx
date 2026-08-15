import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { Film, X, Check, RefreshCw, Calendar, User, FileText } from 'lucide-react';

export const AssignTaskModal = ({ isOpen, onClose, onTaskCreated, initialTask = null }) => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    item_name: '',
    cameraman: 'basith',
    shoot_date: new Date().toISOString().split('T')[0],
    editor: 'aslam',
    edit_date: '',
    delivery_date: '',
    upload_date: '',
    status: 'Pending',
    remarks: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployeeRoster();
      if (initialTask) {
        setFormData({
          id: initialTask.id || '',
          item_name: initialTask.item_name || '',
          cameraman: initialTask.cameraman || 'basith',
          shoot_date: initialTask.shoot_date || new Date().toISOString().split('T')[0],
          editor: initialTask.editor || 'aslam',
          edit_date: initialTask.edit_date || '',
          delivery_date: initialTask.delivery_date || '',
          upload_date: initialTask.upload_date || '',
          status: initialTask.status || 'Pending',
          remarks: initialTask.remarks || ''
        });
      } else {
        setFormData({
          id: '',
          item_name: '',
          cameraman: 'basith',
          shoot_date: new Date().toISOString().split('T')[0],
          editor: 'aslam',
          edit_date: '',
          delivery_date: '',
          upload_date: '',
          status: 'Pending',
          remarks: ''
        });
      }
    }
  }, [isOpen, initialTask]);

  const fetchEmployeeRoster = async () => {
    setLoadingEmployees(true);
    try {
      const res = await apiCall('getEmployees');
      if (res?.employees && Array.isArray(res.employees)) {
        setEmployees(res.employees);
      }
    } catch (err) {
      console.warn("[AssignTaskModal] Could not fetch live employee roster:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { ...formData };
      const res = await apiCall('saveProductionTask', payload);

      const savedTask = res?.task || {
        ...payload,
        id: payload.id || `idx_prod_${Date.now()}`
      };

      if (onTaskCreated) {
        onTaskCreated(savedTask);
      }

      onClose();
    } catch (err) {
      alert("Failed to save production task: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // Fallback employee list if API returns empty
  const defaultStaffList = ['basith', 'aslam', 'Harivasan'];
  const staffOptions = employees.length > 0
    ? Array.from(new Set([...employees.map(e => e.full_name || e.email), ...defaultStaffList]))
    : defaultStaffList;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <Film className="w-6 h-6 text-orange-500" />
            <div>
              <h3 className="font-black text-xl text-slate-900">
                {initialTask ? 'Edit Production Task' : 'Assign New Production Task'}
              </h3>
              <p className="text-xs text-slate-500">
                Create a production workflow ledger item for Cameraman & Editor pipeline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Item / Project Title *
            </label>
            <input
              type="text"
              required
              placeholder='e.g., "kannagi kafthan" or "Brand Promo Reel"'
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Cameraman & Shoot Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Assigned Cameraman</span>
                {loadingEmployees && <span className="text-[10px] text-orange-500 font-normal">Loading roster...</span>}
              </label>
              <select
                value={formData.cameraman}
                onChange={(e) => setFormData({ ...formData, cameraman: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none capitalize"
              >
                <option value="Unassigned">Unassigned</option>
                {staffOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shoot Date</label>
              <input
                type="date"
                value={formData.shoot_date}
                onChange={(e) => setFormData({ ...formData, shoot_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Editor & Edit Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Editor</label>
              <select
                value={formData.editor}
                onChange={(e) => setFormData({ ...formData, editor: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none capitalize"
              >
                <option value="Unassigned">Unassigned</option>
                {staffOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Edit Completion Date</label>
              <input
                type="date"
                value={formData.edit_date}
                onChange={(e) => setFormData({ ...formData, edit_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Delivery Date & Upload Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Delivery Date</label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Upload Date (Optional)</label>
              <input
                type="date"
                value={formData.upload_date}
                onChange={(e) => setFormData({ ...formData, upload_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Status & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Workflow Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Shoot Completed">Shoot Completed</option>
                <option value="Editing Completed">Editing Completed</option>
                <option value="Uploaded">Uploaded</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Notes</label>
              <input
                type="text"
                placeholder="e.g. Special kafthan shoot requirements"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
              <span>{submitting ? 'Saving Task...' : initialTask ? 'Update Task' : 'Assign Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
