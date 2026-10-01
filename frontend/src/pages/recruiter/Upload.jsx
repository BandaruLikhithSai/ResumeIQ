import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, X, ChevronRight, Loader2,
  CheckCircle, AlertCircle, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { resumeApi, jobApi, analysisApi } from '../../api'

export default function RecruiterUpload() {
  const navigate = useNavigate()

  const [step, setStep] = useState(0) // 0=job, 1=resumes, 2=processing
  const [jobText, setJobText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobData, setJobData] = useState(null)
  const [jobLoading, setJobLoading] = useState(false)

  const [files, setFiles] = useState([])
  const [results, setResults] = useState([])
  const [processing, setProcessing] = useState(false)

  const onDrop = useCallback((accepted) => {
    setFiles(prev => [...prev, ...accepted.map(f => ({ file: f, status: 'pending', resumeId: null, analysisId: null, error: null }))])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [], 'text/plain': [] },
  })

  const submitJob = async () => {
    if (!jobText.trim()) { toast.error('Enter a job description'); return }
    setJobLoading(true)
    try {
      const { data } = await jobApi.create({ text: jobText, title: jobTitle || undefined })
      setJobData(data.job)
      toast.success('Job description processed')
      setStep(1)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed')
    } finally {
      setJobLoading(false)
    }
  }

  const processAll = async () => {
    if (files.length === 0) { toast.error('Add at least one resume'); return }
    setProcessing(true)
    setStep(2)
    const resultRows = []

    for (let i = 0; i < files.length; i++) {
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))

      try {
        const fd = new FormData()
        fd.append('file', files[i].file)
        const { data: rData } = await resumeApi.upload(fd)
        const resumeId = rData.resume.id

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'analyzing', resumeId } : f))

        const { data: aData } = await analysisApi.run({ resume_id: resumeId, job_id: jobData.id })
        const analysis = aData.analysis

        resultRows.push({
          name: rData.resume.candidate_name || files[i].file.name,
          score: analysis.overall_score,
          label: analysis.match_label,
          analysisId: analysis.id,
        })

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done', resumeId, analysisId: analysis.id } : f))
      } catch (err) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: err.response?.data?.error || 'Failed' } : f))
      }
    }

    setResults(resultRows.sort((a, b) => b.score - a.score))
    setProcessing(false)
  }

  const STATUS_ICON = {
    pending:   <div className="w-4 h-4 rounded-full border-2 border-gray-300" />,
    uploading: <Loader2 size={16} className="animate-spin text-blue-500" />,
    analyzing: <Loader2 size={16} className="animate-spin text-primary-500" />,
    done:      <CheckCircle size={16} className="text-green-500" />,
    error:     <AlertCircle size={16} className="text-red-500" />,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="page-title">Upload Resumes</h1>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {['Job Description', 'Upload Resumes', 'Process & Rank'].map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < step ? 'bg-primary-600 border-primary-600 text-white'
                : i === step ? 'border-primary-600' : 'border-gray-300'
              }`}>{i < step ? '✓' : i + 1}</div>
              <span className="text-xs font-medium hidden md:block">{s}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-primary-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Job */}
      {step === 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Enter Job Description</h2>
          <div>
            <label className="label">Job Title (optional)</label>
            <input className="input" placeholder="e.g. Senior Backend Developer"
              value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Job Description *</label>
            <textarea className="input resize-none" rows={10}
              placeholder="Paste the full job description…"
              value={jobText} onChange={e => setJobText(e.target.value)} />
          </div>
          <button onClick={submitJob} disabled={jobLoading} className="btn-primary w-full justify-center py-2.5">
            {jobLoading ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ChevronRight size={16} /></>}
          </button>
        </div>
      )}

      {/* Step 1: Resumes */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Upload Candidate Resumes</h2>
            <span className="text-xs text-gray-400">{files.length} file(s) added</span>
          </div>

          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            Job: <strong>{jobData?.title}</strong> · {jobData?.skills?.length || 0} requirements extracted
          </div>

          <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}>
            <input {...getInputProps()} />
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="font-medium text-gray-700 text-sm">Drop resumes here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT · Multiple files supported</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <FileText size={16} className="text-primary-500 shrink-0" />
                  <span className="text-sm flex-1 truncate">{f.file.name}</span>
                  <span className="text-xs text-gray-400">{(f.file.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1 justify-center">Back</button>
            <button onClick={processAll} disabled={files.length === 0} className="btn-primary flex-1 justify-center py-2.5">
              Process {files.length} Resume{files.length !== 1 ? 's' : ''} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Results */}
      {step === 2 && (
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Processing Results</h2>

          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                {STATUS_ICON[f.status]}
                <span className="text-sm flex-1 truncate">{f.file.name}</span>
                <span className={`text-xs font-medium ${
                  f.status === 'done' ? 'text-green-600'
                  : f.status === 'error' ? 'text-red-600'
                  : 'text-gray-500'
                }`}>
                  {f.status === 'error' ? f.error : f.status}
                </span>
                {f.analysisId && (
                  <a href={`/analysis/${f.analysisId}`} className="text-primary-600 text-xs underline">View</a>
                )}
              </div>
            ))}
          </div>

          {!processing && results.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Ranked Results</h3>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={r.analysisId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 text-sm font-bold text-gray-400">#{i + 1}</span>
                    <span className="flex-1 font-medium text-gray-900 text-sm">{r.name}</span>
                    <span className="font-bold text-gray-900">{r.score}%</span>
                    <span className="text-xs text-gray-500">{r.label}</span>
                    <a href={`/analysis/${r.analysisId}`} className="btn-secondary text-xs py-1 px-2.5">View</a>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => navigate('/recruiter/candidates')} className="btn-primary flex-1 justify-center">
                  View All Candidates
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
