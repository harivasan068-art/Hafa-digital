import React from 'react';

export const BackgroundWatermark = () => {
  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
      <style>{`
        @keyframes floatCenter {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-18px) scale(1.02);
          }
        }
        .animate-float-center {
          animation: floatCenter 14s ease-in-out infinite;
        }
      `}</style>
      
      {/* Central Floating Container */}
      <div className="relative flex items-center justify-center animate-float-center">
        {/* Soft Ambient Radial Backlighting for Dark Mode */}
        <div className="absolute w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] md:w-[750px] md:h-[750px] rounded-full bg-transparent dark:bg-orange-500/10 blur-3xl pointer-events-none transition-colors duration-500" />

        {/* Floating Watermark Logo */}
        <img
          src="/logo.png"
          alt="HafA Digital Centered Background Logo"
          className="w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] md:w-[750px] md:h-[750px] rounded-full object-cover opacity-[0.05] dark:opacity-18 dark:brightness-105 dark:contrast-110 blur-[0.5px] ring-1 ring-transparent dark:ring-orange-500/10 dark:drop-shadow-[0_0_30px_rgba(249,115,22,0.18)] pointer-events-none select-none transition-all duration-300"
        />
      </div>
    </div>
  );
};

