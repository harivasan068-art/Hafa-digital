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
      <img
        src="/logo.png"
        alt="HafA Digital Centered Background Logo"
        className="w-[450px] h-[450px] sm:w-[600px] sm:h-[600px] md:w-[750px] md:h-[750px] rounded-full object-cover opacity-[0.04] dark:opacity-[0.06] blur-[0.5px] animate-float-center pointer-events-none select-none"
      />
    </div>
  );
};
