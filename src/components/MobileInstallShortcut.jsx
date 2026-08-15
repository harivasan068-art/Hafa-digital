import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare } from 'lucide-react';

export const MobileInstallShortcut = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if app is already running as an installed PWA standalone app
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Listen for Chrome / Android native PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1. Android / Chrome native PWA prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted mobile app installation.');
        setDeferredPrompt(null);
      }
      return;
    }

    // 2. iOS Safari instructions fallback check
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // 3. Fallback generic instructions modal for other mobile browsers
    setShowIOSModal(true);
  };

  // Hide if already running in standalone PWA mode or explicitly dismissed
  if (isStandalone || !isVisible) return null;

  return (
    <>
      {/* Floating Action Mobile Install Button (Anchored Bottom Right) */}
      <div className="fixed bottom-6 right-4 z-50 animate-bounce-slow">
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-4 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-2xl shadow-orange-500/40 flex items-center space-x-2 border border-orange-400/40 backdrop-blur-md transform transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Install HafA Digital Mobile Shortcut"
        >
          <Smartphone className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <span>App Shortcut</span>
          <Download className="w-3.5 h-3.5 text-orange-100 shrink-0" />
        </button>
      </div>

      {/* iOS / Mobile Installation Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl space-y-4">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Smartphone className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black tracking-tight">Add HafA Digital Shortcut</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Install HafA Digital directly to your mobile home screen for quick 1-tap field access.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs font-medium text-zinc-300 border-t border-zinc-800">
              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <Share className="w-5 h-5 text-orange-400 shrink-0" />
                <span>1. Tap the <strong>Share</strong> button in browser toolbar.</span>
              </div>

              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <PlusSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>2. Select <strong>Add to Home Screen</strong>.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-extrabold text-xs text-white shadow-md transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
