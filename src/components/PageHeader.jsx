import { useNavigate, useLocation, Link } from 'react-router'
import { BurgerIcon } from './icons'
import ProfileAvatar from './ProfileAvatar'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import logoIcon from '../assets/LOGO.svg'
import { useAuthStore } from '../stores/authStore'
import { getAvatarUrl, getDisplayUsername } from '../lib/displayUser'
import { getShellRole, pagePath, pathMatchesPage } from '../lib/workspaceNav'

const DEV_NAV_LINKS = [
  { id: 'dashboard',  label: 'Dashboard'   },
  { id: 'profile',    label: 'Profile'     },
  { id: 'tasklist',   label: 'Tasks'       },
  { id: 'rewardshop', label: 'Reward Shop' },
]

const ADMIN_NAV_LINKS = [
  { id: 'workspace',       label: 'Workspace'    },
  { id: 'admin',           label: 'Admin'        },
  { id: 'rewardshop',      label: 'Reward Shop'  },
  { id: 'profile',         label: 'Profile'      },
]

export default function PageHeader({ onOpenSidebar }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const memberships = useAuthStore((s) => s.memberships)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)
  const activeMembership = useAuthStore((s) => s.activeMembership)
  const userRole = useAuthStore((s) => s.userRole)

  const shellRole = getShellRole({
    memberships,
    activeMembership,
    userRole,
  })
  const multi = Array.isArray(memberships)
  const workspaceId = multi ? activeWorkspaceId : null
  const homePath = pagePath(shellRole === 'admin' ? 'admin' : 'dashboard', workspaceId)

  const hasWorkspace = multi
    ? Boolean(activeWorkspaceId)
    : Boolean(user?.workspace_id)

  // Multi-workspace: developers get a Workspace hub (create/join another).
  // Legacy flag-off: keep Join Workspace only when they have no workspace yet.
  let devLinks = DEV_NAV_LINKS
  if (multi) {
    devLinks = [{ id: 'workspace', label: 'Workspace' }, ...DEV_NAV_LINKS]
  } else if (!hasWorkspace) {
    devLinks = [...DEV_NAV_LINKS, { id: 'workspacejoin', label: 'Join Workspace' }]
  }
  const NAV_LINKS = shellRole === 'admin' ? ADMIN_NAV_LINKS : devLinks
  const displayName = getDisplayUsername(user, shellRole)
  const avatarUrl = getAvatarUrl(user)

  return (
    <header className="ds-chrome ds-chrome-tint border-b border-[color:var(--color-border-soft)] px-[var(--space-2xl)] h-[79px] flex items-stretch">
      <div className="w-full flex items-center justify-between gap-3">

        <div className="flex items-stretch gap-4 md:gap-6 h-full min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="ds-focus-ring flex items-center justify-center cursor-pointer bg-transparent hover:bg-[color:var(--color-bg-subtle)] rounded-[var(--radius-md)] px-2 transition-colors duration-200 shrink-0"
            aria-label="Open menu"
          >
            <BurgerIcon />
          </button>

          <Link
            to={homePath}
            className="ds-focus-ring flex items-center shrink-0 self-center rounded-[var(--radius-sm)]"
            aria-label="Questly home"
          >
            <img
              src={logoHorizontal}
              alt="Questly"
              className="h-[28px] w-auto hidden md:block"
            />
            <img
              src={logoIcon}
              alt="Questly"
              className="h-9 w-9 md:hidden"
            />
          </Link>

          <nav className="flex items-stretch gap-6 lg:gap-10 h-full min-w-0 overflow-x-auto" aria-label="Main">
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(pagePath(id, workspaceId))}
                className={`ds-header-nav ds-focus-ring ${pathMatchesPage(pathname, id, workspaceId) ? 'ds-header-nav--active' : ''}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => navigate(pagePath('profile', workspaceId))}
          className="ds-focus-ring flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-1 cursor-pointer hover:bg-[color:var(--color-bg-subtle)] transition-colors duration-200 shrink-0"
          aria-label="Go to profile"
        >
          <span className="hidden sm:inline text-[length:var(--text-body-lg)] font-semibold text-[color:var(--color-gray-800)]">{displayName}</span>
          <ProfileAvatar
            avatarUrl={avatarUrl}
            variant={shellRole === 'admin' ? 'admin' : 'developer'}
            size={48}
          />
        </button>

      </div>
    </header>
  )
}
