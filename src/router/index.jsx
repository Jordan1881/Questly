import { createBrowserRouter } from 'react-router'
import Hero from '../pages/Hero'
import SignIn from '../pages/SignIn'
import SignUp from '../pages/SignUp'
import Dashboard from '../pages/Dashboard'
import TaskList from '../pages/TaskList'
import RewardShop from '../pages/RewardShop'
import Profile from '../pages/Profile'
import Admin from '../pages/Admin'
import WorkspaceCreate from '../pages/WorkspaceCreate'
import WorkspaceJoin from '../pages/WorkspaceJoin'
import ProtectedRoute from '../components/ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/', element: <Hero /> },
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
