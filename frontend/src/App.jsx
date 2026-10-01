import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Layouts
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'

// Public
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

// Candidate
import CandidateDashboard from './pages/candidate/Dashboard'
import UploadPage from './pages/candidate/Upload'
import ProcessingPage from './pages/candidate/Processing'

// Analysis results
import AnalysisResults from './pages/analysis/Results'
import SkillGapPage from './pages/analysis/SkillGap'
import WhatIfPage from './pages/analysis/WhatIf'
import GraphExplorer from './pages/analysis/GraphExplorer'

// Recruiter
import RecruiterDashboard from './pages/recruiter/Dashboard'
import RecruiterUpload from './pages/recruiter/Upload'
import CandidatesList from './pages/recruiter/CandidatesList'
import CandidateDetail from './pages/recruiter/CandidateDetail'
import ComparisonPage from './pages/recruiter/Comparison'

// Shared
import HistoryPage from './pages/History'
import SettingsPage from './pages/Settings'

function RequireAuth({ children, role }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'recruiter' ? '/recruiter' : '/candidate'} replace />
  }
  return children
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={user?.role === 'recruiter' ? '/recruiter' : '/candidate'} replace />
            : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated
            ? <Navigate to={user?.role === 'recruiter' ? '/recruiter' : '/candidate'} replace />
            : <Register />
        } />
      </Route>

      {/* Authenticated app shell */}
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>

        {/* Candidate routes */}
        <Route path="/candidate" element={
          <RequireAuth role="candidate"><CandidateDashboard /></RequireAuth>
        } />
        <Route path="/candidate/upload" element={
          <RequireAuth role="candidate"><UploadPage /></RequireAuth>
        } />
        <Route path="/candidate/processing/:resumeId/:jobId" element={
          <RequireAuth role="candidate"><ProcessingPage /></RequireAuth>
        } />
        <Route path="/candidate/history" element={
          <RequireAuth role="candidate"><HistoryPage /></RequireAuth>
        } />

        {/* Analysis routes (accessible by both roles) */}
        <Route path="/analysis/:id" element={<RequireAuth><AnalysisResults /></RequireAuth>} />
        <Route path="/analysis/:id/skills" element={<RequireAuth><SkillGapPage /></RequireAuth>} />
        <Route path="/analysis/:id/whatif" element={<RequireAuth><WhatIfPage /></RequireAuth>} />

        {/* Graph explorer */}
        <Route path="/graph" element={<RequireAuth><GraphExplorer /></RequireAuth>} />
        <Route path="/graph/:analysisId" element={<RequireAuth><GraphExplorer /></RequireAuth>} />

        {/* Recruiter routes */}
        <Route path="/recruiter" element={
          <RequireAuth role="recruiter"><RecruiterDashboard /></RequireAuth>
        } />
        <Route path="/recruiter/upload" element={
          <RequireAuth role="recruiter"><RecruiterUpload /></RequireAuth>
        } />
        <Route path="/recruiter/candidates" element={
          <RequireAuth role="recruiter"><CandidatesList /></RequireAuth>
        } />
        <Route path="/recruiter/candidates/:analysisId" element={
          <RequireAuth role="recruiter"><CandidateDetail /></RequireAuth>
        } />
        <Route path="/recruiter/compare" element={
          <RequireAuth role="recruiter"><ComparisonPage /></RequireAuth>
        } />
        <Route path="/recruiter/history" element={
          <RequireAuth role="recruiter"><HistoryPage /></RequireAuth>
        } />

        {/* Shared */}
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
