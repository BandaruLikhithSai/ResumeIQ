import { Link } from 'react-router-dom'
import {
  Brain, CheckCircle, ArrowRight, Zap, GitBranch,
  Target, TrendingUp, BarChart3, Lightbulb, Users,
  FileText, Search, Award
} from 'lucide-react'

const FEATURES = [
  { icon: Brain,      title: 'Explainable Matching',   desc: 'See exactly why you score what you score — no black-box percentages.' },
  { icon: GitBranch,  title: 'Knowledge Graph',         desc: 'Skill relationships mapped as a graph. Transferable skills count.' },
  { icon: Target,     title: 'Skill-Gap Analysis',      desc: 'Prioritised gaps with learning directions and time estimates.' },
  { icon: TrendingUp, title: 'What-If Simulator',       desc: 'Add skills and instantly see your projected match improvement.' },
  { icon: Search,     title: 'Semantic Understanding',  desc: 'Goes beyond keywords — understands meaning and context.' },
  { icon: Users,      title: 'Recruiter Dashboard',     desc: 'Rank, compare, and inspect multiple candidates side by side.' },
]

const STEPS = [
  { icon: FileText,  label: 'Resume Upload' },
  { icon: Brain,     label: 'NLP Extraction' },
  { icon: Search,    label: 'Skill Extraction' },
  { icon: GitBranch, label: 'Knowledge Graph' },
  { icon: BarChart3, label: 'Hybrid Matching' },
  { icon: Lightbulb, label: 'Explainable Results' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-primary-600 text-xl">
          <Brain size={24} />
          ResumeIQ
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} /> Explainable AI-Powered Resume Matching
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Understand how your resume<br />
          <span className="text-primary-600">matches the job.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Not just a score. A clear, evidence-backed explanation of why you match,
          where you fall short, and exactly what to learn next.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="btn-primary text-base px-6 py-3">
            Analyze My Resume <ArrowRight size={18} />
          </Link>
          <Link to="/login?demo=recruiter" className="btn-secondary text-base px-6 py-3">
            Recruiter Dashboard
          </Link>
        </div>

        {/* Demo badges */}
        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          {['Explainable Matching','Skill-Gap Analysis','Knowledge Graph','Semantic Understanding','Transferable Skills','What-If Simulation'].map(f => (
            <span key={f} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
              <CheckCircle size={12} className="text-green-500" /> {f}
            </span>
          ))}
        </div>
      </section>

      {/* Pipeline visualization */}
      <section className="bg-gray-50 border-y border-gray-100 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">
            How It Works
          </p>
          <div className="flex items-center justify-center gap-0 flex-wrap">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-primary-600">
                    <step.icon size={20} />
                  </div>
                  <span className="text-xs font-medium text-gray-600 text-center w-24">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-8 flex items-center justify-center mb-5">
                    <ArrowRight size={16} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Built for clarity, not complexity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Score example callout */}
      <section className="bg-primary-600 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-4">Not just "82%".</h2>
              <p className="text-primary-100 text-lg leading-relaxed">
                ResumeIQ shows you the breakdown behind every score — TF-IDF similarity, semantic match,
                knowledge-graph coverage, and experience relevance — all transparent and inspectable.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-3">
              {[
                { label: 'Skill Match',      val: 88, color: 'bg-green-400' },
                { label: 'Semantic Match',   val: 81, color: 'bg-blue-400' },
                { label: 'Knowledge Graph',  val: 79, color: 'bg-purple-400' },
                { label: 'Experience Fit',   val: 76, color: 'bg-amber-400' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm text-white/80 mb-1">
                    <span>{label}</span><span>{val}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-white/20 flex justify-between text-white font-bold">
                <span>Overall Match</span><span>82%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to understand your match?</h2>
        <p className="text-gray-500 mb-8">Upload your resume and a job description to get started in seconds.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link to="/register?role=candidate" className="btn-primary text-base px-8 py-3">
            I'm a Candidate <ArrowRight size={18} />
          </Link>
          <Link to="/register?role=recruiter" className="btn-secondary text-base px-8 py-3">
            I'm a Recruiter <Award size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        ResumeIQ — Academic Research Project · Explainable Knowledge-Graph-Guided Resume Matching
      </footer>
    </div>
  )
}
