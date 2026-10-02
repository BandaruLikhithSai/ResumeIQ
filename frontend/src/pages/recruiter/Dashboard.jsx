import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, BarChart3, TrendingUp, AlertCircle,
  ArrowRight, Plus, Upload
} from 'lucide-react'
import { recruiterApi } from '../../api'
import useAuthStore from '../../store/authStore'
import ScoreRing from '../../components/ui/ScoreRing'
import { scoreColor, formatDate } from '../../utils/helpers'

export default function RecruiterDashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    recruiterApi.candidates()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
    </div>
  )

  const summary = data?.summary || {}
  const candidates = (data?.candidates || []).slice(0, 5)

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Recruiter Dashboard</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Welcome back, {user?.full_name?.split(' ')[0]}
          </p>
        </div>
        <Link to="/recruiter/upload" className="btn-primary">
          <Upload size={16} /> Upload Resumes
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: summary.total || 0,               icon: Users,       light: 'text-primary-600 bg-primary-50',   dark: 'dark:text-primary-400 dark:bg-primary-900/30' },
          { label: 'Shortlisted',      value: summary.shortlisted || 0,          icon: TrendingUp,  light: 'text-green-600 bg-green-50',       dark: 'dark:text-green-400 dark:bg-green-900/30' },
          { label: 'Needs Review',     value: summary.needs_review || 0,         icon: AlertCircle, light: 'text-amber-600 bg-amber-50',       dark: 'dark:text-amber-400 dark:bg-amber-900/30' },
          { label: 'Avg. Score',       value: `${summary.average_score || 0}%`,  icon: BarChart3,   light: 'text-blue-600 bg-blue-50',         dark: 'dark:text-blue-400 dark:bg-blue-900/30' },
        ].map(({ label, value, icon: Icon, light, dark: dk }) => (
          <div key={label} className="card p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${light} ${dk}`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Top candidates */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="section-title">Top Candidates</h2>
          <Link
            to="/recruiter/candidates"
            className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {candidates.length === 0 ? (
          <div className="card-body py-16 text-center">
            <Users size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-[var(--text-secondary)]">No candidates yet</p>
            <Link to="/recruiter/upload" className="btn-primary mt-4 inline-flex">
              <Plus size={16} /> Upload Resumes
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {candidates.map((c, i) => (
              <div
                key={c.analysis_id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--surface-secondary)] transition-colors"
              >
                <div className="w-6 text-center text-sm font-bold text-[var(--text-muted)]">#{i + 1}</div>
                <ScoreRing
                  score={c.overall_score}
                  color={scoreColor(c.overall_score)}
                  size={52}
                  showLabel={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] text-sm">{c.candidate_name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {c.fully_matched}/{c.total_requirements} matched · {c.experience_years}y exp
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--text-primary)]">{c.overall_score}%</div>
                  <div className="text-xs text-[var(--text-muted)]">{c.match_label}</div>
                </div>
                <Link
                  to={`/recruiter/candidates/${c.analysis_id}`}
                  className="btn-secondary text-xs py-1.5 px-3 shrink-0"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { to: '/recruiter/upload',     icon: Upload,    title: 'Upload Resumes',  desc: 'Add candidates for a job',    primary: true },
          { to: '/recruiter/candidates', icon: Users,     title: 'All Candidates',  desc: 'View ranked list' },
          { to: '/recruiter/compare',    icon: BarChart3, title: 'Compare',         desc: 'Side-by-side comparison' },
        ].map(({ to, icon: Icon, title, desc, primary }) => (
          <Link
            key={to}
            to={to}
            className={`card p-5 hover:shadow-[var(--shadow-md)] transition-shadow flex items-start gap-3 ${
              primary
                ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20'
                : ''
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              primary
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
            }`}>
              <Icon size={17} />
            </div>
            <div>
              <div className="font-semibold text-sm text-[var(--text-primary)]">{title}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
