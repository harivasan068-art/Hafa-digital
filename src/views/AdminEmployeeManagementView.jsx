import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { Users, UserPlus, Search, Edit3, Trash2, Shield, Phone, Mail, Building, Calendar, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminEmployeeManagementView = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    joining_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const res = await apiCall('getEmployees');
    if (res.success && res.employees) {
      setEmployees(res.employees);
    }
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      department: 'Engineering',
      designation: 'Software Engineer',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      joining_date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setFormData({
      full_name: emp.full_name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Engineering',
      designation: emp.designation || 'Software Engineer',
      role: emp.role || 'EMPLOYEE',
      status: emp.status || 'ACTIVE',
      joining_date: emp.joining_date || new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const action = editingEmp ? 'updateEmployee' : 'createEmployee';
    const payload = editingEmp ? { id: editingEmp.id, employee_id: editingEmp.employee_id, ...formData } : formData;

    const res = await apiCall(action, payload);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setShowModal(false);
      await loadEmployees();
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Action failed.' });
    }
    setLoading(false);
  };

  const handleDelete = async (id, empId) => {
    if (!window.confirm(`Are you sure you want to delete employee record ${empId}?`)) return;
    setLoading(true);
    const res = await apiCall('deleteEmployee', { id, employee_id: empId });
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Employee record deleted.' });
      await loadEmployees();
    }
    setLoading(false);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      (emp.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  const departments = ['ALL', 'Management', 'Engineering', 'Design', 'Sales', 'HR'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-700/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 font-semibold text-xs tracking-wider uppercase">
            <Users className="w-4 h-4" />
            <span>Human Resource Directory</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Staff & Employee Management</h2>
          <p className="text-xs text-slate-400">
            Create staff accounts, assign roles, and manage employee master records.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-glow transition-all flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs border font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium">Department:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                departmentFilter === dept
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {dept}
            </button>
          ))}

          <button onClick={loadEmployees} className="p-2 text-slate-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="p-5 rounded-2xl glass-card border border-slate-700/60 relative group hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={emp.photo && !emp.photo.includes('unsplash') ? emp.photo : "/logo.png"}
                  alt={emp.full_name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
                />
                <div>
                  <h3 className="font-bold text-white text-sm">{emp.full_name}</h3>
                  <span className="text-[11px] text-brand-400 font-medium block">{emp.designation}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{emp.employee_id}</span>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                emp.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
              }`}>
                {emp.role}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center space-x-2 text-slate-400">
                <Mail className="w-3.5 h-3.5" />
                <span className="text-slate-200">{emp.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Phone className="w-3.5 h-3.5" />
                <span>{emp.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Building className="w-3.5 h-3.5" />
                <span>Dept: <strong className="text-white">{emp.department}</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleOpenEdit(emp)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Edit Employee Details"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(emp.id, emp.employee_id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Delete Employee Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">
                {editingEmp ? `Edit Record (${editingEmp.employee_id})` : 'Create New Employee Record'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@geotrack.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl glass-input"
                  >
                    <option value="Engineering" className="bg-slate-900">Engineering</option>
                    <option value="Management" className="bg-slate-900">Management</option>
                    <option value="Design" className="bg-slate-900">Design</option>
                    <option value="Sales" className="bg-slate-900">Sales</option>
                    <option value="HR" className="bg-slate-900">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">User Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl glass-input"
                  >
                    <option value="EMPLOYEE" className="bg-slate-900">EMPLOYEE</option>
                    <option value="ADMIN" className="bg-slate-900">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl glass-input"
                  >
                    <option value="ACTIVE" className="bg-slate-900">ACTIVE</option>
                    <option value="INACTIVE" className="bg-slate-900">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-glow"
                >
                  {loading ? 'Saving...' : (editingEmp ? 'Update Record' : 'Save & Create Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
