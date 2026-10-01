import { useState } from 'react'
import { Settings, User, Lock, LogOut, Save, Loader2 } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { authApi } from '../api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Signed out')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="page-title flex items-center gap-2">
        <Settings size={22} className="text-primary-600" /> Settings
      </h1>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2"><User size={17} /> Profile</h2>
        <div className="grid gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input bg-gray-50" value={user?.full_name || ''} readOnly />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50" value={user?.email || ''} readOnly />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input bg-gray-50 capitalize" value={user?.role || ''} readOnly />
          </div>
        </div>
        <p className="text-xs text-gray-400">Profile editing will be available in a future update.</p>
      </div>

      {/* Matching Weights info */}
      <div className="card p-6 space-y-3">
        <h2 className="section-title">Matching Algorithm Weights</h2>
        <p className="text-sm text-gray-600">
          The hybrid score is computed as a weighted sum of four components. Default weights:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'TF-IDF Similarity',    val: '25%', desc: 'Token-level keyword overlap' },
            { label: 'Semantic Match',        val: '30%', desc: 'Meaning-level text similarity' },
            { label: 'Knowledge Graph',       val: '25%', desc: 'Skill relationship coverage' },
            { label: 'Experience Relevance',  val: '20%', desc: 'Years, roles, education fit' },
          ].map(({ label, val, desc }) => (
            <div key={label} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-gray-700">{label}</span>
                <span className="text-sm font-bold text-primary-600">{val}</span>
              </div>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Custom weight overrides can be passed per-analysis via the API (weights parameter in /api/analysis/run).
        </p>
      </div>

      {/* Demo info */}
      {user?.is_demo && (
        <div className="card p-5 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-700 font-medium mb-1">Demo Account</p>
          <p className="text-xs text-amber-600">
            You're using a demo account. All data shown is pre-seeded for demonstration purposes.
          </p>
        </div>
      )}

      {/* Sign out */}
      <div className="card p-5">
        <h2 className="section-title mb-3 text-red-600 flex items-center gap-2"><LogOut size={17} /> Sign Out</h2>
        <p className="text-sm text-gray-500 mb-4">Sign out of your ResumeIQ account on this device.</p>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  )
}
