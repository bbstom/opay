import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('页面崩溃:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-slate-800 font-black">页面出了点问题</p>
          <p className="text-slate-500 text-sm">{this.state.error.message || '未知错误'}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-bold"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
