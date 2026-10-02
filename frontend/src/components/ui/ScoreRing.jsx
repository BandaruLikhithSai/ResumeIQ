import { useEffect, useState } from 'react'

// Light-mode colors stay rich; dark-mode uses slightly brightened variants
const COLOR_MAP = {
  green:  {
    ring: '#10b981', bg: '#ecfdf5', text: '#065f46',
    ringDark: '#34d399', bgDark: 'rgba(52,211,153,0.1)', textDark: '#6ee7b7',
  },
  blue:   {
    ring: '#3b82f6', bg: '#eff6ff', text: '#1e40af',
    ringDark: '#60a5fa', bgDark: 'rgba(96,165,250,0.1)', textDark: '#93c5fd',
  },
  yellow: {
    ring: '#f59e0b', bg: '#fffbeb', text: '#92400e',
    ringDark: '#fbbf24', bgDark: 'rgba(251,191,36,0.1)', textDark: '#fde68a',
  },
  orange: {
    ring: '#f97316', bg: '#fff7ed', text: '#9a3412',
    ringDark: '#fb923c', bgDark: 'rgba(251,146,60,0.1)', textDark: '#fed7aa',
  },
  red:    {
    ring: '#ef4444', bg: '#fef2f2', text: '#991b1b',
    ringDark: '#f87171', bgDark: 'rgba(248,113,113,0.1)', textDark: '#fca5a5',
  },
}

export default function ScoreRing({ score = 0, color = 'blue', size = 120, label = '', showLabel = true }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  // Detect dark mode by checking the html element's class
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference
  const cm = COLOR_MAP[color] || COLOR_MAP.blue

  const ringColor  = dark ? cm.ringDark  : cm.ring
  const trackColor = dark ? '#2a3348'    : '#e5e7eb'
  const labelBg    = dark ? cm.bgDark    : cm.bg
  const labelText  = dark ? cm.textDark  : cm.text

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={trackColor} strokeWidth={8}
          />
          {/* Score arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: ringColor }}>
            {Math.round(animatedScore)}%
          </span>
        </div>
      </div>
      {showLabel && label && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: labelBg, color: labelText }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
