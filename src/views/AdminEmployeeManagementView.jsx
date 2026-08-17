import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { createEmployeeAuthAccount } from '../services/firebase';
import { 
  Users, UserPlus, Search, Edit3, Trash2, Shield, Phone, Mail, 
  Building, Calendar, CheckCircle2, RefreshCw, Eye, EyeOff, Lock, KeyRound 
} from 'lucide-react';

export const AdminEmployeeManagementView = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    joining_date: new Date().toISOString().split('T')[0],
    password: ''
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
    setShowPassword(false);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      department: 'Engineering',
      designation: 'Software Engineer',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      joining_date: new Date().toISOString().split('T')[0],
      password: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setShowPassword(false);
    setFormData({
      full_name: emp.full_name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Engineering',
      designation: emp.designation || 'Software Engineer',
      role: emp.role || 'EMPLOYEE',
      status: emp.status || 'ACTIVE',
      joining_date: emp.joining_date || new Date().toISOString().split('T')[0],
      password: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      let firebaseUid = null;

      // 1. If creating a NEW employee record, create Firebase Auth credentials via Secondary App Instance
      if (!editingEmp) {
        if (!formData.password || formData.password.trim().length < 6) {
          setStatusMessage({
            type: 'error',
            text: 'Initial Password is required and must be at least 6 characters.'
          });
          setLoading(false);
          return;
        }

        // Create account in Firebase Auth using Secondary App Instance (Admin remains signed in!)
        const authResult = await createEmployeeAuthAccount(formData.email.trim(), formData.password.trim());
        firebaseUid = authResult.uid;
      }

      // 2. Save/Update Employee Record in Database (GAS / Firestore / Local State)
      const action = editingEmp ? 'updateEmployee' : 'createEmployee';
      const payload = editingEmp 
        ? { id: editingEmp.id, employee_id: editingEmp.employee_id, ...formData }
        : { ...formData, uid: firebaseUid };

      const res = await apiCall(action, payload);

      if (res.success || res.status === 'success' || !res.error) {
        const successNotice = editingEmp
          ? `Employee record for ${formData.full_name} updated successfully.`
          : `🎉 New Employee Account Created! Login Email: ${formData.email} | Assigned Password: ${formData.password}`;

        setStatusMessage({ type: 'success', text: successNotice });
        setShowModal(false);
        await loadEmployees();
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Action failed.' });
      }
    } catch (err) {
      console.error('[Employee Creation Error]', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to create employee credentials in Firebase Auth.'
      });
    } finally {
      setLoading(false);
    }
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
            Create staff accounts, assign initial login passwords, and manage employee records.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-glow transition-all flex items-center space-x-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs border font-bold flex items-center justify-between gap-2 shadow-md ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100 font-bold ml-2">✕</button>
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
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                departmentFilter === dept
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {dept}
            </button>
          ))}

          <button onClick={loadEmployees} className="p-2 text-slate-400 hover:text-white cursor-pointer">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit Employee Details"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(emp.id, emp.employee_id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-brand-400" />
                <h3 className="font-bold text-base text-white">
                  {editingEmp ? `Edit Record (${editingEmp.employee_id})` : 'Create New Employee Record'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@geotrack.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              {/* Password Input Field with Eye / EyeOff Toggle */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>{editingEmp ? 'Change Password (Optional)' : 'Temporary / Initial Password *'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">Min 6 characters</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingEmp}
                    minLength={6}
                    placeholder={editingEmp ? "Leave blank to keep existing password..." : "Assign initial login password..."}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl glass-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  >
                    <option value="Engineering" className="bg-slate-900">Engineering</option>
                    <option value="Management" className="bg-slate-900">Management</option>
                    <option value="Design" className="bg-slate-900">Design</option>
                    <option value="Sales" className="bg-slate-900">Sales</option>
                    <option value="HR" className="bg-slate-900">HR</option>
                    <option value="Field Operations" className="bg-slate-900">Field Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Field Technician"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">User Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
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
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input"
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
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-glow cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (editingEmp ? 'Update Record' : 'Create Employee Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
