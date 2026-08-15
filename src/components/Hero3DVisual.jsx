import React, { useRef, useState } from 'react';
import { ShieldCheck, Radio, Sparkles, MapPin, Zap } from 'lucide-react';

export const Hero3DVisual = () => {
  const containerRef = useRef(null);
  const [rotations, setRotations] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotX = (-mouseY / (rect.height / 2)) * 20;
    const rotY = (mouseX / (rect.width / 2)) * 20;

    setRotations({ x: rotX, y: rotY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotations({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="my-10 relative w-full max-w-lg mx-auto h-72 sm:h-80 flex items-center justify-center cursor-pointer select-none"
      style={{ perspective: '1000px' }}
    >
      <style>{`
        @keyframes float3DVisual {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes orbitSpin1 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitSpin2 {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-float-3d-visual {
          animation: float3DVisual 10s ease-in-out infinite;
        }
        .animate-orbit-1 {
          animation: orbitSpin1 25s linear infinite;
        }
        .animate-orbit-2 {
          animation: orbitSpin2 35s linear infinite;
        }
      `}</style>

      {/* Main 3D Tilt Container */}
      <div
        className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center"
        style={{
          transform: `rotateX(${rotations.x.toFixed(2)}deg) rotateY(${rotations.y.toFixed(2)}deg) scale3d(1.05, 1.05, 1.05)`,
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Background Glowing Hologram Radial Ambient */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/20 via-amber-500/10 to-emerald-500/20 blur-2xl pointer-events-none"
          style={{ transform: 'translateZ(-40px)' }}
        />

        {/* 3D Orbit Ring 1 */}
        <div
          className="absolute w-60 h-60 sm:w-72 sm:h-72 rounded-full border-2 border-orange-500/30 dark:border-orange-400/30 animate-orbit-1 pointer-events-none"
          style={{ transform: 'translateZ(15px)' }}
        />

        {/* 3D Orbit Ring 2 (Dashed Counter-Rotating) */}
        <div
          className="absolute w-68 h-68 sm:w-80 sm:h-80 rounded-full border border-dashed border-emerald-500/30 dark:border-emerald-400/30 animate-orbit-2 pointer-events-none"
          style={{ transform: 'translateZ(-15px)' }}
        />

        {/* Central 3D Circular Logo Disc */}
        <div
          className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-2.5 bg-white/90 dark:bg-zinc-900/90 border-2 border-orange-500/40 dark:border-orange-500/60 shadow-2xl shadow-orange-500/30 backdrop-blur-xl flex items-center justify-center animate-float-3d-visual"
          style={{ transform: 'translateZ(35px)' }}
        >
          <img
            src="/logo.png"
            alt="HafA Digital 3D Hologram Logo"
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain rounded-full drop-shadow-xl"
          />
        </div>

        {/* 3D Floating Status Badge 1 (Top-Left elevated on Z-Axis) */}
        <div
          className="absolute -top-2 -left-4 sm:-left-8 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-emerald-500/40 text-slate-900 dark:text-white text-xs font-black shadow-xl flex items-center space-x-2 backdrop-blur-md"
          style={{ transform: 'translateZ(65px)' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
          <span>Geofence HQ Active</span>
        </div>

        {/* 3D Floating Status Badge 2 (Bottom-Right elevated on Z-Axis) */}
        <div
          className="absolute -bottom-2 -right-4 sm:-right-8 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-orange-500/40 text-slate-900 dark:text-white text-xs font-black shadow-xl flex items-center space-x-2 backdrop-blur-md"
          style={{ transform: 'translateZ(75px)' }}
        >
          <Radio className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span>Live GAS Cloud Sync</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </div>
      </div>
    </div>
  );
};
