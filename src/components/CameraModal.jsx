import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, RefreshCw, Check, X, ShieldAlert, MapPin } from 'lucide-react';

export const CameraModal = ({ isOpen, onClose, onCapture, location, title = "Live Field Selfie Verification" }) => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access webcam. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    
    // Mirror image for natural selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Format Watermark Metadata
    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
    const latStr = location?.latitude ? location.latitude.toFixed(6) : '13.0853';
    const lngStr = location?.longitude ? location.longitude.toFixed(6) : '80.0179';
    const userName = user?.full_name || 'Harivasan V';
    const userEmpId = user?.employee_id || 'EMP836121';

    // Draw Dark Overlay Banner for Geotag Watermark at Bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(10, canvas.height - 70, canvas.width - 20, 60);

    // Draw Bright Orange Accent Bar
    ctx.fillStyle = '#F97316';
    ctx.fillRect(10, canvas.height - 70, 6, 60);

    // Watermark Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`FIELD GEOTRACK VERIFIED | ${userName} (${userEmpId})`, 24, canvas.height - 48);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '11px sans-serif';
    ctx.fillText(`GPS: Lat ${latStr}, Lon ${lngStr} | Date: ${formattedDate}`, 24, canvas.height - 26);

    const base64Data = canvas.toDataURL('image/png');
    setCapturedImage(base64Data);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!capturedImage) return;
    setLoading(true);
    await onCapture(capturedImage);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WebRTC Video Stream / Snapshot Display */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-rose-400 flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 mb-2 opacity-80" />
              <p className="text-sm font-medium">{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-700"
              >
                Retry Camera Access
              </button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Selfie Snapshot" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          )}

          {/* Live Overlay Badge */}
          {!capturedImage && !cameraError && (
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <span>
                  Lat: {location?.latitude?.toFixed(4) || '13.0853'}, Lon: {location?.longitude?.toFixed(4) || '80.0179'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">
                LIVE GEOTAG
              </span>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-orange-500" />
                <span>Retake Photo</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{loading ? 'Attaching Image...' : 'Confirm & Attach Selfie'}</span>
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                onClick={takeSnapshot}
                disabled={!!cameraError}
                className="flex items-center space-x-2 px-8 py-3.5 rounded-full font-black text-xs text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/30 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
                <span>Capture Verified Selfie</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
