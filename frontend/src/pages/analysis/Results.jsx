import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle, MinusCircle, ArrowUpRight, XCircle,
  ChevronDown, ChevronUp, ArrowRight, GitBranch, Target, TrendingUp, Info
} from 'lucide-react'
import { analysisApi, resumeApi, jobApi } from '../../api'
import ScoreRing from '../../components/ui/ScoreRing'
import SkillBadge from '../../components/ui/SkillBadge'
import { scoreColor, capitalize } from '../../utils/helpers'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function AnalysisResults() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [resume, setResume] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedSkill, setExpandedSkill] = useState(null)

  useEffect(() => {
    analysisApi.get(id)
      .then(({ data }) => {
        setAnalysis(data)
        return Promise.all([resumeApi.get(data.resume_id), jobApi.get(data.job_id)])
      })
      .then(([rRes, jRes]) => {
        setResume(rRes.data)
        setJob(jRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <ResultsSkeleton />
  if (!analysis) return <div className="text-center py-20 text-gray-400">Analysis not found</div>

  const { skill_matches = [], component_scores = {}, counts = {}, strengths = [], weaknesses = [] } = analysis

  const fullyMatched    = skill_matches.filter(s => s.match_status === 'fully_matched')
  const partialMatched  = skill_matches.filter(s => s.match_status === 'partially_matched')
  const transferable    = skill_matches.filter(s => s.match_status === 'transferable')
  const missing         = skill_matches.filter(s => s.match_status === 'missing')

  const radarData = [
    { subject: 'Skills',     value: component_scores.knowledge_graph || 0 },
    { subject: 'Semantic',   value: component_scores.semantic || 0 },
    { subject: 'TF-IDF',     value: component_scores.tfidf || 0 },
    { subject: 'Experience', value: component_scores.experience || 0 },
  ]

  const color = scoreColor(analysis.overall_score)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Match Results</h1>
          <p className="text-gray-500 text-sm mt-1">
            {resume?.candidate_name || 'Candidate'} → {job?.title || 'Position'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/analysis/${id}/skills`} className="btn-secondary text-sm">
            <Target size={15} /> Skill Gap
          </Link>
          <Link to={`/analysis/${id}/whatif`} className="btn-secondary text-sm">
            <TrendingUp size={15} /> What-If
          </Link>
          <Link to={`/graph/${id}`} className="btn-secondary text-sm">
            <GitBranch size={15} /> Skill Graph
          </Link>
        </div>
      </div>

      {/* Score hero card */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score ring */}
          <div className="flex flex-col items-center">
            <ScoreRing score={analysis.overall_score} color={color} size={160} label={analysis.match_label} />
          </div>

          {/* Component scores */}
          <div className="flex-1 w-full space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm mb-4">Score Breakdown</h3>
            {[
              { label: 'TF-IDF Similarity',    value: component_scores.tfidf,          color: 'bg-indigo-500',  weight: analysis.weights?.tfidf },
              { label: 'Semantic Match',        value: component_scores.semantic,        color: 'bg-blue-500',    weight: analysis.weights?.semantic },
              { label: 'Knowledge Graph',       value: component_scores.knowledge_graph, color: 'bg-purple-500',  weight: analysis.weights?.knowledge_graph },
              { label: 'Experience Relevance',  value: component_scores.experience,      color: 'bg-teal-500',    weight: analysis.weights?.experience },
            ].map(({ label, value, color: barColor, weight }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">weight {Math.round((weight || 0) * 100)}%</span>
                    <span className="font-bold text-gray-900 w-10 text-right">{Math.round(value || 0)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all`}
                    style={{ width: `${value || 0}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Radar chart */}
          <div className="w-48 h-48 shrink-0 hidden lg:block">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                <Tooltip formatter={v => `${Math.round(v)}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Requirement coverage bar */}
      <div className="card p-6">
        <h3 className="section-title mb-4">Requirement Coverage</h3>
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-3">
          {counts.fully_matched > 0    && <div className="bg-green-500 transition-all"  style={{ flex: counts.fully_matched }} />}
          {counts.partially_matched > 0 && <div className="bg-blue-400 transition-all"   style={{ flex: counts.partially_matched }} />}
          {counts.transferable > 0     && <div className="bg-purple-400 transition-all" style={{ flex: counts.transferable }} />}
          {counts.missing > 0          && <div className="bg-red-300 transition-all"    style={{ flex: counts.missing }} />}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { label: 'Fully Matched',   count: counts.fully_matched,    color: 'bg-green-500' },
            { label: 'Partial Match',   count: counts.partially_matched, color: 'bg-blue-400' },
            { label: 'Transferable',    count: counts.transferable,     color: 'bg-purple-400' },
            { label: 'Missing',         count: counts.missing,          color: 'bg-red-300' },
          ].map(({ label, count, color: dotColor }) => (
            <div key={label} className="flex items-center gap-2 text-gray-600">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
              <span>{count} {label}</span>
            </div>
          ))}
          <span className="text-gray-400">/ {counts.total} total</span>
        </div>
      </div>

      {/* Skill matches grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkillGroup title="Fully Matched" icon={<CheckCircle size={16} className="text-green-600" />}
          color="border-green-200 bg-green-50" skills={fullyMatched} status="fully_matched" expandedSkill={expandedSkill} setExpandedSkill={setExpandedSkill} />
        <SkillGroup title="Partially Matched" icon={<MinusCircle size={16} className="text-blue-600" />}
          color="border-blue-200 bg-blue-50" skills={partialMatched} status="partially_matched" expandedSkill={expandedSkill} setExpandedSkill={setExpandedSkill} />
        <SkillGroup title="Transferable Skills" icon={<ArrowUpRight size={16} className="text-purple-600" />}
          color="border-purple-200 bg-purple-50" skills={transferable} status="transferable" expandedSkill={expandedSkill} setExpandedSkill={setExpandedSkill} />
        <SkillGroup title="Missing Skills" icon={<XCircle size={16} className="text-red-600" />}
          color="border-red-200 bg-red-50" skills={missing} status="missing" expandedSkill={expandedSkill} setExpandedSkill={setExpandedSkill} />
      </div>

      {/* Explanation */}
      <div className="card p-6 space-y-5">
        <h3 className="section-title">Why this score?</h3>

        {analysis.summary && (
          <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-200">
            {analysis.summary}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Strengths */}
          {strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle size={15} /> What's working in your favour
              </h4>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <XCircle size={15} /> Areas reducing your score
              </h4>
              <ul className="space-y-2">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-400 mt-0.5 shrink-0">✕</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Experience & Education */}
      {analysis.experience_match && (
        <div className="card p-6">
          <h3 className="section-title mb-4">Experience & Education Match</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <StatBox label="Required Experience" value={`${analysis.experience_match.required_years || 0}+ yrs`} />
            <StatBox label="Detected Experience" value={`${analysis.experience_match.candidate_years || 0} yrs`} />
            <StatBox label="Education" value={
              analysis.education_match?.matched
                ? `✓ ${capitalize(analysis.education_match?.candidate_edu || '')}`
                : `✕ ${capitalize(analysis.education_match?.required_edu || '')}`
            } highlight={analysis.education_match?.matched ? 'green' : 'red'} />
          </div>
        </div>
      )}

      {/* CTA row */}
      <div className="flex flex-wrap gap-3">
        <Link to={`/analysis/${id}/skills`} className="btn-primary">
          <Target size={16} /> View Skill Gap Analysis
        </Link>
        <Link to={`/analysis/${id}/whatif`} className="btn-secondary">
          <TrendingUp size={16} /> Run What-If Simulation
        </Link>
        <Link to={`/graph/${id}`} className="btn-secondary">
          <GitBranch size={16} /> Explore Skill Graph
        </Link>
      </div>
    </div>
  )
}

function SkillGroup({ title, icon, color, skills, status, expandedSkill, setExpandedSkill }) {
  if (skills.length === 0) return null
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-3 font-semibold text-sm text-gray-800">
        {icon} {title} <span className="ml-auto bg-white/70 px-2 py-0.5 rounded-full text-xs">{skills.length}</span>
      </div>
      <div className="space-y-2">
        {skills.map(sm => (
          <div key={sm.job_skill} className="bg-white/80 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSkill(expandedSkill === sm.job_skill ? null : sm.job_skill)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/50 transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                <SkillBadge skill={sm.job_skill} status={status} size="sm" />
                {sm.transfer_path && sm.transfer_path !== sm.job_skill && (
                  <span className="text-xs text-gray-400">via {sm.transfer_path}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-gray-400">{Math.round((sm.match_score || 0) * 100)}%</span>
                {expandedSkill === sm.job_skill ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>
            </button>
            {expandedSkill === sm.job_skill && sm.evidence?.length > 0 && (
              <div className="px-3 pb-3 space-y-1 border-t border-gray-100 pt-2">
                <p className="text-xs font-semibold text-gray-500 mb-1">Evidence</p>
                {sm.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <Info size={11} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>{ev.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatBox({ label, value, highlight }) {
  const color = highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-500' : 'text-gray-900'
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`font-bold text-lg ${color}`}>{value}</div>
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="h-8 skeleton w-64" />
      <div className="h-48 skeleton rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-40 skeleton rounded-xl" />)}
      </div>
    </div>
  )
}
