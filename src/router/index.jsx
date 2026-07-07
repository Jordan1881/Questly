import { createBrowserRouter } from 'react-router'
import Hero from '../pages/Hero'
import SignIn from '../pages/SignIn'
import SignUp from '../pages/SignUp'
import Dashboard from '../pages/Dashboard'
import TaskList from '../pages/TaskList'
import RewardShop from '../pages/RewardShop'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'
import Admin from '../pages/Admin'
import WorkspaceCreate from '../pages/WorkspaceCreate'
import WorkspaceJoin from '../pages/WorkspaceJoin'
import PrivacyPolicy from '../pages/PrivacyPolicy'
import TermsOfService from '../pages/TermsOfService'
import ProtectedRoute from '../components/ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/', element: <Hero /> },
  { path: '/privacy', element: <PrivacyPolicy /> },
  { path: '/terms', element: <TermsOfService /> },
  { path: '/login', element: <SignIn /> },
  { path: '/signup', element: <SignUp /> },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute requiredRole="developer">
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tasks',
    element: (
      <ProtectedRoute requiredRole="developer">
        <TaskList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/shop',
    element: (
      <ProtectedRoute>
        <RewardShop />
      </ProtectedRoute>
    ),
  },
  {
    path: '/rewards',
    element: (
      <ProtectedRoute>
        <RewardShop />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Admin />
      </ProtectedRoute>
    ),
  },
  {
    path: '/workspace/create',
    element: (
      <ProtectedRoute requiredRole="admin">
        <WorkspaceCreate />
      </ProtectedRoute>
    ),
  },
  {
    path: '/workspace/join',
    element: (
      <ProtectedRoute requiredRole="developer">
        <WorkspaceJoin />
      </ProtectedRoute>
    ),
  },
])
