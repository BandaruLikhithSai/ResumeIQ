import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Brain, Loader2, User, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api'
import useAuthStore from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login } = useAuthStore()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: params.get('role') || 'candidate',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      login(data.token, data.user)
      toast.success(`Welcome to ResumeIQ, ${data.user.full_name}!`)
      navigate(data.user.role === 'recruiter' ? '/recruiter' : '/candidate', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-2">Get started with ResumeIQ</p>
        </div>

        {/* Role picker */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: 'candidate', label: 'Job Seeker', icon: User, desc: 'Analyze my resume' },
            { value: 'recruiter', label: 'Recruiter', icon: Briefcase, desc: 'Evaluate candidates' },
          ].map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm(p => ({ ...p, role: value }))}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                form.role === value
                  ? 'border-primary-500 dark:border-primary-400 bg-[var(--accent-subtle)]'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--surface-secondary)]'
              }`}
            >
              <Icon
                size={18}
                className={form.role === value
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-[var(--text-muted)]'}
              />
              <div className={`font-semibold text-sm mt-2 ${
                form.role === value
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-[var(--text-primary)]'
              }`}>
                {label}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              type="text"
              required
              placeholder="Your full name"
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            />
          </div>
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
                minLength={6}
                placeholder="At least 6 characters"
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
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent)] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
