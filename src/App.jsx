import { useState } from 'react'
import Hero from './pages/Hero'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import TaskList from './pages/TaskList'
import RewardShop from './pages/RewardShop'
import Profile from './pages/Profile'
import JiraAuth from './overlays/JiraAuth'

export default function App() {
  const [page, setPage] = useState('hero')
  const [showJiraAuth, setShowJiraAuth] = useState(false)
  const [userXP, setUserXP] = useState(1250)
  const [purchased, setPurchased] = useState(new Set([3]))

  return (
    <>
      {page === 'hero'      && <Hero      onNavigate={setPage} />}
      {page === 'signin'    && <SignIn    onNavigate={setPage} onSuccess={() => setShowJiraAuth(true)} />}
      {page === 'signup'    && <SignUp    onNavigate={setPage} onSuccess={() => setShowJiraAuth(true)} />}
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'tasklist'  && <TaskList   onNavigate={setPage} />}
      {page === 'rewardshop'&& <RewardShop onNavigate={setPage} userXP={userXP} setUserXP={setUserXP} purchased={purchased} setPurchased={setPurchased} />}
      {page === 'profile'   && <Profile   onNavigate={setPage} userXP={userXP} purchased={purchased} />}

      {showJiraAuth && (
        <JiraAuth
          onClose={() => setShowJiraAuth(false)}
          onConnect={() => {
            setShowJiraAuth(false)
            setPage('dashboard')
          }}
        />
      )}
    </>
  )
}
