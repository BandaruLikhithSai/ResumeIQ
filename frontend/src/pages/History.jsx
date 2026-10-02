import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, ArrowRight } from 'lucide-react'
import { analysisApi } from '../api'
import ScoreRing from '../components/ui/ScoreRing'
import { scoreColor, formatDate } from '../utils/helpers'

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analysisApi.list()
      .then(({ data }) => setAnalyses(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
    </div>
  )

  return (
    <div className="max-w-4xl space-y-5">
      <h1 className="page-title flex items-center gap-2">
        <History size={22} className="text-[var(--accent)]" /> Analysis History
      </h1>

      {analyses.length === 0 ? (
        <div className="card py-20 text-center">
          <History size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)]">No analyses yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {analyses.map(a => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--surface-secondary)] transition-colors"
              >
                <ScoreRing
                  score={a.overall_score || 0}
                  color={scoreColor(a.overall_score || 0)}
                  size={52}
                  showLabel={false}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] text-sm">
                    Analysis #{a.id}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {a.counts?.fully_matched || 0} matched · {a.counts?.missing || 0} missing · {formatDate(a.created_at)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-[var(--text-primary)]">{a.overall_score}%</div>
                  <div className="text-xs text-[var(--text-muted)]">{a.match_label}</div>
                </div>
                <Link to={`/analysis/${a.id}`} className="btn-secondary text-xs py-1.5 px-3 shrink-0">
                  View <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
