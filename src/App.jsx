import { useState } from 'react'
import Hero from './pages/Hero'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import TaskList from './pages/TaskList'
import RewardShop from './pages/RewardShop'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import JiraAuth from './overlays/JiraAuth'

export default function App() {
  const [page, setPage] = useState('hero')
  const [showJiraAuth, setShowJiraAuth] = useState(false)
  const [userRole, setUserRole] = useState(() => localStorage.getItem('questlyUserRole') || 'developer')
  const [userXP, setUserXP] = useState(1250)
  const [userCoins, setUserCoins] = useState(125)
  const [purchased, setPurchased] = useState(new Set([3]))
  const [pendingRequests, setPendingRequests] = useState(new Set())

  const handleAuthSuccess = (role = 'developer') => {
    setUserRole(role)
    localStorage.setItem('questlyUserRole', role)
    setShowJiraAuth(true)
  }

  return (
    <>
      {page === 'hero'       && <Hero       onNavigate={setPage} />}
      {page === 'signin'     && <SignIn     onNavigate={setPage} onSuccess={() => handleAuthSuccess('developer')} />}
      {page === 'signup'     && <SignUp     onNavigate={setPage} onSuccess={handleAuthSuccess} />}
      {page === 'dashboard'  && <Dashboard  onNavigate={setPage} userRole={userRole} />}
      {page === 'tasklist'   && <TaskList   onNavigate={setPage} userRole={userRole} />}
      {page === 'rewardshop' && <RewardShop onNavigate={setPage} userRole={userRole} userCoins={userCoins} setUserCoins={setUserCoins} purchased={purchased} setPurchased={setPurchased} pendingRequests={pendingRequests} setPendingRequests={setPendingRequests} />}
      {page === 'profile'    && <Profile   onNavigate={setPage} userRole={userRole} userXP={userXP} userCoins={userCoins} purchased={purchased} pendingRequests={pendingRequests} />}
      {page === 'admin'      && <Admin     onNavigate={setPage} userRole={userRole} userXP={userXP} setUserXP={setUserXP} userCoins={userCoins} setUserCoins={setUserCoins} purchased={purchased} setPurchased={setPurchased} pendingRequests={pendingRequests} setPendingRequests={setPendingRequests} />}

      {showJiraAuth && (
        <JiraAuth
          onClose={() => setShowJiraAuth(false)}
          onConnect={() => {
            setShowJiraAuth(false)
            setPage(userRole === 'admin' ? 'admin' : 'dashboard')
          }}
        />
      )}
    </>
  )
}
