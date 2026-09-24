import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.href = '/';
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CGSSB & CGPSC Test Portal</h1>
                <p className="text-xs text-slate-400">App recovery & diagnostics</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-base font-semibold text-slate-200">
                An unexpected display error occurred while rendering the page.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                This might happen if previous session cache or temporary local storage conflicts with the latest update.
                You can reload or clear local cached data below.
              </p>

              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-red-300 break-all overflow-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearStorageAndReload}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Cache & Reset</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="sm:col-span-2 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-xs rounded-xl transition cursor-pointer border border-slate-700"
              >
                <Home className="w-4 h-4" />
                <span>Return to Main Test Catalog</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
