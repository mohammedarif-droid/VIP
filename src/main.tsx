import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in PCIS Platform:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-['Cairo',sans-serif]">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-base font-bold text-white">حدث خطأ أثناء تحميل المنصة</h2>
            <p className="text-xs text-slate-400">
              {this.state.error?.message || 'تعذر تشغيل واجهة المنصة بسبب تعارض في المتصفح أو التخزين المحلي.'}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
              >
                إعادة ضبط وتشغيل المنصة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
