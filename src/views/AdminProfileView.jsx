import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall, getGasUrl, setGasUrl } from '../services/api';
import { 
  ShieldCheck, Camera, Upload, Settings, Save, Phone, Mail, 
  Building, CheckCircle2, Shield, RefreshCw, X, Check, Lock, MapPin, Globe
} from 'lucide-react';

const resolveAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return trimmed;
};

export const AdminProfileView = () => {
  const { user, updateUser } = useAuth();

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [notification, setNotification] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Form State for Admin Profile & System Configurations
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    department: user?.department || 'Executive Board',
    password: '',
    confirm_password: '',
    gas_url: getGasUrl(),
    office_latitude: 13.0853,
    office_longitude: 80.0179,
    geofence_radius_meters: 200
  });

  useEffect(() => {
    const savedAvatar = localStorage.getItem('hafa_admin_avatar');
    if (savedAvatar && user && user.photo !== savedAvatar) {
      if (updateUser) {
        updateUser({ photo: savedAvatar });
      }
    }
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || '',
        department: user.department || 'Executive Board',
        gas_url: getGasUrl()
      }));
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const res = await apiCall('getSettings');
      if (res?.settings) {
        setFormData(prev => ({
          ...prev,
          office_latitude: parseFloat(res.settings.office_latitude || 13.0853),
          office_longitude: parseFloat(res.settings.office_longitude || 80.0179),
          geofence_radius_meters: parseFloat(res.settings.geofence_radius_meters || 200)
        }));
      }
    } catch (err) {
      console.warn("[AdminProfileView] Using default geofence settings:", err);
    }
  };

  const handlePhotoBase64Upload = async (base64String) => {
    setUploadingPhoto(true);
    try {
      // Instantly persist custom photo in localStorage
      localStorage.setItem('hafa_admin_avatar', base64String);

      const payload = {
        id: user?.id,
        employee_id: user?.employee_id,
        photo_base64: base64String
      };

      const res = await apiCall('updateProfilePhoto', payload);
      const newPhotoUrl = res?.photo_url || base64String;

      if (updateUser) {
        updateUser({
          ...user,
          photo: newPhotoUrl
        });
      }

      setNotification({
        type: 'success',
        message: 'Admin profile avatar updated and persisted successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      // Even if API fails, maintain local state & storage persistence
      localStorage.setItem('hafa_admin_avatar', base64String);
      if (updateUser) {
        updateUser({ ...user, photo: base64String });
      }
      setNotification({
        type: 'success',
        message: 'Admin profile photo saved locally!'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handlePhotoBase64Upload(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Could not access camera: " + err.message);
      setShowCameraModal(false);
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const handleCaptureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    handleStopCamera();
    handlePhotoBase64Upload(dataUrl);
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    if (formData.password && formData.password !== formData.confirm_password) {
      alert("Admin passwords do not match!");
      setSaving(false);
      return;
    }

    try {
      // 1. Update Admin Personal Details
      const profilePayload = {
        id: user?.id,
        employee_id: user?.employee_id,
        full_name: formData.full_name,
        phone: formData.phone,
        department: formData.department,
        ...(formData.password ? { password: formData.password } : {})
      };

      await apiCall('updateProfile', profilePayload);

      if (updateUser) {
        updateUser({
          ...user,
          full_name: formData.full_name,
          phone: formData.phone,
          department: formData.department
        });
      }

      // 2. Update Global System Configurations
      if (formData.gas_url) {
        setGasUrl(formData.gas_url);
      }

      const settingsPayload = {
        office_latitude: parseFloat(formData.office_latitude),
        office_longitude: parseFloat(formData.office_longitude),
        geofence_radius_meters: parseFloat(formData.geofence_radius_meters)
      };

      await apiCall('updateCompanySettings', settingsPayload);

      setNotification({
        type: 'success',
        message: 'Admin Profile & System Settings saved successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      alert("Failed to save admin profile: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ADMIN PROFILE BANNER */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          
          {/* Avatar Picture */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {user?.photo && !user.photo.includes('unsplash') ? (
              <img 
                src={resolveAvatarUrl(user.photo)} 
                alt={user.full_name} 
                className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-cover border-2 border-purple-500/50 shadow-2xl group-hover:opacity-80 transition-opacity"
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
              />
            ) : (
              <img 
                src="/logo.png" 
                alt={user?.full_name || 'Admin'} 
                className="w-24 h-24 md:w-28 md:h-28 rounded-3xl object-contain bg-slate-800 p-2 border-2 border-purple-500/50 shadow-2xl group-hover:opacity-80 transition-opacity"
              />
            )}

            <div className="absolute inset-0 rounded-3xl bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>

            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 border-2 border-slate-900 shadow-md animate-pulse" />
          </div>

          {/* Identity details */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-3">
              <h1 className="text-2xl md:text-3xl font-black">{user?.full_name || 'HR Administrator'}</h1>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                SYSTEM ADMINISTRATOR
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start space-x-3 mt-1 text-xs text-slate-400 font-medium">
              <span className="font-mono text-purple-400 font-bold">{user?.employee_id || 'ADM-2026-001'}</span>
              <span>•</span>
              <span>{user?.email || 'admin@hafa.com'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Full Access Enabled
              </span>
            </div>

            {/* Quick Upload Buttons */}
            <div className="flex items-center justify-center sm:justify-start space-x-4 mt-3 text-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold border border-purple-500/30 transition-colors flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Avatar File</span>
              </button>

              <button
                onClick={handleStartCamera}
                disabled={uploadingPhoto}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-colors flex items-center space-x-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Camera Snap</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* EDIT ADMIN DETAILS & HQ CONFIG FORM */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
          <Shield className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-black text-slate-900">Admin Account & System Configurations</h2>
        </div>

        <form onSubmit={handleSaveAdminProfile} className="space-y-6">
          
          {/* Section 1: Admin Personal Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              1. Admin Identity & Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Security */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password Reset</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Admin Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Global System & Geofence Configurations */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-extrabold text-purple-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>2. Global System & Geofence Headquarters Configurations</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black">ADMIN CONTROL</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Google Apps Script Web App Endpoint URL
              </label>
              <input
                type="url"
                required
                value={formData.gas_url}
                onChange={(e) => setFormData({ ...formData, gas_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target HQ Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.office_latitude}
                  onChange={(e) => setFormData({ ...formData, office_latitude: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target HQ Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.office_longitude}
                  onChange={(e) => setFormData({ ...formData, office_longitude: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Radius (Meters)</label>
                <input
                  type="number"
                  value={formData.geofence_radius_meters}
                  onChange={(e) => setFormData({ ...formData, geofence_radius_meters: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[46px] px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/20 flex items-center space-x-2 disabled:opacity-50 transition-all"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving Configurations...' : 'Save Admin Profile & System Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CAMERA CAPTURE MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 text-center">
            <h3 className="font-extrabold text-lg flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              <span>Capture Admin Avatar Photo</span>
            </h3>

            <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-slate-800">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={handleStopCamera}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>

              <button
                onClick={handleCaptureCameraPhoto}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20"
              >
                Snap & Save Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
