import React from 'react';
import { AlertOctagon, RefreshCw, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HafA DIGITAL Error Boundary Caught Exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-white">Application Exception Intercepted</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                A runtime exception occurred in the web application. Your data remains safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-left overflow-hidden">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Error Details:
                </span>
                <p className="text-xs font-mono text-zinc-300 break-words line-clamp-3">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3.5 rounded-2xl font-extrabold text-xs text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload & Recover Portal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
