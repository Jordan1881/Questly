import { useNavigate, useLocation } from 'react-router'
import { BurgerIcon, AvatarPlaceholder, ProfileAvatarPlaceholder } from './icons'
import { useAuthStore } from '../stores/authStore'

// Maps old page IDs to URL paths
const PAGE_PATHS = {
  dashboard:       '/dashboard',
  profile:         '/profile',
  tasklist:        '/tasks',
  rewardshop:      '/shop',
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

// Shared top header used by all inner pages.
// Props:
//   onOpenSidebar — called when the burger button is clicked
export default function PageHeader({ onOpenSidebar }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const userRole = useAuthStore((s) => s.userRole)
  const user = useAuthStore((s) => s.user)

  const devLinks = !user?.workspace_id
    ? [...DEV_NAV_LINKS, { id: 'workspacejoin', label: 'Join Workspace' }]
    : DEV_NAV_LINKS
  const NAV_LINKS = userRole === 'admin' ? ADMIN_NAV_LINKS : devLinks
  const isProfile = pathname === '/profile'
  const isActive = (id) => pathname === PAGE_PATHS[id]

  return (
    <header className="bg-white border-b border-[#e5e7eb] px-12 h-[79px] flex items-stretch">
      <div className="w-full flex items-center justify-between">

        {/* Burger button + nav links */}
        <div className="flex items-stretch gap-6 h-full">
          <button
            onClick={onOpenSidebar}
            className="flex items-center justify-center cursor-pointer bg-transparent hover:bg-[#f9fafb] rounded-[8px] px-2 transition-colors duration-200"
            aria-label="Open menu"
          >
            <BurgerIcon />
          </button>

          <nav className="flex items-stretch gap-10 h-full">
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => navigate(PAGE_PATHS[id])}
                className={`h-full border-b-2 text-[16px] cursor-pointer transition-colors duration-200 bg-transparent ${
                  isActive(id)
                    ? 'border-[#942fcd] text-[#942fcd] font-semibold'
                    : 'border-transparent text-[#6b7280] font-normal hover:text-[#1f2937]'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* User info — avatar background differs on the Profile page */}
        <div className="flex items-center gap-3">
          <span className="text-[16px] font-semibold text-[#1f2937]">
            {userRole === 'admin' ? 'Admin_User' : 'Ashton_44'}
          </span>
          <div
            className="w-12 h-12 rounded-full overflow-hidden shrink-0"
            style={isProfile
              ? { background: 'linear-gradient(to bottom, #942fcd, #ca9af4)' }
              : { background: '#e5e7eb' }
            }
          >
            {isProfile ? <ProfileAvatarPlaceholder /> : <AvatarPlaceholder />}
          </div>
        </div>

      </div>
    </header>
  )
}
