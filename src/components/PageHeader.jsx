import { useNavigate, useLocation, Link } from 'react-router'
import { BurgerIcon } from './icons'
import ProfileAvatar from './ProfileAvatar'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import logoIcon from '../assets/LOGO.svg'
import { useAuthStore } from '../stores/authStore'
import { getAvatarUrl, getDisplayUsername } from '../lib/displayUser'

const PAGE_PATHS = {
  dashboard:       '/dashboard',
  profile:         '/profile',
  tasklist:        '/tasks',
  rewardshop:      '/rewards',
  admin:           '/admin',
  workspacecreate: '/workspace/create',
  workspacejoin:   '/workspace/join',
}

const DEV_NAV_LINKS = [
  { id: 'dashboard',  label: 'Dashboard'   },
  { id: 'profile',    label: 'Profile'     },
  { id: 'tasklist',   label: 'Tasks'       },
  { id: 'rewardshop', label: 'Reward Shop' },
]

const ADMIN_NAV_LINKS = [
  { id: 'workspacecreate', label: 'Workspace'    },
  { id: 'admin',           label: 'Admin'        },
  { id: 'rewardshop',      label: 'Reward Shop'  },
  { id: 'profile',         label: 'Profile'      },
]

export default function PageHeader({ onOpenSidebar }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const userRole = useAuthStore((s) => s.userRole)
  const user = useAuthStore((s) => s.user)

  const devLinks = !user?.workspace_id
    ? [...DEV_NAV_LINKS, { id: 'workspacejoin', label: 'Join Workspace' }]
    : DEV_NAV_LINKS
  const NAV_LINKS = userRole === 'admin' ? ADMIN_NAV_LINKS : devLinks
  const isActive = (id) => pathname === PAGE_PATHS[id]
  const displayName = getDisplayUsername(user, userRole)
  const avatarUrl = getAvatarUrl(user)

  return (
    <header className="bg-[color:var(--color-bg)] border-b border-[color:var(--color-border)] px-[var(--space-2xl)] h-[79px] flex items-stretch">
      <div className="w-full flex items-center justify-between">

        <div className="flex items-stretch gap-6 h-full min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="ds-focus-ring flex items-center justify-center cursor-pointer bg-transparent hover:bg-[color:var(--color-bg-subtle)] rounded-[var(--radius-md)] px-2 transition-colors duration-200 shrink-0"
            aria-label="Open menu"
          >
            <BurgerIcon />
          </button>

          <Link
            to="/dashboard"
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

          <nav className="flex items-stretch gap-10 h-full min-w-0 overflow-x-auto" aria-label="Main">
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(PAGE_PATHS[id])}
                className={`ds-header-nav ds-focus-ring ${isActive(id) ? 'ds-header-nav--active' : ''}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="ds-focus-ring flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-1 cursor-pointer hover:bg-[color:var(--color-bg-subtle)] transition-colors duration-200"
          aria-label="Go to profile"
        >
          <span className="text-[length:var(--text-body-lg)] font-semibold text-[color:var(--color-gray-800)]">{displayName}</span>
          <ProfileAvatar
            avatarUrl={avatarUrl}
            variant={userRole === 'admin' ? 'admin' : 'developer'}
            size={48}
          />
        </button>

      </div>
    </header>
  )
}
