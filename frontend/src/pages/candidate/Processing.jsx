import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { analysisApi } from '../../api'

const STAGES = [
  'Validating documents',
  'Running text analysis',
  'Extracting skills',
  'Building candidate profile',
  'Analyzing job requirements',
  'Computing TF-IDF similarity',
  'Running semantic matching',
  'Traversing knowledge graph',
  'Calculating experience fit',
  'Generating explanation',
  'Preparing skill-gap report',
  'Finalizing results',
]

export default function ProcessingPage() {
  const { resumeId, jobId } = useParams()
  const navigate = useNavigate()

  const [currentStage, setCurrentStage] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const analysisIdRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    let stageIndex = 0

    timerRef.current = setInterval(() => {
      stageIndex++
      if (stageIndex < STAGES.length - 1) {
        setCurrentStage(stageIndex)
      } else {
        clearInterval(timerRef.current)
      }
    }, 700)

    analysisApi.run({ resume_id: Number(resumeId), job_id: Number(jobId) })
      .then(({ data }) => {
        clearInterval(timerRef.current)
        setCurrentStage(STAGES.length - 1)
        analysisIdRef.current = data.analysis.id
        setDone(true)
        setTimeout(() => navigate(`/analysis/${data.analysis.id}`), 800)
      })
      .catch((err) => {
        clearInterval(timerRef.current)
        setError(err.response?.data?.error || 'Analysis failed. Please try again.')
      })

    return () => clearInterval(timerRef.current)
  }, [resumeId, jobId, navigate])

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full card p-8">
        <div className="text-center mb-8">
          {error ? (
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500 dark:text-red-400" />
            </div>
          ) : done ? (
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500 dark:text-green-400" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 size={32} className="text-primary-600 dark:text-primary-400 animate-spin" />
            </div>
          )}
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {error ? 'Analysis Failed' : done ? 'Analysis Complete!' : 'Analyzing your profile…'}
          </h2>
          {!error && !done && (
            <p className="text-[var(--text-secondary)] text-sm mt-2">This usually takes 5–15 seconds</p>
          )}
          {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {!error && (
          <div className="space-y-2">
            {STAGES.map((stage, i) => {
              const isActive = i === currentStage && !done
              const isDone = i < currentStage || done

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-[var(--accent-subtle)]' : ''
                  }`}
                >
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {isDone ? (
                      <CheckCircle size={18} className="text-green-500 dark:text-green-400" />
                    ) : isActive ? (
                      <Loader2 size={18} className="text-[var(--accent)] animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-[var(--border)]" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isDone
                      ? 'text-[var(--text-secondary)]'
                      : isActive
                        ? 'text-[var(--accent)] font-medium'
                        : 'text-[var(--text-muted)]'
                  }`}>
                    {stage}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <div className="text-center mt-4">
            <button onClick={() => navigate('/candidate/upload')} className="btn-primary">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
