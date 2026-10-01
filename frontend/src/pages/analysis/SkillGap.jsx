import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Target, AlertTriangle, Info, BookOpen,
  Clock, ArrowLeft, TrendingUp, CheckCircle, ArrowUpRight
} from 'lucide-react'
import { analysisApi } from '../../api'

const PRIORITY_CONFIG = {
  high:   { color: 'bg-red-100 text-red-700 border-red-200',    dot: 'bg-red-500',    label: 'High Priority' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Medium Priority' },
  low:    { color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400',   label: 'Low Priority' },
}

const GAP_TYPE_CONFIG = {
  missing:     { icon: AlertTriangle, label: 'Missing',     color: 'text-red-600' },
  partial:     { icon: Info,          label: 'Partial',     color: 'text-blue-600' },
  transferable:{ icon: ArrowUpRight,  label: 'Transferable', color: 'text-purple-600' },
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

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton rounded-xl" />)}</div>
  if (!analysis) return <div className="text-gray-400 text-center py-20">Not found</div>

  const gaps = analysis.skill_gaps || []
  const filtered = filter === 'all' ? gaps : gaps.filter(g => g.priority === filter)

  const counts = {
    all: gaps.length,
    high: gaps.filter(g => g.priority === 'high').length,
    medium: gaps.filter(g => g.priority === 'medium').length,
    low: gaps.filter(g => g.priority === 'low').length,
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
            <Target size={22} className="text-primary-600" /> Skill Gap Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">Prioritised gaps with learning recommendations</p>
        </div>
        <Link to={`/analysis/${id}/whatif`} className="btn-primary ml-auto text-sm">
          <TrendingUp size={15} /> Simulate Improvement
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all',    label: 'Total Gaps',   color: 'text-gray-700 bg-gray-50' },
          { key: 'high',   label: 'High Priority', color: 'text-red-700 bg-red-50' },
          { key: 'medium', label: 'Medium',        color: 'text-amber-700 bg-amber-50' },
          { key: 'low',    label: 'Low',           color: 'text-gray-600 bg-gray-50' },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`p-4 rounded-xl border-2 text-center transition-all ${
              filter === key ? 'border-primary-400 shadow-sm' : 'border-gray-100 hover:border-gray-200'
            } ${color}`}>
            <div className="text-2xl font-bold">{counts[key]}</div>
            <div className="text-xs font-medium mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Gap list */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-500">No gaps in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((gap) => {
            const pc = PRIORITY_CONFIG[gap.priority] || PRIORITY_CONFIG.low
            const gtc = GAP_TYPE_CONFIG[gap.gap_type] || GAP_TYPE_CONFIG.missing
            const GapIcon = gtc.icon
            return (
              <div key={gap.skill} className="card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <GapIcon size={18} className={gtc.color} />
                      <h3 className="font-bold text-gray-900 text-base capitalize">
                        {gap.skill.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pc.color}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${pc.dot} mr-1.5`} />
                        {pc.label}
                      </span>
                      <span className="text-xs text-gray-400 capitalize border border-gray-200 px-2 py-1 rounded-full">
                        {gtc.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{gap.reason}</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <BookOpen size={15} className="text-primary-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">Learning Direction</div>
                        <div className="text-sm text-gray-700">{gap.learning_direction}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock size={15} className="text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1">Estimated Time</div>
                        <div className="text-sm text-gray-700">
                          ~{gap.estimated_learning_weeks} weeks of focused study
                        </div>
                      </div>
                    </div>
                  </div>

                  {gap.related_resources?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 mb-2">Suggested Resources</div>
                      <div className="flex flex-wrap gap-2">
                        {gap.related_resources.map((r, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
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

      <p className="text-xs text-gray-400 text-center">
        Learning directions are general guidance. Actual time to proficiency varies by background and effort.
      </p>
    </div>
  )
}
