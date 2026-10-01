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

    // Advance the visual stage indicator every ~700ms
    timerRef.current = setInterval(() => {
      stageIndex++
      if (stageIndex < STAGES.length - 1) {
        setCurrentStage(stageIndex)
      } else {
        clearInterval(timerRef.current)
      }
    }, 700)

    // Actually call the API
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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
          ) : done ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 size={32} className="text-primary-600 animate-spin" />
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900">
            {error ? 'Analysis Failed' : done ? 'Analysis Complete!' : 'Analyzing your profile…'}
          </h2>
          {!error && !done && (
            <p className="text-gray-500 text-sm mt-2">This usually takes 5–15 seconds</p>
          )}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {!error && (
          <div className="space-y-2">
            {STAGES.map((stage, i) => {
              const isActive = i === currentStage && !done
              const isDone = i < currentStage || done

              return (
                <div key={stage} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isActive ? 'bg-primary-50' : ''
                }`}>
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {isDone ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : isActive ? (
                      <Loader2 size={18} className="text-primary-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isDone ? 'text-gray-600' : isActive ? 'text-primary-700 font-medium' : 'text-gray-400'
                  }`}>{stage}</span>
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
