import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { apiCall, getGasUrl, setGasUrl } from '../services/api';
import { UserAvatar, resolveAvatarUrl } from '../components/UserAvatar';
import { 
  User, ShieldCheck, Clock, MapPin, CheckCircle2, AlertTriangle, 
  ArrowRight, Radio, ExternalLink, Settings, Save, Lock, Phone, Mail, 
  Building, Bell, RefreshCw, X, Camera, FileSpreadsheet, Users, Check, Shield, Upload
} from 'lucide-react';

export const CommonDashboardView = ({ onNavigate }) => {
  const { user, isAdmin, updateUser } = useAuth();

  // Company Geofence settings
  const [officeSettings, setOfficeSettings] = useState({
    latitude: 13.0853,
    longitude: 80.0179,
    radiusMeters: 200,
    companyName: 'GeoTrack HRMS HQ',
    checkinTime: '09:00 AM',
    shiftRules: 'Standard 9:00 AM - 6:00 PM'
  });

  const { location, distanceMeters, isInsideGeofence } = useGeolocation({
    latitude: officeSettings.latitude,
    longitude: officeSettings.longitude,
    radiusMeters: officeSettings.radiusMeters
  });

  // State management
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Avatar Upload & Camera State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Edit Settings Form State
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formNewPassword, setFormNewPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifPush, setNotifPush] = useState(true);

  // Admin Specific Settings Form State
  const [formLat, setFormLat] = useState(13.0853);
  const [formLng, setFormLng] = useState(80.0179);
  const [formRadius, setFormRadius] = useState(200);
  const [formGasUrl, setFormGasUrl] = useState('');
  const [formCheckinTime, setFormCheckinTime] = useState('09:00 AM');
  const [formShiftRules, setFormShiftRules] = useState('9:00 AM - 6:00 PM (Mon-Fri)');

  const publishedSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJieiTyHLD4AITlgJ9Tv8iKitcrHd1HKorFBIyha8Nro2CJDvIzT7KYmEvcu43wNjrNU03FAkEolYe/pubhtml";

  useEffect(() => {
    if (user) {
      setFormFullName(user.full_name || '');
      setFormPhone(user.phone || '+91 98765 43210');
      setFormDepartment(user.department || 'Field Operations');
      setFormDesignation(user.designation || 'Technician');
      setFormGasUrl(getGasUrl());
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch attendance records
      const attRes = await apiCall('getAttendance');
      let attRecords = [];
      if (Array.isArray(attRes)) attRecords = attRes;
      else if (attRes?.records && Array.isArray(attRes.records)) attRecords = attRes.records;
      else if (attRes?.attendance && Array.isArray(attRes.attendance)) attRecords = attRes.attendance;
      setAttendance(attRecords);

      // 2. If Admin, fetch employee roster and company settings
      if (isAdmin) {
        const empRes = await apiCall('getEmployees');
        if (empRes?.employees && Array.isArray(empRes.employees)) {
          setEmployees(empRes.employees);
        }
      }

      const settingsRes = await apiCall('getSettings');
      if (settingsRes?.settings) {
        const s = settingsRes.settings;
        setOfficeSettings({
          latitude: parseFloat(s.office_latitude || 13.0853),
          longitude: parseFloat(s.office_longitude || 80.0179),
          radiusMeters: parseFloat(s.geofence_radius_meters || 200),
          companyName: s.company_name || 'GeoTrack HRMS HQ',
          checkinTime: s.default_checkin_time || '09:00 AM',
          shiftRules: s.shift_rules || 'Standard 9:00 AM - 6:00 PM'
        });
        setFormLat(parseFloat(s.office_latitude || 13.0853));
        setFormLng(parseFloat(s.office_longitude || 80.0179));
        setFormRadius(parseFloat(s.geofence_radius_meters || 200));
        setFormCheckinTime(s.default_checkin_time || '09:00 AM');
        setFormShiftRules(s.shift_rules || '9:00 AM - 6:00 PM (Mon-Fri)');
      }
    } catch (err) {
      console.error("[GeoTrack Dashboard] Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Avatar Photo Upload Handler (Base64 conversion & API call)
  const handlePhotoBase64Upload = async (base64String) => {
    setUploadingPhoto(true);
    try {
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

      setSaveSuccessMsg("Profile avatar photo updated successfully!");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      alert("Failed to upload profile photo: " + (err.message || err));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle local file selection
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

  // Camera capture modal logic
  const handleStartCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Could not access web camera: " + err.message);
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

  // Save Edit Profile & Settings Form
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccessMsg(null);

    if (formNewPassword && formNewPassword !== formConfirmPassword) {
      alert("Password confirmation does not match!");
      setSavingSettings(false);
      return;
    }

    try {
      // 1. Common User Profile Update
      const profilePayload = {
        id: user?.id,
        employee_id: user?.employee_id,
        full_name: formFullName,
        phone: formPhone,
        department: formDepartment,
        designation: formDesignation,
        ...(formNewPassword ? { password: formNewPassword } : {}),
        notifications: { email: notifEmail, sms: notifSms, push: notifPush }
      };

      await apiCall('updateProfile', profilePayload);

      if (updateUser) {
        updateUser({
          ...user,
          full_name: formFullName,
          phone: formPhone,
          department: formDepartment,
          designation: formDesignation
        });
      }

      // 2. Admin Settings Update
      if (isAdmin) {
        if (formGasUrl) setGasUrl(formGasUrl);

        const settingsPayload = {
          office_latitude: parseFloat(formLat),
          office_longitude: parseFloat(formLng),
          geofence_radius_meters: parseFloat(formRadius),
          default_checkin_time: formCheckinTime,
          shift_rules: formShiftRules
        };

        await apiCall('updateCompanySettings', settingsPayload);

        setOfficeSettings(prev => ({
          ...prev,
          latitude: parseFloat(formLat),
          longitude: parseFloat(formLng),
          radiusMeters: parseFloat(formRadius),
          checkinTime: formCheckinTime,
          shiftRules: formShiftRules
        }));
      }

      setSaveSuccessMsg("Profile and Configuration Settings updated successfully!");
      setTimeout(() => setShowEditModal(false), 1500);
    } catch (err) {
      alert("Failed to save settings: " + (err.message || err));
    } finally {
      setSavingSettings(false);
    }
  };

  // Derived metrics
  const todayStr = new Date().toISOString().split('T')[0];

  // User specific attendance today
  const myTodayRecord = attendance.find(r => 
    String(r.employee_id) === String(user?.employee_id) && 
    (r.date === todayStr || (r.check_in && r.check_in.includes(todayStr)))
  );

  const mySubmissionsToday = attendance.filter(r => 
    String(r.employee_id) === String(user?.employee_id) && 
    (r.date === todayStr || (r.check_in && r.check_in.includes(todayStr)))
  ).length;

  const userRecentLogs = attendance.filter(r => 
    String(r.employee_id) === String(user?.employee_id)
  ).slice(0, 4);

  // Admin Summary Metrics
  const totalStaffCount = employees.length > 0 ? employees.length : 12;
  const presentTodayCount = attendance.filter(r => 
    (r.date === todayStr || (r.check_in && r.check_in.includes(todayStr))) &&
    String(r.status).toLowerCase() === 'present'
  ).length;

  const pendingReviewsCount = attendance.filter(r => 
    String(r.status).toLowerCase() === 'pending'
  ).length;

  const latDisplay = location?.latitude ? location.latitude.toFixed(4) : officeSettings.latitude.toFixed(4);
  const lngDisplay = location?.longitude ? location.longitude.toFixed(4) : officeSettings.longitude.toFixed(4);
  const formattedDistance = distanceMeters !== null ? `${distanceMeters}m` : 'Locating...';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Hidden File Input for Avatar Selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. DYNAMIC USER PROFILE & DETAILS CARD */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 md:p-8 text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* User Avatar + Identity Info */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <UserAvatar user={user} size="xl" className="border-2 border-orange-500/50 shadow-xl group-hover:opacity-80 transition-opacity" />

              {/* Camera Hover Overlay Badge */}
              <div 
                className="absolute inset-0 rounded-2xl bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                title="Change Avatar Photo"
              >
                <Camera className="w-6 h-6 text-white" />
              </div>

              {/* Active Indicator Dot */}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-md animate-pulse" title="Account Status: Active On-Duty" />
            </div>

            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {user?.full_name || 'GeoTrack User'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isAdmin 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}>
                  {isAdmin ? 'ADMINISTRATOR' : 'FIELD EMPLOYEE'}
                </span>
              </div>

              <div className="flex items-center space-x-3 mt-1 text-xs text-slate-400 flex-wrap gap-y-1">
                <span className="font-mono bg-slate-800 text-orange-400 px-2 py-0.5 rounded-md font-bold">
                  {user?.employee_id || 'EMP-2026-001'}
                </span>
                <span>•</span>
                <span>{user?.department || 'Field Operations'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active (On-Duty)
                </span>
              </div>

              {/* Avatar Action Trigger Options */}
              <div className="flex items-center space-x-3 mt-2 text-[11px]">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="text-orange-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={handleStartCamera}
                  disabled={uploadingPhoto}
                  className="text-orange-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" /> Take Camera Photo
                </button>
              </div>
            </div>
          </div>

          {/* Quick Edit Profile Action Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full lg:w-auto min-h-[48px] px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-95 shrink-0"
          >
            <Settings className="w-4 h-4 text-orange-400" />
            <span>Edit Profile & Settings</span>
          </button>
        </div>

        {/* Contact Info & Assigned Zone Grid */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-300">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <Mail className="w-4 h-4 text-orange-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Address</span>
              <span className="font-semibold text-white truncate block">{user?.email || 'user@hafa.com'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone Contact</span>
              <span className="font-semibold text-white block">{user?.phone || '+91 98765 43210'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <Building className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Designation</span>
              <span className="font-semibold text-white block">{user?.designation || 'Field Technician'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Geofence Zone</span>
              <span className="font-semibold text-white block truncate">{officeSettings.companyName} ({officeSettings.radiusMeters}m)</span>
            </div>
          </div>
        </div>

        {/* Work Stats Summary Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <span className="text-slate-300">Today's Check-in Timestamp: </span>
              <strong className="text-white font-bold">
                {myTodayRecord?.check_in 
                  ? (myTodayRecord.check_in.includes('T') ? new Date(myTodayRecord.check_in).toLocaleTimeString() : myTodayRecord.check_in)
                  : 'Not Clocked In Yet'}
              </strong>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div>
              <span className="text-slate-400">Total Submissions Today: </span>
              <strong className="text-orange-400 font-extrabold text-sm">{mySubmissionsToday}</strong>
            </div>
            <div>
              <span className="text-slate-400">GPS Proximity: </span>
              <strong className={isInsideGeofence ? "text-emerald-400 font-extrabold" : "text-amber-400 font-extrabold"}>
                {formattedDistance} ({isInsideGeofence ? 'Inside Zone' : 'Remote'})
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ACTION SHORTCUTS & METRICS SUMMARY SECTION */}
      {isAdmin ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Staff Roster</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{totalStaffCount} Employees</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Active organization users</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Verified Present Today</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{presentTodayCount} Staff</span>
                <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">Approved field dispatches</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending Geotag Reviews</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingReviewsCount} Submissions</span>
                <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">Awaiting HR action</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <span>HR Administrator Quick Actions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigate && onNavigate('performance-report')}
                className="min-h-[52px] p-4 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 font-bold text-xs shadow-sm flex items-center justify-between group transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                  <span>Production Performance Report</span>
                </div>
                <ArrowRight className="w-4 h-4 text-orange-600 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href={publishedSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[52px] p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs shadow-sm flex items-center justify-between group transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Open Google Sheets Ledger</span>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-600" />
              </a>

              <button
                onClick={() => onNavigate && onNavigate('employee-management')}
                className="min-h-[52px] p-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs shadow-sm flex items-center justify-between group transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <Users className="w-5 h-5 text-slate-600" />
                  <span>Manage Employee Roster</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black">Field Site Attendance & Proof Submission</h3>
              <p className="text-xs text-orange-100 mt-1">
                Snap real-time selfie verification and transmit GPS geotagged work proof directly to HR.
              </p>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('attendance')}
              className="w-full sm:w-auto min-h-[52px] px-6 py-3 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-black text-xs shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2 shrink-0"
            >
              <Camera className="w-5 h-5 text-orange-600" />
              <span>Launch Camera & Submit Proof</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Embedded Live Geolocation Radar Map */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span>Live HQ Geofence Radar & Coordinates</span>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 border ${
            isInsideGeofence ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isInsideGeofence ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
            <span>{isInsideGeofence ? 'Inside HQ Zone' : `Remote Site (${formattedDistance})`}</span>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video md:aspect-[21/9]">
          <iframe
            title="Geofence Radar"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://maps.google.com/maps?q=${latDisplay},${lngDisplay}&z=15&output=embed`}
            className="w-full h-full"
          />
          <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[11px] font-mono font-semibold px-3 py-1.5 rounded-full shadow-md">
            Lat: {latDisplay}, Lng: {lngDisplay}
          </div>
        </div>
      </div>

      {/* 3. CAMERA CAPTURE MODAL */}
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

      {/* 4. EDIT PROFILE & SETTINGS MODAL */}
      {showEditModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="relative max-w-2xl w-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-orange-500" />
                <h3 className="font-black text-lg text-slate-900">
                  {isAdmin ? 'Admin & User Settings' : 'Edit Profile & Settings'}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-orange-600 uppercase tracking-wider border-b border-slate-100 pb-1">
                  Personal Information & Preferences
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Contact</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={formNewPassword}
                      onChange={(e) => setFormNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      value={formConfirmPassword}
                      onChange={(e) => setFormConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-extrabold text-purple-700 uppercase tracking-wider border-b border-purple-100 pb-1 flex items-center justify-between">
                    <span>Admin System & Geofence Configurations</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">ADMIN ONLY</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formLat}
                        onChange={(e) => setFormLat(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formLng}
                        onChange={(e) => setFormLng(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Geofence Radius (Meters)</label>
                      <input
                        type="number"
                        value={formRadius}
                        onChange={(e) => setFormRadius(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Google Apps Script Web App Endpoint URL
                    </label>
                    <input
                      type="url"
                      required
                      value={formGasUrl}
                      onChange={(e) => setFormGasUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{savingSettings ? 'Saving Settings...' : 'Save Profile & Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
