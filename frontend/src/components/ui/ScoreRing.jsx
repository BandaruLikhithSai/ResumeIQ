import { useEffect, useState } from 'react'

const COLOR_MAP = {
  green:  { ring: '#10b981', bg: '#ecfdf5', text: '#065f46' },
  blue:   { ring: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
  yellow: { ring: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  orange: { ring: '#f97316', bg: '#fff7ed', text: '#9a3412' },
  red:    { ring: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
}

export default function ScoreRing({ score = 0, color = 'blue', size = 120, label = '', showLabel = true }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference
  const colors = COLOR_MAP[color] || COLOR_MAP.blue

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#e5e7eb" strokeWidth={8}
          />
          {/* Score arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: colors.ring }}>
            {Math.round(animatedScore)}%
          </span>
        </div>
      </div>
      {showLabel && label && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: colors.bg, color: colors.text }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
