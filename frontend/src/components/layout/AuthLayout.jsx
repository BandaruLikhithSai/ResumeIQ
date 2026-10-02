import { Outlet, Link } from 'react-router-dom'
import { Brain, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function AuthLayout() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col transition-colors">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xl w-fit">
          <Brain size={24} />
          ResumeIQ
        </Link>
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
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <Outlet />
      </div>
      <footer className="p-6 text-center text-sm text-[var(--text-muted)]">
        © 2024 ResumeIQ — Academic Project
      </footer>
    </div>
  )
}
