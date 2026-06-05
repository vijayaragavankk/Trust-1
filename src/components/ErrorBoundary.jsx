// src/components/ErrorBoundary.jsx
// Catches any unhandled React render errors so one broken page
// doesn't white-screen the entire site.
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    // In production you would send this to a logging service (e.g. Sentry)
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-page">
          <div className="error-boundary-card">
            <span className="error-boundary-icon">⚠️</span>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-msg">{this.state.errorMsg}</p>
            <p className="error-boundary-hint">
              Please refresh the page. If the problem persists, contact us at{' '}
              <a href="mailto:contact@ourtrust.org">contact@ourtrust.org</a>.
            </p>
            <button
              className="error-boundary-btn"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
