import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GitCompare, Loader2 } from 'lucide-react'
import { recruiterApi } from '../../api'
import ScoreRing from '../../components/ui/ScoreRing'
import { scoreColor } from '../../utils/helpers'

const STATUS_SYMBOL = {
  fully_matched:    { symbol: '✓', cls: 'text-green-600 dark:text-green-400 font-bold' },
  partially_matched:{ symbol: '◐', cls: 'text-blue-600 dark:text-blue-400' },
  transferable:     { symbol: '↗', cls: 'text-purple-600 dark:text-purple-400' },
  missing:          { symbol: '✕', cls: 'text-red-500 dark:text-red-400' },
}

export default function ComparisonPage() {
  const [params] = useSearchParams()
  const idsParam = params.get('ids') || ''

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [inputIds, setInputIds] = useState(idsParam)
  const [error, setError] = useState(null)

  const load = (ids) => {
    const parsed = ids.split(',').map(s => parseInt(s.trim())).filter(Boolean)
    if (parsed.length < 2) { setError('Enter at least 2 analysis IDs'); return }
    setLoading(true); setError(null)
    recruiterApi.compare(parsed)
      .then(({ data }) => setData(data))
      .catch(err => setError(err.response?.data?.error || 'Failed to compare'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (idsParam) load(idsParam) }, [])

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <h1 className="page-title flex items-center gap-2">
          <GitCompare size={22} className="text-[var(--accent)]" /> Candidate Comparison
        </h1>
      </div>

      {/* Input form */}
      {!data && (
        <div className="card p-6 space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Enter comma-separated analysis IDs to compare (2–4 candidates):
          </p>
          <div className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="e.g. 1, 2, 3"
              value={inputIds}
              onChange={e => setInputIds(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(inputIds)}
            />
            <button onClick={() => load(inputIds)} disabled={loading} className="btn-primary px-5">
              {loading ? <Loader2 size={15} className="animate-spin" /> : 'Compare'}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <p className="text-xs text-[var(--text-muted)]">
            Tip: Go to Candidates list, select candidates, and click Compare to auto-fill IDs.
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Score cards */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${data.candidates.length}, 1fr)` }}
          >
            {data.candidates.map((c, i) => (
              <div key={c.analysis_id} className="card p-5 text-center">
                <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">#{i + 1}</div>
                <div className="font-bold text-[var(--text-primary)] mb-3 truncate">{c.candidate_name}</div>
                <ScoreRing
                  score={c.overall_score}
                  color={scoreColor(c.overall_score)}
                  size={100}
                  label={c.match_label}
                />
                <div className="mt-4 space-y-1 text-xs text-[var(--text-muted)] text-left">
                  {[
                    ['TF-IDF',    c.component_scores.tfidf],
                    ['Semantic',  c.component_scores.semantic],
                    ['KG',        c.component_scores.knowledge_graph],
                    ['Exp.',      c.component_scores.experience],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span>{label}</span>
                      <span className="font-medium text-[var(--text-secondary)]">{Math.round(val || 0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Requirement matrix */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <h3 className="section-title">Requirement Matrix — {data.job_title}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)]">
                    <th className="px-5 py-3 text-left">Requirement</th>
                    {data.candidates.map(c => (
                      <th key={c.analysis_id} className="px-5 py-3 text-center">
                        {c.candidate_name.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.requirement_matrix.map(row => (
                    <tr key={row.requirement} className="hover:bg-[var(--surface-secondary)] transition-colors">
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)] capitalize">
                        {row.requirement.replace(/_/g, ' ')}
                      </td>
                      {data.candidates.map(c => {
                        const status = row[String(c.analysis_id)]
                        const cfg = STATUS_SYMBOL[status] || { symbol: '?', cls: 'text-[var(--text-muted)]' }
                        return (
                          <td key={c.analysis_id} className={`px-5 py-3 text-center text-lg ${cfg.cls}`}>
                            {cfg.symbol}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="px-5 py-3 bg-[var(--surface-secondary)] border-t border-[var(--border)] flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
              <span className="text-green-600 dark:text-green-400 font-bold">✓ Matched</span>
              <span className="text-blue-600 dark:text-blue-400">◐ Partial</span>
              <span className="text-purple-600 dark:text-purple-400">↗ Transferable</span>
              <span className="text-red-500 dark:text-red-400">✕ Missing</span>
            </div>
          </div>

          <button onClick={() => setData(null)} className="btn-secondary text-sm">
            Compare different candidates
          </button>
        </>
      )}
    </div>
  )
}
