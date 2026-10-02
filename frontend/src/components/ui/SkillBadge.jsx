import { CheckCircle, MinusCircle, ArrowUpRight, XCircle } from 'lucide-react'

// Each status has light + dark class variants
const STATUS_CONFIG = {
  fully_matched: {
    icon: CheckCircle,
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/25 dark:text-green-400 dark:border-green-800',
    iconClass: 'text-green-500 dark:text-green-400',
    label: 'Matched',
  },
  partially_matched: {
    icon: MinusCircle,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-400 dark:border-blue-800',
    iconClass: 'text-blue-500 dark:text-blue-400',
    label: 'Partial',
  },
  transferable: {
    icon: ArrowUpRight,
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/25 dark:text-purple-400 dark:border-purple-800',
    iconClass: 'text-purple-500 dark:text-purple-400',
    label: 'Transferable',
  },
  missing: {
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-400 dark:border-red-800',
    iconClass: 'text-red-500 dark:text-red-400',
    label: 'Missing',
  },
}

const CATEGORY_COLORS = {
  programming_language: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/25 dark:text-indigo-400 dark:border-indigo-800',
  framework:            'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/25 dark:text-violet-400 dark:border-violet-800',
  ml_ai:                'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-400 dark:border-blue-800',
  data_engineering:     'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/25 dark:text-teal-400 dark:border-teal-800',
  database:             'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-400 dark:border-amber-800',
  cloud:                'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/25 dark:text-sky-400 dark:border-sky-800',
  devops:               'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/25 dark:text-orange-400 dark:border-orange-800',
  mobile:               'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/25 dark:text-pink-400 dark:border-pink-800',
  testing:              'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/25 dark:text-lime-400 dark:border-lime-800',
  methodology:          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
}

/**
 * SkillBadge — renders a skill with optional match status icon
 *
 * Props:
 *   skill: string
 *   status: 'fully_matched' | 'partially_matched' | 'transferable' | 'missing' | undefined
 *   category: string (for color when no status)
 *   size: 'sm' | 'md'
 */
export default function SkillBadge({ skill, status, category, size = 'md' }) {
  if (status && STATUS_CONFIG[status]) {
    const config = STATUS_CONFIG[status]
    const Icon = config.icon
    const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-sm px-2.5 py-1 gap-1.5'
    return (
      <span className={`inline-flex items-center border rounded-full font-medium ${sizeClass} ${config.className}`}>
        <Icon size={size === 'sm' ? 12 : 14} className={config.iconClass} />
        {skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </span>
    )
  }

  const colorClass = CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${sizeClass} ${colorClass}`}>
      {skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}
