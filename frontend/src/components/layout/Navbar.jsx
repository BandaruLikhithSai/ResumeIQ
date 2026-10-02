import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User, Brain, ChevronDown, Sun, Moon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import useAuthStore from '../../store/authStore'
import { useTheme } from '../../context/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="h-14 bg-[var(--card)] border-b border-[var(--border)] flex items-center px-6 sticky top-0 z-30 transition-colors">
      <Link
        to={user ? (user.role === 'recruiter' ? '/recruiter' : '/candidate') : '/'}
        className="flex items-center gap-2 font-bold text-primary-600 dark:text-primary-400 text-lg mr-8"
      >
        <Brain size={22} />
        ResumeIQ
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 flex items-center justify-center rounded-lg
                     text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                     hover:bg-[var(--surface-secondary)]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
                     transition-colors duration-150"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {user && (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                         hover:bg-[var(--surface-secondary)] transition-colors
                         text-sm font-medium text-[var(--text-secondary)]"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/50
                              text-primary-700 dark:text-primary-300
                              flex items-center justify-center text-xs font-bold">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-[var(--text-primary)]">{user.full_name}</span>
              <span className="hidden sm:block text-xs text-[var(--text-muted)] capitalize">
                ({user.role})
              </span>
              <ChevronDown size={14} className="text-[var(--text-muted)]" />
            </button>

            {open && (
              <div className="absolute right-0 top-10 w-48
                              bg-[var(--card)] border border-[var(--border)]
                              rounded-xl shadow-[var(--shadow-md)] py-1 z-50">
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm
                             text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]
                             hover:text-[var(--text-primary)] transition-colors"
                >
                  <User size={14} /> Profile &amp; Settings
                </Link>
                <hr className="my-1 border-[var(--border)]" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm
                             text-red-500 dark:text-red-400
                             hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
