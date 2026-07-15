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
import WorkspaceScopedRoute from '../components/WorkspaceScopedRoute'
import MultiWorkspaceRedirect from '../components/MultiWorkspaceRedirect'

function scoped(pageId, element, requiredRole) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <WorkspaceScopedRoute>
        {element}
      </WorkspaceScopedRoute>
    </ProtectedRoute>
  )
}

function flat(pageId, element, requiredRole) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <MultiWorkspaceRedirect pageId={pageId}>
        {element}
      </MultiWorkspaceRedirect>
    </ProtectedRoute>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <Hero /> },
  { path: '/privacy', element: <PrivacyPolicy /> },
  { path: '/terms', element: <TermsOfService /> },
  { path: '/login', element: <SignIn /> },
  { path: '/signup', element: <SignUp /> },
  {
    path: '/dashboard',
    element: flat('dashboard', <Dashboard />, 'developer'),
  },
  {
    path: '/tasks',
    element: flat('tasklist', <TaskList />, 'developer'),
  },
  {
    path: '/shop',
    element: flat('shop', <RewardShop />),
  },
  {
    path: '/rewards',
    element: flat('rewardshop', <RewardShop />),
  },
  {
    path: '/profile',
    element: flat('profile', <Profile />),
  },
  {
    path: '/settings',
    element: flat('settings', <Settings />),
  },
  {
    path: '/admin',
    element: flat('admin', <Admin />, 'admin'),
  },
  {
    path: '/w/:workspaceId/dashboard',
    element: scoped('dashboard', <Dashboard />, 'developer'),
  },
  {
    path: '/w/:workspaceId/tasks',
    element: scoped('tasklist', <TaskList />, 'developer'),
  },
  {
    path: '/w/:workspaceId/shop',
    element: scoped('shop', <RewardShop />),
  },
  {
    path: '/w/:workspaceId/rewards',
    element: scoped('rewardshop', <RewardShop />),
  },
  {
    path: '/w/:workspaceId/profile',
    element: scoped('profile', <Profile />),
  },
  {
    path: '/w/:workspaceId/settings',
    element: scoped('settings', <Settings />),
  },
  {
    path: '/w/:workspaceId/admin',
    element: scoped('admin', <Admin />, 'admin'),
  },
  {
    path: '/workspace/create',
    element: (
      <ProtectedRoute requiredRole="admin" skipRoleWhenMulti>
        <WorkspaceCreate />
      </ProtectedRoute>
    ),
  },
  {
    path: '/workspace/join',
    element: (
      <ProtectedRoute requiredRole="developer" skipRoleWhenMulti>
        <WorkspaceJoin />
      </ProtectedRoute>
    ),
  },
])
