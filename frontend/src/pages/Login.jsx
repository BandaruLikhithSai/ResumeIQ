import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Brain, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api'
import useAuthStore from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login } = useAuthStore()

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      login(data.token, data.user)
      toast.success(`Welcome back, ${data.user.full_name}!`)
      navigate(data.user.role === 'recruiter' ? '/recruiter' : '/candidate', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async (role) => {
    setDemoLoading(role)
    try {
      const { data } = await authApi.demoLogin(role)
      login(data.token, data.user)
      toast.success(`Logged in as demo ${role}`)
      navigate(role === 'recruiter' ? '/recruiter' : '/candidate', { replace: true })
    } catch (err) {
      toast.error('Demo login failed. Run the seed script first.')
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12
                          bg-primary-100 dark:bg-primary-900/40
                          text-primary-600 dark:text-primary-400
                          rounded-xl mb-4">
            <Brain size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sign in to ResumeIQ</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2">Continue where you left off</p>
        </div>

        {/* Demo buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleDemo('candidate')}
            disabled={demoLoading !== null}
            className="btn-secondary justify-center text-xs py-2"
          >
            {demoLoading === 'candidate' ? <Loader2 size={14} className="animate-spin" /> : '🎓 Demo Candidate'}
          </button>
          <button
            onClick={() => handleDemo('recruiter')}
            disabled={demoLoading !== null}
            className="btn-secondary justify-center text-xs py-2"
          >
            {demoLoading === 'recruiter' ? <Loader2 size={14} className="animate-spin" /> : '🏢 Demo Recruiter'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <hr className="flex-1 border-[var(--border)]" />
          <span className="text-xs text-[var(--text-muted)]">or sign in with email</span>
          <hr className="flex-1 border-[var(--border)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPw ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--accent)] font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
