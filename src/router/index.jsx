import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import Hero from '../pages/Hero'
import SignIn from '../pages/SignIn'
import SignUp from '../pages/SignUp'
import ProtectedRoute from '../components/ProtectedRoute'
import WorkspaceScopedRoute from '../components/WorkspaceScopedRoute'
import MultiWorkspaceRedirect from '../components/MultiWorkspaceRedirect'
import PageLoader from '../components/PageLoader'

// Authenticated + secondary pages are code-split so the initial (public) bundle
// stays small. Landing/auth pages above load eagerly for a fast first paint.
const Dashboard = lazy(() => import('../pages/Dashboard'))
const TaskList = lazy(() => import('../pages/TaskList'))
const RewardShop = lazy(() => import('../pages/RewardShop'))
const Profile = lazy(() => import('../pages/Profile'))
const Settings = lazy(() => import('../pages/Settings'))
const Admin = lazy(() => import('../pages/Admin'))
const Workspace = lazy(() => import('../pages/Workspace'))
const WorkspaceCreate = lazy(() => import('../pages/WorkspaceCreate'))
const WorkspaceJoin = lazy(() => import('../pages/WorkspaceJoin'))
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('../pages/TermsOfService'))

function withSuspense(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

function scoped(pageId, element, requiredRole) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <WorkspaceScopedRoute>
        {withSuspense(element)}
      </WorkspaceScopedRoute>
    </ProtectedRoute>
  )
}

function flat(pageId, element, requiredRole) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <MultiWorkspaceRedirect pageId={pageId}>
        {withSuspense(element)}
      </MultiWorkspaceRedirect>
    </ProtectedRoute>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <Hero /> },
  { path: '/privacy', element: withSuspense(<PrivacyPolicy />) },
  { path: '/terms', element: withSuspense(<TermsOfService />) },
  { path: '/login', element: <SignIn /> },
  { path: '/signin', element: <Navigate to="/login" replace /> },
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
    path: '/workspace',
    element: (
      <ProtectedRoute>
        <MultiWorkspaceRedirect pageId="workspace">
          {withSuspense(<Workspace />)}
        </MultiWorkspaceRedirect>
      </ProtectedRoute>
    ),
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
    path: '/w/:workspaceId/workspace',
    element: (
      <ProtectedRoute>
        <WorkspaceScopedRoute>
          {withSuspense(<Workspace />)}
        </WorkspaceScopedRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/workspace/create',
    element: (
      <ProtectedRoute requiredRole="admin" skipRoleWhenMulti>
        {withSuspense(<WorkspaceCreate />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/workspace/join',
    element: (
      <ProtectedRoute requiredRole="developer" skipRoleWhenMulti>
        {withSuspense(<WorkspaceJoin />)}
      </ProtectedRoute>
    ),
  },
])
