import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User, Brain, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import useAuthStore from '../../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-30">
      <Link to={user ? (user.role === 'recruiter' ? '/recruiter' : '/candidate') : '/'} className="flex items-center gap-2 font-bold text-primary-600 text-lg mr-8">
        <Brain size={22} />
        ResumeIQ
      </Link>

      <div className="flex-1" />

      {user && (
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700">
            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block">{user.full_name}</span>
            <span className="hidden sm:block text-xs text-gray-400 capitalize">({user.role})</span>
            <ChevronDown size={14} />
          </button>

          {open && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
              <Link to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <User size={14} /> Profile & Settings
              </Link>
              <hr className="my-1 border-gray-100" />
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
