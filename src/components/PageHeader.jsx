import { BurgerIcon, AvatarPlaceholder, ProfileAvatarPlaceholder } from './icons'

// Navigation links shared across all inner pages
const NAV_LINKS = [
  { id: 'dashboard',  label: 'Dashboard'   },
  { id: 'profile',    label: 'Profile'     },
  { id: 'tasklist',   label: 'Tasks'       },
  { id: 'rewardshop', label: 'Reward Shop' },
]

// Shared top header used by Dashboard, TaskList, RewardShop, and Profile.
// Props:
//   activePage    — id of the currently active nav link (controls underline + color)
//   onNavigate    — called with the target page id when a nav link is clicked
//   onOpenSidebar — called when the burger button is clicked
export default function PageHeader({ activePage, onNavigate, onOpenSidebar }) {
  const isProfile = activePage === 'profile'

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
                onClick={() => onNavigate?.(id)}
                className={`h-full border-b-2 text-[16px] cursor-pointer transition-colors duration-200 bg-transparent ${
                  id === activePage
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
          <span className="text-[16px] font-semibold text-[#1f2937]">Ashton_44</span>
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
