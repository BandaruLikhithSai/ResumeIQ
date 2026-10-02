import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Upload, FileText, BarChart3,
  GitBranch, History, Settings, Users, GitCompare,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import clsx from 'clsx'

const CANDIDATE_LINKS = [
  { to: '/candidate', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/candidate/upload', icon: Upload, label: 'New Analysis' },
  { to: '/candidate/history', icon: History, label: 'History' },
  { to: '/graph', icon: GitBranch, label: 'Skill Graph' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const RECRUITER_LINKS = [
  { to: '/recruiter', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/recruiter/upload', icon: Upload, label: 'Upload Resumes' },
  { to: '/recruiter/candidates', icon: Users, label: 'Candidates' },
  { to: '/recruiter/compare', icon: GitCompare, label: 'Compare' },
  { to: '/graph', icon: GitBranch, label: 'Skill Graph' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const links = user?.role === 'recruiter' ? RECRUITER_LINKS : CANDIDATE_LINKS

  return (
    <aside className="w-56 shrink-0 bg-[var(--card)] border-r border-[var(--border)] flex flex-col transition-colors">
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]'
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-[var(--border)]">
        <div className="text-xs text-[var(--text-muted)] text-center">ResumeIQ v1.0</div>
      </div>
    </aside>
  )
}
