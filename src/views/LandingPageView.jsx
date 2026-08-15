import React, { useState } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { MobileInstallShortcut } from '../components/MobileInstallShortcut';
import { Card3D } from '../components/Card3D';
import { Hero3DVisual } from '../components/Hero3DVisual';
import { 
  MapPin, ShieldCheck, Clock, Camera, FileSpreadsheet, Server, 
  ArrowRight, Users, CheckCircle2, ChevronRight, Phone, Mail, Building, Globe, Smartphone, Download, Sparkles
} from 'lucide-react';

export const LandingPageView = ({ onOpenLogin }) => {
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* AMBIENT 3D ORBIT RINGS & CENTERED FLOATING WATERMARK LOGO */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
        <style>{`
          @keyframes float3D {
            0%, 100% {
              transform: translateY(0px) rotate(0deg) scale(1);
            }
            50% {
              transform: translateY(-20px) rotate(3deg) scale(1.03);
            }
          }
          @keyframes spinSlow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-float-3d {
            animation: float3D 14s ease-in-out infinite;
          }
          .animate-spin-orbit {
            animation: spinSlow 35s linear infinite;
          }
          .animate-spin-orbit-reverse {
            animation: spinSlow 50s linear infinite reverse;
          }
        `}</style>

        {/* Outer & Inner Ambient 3D Orbit Rings */}
        <div className="absolute w-[520px] h-[520px] sm:w-[720px] sm:h-[720px] rounded-full border border-orange-500/10 dark:border-orange-500/15 animate-spin-orbit pointer-events-none" />
        <div className="absolute w-[620px] h-[620px] sm:w-[880px] sm:h-[880px] rounded-full border border-dashed border-amber-500/10 dark:border-amber-500/10 animate-spin-orbit-reverse pointer-events-none" />

        {/* Centered Circular Watermark Logo */}
        <img
          src="/logo.png"
          alt="HafA Digital Ambient 3D Watermark"
          className="w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] md:w-[800px] md:h-[800px] rounded-full object-cover opacity-[0.05] dark:opacity-[0.07] blur-[0.5px] animate-float-3d pointer-events-none select-none"
        />
      </div>

      {/* Background Ambient Radial Glow Accents */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/10 dark:bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Company Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="HafA DIGITAL" className="w-10 h-10 object-contain rounded-full shadow-lg shadow-orange-500/30" />
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white block">HafA DIGITAL</span>
              <span className="text-[10px] font-bold tracking-widest text-orange-600 dark:text-orange-400 uppercase block">GeoTrack HRMS Suite</span>
            </div>
          </div>

          {/* Action Header Buttons & Theme Toggle */}
          <div className="flex items-center space-x-2.5">
            {/* Install App Shortcut Button */}
            <button
              onClick={() => setShowInstallGuide(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Install Mobile App Shortcut"
            >
              <Smartphone className="w-4 h-4 text-orange-500" />
              <span className="hidden sm:inline">Install App</span>
            </button>

            {/* Employee Portal Button */}
            <button
              onClick={() => onOpenLogin && onOpenLogin('employee')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            >
              Employee Portal
            </button>

            {/* Admin Access Button */}
            <button
              onClick={() => onOpenLogin && onOpenLogin('admin')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/25 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Access</span>
            </button>

            {/* Light/Dark Mode Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto text-center space-y-6 relative z-10">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider shadow-sm">
          <img src="/logo.png" alt="HafA DIGITAL Logo" className="w-5 h-5 object-contain rounded-full" />
          <span>HafA DIGITAL - GeoTrack HRMS Suite</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Empowering Modern Workforce & <span className="text-orange-500">Field Operations</span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          GeoTrack HRMS by <strong className="text-slate-900 dark:text-slate-200">HafA DIGITAL</strong> delivers real-time geofence tracking, live WebRTC selfie verification, and Google Workspace cloud master ledgers with zero database hosting costs.
        </p>

        {/* HERO INTERACTIVE 3D CIRCULAR HOLOGRAM VISUAL (NEW MODULE) */}
        <Hero3DVisual />

        {/* Hero Prominent CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onOpenLogin && onOpenLogin('employee')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/30 transition-all transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Clock className="w-5 h-5" />
            <span>Employee Check-In & Proof Portal</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => onOpenLogin && onOpenLogin('admin')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            <span>HR Admin Verification Portal</span>
          </button>
        </div>
      </section>

      {/* Features Grid (3 Core Interactive 3D Cards with Specular Glare) */}
      <section className="py-16 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Core Operational Capabilities</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise-grade tracking architecture engineered for mobile field teams.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Geofenced Field Tracking (3D Parallax with Glare) */}
          <Card3D maxTilt={14}>
            <div className="h-full p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 backdrop-blur-xl transition-colors group space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Geofenced Field Tracking</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Real-time Haversine distance proximity verification against office headquarters and client site boundaries. Continuous silent background location sync.
              </p>
            </div>
          </Card3D>

          {/* Card 2: Live WebRTC Proofs (3D Parallax with Glare) */}
          <Card3D maxTilt={14}>
            <div className="h-full p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 backdrop-blur-xl transition-colors group space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Live WebRTC Proofs</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Live HTML5 WebRTC camera selfie capture with geotagged timestamps (Lat, Lon, Date) overlaid directly onto canvas frames alongside site work proof uploads.
              </p>
            </div>
          </Card3D>

          {/* Card 3: Google Workspace Engine (3D Parallax with Glare) */}
          <Card3D maxTilt={14}>
            <div className="h-full p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 backdrop-blur-xl transition-colors group space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Google Workspace Engine</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Google Apps Script serverless REST API endpoints serving Google Sheets relational database tabs (Employees, Attendance, WorkProofs) & Drive asset folders.
              </p>
            </div>
          </Card3D>
        </div>
      </section>

      {/* About Company & Contact Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-12 px-6 relative z-10 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
              <img src="/logo.png" alt="HafA DIGITAL" className="w-5 h-5 object-contain rounded-full" />
              <span>HafA DIGITAL</span>
            </div>
            <p className="text-slate-500 max-w-sm">
              GeoTrack HRMS — Zero-Infrastructure Workforce Management & Geofencing System.
            </p>
          </div>

          {/* Contact Details */}
          <div className="flex flex-wrap items-center gap-6 text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
              <span>Tamil Nadu, India</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-orange-500 shrink-0" />
              <span>contact@hafadigital.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-orange-500 shrink-0" />
              <span>+91 (44) 2800-4232</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-slate-200 dark:border-slate-900 text-center text-slate-500 dark:text-slate-600 text-[11px]">
          © {new Date().getFullYear()} HafA DIGITAL. All rights reserved. GeoTrack HRMS Suite.
        </div>
      </footer>

      {/* MOBILE PWA INSTALL FLOATING SHORTCUT BUTTON */}
      <MobileInstallShortcut />

      {/* Header Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white shadow-2xl space-y-4">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold"
            >
              ✕
            </button>
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Install HafA Digital App</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                For quick 1-tap mobile access, tap the floating <strong>App Shortcut</strong> button at the bottom right of your screen!
              </p>
            </div>
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-extrabold text-xs text-white shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
