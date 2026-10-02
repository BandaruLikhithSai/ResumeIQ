import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import './index.css'

function ThemedToaster() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: isDark
          ? {
              background: '#1e2535',
              color: '#e2e8f0',
              border: '1px solid #2a3348',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }
          : {
              background: '#fff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            },
        success: {
          iconTheme: { primary: '#10b981', secondary: isDark ? '#1e2535' : '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: isDark ? '#1e2535' : '#fff' },
        },
      }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <ThemedToaster />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
