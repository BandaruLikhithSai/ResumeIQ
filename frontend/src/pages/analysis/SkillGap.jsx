import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Target, AlertTriangle, Info, BookOpen,
  Clock, ArrowLeft, TrendingUp, CheckCircle, ArrowUpRight
} from 'lucide-react'
import { analysisApi } from '../../api'

const PRIORITY_CONFIG = {
  high: {
    color:    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-400 dark:border-red-800',
    dot:      'bg-red-500 dark:bg-red-400',
    label:    'High Priority',
    cardBg:   'border-red-200 dark:border-red-900',
  },
  medium: {
    color:    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-400 dark:border-amber-800',
    dot:      'bg-amber-500 dark:bg-amber-400',
    label:    'Medium Priority',
    cardBg:   'border-amber-200 dark:border-amber-900',
  },
  low: {
    color:    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    dot:      'bg-gray-400 dark:bg-slate-500',
    label:    'Low Priority',
    cardBg:   '',
  },
}

const GAP_TYPE_CONFIG = {
  missing:     { icon: AlertTriangle, label: 'Missing',      color: 'text-red-600 dark:text-red-400' },
  partial:     { icon: Info,          label: 'Partial',      color: 'text-blue-600 dark:text-blue-400' },
  transferable:{ icon: ArrowUpRight,  label: 'Transferable', color: 'text-purple-600 dark:text-purple-400' },
}

export default function SkillGapPage() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    analysisApi.get(id)
      .then(({ data }) => setAnalysis(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
    </div>
  )
  if (!analysis) return (
    <div className="text-[var(--text-muted)] text-center py-20">Not found</div>
  )

  const gaps = analysis.skill_gaps || []
  const filtered = filter === 'all' ? gaps : gaps.filter(g => g.priority === filter)

  const counts = {
    all:    gaps.length,
    high:   gaps.filter(g => g.priority === 'high').length,
    medium: gaps.filter(g => g.priority === 'medium').length,
    low:    gaps.filter(g => g.priority === 'low').length,
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/analysis/${id}`} className="btn-ghost text-sm px-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Target size={22} className="text-[var(--accent)]" /> Skill Gap Analysis
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Prioritised gaps with learning recommendations
          </p>
        </div>
        <Link to={`/analysis/${id}/whatif`} className="btn-primary ml-auto text-sm">
          <TrendingUp size={15} /> Simulate Improvement
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all',    label: 'Total Gaps',    base: 'text-[var(--text-primary)] bg-[var(--surface-secondary)]' },
          { key: 'high',   label: 'High Priority', base: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20' },
          { key: 'medium', label: 'Medium',        base: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20' },
          { key: 'low',    label: 'Low',           base: 'text-[var(--text-secondary)] bg-[var(--surface-secondary)]' },
        ].map(({ key, label, base }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              filter === key
                ? 'border-[var(--accent)] shadow-sm'
                : 'border-[var(--border)] hover:border-[var(--border-hover)]'
            } ${base}`}
          >
            <div className="text-2xl font-bold">{counts[key]}</div>
            <div className="text-xs font-medium mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Gap list */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle size={40} className="mx-auto text-green-400 dark:text-green-500 mb-3" />
          <p className="text-[var(--text-secondary)]">No gaps in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((gap) => {
            const pc  = PRIORITY_CONFIG[gap.priority]  || PRIORITY_CONFIG.low
            const gtc = GAP_TYPE_CONFIG[gap.gap_type]  || GAP_TYPE_CONFIG.missing
            const GapIcon = gtc.icon
            return (
              <div key={gap.skill} className={`card overflow-hidden`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <GapIcon size={18} className={gtc.color} />
                      <h3 className="font-bold text-[var(--text-primary)] text-base capitalize">
                        {gap.skill.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pc.color}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${pc.dot} mr-1.5`} />
                        {pc.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] capitalize border border-[var(--border)] px-2 py-1 rounded-full">
                        {gtc.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mb-4">{gap.reason}</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <BookOpen size={15} className="text-[var(--accent)] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">Learning Direction</div>
                        <div className="text-sm text-[var(--text-secondary)]">{gap.learning_direction}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={15} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">Estimated Time</div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          ~{gap.estimated_learning_weeks} weeks of focused study
                        </div>
                      </div>
                    </div>
                  </div>

                  {gap.related_resources?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <div className="text-xs font-semibold text-[var(--text-muted)] mb-2">Suggested Resources</div>
                      <div className="flex flex-wrap gap-2">
                        {gap.related_resources.map((r, i) => (
                          <span key={i} className="text-xs bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-full">
                            {r.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] text-center">
        Learning directions are general guidance. Actual time to proficiency varies by background and effort.
      </p>
    </div>
  )
}
