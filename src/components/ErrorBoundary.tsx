import { Component, ErrorInfo, ReactNode } from 'react'
import Layout from './Layout'
import './Layout.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="page-container">
            <h1 className="page-title">Something went wrong</h1>
            <p className="page-content">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="email-button"
            >
              Reload Page
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '600px', margin: '2rem auto 0' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>Error Details (Dev Only)</summary>
                <pre style={{ 
                  background: 'rgba(0, 0, 0, 0.05)', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.9rem'
                }}>
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </Layout>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

