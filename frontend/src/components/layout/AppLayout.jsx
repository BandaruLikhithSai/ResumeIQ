import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg)] transition-colors">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[var(--bg)] p-6 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
