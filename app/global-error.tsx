'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the global error
    console.error('Global Application Error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    })
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'Poppins, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              ⚠️ Application Error
            </h1>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Something went wrong. Please try refreshing the page.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fee',
                borderRadius: '0.25rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#324426',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#324426',
                  border: '1px solid #324426',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Go Home
              </button>
            </div>

            <p style={{
              marginTop: '1.5rem',
              fontSize: '0.875rem',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              If the problem persists, contact{' '}
              <a href="mailto:team@prieelo.com" style={{ color: '#324426' }}>
                team@prieelo.com
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

