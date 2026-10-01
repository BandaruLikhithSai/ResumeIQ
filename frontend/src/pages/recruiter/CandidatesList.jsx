import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Filter, ArrowUpDown, Eye, GitCompare,
  CheckCircle, XCircle, TrendingUp
} from 'lucide-react'
import { recruiterApi } from '../../api'
import ScoreRing from '../../components/ui/ScoreRing'
import { scoreColor, formatDate } from '../../utils/helpers'

export default function CandidatesList() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [sortKey, setSortKey] = useState('overall_score')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState([])

  useEffect(() => {
    recruiterApi.candidates()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>

  const candidates = (data?.candidates || []).filter(c =>
    (!search || c.candidate_name?.toLowerCase().includes(search.toLowerCase())) &&
    c.overall_score >= minScore
  )

  const sorted = [...candidates].sort((a, b) => {
    const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0
    return sortDir === 'asc' ? va - vb : vb - va
  })

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const summary = data?.summary || {}

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Candidates</h1>
        {selected.length >= 2 && (
          <Link
            to={`/recruiter/compare?ids=${selected.join(',')}`}
            className="btn-primary text-sm">
            <GitCompare size={15} /> Compare {selected.length} Selected
          </Link>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: summary.total || 0, color: 'text-gray-700' },
          { label: 'Shortlisted (≥70%)', value: summary.shortlisted || 0, color: 'text-green-600' },
          { label: 'Needs Review', value: summary.needs_review || 0, color: 'text-amber-600' },
          { label: 'Average Score', value: `${summary.average_score || 0}%`, color: 'text-primary-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 w-56" placeholder="Search candidate…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select className="input py-1.5 text-sm w-40" value={minScore} onChange={e => setMinScore(Number(e.target.value))}>
            <option value={0}>All scores</option>
            <option value={70}>≥ 70% (Shortlisted)</option>
            <option value={50}>≥ 50% (Moderate)</option>
            <option value={85}>≥ 85% (Excellent)</option>
          </select>
        </div>
        {selected.length > 0 && (
          <button onClick={() => setSelected([])} className="btn-ghost text-xs text-red-500">
            Clear selection ({selected.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500">
                <th className="px-4 py-3 text-left w-8"><input type="checkbox" onChange={e => setSelected(e.target.checked ? sorted.map(c => c.analysis_id) : [])} /></th>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => toggleSort('overall_score')}>
                  <span className="flex items-center gap-1">Score <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => toggleSort('skill_coverage')}>
                  <span className="flex items-center gap-1">Coverage <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 text-left cursor-pointer" onClick={() => toggleSort('experience_years')}>
                  <span className="flex items-center gap-1">Exp <ArrowUpDown size={12} /></span>
                </th>
                <th className="px-4 py-3 text-left">Gaps</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-gray-400">No candidates found</td></tr>
              ) : sorted.map((c, i) => (
                <tr key={c.analysis_id} className={`hover:bg-gray-50 transition-colors ${selected.includes(c.analysis_id) ? 'bg-primary-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(c.analysis_id)}
                      onChange={() => toggleSelect(c.analysis_id)} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-medium">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{c.candidate_name}</div>
                    <div className="text-xs text-gray-400">{c.email || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ScoreRing score={c.overall_score} color={scoreColor(c.overall_score)} size={40} showLabel={false} />
                      <div>
                        <div className="font-bold text-gray-900">{c.overall_score}%</div>
                        <div className="text-xs text-gray-400">{c.match_label}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900 font-medium">{c.skill_coverage}%</div>
                    <div className="text-xs text-gray-400">{c.fully_matched}/{c.total_requirements} matched</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.experience_years}y</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.missing > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {c.missing} missing
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.overall_score >= 70 ? 'bg-green-100 text-green-700'
                      : c.overall_score >= 50 ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {c.overall_score >= 70 ? 'Shortlisted' : c.overall_score >= 50 ? 'Review' : 'Not Suitable'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/recruiter/candidates/${c.analysis_id}`} className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1">
                      <Eye size={13} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
