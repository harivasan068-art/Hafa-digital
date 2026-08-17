import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';
import { UserAvatar, resolveAvatarUrl } from '../components/UserAvatar';
import { 
  User, Camera, Upload, Settings, Save, Phone, Mail, 
  Building, CheckCircle2, Shield, RefreshCw, X, Check, Lock, MapPin
} from 'lucide-react';

export const EmployeeProfileView = () => {
  const { user, updateUser, isAdmin } = useAuth();

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [notification, setNotification] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    department: user?.department || 'Field Operations',
    designation: user?.designation || 'Employee',
    password: '',
    confirm_password: ''
  });

  useEffect(() => {
    const savedAvatar = localStorage.getItem('hafa_admin_avatar');
    if (savedAvatar && user && user.photo !== savedAvatar) {
      if (updateUser) {
        updateUser({ photo: savedAvatar });
      }
    }
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        department: user.department || 'Field Operations',
        designation: user.designation || 'Employee',
        password: '',
        confirm_password: ''
      });
    }
  }, [user]);

  // Handle Photo Base64 upload
  const handlePhotoBase64Upload = async (base64String) => {
    setUploadingPhoto(true);
    try {
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
        message: 'Profile photo updated and saved successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      localStorage.setItem('hafa_admin_avatar', base64String);
      if (updateUser) {
        updateUser({ ...user, photo: base64String });
      }
      setNotification({
        type: 'success',
        message: 'Profile photo saved locally!'
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    if (formData.password && formData.password !== formData.confirm_password) {
      alert("Passwords do not match!");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        id: user?.id,
        employee_id: user?.employee_id,
        full_name: formData.full_name,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        ...(formData.password ? { password: formData.password } : {})
      };

      await apiCall('updateProfile', payload);

      if (updateUser) {
        updateUser({
          ...user,
          full_name: formData.full_name,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation
        });
      }

      setNotification({
        type: 'success',
        message: 'Personal profile details updated successfully!'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      alert("Failed to save profile: " + (err.message || err));
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

      {/* HEADER BANNER */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          
          {/* Avatar Picture */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <UserAvatar user={user} size="xl" className="w-24 h-24 md:w-28 md:h-28 rounded-3xl border-2 border-orange-500/50 shadow-2xl group-hover:opacity-80 transition-opacity" />

            <div className="absolute inset-0 rounded-3xl bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>

            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md animate-pulse" />
          </div>

          {/* Identity details */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-3">
              <h1 className="text-2xl md:text-3xl font-black">{user?.full_name || 'Employee Profile'}</h1>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {isAdmin ? 'ADMIN' : 'EMPLOYEE'}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-start space-x-3 mt-1 text-xs text-slate-400 font-medium">
              <span className="font-mono text-orange-400 font-bold">{user?.employee_id || 'EMP-2026-001'}</span>
              <span>•</span>
              <span>{user?.department || 'Field Operations'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Status
              </span>
            </div>

            {/* Quick Upload Action Links */}
            <div className="flex items-center justify-center sm:justify-start space-x-4 mt-3 text-xs">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-bold border border-orange-500/30 transition-colors flex items-center space-x-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Avatar File</span>
              </button>

              <button
                onClick={handleStartCamera}
                disabled={uploadingPhoto}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-colors flex items-center space-x-1.5"
              >
                <Camera className="w-3.5 h-3.5 text-orange-400" />
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

      {/* EDIT PROFILE FORM */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
          <Settings className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-black text-slate-900">Personal Information & Account Settings</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Contact</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-extrabold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-orange-500" />
              <span>Change Password (Optional)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep existing"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[46px] px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 flex items-center space-x-2 disabled:opacity-50 transition-all"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CAMERA CAPTURE MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 text-center">
            <h3 className="font-extrabold text-lg flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-orange-500" />
              <span>Capture Profile Photo</span>
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
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
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
