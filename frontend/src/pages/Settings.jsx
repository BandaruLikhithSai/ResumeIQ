import { useState } from 'react'
import { Settings, User, Lock, LogOut, Sun, Moon } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Signed out')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="page-title flex items-center gap-2">
        <Settings size={22} className="text-[var(--accent)]" /> Settings
      </h1>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="section-title flex items-center gap-2 mb-4">
          {isDark ? <Moon size={17} /> : <Sun size={17} />} Appearance
        </h2>
        <div className="flex items-center justify-between p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
          <div>
            <div className="font-medium text-sm text-[var(--text-primary)]">Theme</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              {isDark ? 'Dark mode is active' : 'Light mode is active'}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
              isDark ? 'bg-[var(--accent)]' : 'bg-gray-300 dark:bg-slate-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2">
          <User size={17} /> Profile
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input bg-[var(--surface-secondary)] cursor-not-allowed" value={user?.full_name || ''} readOnly />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-[var(--surface-secondary)] cursor-not-allowed" value={user?.email || ''} readOnly />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input bg-[var(--surface-secondary)] capitalize cursor-not-allowed" value={user?.role || ''} readOnly />
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Profile editing will be available in a future update.</p>
      </div>

      {/* Matching Weights info */}
      <div className="card p-6 space-y-3">
        <h2 className="section-title">Matching Algorithm Weights</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          The hybrid score is computed as a weighted sum of four components. Default weights:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'TF-IDF Similarity',   val: '25%', desc: 'Token-level keyword overlap' },
            { label: 'Semantic Match',       val: '30%', desc: 'Meaning-level text similarity' },
            { label: 'Knowledge Graph',      val: '25%', desc: 'Skill relationship coverage' },
            { label: 'Experience Relevance', val: '20%', desc: 'Years, roles, education fit' },
          ].map(({ label, val, desc }) => (
            <div key={label} className="p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                <span className="text-sm font-bold text-[var(--accent)]">{val}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Custom weight overrides can be passed per-analysis via the API (weights parameter in /api/analysis/run).
        </p>
      </div>

      {/* Demo info */}
      {user?.is_demo && (
        <div className="card p-5 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-1">Demo Account</p>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            You're using a demo account. All data shown is pre-seeded for demonstration purposes.
          </p>
        </div>
      )}

      {/* Sign out */}
      <div className="card p-5">
        <h2 className="section-title mb-3 text-red-600 dark:text-red-400 flex items-center gap-2">
          <LogOut size={17} /> Sign Out
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Sign out of your ResumeIQ account on this device.
        </p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg text-sm font-medium
                     hover:bg-red-700 dark:hover:bg-red-600 transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
