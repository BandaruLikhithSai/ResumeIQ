import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  TrendingUp, Plus, X, Play, ArrowLeft,
  CheckCircle, ArrowRight, Info, Loader2
} from 'lucide-react'
import { analysisApi, jobApi } from '../../api'
import ScoreRing from '../../components/ui/ScoreRing'
import { scoreColor, capitalize } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function WhatIfPage() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedSkills, setSelectedSkills] = useState([])
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)

  useEffect(() => {
    analysisApi.get(id)
      .then(({ data }) => {
        setAnalysis(data)
        return jobApi.get(data.job_id)
      })
      .then(({ data }) => setJob(data))
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

  const missingSkills = (analysis.skill_matches || [])
    .filter(sm => sm.match_status === 'missing' || sm.match_status === 'partially_matched')
    .map(sm => sm.job_skill)

  const partialSkills = (analysis.skill_matches || [])
    .filter(sm => sm.match_status === 'transferable')
    .map(sm => sm.job_skill)

  const toggle = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
    setSimResult(null)
  }

  const runSimulation = async () => {
    if (selectedSkills.length === 0) { toast.error('Select at least one skill to simulate'); return }
    setSimulating(true)
    try {
      const { data } = await analysisApi.simulate(id, { added_skills: selectedSkills })
      setSimResult(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulation failed')
    } finally {
      setSimulating(false)
    }
  }

  const originalScore = analysis.overall_score || 0
  const simScore = simResult?.simulated_score || originalScore
  const delta = simResult?.score_delta || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/analysis/${id}`} className="btn-ghost text-sm px-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp size={22} className="text-[var(--accent)]" /> What-If Simulator
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Select skills to add and see your projected match improvement
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3
                      bg-amber-50 dark:bg-amber-900/20
                      border border-amber-200 dark:border-amber-800
                      rounded-lg text-sm text-amber-700 dark:text-amber-400">
        <Info size={15} className="mt-0.5 shrink-0" />
        Simulated scores are estimates using the same matching algorithm — not guarantees of real-world outcomes.
      </div>

      {/* Score comparison */}
      <div className="card p-6">
        <h3 className="section-title mb-6">Score Comparison</h3>
        <div className="flex items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Current Score</div>
            <ScoreRing score={originalScore} color={scoreColor(originalScore)} size={130} label="Current" />
          </div>

          <div className="text-center">
            <div className={`text-3xl font-black ${delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-muted)]'}`}>
              {delta > 0 ? `+${delta.toFixed(1)}` : '—'}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">points</div>
            <ArrowRight size={24} className="mx-auto mt-2 text-[var(--border-hover)]" />
          </div>

          <div className="text-center">
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Simulated Score</div>
            <ScoreRing score={simScore} color={scoreColor(simScore)} size={130} label={simResult ? 'Simulated' : 'Projected'} />
          </div>
        </div>
      </div>

      {/* Skill selector */}
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Select Skills to Add</h3>

        {missingSkills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              Missing / Partial Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggle(skill)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    selectedSkills.includes(skill)
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  {selectedSkills.includes(skill) ? <CheckCircle size={13} /> : <Plus size={13} />}
                  {capitalize(skill)}
                </button>
              ))}
            </div>
          </div>
        )}

        {partialSkills.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
              Transferable → Direct Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {partialSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => toggle(skill)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    selectedSkills.includes(skill)
                      ? 'bg-purple-600 dark:bg-purple-700 text-white border-purple-600 dark:border-purple-700'
                      : 'bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-purple-400 dark:hover:border-purple-600'
                  }`}
                >
                  {selectedSkills.includes(skill) ? <CheckCircle size={13} /> : <Plus size={13} />}
                  {capitalize(skill)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected skills summary */}
        {selectedSkills.length > 0 && (
          <div className="p-3 bg-[var(--accent-subtle)] border border-[var(--border)] rounded-lg flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-[var(--accent)]">Selected:</span>
            {selectedSkills.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-[var(--card)] text-[var(--accent)] border border-[var(--border)] text-xs px-2 py-1 rounded-full">
                {capitalize(s)}
                <button
                  onClick={() => toggle(s)}
                  className="hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          onClick={runSimulation}
          disabled={simulating || selectedSkills.length === 0}
          className="btn-primary w-full justify-center py-2.5"
        >
          {simulating
            ? <><Loader2 size={16} className="animate-spin" /> Simulating…</>
            : <><Play size={16} /> Simulate Improvement</>}
        </button>
      </div>

      {/* Changes */}
      {simResult?.changes?.length > 0 && (
        <div className="card p-6">
          <h3 className="section-title mb-4">Requirement Changes</h3>
          <div className="divide-y divide-[var(--border)]">
            {simResult.changes.map((change, i) => (
              <div key={i} className="py-3 flex items-center gap-4 text-sm">
                <span className="font-medium text-[var(--text-primary)] capitalize flex-1">
                  {change.skill.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <StatusPill status={change.from_status} />
                  <ArrowRight size={14} className="text-[var(--text-muted)]" />
                  <StatusPill status={change.to_status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_STYLES = {
  fully_matched:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  partially_matched:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  transferable:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  missing:          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABELS = {
  fully_matched: 'Matched', partially_matched: 'Partial',
  transferable: 'Transferable', missing: 'Missing',
}

function StatusPill({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
