import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { RoleProvider } from './context/RoleContext.jsx'
import RoleSwitch from './components/RoleSwitch.jsx'
import PostSurplus from './pages/PostSurplus.jsx'
import MatchClaim from './pages/MatchClaim.jsx'
import StatusBoard from './pages/StatusBoard.jsx'
import Impact from './pages/Impact.jsx'
import ListingDetail from './pages/ListingDetail.jsx'

const tabClass = ({ isActive }) =>
  'flex-1 min-h-12 min-w-12 py-3 text-center text-sm font-semibold ' +
  (isActive ? 'text-green-700' : 'text-gray-500')

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
        <div className="mx-auto min-h-screen max-w-[390px] overflow-x-hidden bg-white pb-24">
          <header className="flex items-center justify-between gap-2 border-b p-3">
            <h1 className="text-lg font-bold text-green-700">Rescue the Surplus</h1>
            <RoleSwitch />
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/post" replace />} />
              <Route path="/post" element={<PostSurplus />} />
              <Route path="/match" element={<MatchClaim />} />
              <Route path="/status" element={<StatusBoard />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
            </Routes>
          </main>
          <nav className="fixed bottom-0 left-1/2 flex w-full max-w-[390px] -translate-x-1/2 border-t bg-white">
            <NavLink to="/post" className={tabClass}>Post</NavLink>
            <NavLink to="/match" className={tabClass}>Match</NavLink>
            <NavLink to="/status" className={tabClass}>Status</NavLink>
            <NavLink to="/impact" className={tabClass}>Impact</NavLink>
          </nav>
        </div>
      </RoleProvider>
    </BrowserRouter>
  )
}
