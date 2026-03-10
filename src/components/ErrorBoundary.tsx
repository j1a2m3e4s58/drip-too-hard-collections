import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    (this as any).state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8 text-center">
          <AlertTriangle size={40} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-2 uppercase font-bold text-xs">
            Reload
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
