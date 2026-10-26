import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Signal to index.html fallback loader that the module bundle executed
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, boolean>).__IKQA_MOUNTED__ = true;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class PortalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Portal runtime error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('ikqa_documents_v2');
      localStorage.removeItem('ikqa_documents_v1');
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#020617',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800 }}>
              IKQA Food Safety & Compliance Portal
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8' }}>
              A cached state issue prevented the view from loading ({this.state.errorMessage}).
            </p>
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Cache & Reload Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <PortalErrorBoundary>
      <App />
    </PortalErrorBoundary>
  );
}
