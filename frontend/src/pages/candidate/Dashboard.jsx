import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, BarChart3, Clock, ArrowRight, TrendingUp } from 'lucide-react'
import { analysisApi, resumeApi } from '../../api'
import useAuthStore from '../../store/authStore'
import ScoreRing from '../../components/ui/ScoreRing'
import { scoreColor, formatDate } from '../../utils/helpers'

export default function CandidateDashboard() {
  const { user } = useAuthStore()
  const [analyses, setAnalyses] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analysisApi.list(), resumeApi.list()])
      .then(([aRes, rRes]) => {
        setAnalyses(aRes.data)
        setResumes(rRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const bestScore = analyses.length
    ? Math.max(...analyses.map(a => a.overall_score || 0))
    : null

  const recentAnalyses = analyses.slice(0, 5)

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Your career intelligence dashboard</p>
        </div>
        <Link to="/candidate/upload" className="btn-primary">
          <Plus size={16} /> New Analysis
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Analyses',   value: analyses.length,                    icon: BarChart3,  light: 'text-primary-600 bg-primary-50',   dark: 'dark:text-primary-400 dark:bg-primary-900/30' },
          { label: 'Resumes Uploaded', value: resumes.length,                     icon: FileText,   light: 'text-teal-600 bg-teal-50',         dark: 'dark:text-teal-400 dark:bg-teal-900/30' },
          { label: 'Best Match Score', value: bestScore !== null ? `${bestScore}%` : '—', icon: TrendingUp, light: 'text-green-600 bg-green-50', dark: 'dark:text-green-400 dark:bg-green-900/30' },
          { label: 'This Month',       value: analyses.filter(a => new Date(a.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length, icon: Clock, light: 'text-amber-600 bg-amber-50', dark: 'dark:text-amber-400 dark:bg-amber-900/30' },
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

      {/* Recent analyses */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="section-title">Recent Analyses</h2>
          <Link to="/candidate/history" className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentAnalyses.length === 0 ? (
          <div className="card-body py-16 text-center">
            <div className="w-16 h-16 bg-[var(--surface-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={28} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">No analyses yet</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Upload your resume to get your first match score</p>
            <Link to="/candidate/upload" className="btn-primary mt-4 inline-flex">
              <Plus size={16} /> Start Analysis
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recentAnalyses.map(analysis => (
              <div key={analysis.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--surface-secondary)] transition-colors">
                <ScoreRing score={analysis.overall_score || 0} color={scoreColor(analysis.overall_score || 0)} size={56} showLabel={false} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--text-primary)] text-sm truncate">
                    Analysis #{analysis.id}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(analysis.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{analysis.overall_score}%</div>
                  <div className="text-xs text-[var(--text-muted)]">{analysis.match_label}</div>
                </div>
                <Link to={`/analysis/${analysis.id}`} className="btn-secondary text-xs py-1.5 px-3">
                  View <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: '/candidate/upload', icon: Plus,     title: 'New Analysis', desc: 'Upload resume + job description', primary: true },
          { to: '/graph',            icon: BarChart3, title: 'Skill Graph',  desc: 'Explore skill relationships' },
          { to: '/candidate/history',icon: Clock,    title: 'History',      desc: 'All your past analyses' },
        ].map(({ to, icon: Icon, title, desc, primary }) => (
          <Link
            key={to}
            to={to}
            className={`card p-5 hover:shadow-[var(--shadow-md)] transition-shadow flex items-start gap-4 ${
              primary
                ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20'
                : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              primary
                ? 'bg-primary-600 dark:bg-primary-700 text-white'
                : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
            }`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)] text-sm">{title}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="h-8 skeleton w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
      </div>
      <div className="h-64 skeleton rounded-xl" />
    </div>
  )
}
