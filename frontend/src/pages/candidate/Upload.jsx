import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, Loader2, ChevronRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { resumeApi, jobApi } from '../../api'

const STEP_LABELS = ['Upload Resume', 'Job Description', 'Review & Analyze']

export default function UploadPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const [resumeFile, setResumeFile] = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)

  const [jobMode, setJobMode] = useState('text')
  const [jobText, setJobText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [jobFile, setJobFile] = useState(null)
  const [jobData, setJobData] = useState(null)
  const [jobLoading, setJobLoading] = useState(false)

  const [analyzing, setAnalyzing] = useState(false)

  const onDropResume = useCallback((files) => {
    if (files[0]) setResumeFile(files[0])
  }, [])

  const { getRootProps: getResumeRootProps, getInputProps: getResumeInputProps, isDragActive: isResumeDrag } =
    useDropzone({
      onDrop: onDropResume,
      accept: {
        'application/pdf': [],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
        'text/plain': [],
      },
      maxFiles: 1,
    })

  const uploadResume = async () => {
    if (!resumeFile) return
    setResumeLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', resumeFile)
      const { data } = await resumeApi.upload(fd)
      setResumeData(data.resume)
      toast.success('Resume processed successfully')
      setStep(1)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload resume')
    } finally {
      setResumeLoading(false)
    }
  }

  const submitJob = async () => {
    setJobLoading(true)
    try {
      let data
      if (jobMode === 'text') {
        if (!jobText.trim()) { toast.error('Please enter a job description'); setJobLoading(false); return }
        const res = await jobApi.create({ text: jobText, title: jobTitle || undefined })
        data = res.data.job
      } else {
        if (!jobFile) { toast.error('Please select a file'); setJobLoading(false); return }
        const fd = new FormData()
        fd.append('file', jobFile)
        if (jobTitle) fd.append('title', jobTitle)
        const res = await jobApi.upload(fd)
        data = res.data.job
      }
      setJobData(data)
      toast.success('Job description processed')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process job description')
    } finally {
      setJobLoading(false)
    }
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    navigate(`/candidate/processing/${resumeData.id}/${jobData.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">New Analysis</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Upload your resume and job description to get your match score
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < step
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                  : i === step
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block">{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Resume upload */}
      {step === 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Upload Your Resume</h2>
          <p className="text-sm text-[var(--text-secondary)]">Supported formats: PDF, DOCX, TXT</p>

          <div
            {...getResumeRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isResumeDrag
                ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            <input {...getResumeInputProps()} />
            <Upload size={36} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="font-medium text-[var(--text-primary)]">Drop your resume here</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">or click to browse files</p>
          </div>

          {resumeFile && (
            <div className="flex items-center gap-3 p-3 bg-[var(--surface-secondary)] rounded-lg border border-[var(--border)]">
              <FileText size={20} className="text-[var(--accent)]" />
              <span className="text-sm font-medium flex-1 truncate text-[var(--text-primary)]">{resumeFile.name}</span>
              <span className="text-xs text-[var(--text-muted)]">{(resumeFile.size / 1024).toFixed(0)} KB</span>
              <button
                onClick={() => setResumeFile(null)}
                className="text-[var(--text-muted)] hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <button
            onClick={uploadResume}
            disabled={!resumeFile || resumeLoading}
            className="btn-primary w-full justify-center py-2.5"
          >
            {resumeLoading
              ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
              : <>Continue <ChevronRight size={16} /></>}
          </button>
        </div>
      )}

      {/* Step 1: Job description */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Add Job Description</h2>

          {/* Mode toggle */}
          <div className="flex gap-2">
            {['text', 'file'].map(m => (
              <button
                key={m}
                onClick={() => setJobMode(m)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  jobMode === m
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                {m === 'text' ? 'Paste Text' : 'Upload File'}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Job Title (optional)</label>
            <input
              className="input"
              placeholder="e.g. Machine Learning Engineer"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
          </div>

          {jobMode === 'text' ? (
            <div>
              <label className="label">Job Description</label>
              <textarea
                className="input resize-none"
                rows={10}
                placeholder="Paste the full job description here..."
                value={jobText}
                onChange={e => setJobText(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="label">Upload Job Description File</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={e => setJobFile(e.target.files[0])}
                className="block w-full text-sm text-[var(--text-secondary)]
                           file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                           file:text-sm file:font-medium
                           file:bg-[var(--accent-subtle)] file:text-[var(--accent)]
                           hover:file:bg-[var(--border)]"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary flex-1 justify-center">Back</button>
            <button onClick={submitJob} disabled={jobLoading} className="btn-primary flex-1 justify-center">
              {jobLoading
                ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                : <>Continue <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review & analyze */}
      {step === 2 && resumeData && jobData && (
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Review &amp; Analyze</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Resume</p>
              <p className="font-medium text-[var(--text-primary)] text-sm">
                {resumeData.candidate_name || resumeData.filename}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {resumeData.skills?.length || 0} skills detected · {resumeData.extraction_status}
              </p>
            </div>
            <div className="p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Job Description</p>
              <p className="font-medium text-[var(--text-primary)] text-sm">{jobData.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {jobData.skills?.length || 0} requirements · {jobData.domain || 'General'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3
                          bg-amber-50 dark:bg-amber-900/20
                          border border-amber-200 dark:border-amber-800
                          rounded-lg text-sm
                          text-amber-700 dark:text-amber-400">
            <Info size={15} className="mt-0.5 shrink-0" />
            Analysis typically takes 5–15 seconds. The system will run NLP extraction,
            semantic matching, and knowledge-graph scoring.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">Back</button>
            <button onClick={runAnalysis} disabled={analyzing} className="btn-primary flex-1 justify-center py-2.5">
              {analyzing
                ? <><Loader2 size={16} className="animate-spin" /> Starting...</>
                : 'Run Analysis →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
