import { Outlet, Link } from 'react-router-dom'
import { Brain } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex flex-col">
      <header className="p-6">
        <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl w-fit">
          <Brain size={24} />
          ResumeIQ
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <Outlet />
      </div>
      <footer className="p-6 text-center text-sm text-gray-400">
        © 2024 ResumeIQ — Academic Project
      </footer>
    </div>
  )
}
