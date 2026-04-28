import React from 'react';
import monitoringService from '../services/monitoringService.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    monitoringService.captureException(error, {
      source: 'react.error-boundary',
      componentStack: errorInfo?.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <div className="shell-backdrop" />
          <main className="app-layout">
            <section className="hero-panel">
              <span className="eyebrow">Recovery Mode</span>
              <h1>StellaPay hit an unexpected client error.</h1>
              <p>
                The issue has been captured for debugging. Refresh the page to retry the
                dashboard.
              </p>
            </section>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}
