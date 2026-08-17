import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { CameraModal } from '../components/CameraModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { apiCall } from '../services/api';
import { compressImage } from '../utils/mediaUtils';
import { saveToOfflineQueue, getOfflineQueue, syncOfflineQueue } from '../services/offlineSync';
import { 
  MapPin, Camera, CheckCircle2, AlertTriangle, Calendar, RefreshCw, 
  ArrowUpRight, Upload, ExternalLink, Navigation, Send, Image as ImageIcon, Radio, Check, Eye, User, WifiOff, Zap, Target, Building
} from 'lucide-react';

/**
 * Normalizes image URLs to ensure Google Drive files render properly in standard <img> tags.
 */
export const getDirectImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:image/')) return trimmed;

  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('googleusercontent.com') ||
    trimmed.includes('docs.google.com')
  ) {
    const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${dMatch[1]}&sz=w1000`;
    }
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }
  }
  return trimmed;
};

/**
 * Robust extraction helper for attendance API responses
 */
const extractAttendanceRecords = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (typeof res === 'string') {
    try { return extractAttendanceRecords(JSON.parse(res)); } catch (e) { return []; }
  }
  if (typeof res === 'object') {
    if (Array.isArray(res.records)) return res.records;
    if (Array.isArray(res.attendance)) return res.attendance;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
  }
  return [];
};

export const EmployeeAttendanceView = () => {
  const { user } = useAuth();

  // Office Headquarters Coordinates & Geofence Boundary Config
  const [officeSettings, setOfficeSettings] = useState({
    latitude: 13.0853,
    longitude: 80.0179,
    radiusMeters: 200
  });

  const { 
    location, 
    loading: geoLoading, 
    distanceMeters, 
    isInsideGeofence, 
    refreshLocation, 
    setSimulatedLocation 
  } = useGeolocation(officeSettings);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [fieldDispatches, setFieldDispatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [lightboxTitle, setLightboxTitle] = useState('Dispatch Inspection');

  // Form State
  const [selfieBase64, setSelfieBase64] = useState('');
  const [proofBase64, setProofBase64] = useState('');
  const [siteRemarks, setSiteRemarks] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [lastPingTime, setLastPingTime] = useState(null);

  // Shoot & Production Metadata State
  const [shopName, setShopName] = useState('');
  const [productModel, setProductModel] = useState('');
  const [cameraman, setCameraman] = useState('');
  const [editor, setEditor] = useState('');

  // Offline Sync State
  const [offlineQueueCount, setOfflineQueueCount] = useState(getOfflineQueue().length);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Digital Clock & Offline Status Listeners
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const updateOfflineStatus = () => {
      setOfflineQueueCount(getOfflineQueue().length);
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
    window.addEventListener('hafa_queue_updated', updateOfflineStatus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', updateOfflineStatus);
      window.removeEventListener('offline', updateOfflineStatus);
      window.removeEventListener('hafa_queue_updated', updateOfflineStatus);
    };
  }, []);

  // Fetch Office Settings & Today's Field Dispatches
  useEffect(() => {
    loadSettings();
    loadDispatches();
  }, [user]);

  // Continuous Silent Background GPS Tracking (Every 2 Minutes)
  useEffect(() => {
    if (!user) return;

    const transmitQuietLocationPing = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const res = await apiCall('updateLocation', {
            employee_id: user.employee_id,
            latitude: lat,
            longitude: lng
          });

          if (res.success) {
            setLastPingTime(new Date().toLocaleTimeString());
          }
        },
        (err) => {
          console.warn('[GeoTrack Mobile] GPS sync warning:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    transmitQuietLocationPing();
    const trackingInterval = setInterval(transmitQuietLocationPing, 120000);

    return () => clearInterval(trackingInterval);
  }, [user]);

  const loadSettings = async () => {
    const res = await apiCall('getSettings');
    if (res && res.settings) {
      setOfficeSettings({
        latitude: parseFloat(res.settings.office_latitude || 13.0853),
        longitude: parseFloat(res.settings.office_longitude || 80.0179),
        radiusMeters: parseFloat(res.settings.geofence_radius_meters || 200)
      });
    }
  };

  const loadDispatches = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const res = await apiCall('getAttendance', { employee_id: user.employee_id });
      const records = extractAttendanceRecords(res);
      setFieldDispatches(records);
    } catch (e) {
      console.error("[GeoTrack Mobile] Failed to load field dispatches:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Trigger Device Haptic Feedback Helper
  const triggerHapticFeedback = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch (err) {
      console.warn("Haptic vibration error:", err);
    }
  };

  // Handle Selfie Captured from CameraModal (Compressed client-side < 350KB)
  const handleSelfieCaptured = async (base64Image) => {
    try {
      const compressed = await compressImage(base64Image, 1000, 0.7);
      setSelfieBase64(compressed);
    } catch (err) {
      console.warn("Selfie compression fallback:", err);
      setSelfieBase64(base64Image);
    }
  };

  // Handle Attachment of Work Proof Image File (Compressed client-side < 350KB)
  const handleProofFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result, 1000, 0.7);
          setProofBase64(compressed);
        } catch (err) {
          console.warn("Proof image compression fallback:", err);
          setProofBase64(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Field Site Location & Proof Submission Handler (With Haptic Feedback & Offline Fallback)
  const handleSubmitFieldDispatch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user) return;

    if (!selfieBase64) {
      setStatusMessage({ type: 'error', text: 'Geotag Selfie is required! Tap "Take Live Geotag Selfie" before submitting.' });
      return;
    }

    // Trigger Mobile Device Haptic Vibration Feedback
    triggerHapticFeedback();

    // GPS Accuracy Validation (>50m Warning)
    if (location?.accuracy && location.accuracy > 50) {
      console.warn(`[GPS Accuracy Warning] Accuracy is ${location.accuracy}m (> 50m target threshold).`);
    }

    setLoading(true);
    setStatusMessage(null);

    const latVal = location?.latitude || officeSettings.latitude;
    const lngVal = location?.longitude || officeSettings.longitude;

    const payload = {
      action: 'clockIn',
      employee_id: user.employee_id,
      employee_name: user.full_name || user.name || user.employee_id,
      latitude: latVal,
      longitude: lngVal,
      photo_base64: selfieBase64,
      selfie_image: selfieBase64,
      photo_url: selfieBase64,
      proof_base64: proofBase64,
      proof_image: proofBase64,
      proof_photo: proofBase64,
      proof_url: proofBase64,
      shop_name: shopName,
      client_name: shopName,
      product_model: productModel,
      shoot_item: productModel,
      camera_man: cameraman,
      cameraman: cameraman,
      editor: editor,
      remarks: siteRemarks || `Field Site Dispatch (${shopName || 'Client Site'} - ${productModel || 'Production'})`,
      location_name: shopName || (isInsideGeofence ? "Main Office HQ" : "On-Field Client Location"),
      address: `Lat: ${latVal.toFixed(4)}, Lng: ${lngVal.toFixed(4)}`
    };

    const resetFormFields = () => {
      setSelfieBase64('');
      setProofBase64('');
      setSiteRemarks('');
      setShopName('');
      setProductModel('');
      setCameraman('');
      setEditor('');
    };

    // Check Offline state or network outage
    if (!navigator.onLine) {
      saveToOfflineQueue({ action: 'clockIn', data: payload });
      setStatusMessage({ 
        type: 'amber', 
        text: 'Offline: Submission saved locally. Will auto-sync when online.' 
      });
      resetFormFields();
      setOfflineQueueCount(getOfflineQueue().length);
      setLoading(false);
      return;
    }

    // If work proof base64 is present, also trigger submitWorkProof
    if (proofBase64) {
      try {
        await apiCall('submitWorkProof', {
          employee_id: user.employee_id,
          proof_image: proofBase64,
          proof_base64: proofBase64,
          shop_name: shopName,
          product_model: productModel,
          camera_man: cameraman,
          cameraman: cameraman,
          editor: editor,
          remarks: siteRemarks || "Work proof attached"
        });
      } catch (err) {
        console.warn("submitWorkProof fallback handled:", err);
      }
    }

    // If product model or shop name provided, also sync directly to Production Tasks Pipeline
    if (productModel || shopName) {
      try {
        await apiCall('saveProductionTask', {
          item_name: productModel ? `${shopName ? shopName + ' - ' : ''}${productModel}` : shopName,
          shop_name: shopName,
          product_model: productModel,
          camera_man: cameraman || user.full_name || 'Basith',
          cameraman: cameraman || user.full_name || 'Basith',
          editor: editor || 'Basith',
          shoot_date: new Date().toISOString().split('T')[0],
          status: 'Shoot Done',
          remarks: siteRemarks || 'Field Attendance Submission'
        });
      } catch (err) {
        console.warn('saveProductionTask sync handled:', err);
      }
    }

    const res = await apiCall('clockIn', payload);

    if (res.success || res.status === 'success' || !res.error) {
      setStatusMessage({ type: 'success', text: 'Field site location, metadata & image proof submitted successfully to HR Master Sheet!' });
      resetFormFields();
      await loadDispatches(false);
    } else {
      // If error caused by network dropout, save to offline queue
      if (!navigator.onLine || (res.error && res.error.includes('Network'))) {
        saveToOfflineQueue({ action: 'clockIn', data: payload });
        setStatusMessage({ 
          type: 'amber', 
          text: 'Offline: Submission saved locally. Will auto-sync when online.' 
        });
        resetFormFields();
        setOfflineQueueCount(getOfflineQueue().length);
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Dispatch submission failed.' });
      }
    }
    setLoading(false);
  };

  const openLightbox = (url, title) => {
    if (!url) return;
    setSelectedPhoto(url);
    setLightboxTitle(title || 'Inspection Preview');
  };

  const latDisplay = location?.latitude ? location.latitude.toFixed(4) : '13.0853';
  const lngDisplay = location?.longitude ? location.longitude.toFixed(4) : '80.0179';
  const formattedDistance = distanceMeters !== null ? `${distanceMeters}m` : 'Calculating...';

  return (
    <div className="px-2 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-28 md:pb-12 text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Offline Queue Amber Banner */}
      {(!isOnline || offlineQueueCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Offline Mode Active ({offlineQueueCount} queued submission{offlineQueueCount !== 1 ? 's' : ''})
              </h4>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mt-0.5">
                Offline: Submission saved locally. Will auto-sync when online.
              </p>
            </div>
          </div>
          {isOnline && offlineQueueCount > 0 && (
            <button
              onClick={async () => {
                const result = await syncOfflineQueue();
                setOfflineQueueCount(getOfflineQueue().length);
                if (result.syncedCount > 0) {
                  await loadDispatches(false);
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Sync Now ({offlineQueueCount})</span>
            </button>
          )}
        </div>
      )}

      {/* GPS Accuracy Warning Alert (>50 meters) */}
      {location?.accuracy && location.accuracy > 50 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center space-x-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span>GPS Accuracy is low ({Math.round(location.accuracy)} meters).</span>
            <span className="font-normal block text-[11px] text-amber-700 dark:text-amber-300">
              Please step outdoors or into open air for an accurate satellite lock.
            </span>
          </div>
        </div>
      )}

      {/* Header & User Info Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
        <div>
          <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 font-semibold text-xs tracking-wider uppercase">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>{currentTime.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            {currentTime.toLocaleTimeString()}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Mobile Field Account: <strong className="text-slate-900 dark:text-white font-semibold">{user?.full_name || 'Field Worker'}</strong> ({user?.employee_id || 'EMP-MOBILE'})
            {lastPingTime && <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-2">(GPS Ping: {lastPingTime})</span>}
          </p>
        </div>

        <button
          onClick={() => loadDispatches(false)}
          disabled={loading}
          className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors border border-slate-300 dark:border-zinc-700 flex items-center justify-center space-x-2 self-start md:self-auto w-full md:w-auto cursor-pointer"
          title="Refresh Field History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          <span>Sync Latest Records</span>
        </button>
      </div>

      {/* GPS Location Simulator Controls Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900 dark:bg-zinc-950 text-white text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm border border-slate-800">
        <div className="flex items-center space-x-2 text-slate-300">
          <Navigation className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="font-semibold">GPS Boundary Simulator:</span>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSimulatedLocation(officeSettings.latitude, officeSettings.longitude)}
            className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold cursor-pointer"
          >
            Simulate Inside HQ (0m)
          </button>
          <button
            type="button"
            onClick={() => setSimulatedLocation(officeSettings.latitude + 0.05, officeSettings.longitude + 0.05)}
            className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 text-[11px] font-bold cursor-pointer"
          >
            Simulate Client Site (5.8km)
          </button>
        </div>
      </div>

      {/* REAL-TIME GEOFENCE PROXIMITY PULSE RADAR WIDGET */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {/* Pulsing Concentric Radar Rings Widget */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${isInsideGeofence ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              <div className={`absolute w-9 h-9 rounded-full animate-pulse opacity-40 ${isInsideGeofence ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              <div className={`relative w-7 h-7 rounded-full flex items-center justify-center text-white font-bold shadow-md ${isInsideGeofence ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                <Target className="w-4 h-4 animate-spin-slow" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Geofence Proximity Radar</span>
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">({officeSettings.radiusMeters}m HQ Radius)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isInsideGeofence 
                  ? `IN RANGE: ${formattedDistance} from HQ Center` 
                  : `REMOTE CLIENT SITE: ${formattedDistance} from HQ Center`}
              </p>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center space-x-2 border transition-all self-start sm:self-auto ${
            isInsideGeofence 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
              : 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isInsideGeofence ? 'bg-emerald-500' : 'bg-orange-500 animate-ping'}`} />
            <span>{isInsideGeofence ? `GEOFENCE IN-RANGE (${formattedDistance})` : `REMOTE SITE (${formattedDistance})`}</span>
          </div>
        </div>

        {/* Embedded Interactive Map */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 aspect-video md:aspect-[21/9] shadow-inner">
          <div className="absolute top-3 left-3 z-10">
            <div className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-mono font-semibold shadow-md flex items-center space-x-1.5">
              <Navigation className="w-3 h-3 text-orange-400" />
              <span>Lat: {latDisplay}, Lon: {lngDisplay}</span>
            </div>
          </div>

          <iframe
            title="Field Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://maps.google.com/maps?q=${latDisplay},${lngDisplay}&z=15&output=embed`}
            className="w-full h-full filter saturate-[1.1]"
          />

          <a
            href={`https://maps.google.com/?q=${latDisplay},${lngDisplay}`}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-3 z-10 min-h-[44px] px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/30 flex items-center space-x-1.5 transition-transform transform active:scale-95 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Google Maps</span>
          </a>
        </div>
      </div>

      {/* Feedback Status Alert */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold border flex items-center justify-between shadow-sm ${
          statusMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Continuous Field Site Location & Proof Submission Portal */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-5 transition-colors">
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              SUBMIT FIELD LOCATION & PROOF
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Field dispatcher portal. Submit location, geotag selfie, and site work proof.
            </p>
          </div>
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-[10px] font-bold">
            <Radio className="w-3 h-3 animate-pulse text-orange-500" />
            <span className="hidden sm:inline">Multi-Site Active</span>
          </div>
        </div>

        <form onSubmit={handleSubmitFieldDispatch} className="space-y-5">
          {/* Image Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: WebRTC Live Selfie Capture */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-300 uppercase tracking-wider block">Step 1: Geotag Selfie</span>
                {selfieBase64 && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Captured</span>}
              </div>

              {selfieBase64 ? (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-300 dark:border-zinc-700 shadow-sm">
                  <img src={selfieBase64} alt="Selfie Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="absolute bottom-2 right-2 min-h-[44px] px-3.5 py-2 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold shadow-md hover:bg-slate-800 active:scale-95 cursor-pointer"
                  >
                    Retake Selfie
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-full min-h-[64px] py-4 rounded-2xl border-2 border-dashed border-orange-400 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 text-orange-600 dark:text-orange-400 font-extrabold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all transform active:scale-98 cursor-pointer"
                >
                  <Camera className="w-7 h-7 text-orange-500 animate-bounce" />
                  <span>Take Live Geotag Selfie</span>
                </button>
              )}
            </div>

            {/* Step 2: Mobile Camera Upload for Site Work Proof */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-zinc-300 uppercase tracking-wider block">Step 2: Site Work Proof (Optional)</span>
                {proofBase64 && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Attached</span>}
              </div>

              {proofBase64 ? (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-300 dark:border-zinc-700 shadow-sm">
                  <img src={proofBase64} alt="Proof Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setProofBase64('')}
                    className="absolute bottom-2 right-2 min-h-[44px] px-3.5 py-2 rounded-lg bg-rose-600 text-white text-[11px] font-bold shadow-md hover:bg-rose-700 active:scale-95 cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="w-full min-h-[64px] py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold text-xs flex flex-col items-center justify-center space-y-1.5 cursor-pointer transition-all active:scale-98">
                  <Upload className="w-7 h-7 text-slate-400 dark:text-zinc-500" />
                  <span>Snap or Upload Work Proof</span>
                  {/* Mobile Camera Upload Input */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleProofFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Structured Shoot & Production Metadata Grid */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
              <Building className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Shoot & Production Metadata
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Shop / Client Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. NISHA BURKA"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Product Model / Shoot Item
                </label>
                <input
                  type="text"
                  placeholder="e.g. kannagi kafthan / black aabaya"
                  value={productModel}
                  onChange={(e) => setProductModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Camera Man
                </label>
                <input
                  type="text"
                  placeholder="e.g. basith / aslam"
                  value={cameraman}
                  onChange={(e) => setCameraman(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Editor
                </label>
                <input
                  type="text"
                  placeholder="e.g. basith"
                  value={editor}
                  onChange={(e) => setEditor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Remarks Input */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Site Remarks & Notes (e.g., "Arrived at Thirumazhisai Site B")
            </label>
            <textarea
              rows="3"
              required
              placeholder="Enter site location details, client meeting notes, or job completion status..."
              value={siteRemarks}
              onChange={(e) => setSiteRemarks(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
            />
          </div>

          {/* Main Desktop Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] py-3.5 rounded-2xl font-black text-sm text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/30 transition-all transform hover:scale-[1.01] active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span>{loading ? 'Transmitting Field Data to HR...' : 'Submit Location & Image Proof to Admin'}</span>
          </button>
        </form>
      </div>

      {/* Today's Field Dispatches History Section with Skeleton Loading Placeholders */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4 transition-colors">
        <h3 className="font-black text-slate-900 dark:text-white text-base">Today's Field Dispatches History</h3>

        {/* Mobile Stacked Cards View (< md screens) */}
        <div className="space-y-3 block md:hidden">
          {loading ? (
            <SkeletonLoader type="card" count={3} />
          ) : fieldDispatches.length === 0 ? (
            <div className="p-6 text-center text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
              No field dispatches logged yet today. Use the form above to record site visits.
            </div>
          ) : (
            fieldDispatches.map((log, idx) => {
              const selfieUrl = log.photo_url || log.photo || log.selfie || '';
              let proofUrl = log.proof_url || log.proof_photo || log.proof_image || '';
              if (!proofUrl && log.remarks && log.remarks.includes('Work Proof Attached:')) {
                const parts = log.remarks.split('Work Proof Attached:');
                if (parts[1]) proofUrl = parts[1].trim();
              }

              const rawStatus = String(log.status || log.hr_status || 'Pending').trim();
              const statusLower = rawStatus.toLowerCase();

              return (
                <div key={log.id || `mob_${idx}`} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">{log.date}</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {log.check_in ? (log.check_in.includes('T') ? new Date(log.check_in).toLocaleTimeString() : log.check_in) : '---'}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      statusLower === 'present' || statusLower === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : statusLower === 'pending'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {rawStatus}
                    </span>
                  </div>

                  {/* Side-by-Side Thumbnails */}
                  <div className="flex items-center space-x-3 pt-1">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase block mb-1">Geotag Selfie</span>
                      {selfieUrl ? (
                        <div className="relative group w-full h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-800">
                          <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => openLightbox(selfieUrl, `Selfie Preview - ${log.date}`)}
                            className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded-xl bg-slate-200/60 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 flex items-center justify-center text-[10px] text-slate-400 dark:text-zinc-500 italic">
                          No Selfie
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase block mb-1">Site Work Proof</span>
                      {proofUrl ? (
                        <div className="relative group w-full h-20 rounded-xl overflow-hidden border border-orange-300 dark:border-orange-800">
                          <img src={proofUrl} alt="Work Proof" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => openLightbox(proofUrl, `Work Proof Preview - ${log.date}`)}
                            className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded-xl bg-slate-200/60 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 flex items-center justify-center text-[10px] text-slate-400 dark:text-zinc-500 italic">
                          No Proof
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & Remarks */}
                  <div className="space-y-1 text-xs pt-1 border-t border-slate-200 dark:border-zinc-800">
                    <div className="font-bold text-slate-900 dark:text-white">{log.location_name || 'Field Location'}</div>
                    {(log.latitude || log.lat) && (
                      <a
                        href={`https://maps.google.com/?q=${log.latitude || log.lat},${log.longitude || log.lng || log.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{parseFloat(log.latitude || log.lat).toFixed(4)}, {parseFloat(log.longitude || log.lng || log.lon).toFixed(4)}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                    {log.remarks && (
                      <p className="text-slate-600 dark:text-zinc-400 text-[11px] font-medium pt-1">{log.remarks}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= md screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-300">
            <thead className="bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Timestamp & Date</th>
                <th className="px-4 py-3">Selfie Image</th>
                <th className="px-4 py-3">Site Work Proof</th>
                <th className="px-4 py-3">GPS Location & Address</th>
                <th className="px-4 py-3">Notes & Proof Remarks</th>
                <th className="px-4 py-3">HR Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {loading ? (
                <SkeletonLoader type="table" count={4} />
              ) : fieldDispatches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400 dark:text-zinc-500">
                    No field dispatches logged yet today. Use the form above to record site visits.
                  </td>
                </tr>
              ) : (
                fieldDispatches.map((log, idx) => {
                  const selfieUrl = log.photo_url || log.photo || log.selfie || '';
                  let proofUrl = log.proof_url || log.proof_photo || log.proof_image || '';
                  if (!proofUrl && log.remarks && log.remarks.includes('Work Proof Attached:')) {
                    const parts = log.remarks.split('Work Proof Attached:');
                    if (parts[1]) proofUrl = parts[1].trim();
                  }

                  const rawStatus = String(log.status || log.hr_status || 'Pending').trim();
                  const statusLower = rawStatus.toLowerCase();

                  return (
                    <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-zinc-950/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{log.date}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          {log.check_in ? (log.check_in.includes('T') ? new Date(log.check_in).toLocaleTimeString() : log.check_in) : '---'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {selfieUrl ? (
                          <div className="relative group w-10 h-10">
                            <img
                              src={selfieUrl}
                              alt="Selfie"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-zinc-800 shadow-sm cursor-pointer"
                              onClick={() => openLightbox(selfieUrl, `Selfie - ${log.date}`)}
                            />
                            <button
                              type="button"
                              onClick={() => openLightbox(selfieUrl, `Selfie - ${log.date}`)}
                              className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 italic">No Selfie</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {proofUrl ? (
                          <div className="relative group w-10 h-10">
                            <img
                              src={proofUrl}
                              alt="Work Proof"
                              className="w-10 h-10 rounded-xl object-cover border border-orange-300 dark:border-orange-800 shadow-sm cursor-pointer"
                              onClick={() => openLightbox(proofUrl, `Work Proof - ${log.date}`)}
                            />
                            <button
                              type="button"
                              onClick={() => openLightbox(proofUrl, `Work Proof - ${log.date}`)}
                              className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 italic text-[11px]">No Proof</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{log.location_name || 'Field Site'}</div>
                        {(log.latitude || log.lat) && (
                          <a
                            href={`https://maps.google.com/?q=${log.latitude || log.lat},${log.longitude || log.lng || log.lon}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1 mt-0.5 font-mono text-[10px]"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>{parseFloat(log.latitude || log.lat).toFixed(4)}, {parseFloat(log.longitude || log.lng || log.lon).toFixed(4)}</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-slate-800 dark:text-zinc-300 font-medium truncate" title={log.remarks}>{log.remarks}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          statusLower === 'present' || statusLower === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : statusLower === 'pending'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}>
                          {rawStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WebRTC Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleSelfieCaptured}
        location={location}
        title="Field Geotag Selfie Capture"
      />

      {/* Image Lightbox Viewer Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                <span>{lightboxTitle}</span>
              </h4>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-950/5 dark:bg-zinc-950 rounded-2xl p-2 flex items-center justify-center min-h-[300px]">
              <img 
                src={selectedPhoto} 
                alt="Dispatch Inspection" 
                className="w-full h-auto max-h-[75vh] object-contain rounded-xl border border-slate-200 dark:border-zinc-800 shadow-md" 
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
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
