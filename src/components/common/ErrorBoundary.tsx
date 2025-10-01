import React from 'react';

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_: Error, __: React.ErrorInfo): void {
    // In production wire to logging/monitoring service
    // console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-700 bg-red-50 border border-red-200 rounded-md max-w-2xl m-6">
          <div className="font-semibold mb-1">Something went wrong.</div>
          <div className="text-sm">Please refresh the page or try again later.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
