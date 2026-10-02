import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, GitBranch, TrendingUp, Target,
  CheckCircle, XCircle, ArrowUpRight, MinusCircle,
} from 'lucide-react'
import { analysisApi, resumeApi, jobApi } from '../../api'
import ScoreRing from '../../components/ui/ScoreRing'
import { scoreColor, capitalize } from '../../utils/helpers'

export default function CandidateDetail() {
  const { analysisId } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [resume, setResume] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analysisApi.get(analysisId)
      .then(({ data }) => {
        setAnalysis(data)
        return Promise.all([resumeApi.get(data.resume_id), jobApi.get(data.job_id)])
      })
      .then(([r, j]) => { setResume(r.data); setJob(j.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [analysisId])

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 skeleton rounded-xl" />)}
    </div>
  )
  if (!analysis) return (
    <div className="text-[var(--text-muted)] text-center py-20">Not found</div>
  )

  const { skill_matches = [], component_scores = {}, strengths = [], weaknesses = [] } = analysis

  // Status config with dark-mode variants
  const STATUS_CFG = {
    fully_matched: {
      icon: <CheckCircle size={15} className="text-green-500 dark:text-green-400" />,
      label: 'Matched',
      cls: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/25',
    },
    partially_matched: {
      icon: <MinusCircle size={15} className="text-blue-500 dark:text-blue-400" />,
      label: 'Partial',
      cls: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/25',
    },
    transferable: {
      icon: <ArrowUpRight size={15} className="text-purple-500 dark:text-purple-400" />,
      label: 'Transferable',
      cls: 'text-purple-700 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/25',
    },
    missing: {
      icon: <XCircle size={15} className="text-red-400 dark:text-red-400" />,
      label: 'Missing',
      cls: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/25',
    },
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/recruiter/candidates" className="btn-ghost px-2">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{resume?.candidate_name || 'Candidate'}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {resume?.email} · {job?.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/analysis/${analysisId}/skills`} className="btn-secondary text-sm">
            <Target size={14} /> Skills
          </Link>
          <Link to={`/analysis/${analysisId}/whatif`} className="btn-secondary text-sm">
            <TrendingUp size={14} /> What-If
          </Link>
          <Link to={`/graph/${analysisId}`} className="btn-secondary text-sm">
            <GitBranch size={14} /> Graph
          </Link>
        </div>
      </div>

      {/* Score panel */}
      <div className="card p-6 flex flex-col md:flex-row items-center gap-8">
        <ScoreRing
          score={analysis.overall_score}
          color={scoreColor(analysis.overall_score)}
          size={160}
          label={analysis.match_label}
        />
        <div className="flex-1 w-full space-y-3">
          {[
            { label: 'TF-IDF Similarity',   value: component_scores.tfidf,          color: 'bg-indigo-500 dark:bg-indigo-400' },
            { label: 'Semantic Match',       value: component_scores.semantic,        color: 'bg-blue-500 dark:bg-blue-400' },
            { label: 'Knowledge Graph',      value: component_scores.knowledge_graph, color: 'bg-purple-500 dark:bg-purple-400' },
            { label: 'Experience Relevance', value: component_scores.experience,      color: 'bg-teal-500 dark:bg-teal-400' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="font-bold text-[var(--text-primary)]">{Math.round(value || 0)}%</span>
              </div>
              <div className="h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${value || 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requirement table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="section-title">Requirement Coverage</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="px-5 py-3 text-left">Job Requirement</th>
                <th className="px-5 py-3 text-left">Priority</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Matched Via</th>
                <th className="px-5 py-3 text-left">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {skill_matches.map(sm => {
                const cfg = STATUS_CFG[sm.match_status] || {}
                return (
                  <tr key={sm.job_skill} className="hover:bg-[var(--surface-secondary)] transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)] capitalize">
                      {sm.job_skill.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        sm.job_skill_priority === 'required'
                          ? 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-900/25 dark:text-blue-400'
                      }`}>
                        {sm.job_skill_priority || 'required'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] text-xs max-w-xs truncate">
                      {sm.transfer_path || sm.matched_candidate_skill || '—'}
                    </td>
                    <td className="px-5 py-3 font-medium text-[var(--text-secondary)]">
                      {Math.round((sm.match_score || 0) * 100)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanation */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2 text-sm">
            <CheckCircle size={15} /> Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                <span className="text-green-500 dark:text-green-400 shrink-0">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2 text-sm">
            <XCircle size={15} /> Gaps
          </h3>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                <span className="text-red-400 shrink-0">✕</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
