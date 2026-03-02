import logoIcon from '../assets/LOGO.svg'
import logoHorizental from '../assets/LOGO-HORIZENTAL.svg'

// ── Icons — paths lifted from asset SVGs; active color controlled via prop ──

const DashboardIcon = ({ active }) => (
  <svg viewBox="12 12 24 24" fill="none" className="w-5 h-5 shrink-0">
    <path d="M27 33V25C27 24.7348 26.8946 24.4804 26.7071 24.2929C26.5196 24.1054 26.2652 24 26 24H22C21.7348 24 21.4804 24.1054 21.2929 24.2929C21.1054 24.4804 21 24.7348 21 25V33"
      stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 22C14.9999 21.709 15.0633 21.4216 15.1858 21.1577C15.3082 20.8938 15.4868 20.6598 15.709 20.472L22.709 14.473C23.07 14.1679 23.5274 14.0005 24 14.0005C24.4726 14.0005 24.93 14.1679 25.291 14.473L32.291 20.472C32.5132 20.6598 32.6918 20.8938 32.8142 21.1577C32.9367 21.4216 33.0001 21.709 33 22V31C33 31.5304 32.7893 32.0391 32.4142 32.4142C32.0391 32.7893 31.5304 33 31 33H17C16.4696 33 15.9609 32.7893 15.5858 32.4142C15.2107 32.0391 15 31.5304 15 31V22Z"
      stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TasksIcon = ({ active }) => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 shrink-0">
    <rect x="4" y="3" width="12" height="15" rx="2" stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="1.5" />
    <path d="M7 8h6M7 11h6M7 14h3.5" stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const RewardShopIcon = ({ active }) => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 shrink-0">
    <path d="M3 8.5h14v8a1 1 0 01-1 1H4a1 1 0 01-1-1v-8z" stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="1.5" />
    <path d="M2 5.5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z" stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="1.5" />
    <path d="M10 4.5v13M10 4.5c0-1.5-1.5-2.5-3-2.5S4.5 3 5 4.5M10 4.5c0-1.5 1.5-2.5 3-2.5s2.5 1 2 2.5"
      stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ProfileIcon = ({ active }) => (
  <svg viewBox="12 12 24 24" fill="none" className="w-5 h-5 shrink-0">
    <path d="M31 33V31C31 29.9391 30.5786 28.9217 29.8284 28.1716C29.0783 27.4214 28.0609 27 27 27H21C19.9391 27 18.9217 27.4214 18.1716 28.1716C17.4214 28.9217 17 29.9391 17 31V33"
      stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 23C26.2091 23 28 21.2091 28 19C28 16.7909 26.2091 15 24 15C21.7909 15 20 16.7909 20 19C20 21.2091 21.7909 23 24 23Z"
      stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SettingsIcon = ({ active }) => (
  <svg viewBox="12 12 24 24" fill="none" className="w-5 h-5 shrink-0">
    <path d="M24.22 14H23.78C23.2496 14 22.7409 14.2107 22.3658 14.5858C21.9907 14.9609 21.78 15.4696 21.78 16V16.18C21.7796 16.5307 21.6871 16.8752 21.5115 17.1788C21.336 17.4825 21.0837 17.7346 20.78 17.91L20.35 18.16C20.046 18.3355 19.7011 18.4279 19.35 18.4279C18.9989 18.4279 18.654 18.3355 18.35 18.16L18.2 18.08C17.7411 17.8153 17.1958 17.7434 16.684 17.8803C16.1722 18.0172 15.7356 18.3515 15.47 18.81L15.25 19.19C14.9853 19.6489 14.9134 20.1942 15.0503 20.706C15.1872 21.2178 15.5215 21.6544 15.98 21.92L16.13 22.02C16.4323 22.1945 16.6836 22.4451 16.8591 22.7468C17.0345 23.0486 17.1279 23.391 17.13 23.74V24.25C17.1314 24.6024 17.0397 24.949 16.864 25.2545C16.6884 25.5601 16.4352 25.8138 16.13 25.99L15.98 26.08C15.5215 26.3456 15.1872 26.7822 15.0503 27.294C14.9134 27.8058 14.9853 28.3511 15.25 28.81L15.47 29.19C15.7356 29.6485 16.1722 29.9828 16.684 30.1197C17.1958 30.2566 17.7411 30.1847 18.2 29.92L18.35 29.84C18.654 29.6645 18.9989 29.5721 19.35 29.5721C19.7011 29.5721 20.046 29.6645 20.35 29.84L20.78 30.09C21.0837 30.2654 21.336 30.5175 21.5115 30.8212C21.6871 31.1248 21.7796 31.4693 21.78 31.82V32C21.78 32.5304 21.9907 33.0391 22.3658 33.4142C22.7409 33.7893 23.2496 34 23.78 34H24.22C24.7504 34 25.2591 33.7893 25.6342 33.4142C26.0093 33.0391 26.22 32.5304 26.22 32V31.82C26.2204 31.4693 26.3129 31.1248 26.4885 30.8212C26.664 30.5175 26.9163 30.2654 27.22 30.09L27.65 29.84C27.954 29.6645 28.2989 29.5721 28.65 29.5721C29.0011 29.5721 29.346 29.6645 29.65 29.84L29.8 29.92C30.2589 30.1847 30.8042 30.2566 31.316 30.1197C31.8278 29.9828 32.2645 29.6485 32.53 29.19L32.75 28.8C33.0147 28.3411 33.0866 27.7958 32.9497 27.284C32.8128 26.7722 32.4785 26.3356 32.02 26.07L31.87 25.99C31.5648 25.8138 31.3116 25.5601 31.136 25.2545C30.9604 24.949 30.8686 24.6024 30.87 24.25V23.75C30.8686 23.3976 30.9604 23.051 31.136 22.7455C31.3116 22.4399 31.5648 22.1862 31.87 22.01L32.02 21.92C32.4785 21.6544 32.8128 21.2178 32.9497 20.706C33.0866 20.1942 33.0147 19.6489 32.75 19.19L32.53 18.81C32.2645 18.3515 31.8278 18.0172 31.316 17.8803C30.8042 17.7434 30.2589 17.8153 29.8 18.08L29.65 18.16C29.346 18.3355 29.0011 18.4279 28.65 18.4279C28.2989 18.4279 27.954 18.3355 27.65 18.16L27.22 17.91C26.9163 17.7346 26.664 17.4825 26.4885 17.1788C26.3129 16.8752 26.2204 16.5307 26.22 16.18V16C26.22 15.4696 26.0093 14.9609 25.6342 14.5858C25.2591 14.2107 24.7504 14 24.22 14Z"
      stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 27C25.6569 27 27 25.6569 27 24C27 22.3431 25.6569 21 24 21C22.3431 21 21 22.3431 21 24C21 25.6569 22.3431 27 24 27Z"
      stroke={active ? '#942fcd' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
    <path d="M1 1l12 12M13 1L1 13" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// ── Nav config ──────────────────────────────────────────────

const NAV_LINKS = [
  { id: 'dashboard',  label: 'Dashboard',   Icon: DashboardIcon  },
  { id: 'tasklist',   label: 'Tasks',        Icon: TasksIcon      },
  { id: 'rewardshop', label: 'Reward Shop',  Icon: RewardShopIcon, dot: true },
  { id: 'profile',    label: 'Profile',      Icon: ProfileIcon    },
  { id: 'settings',   label: 'Settings',     Icon: SettingsIcon   },
]

// ── Sidebar ─────────────────────────────────────────────────

export default function Sidebar({ isOpen, onClose, activePage = 'dashboard', onNavigate }) {
  const handleNav = (id) => {
    onNavigate?.(id)
    onClose?.()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      {/* Drawer */}
      <div
        className="fixed left-0 top-0 h-full w-[259px] bg-white border-r border-[#e5e7eb] z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', fontFamily: 'Poppins, sans-serif' }}
      >

        {/* Header */}
        <div className="h-[88px] border-b border-[#e5e7eb] flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <img src={logoIcon} alt="Questly" className="h-[38px] w-[38px] shrink-0" />
            <img src={logoHorizental} alt="Questly" className="h-[26px] w-auto shrink-0" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[8px] flex items-center justify-center cursor-pointer shrink-0 bg-white hover:bg-[#f9fafb] transition-colors duration-200"
            style={{ border: '0.8px solid #a5a9b5', boxShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-[12px] p-4 flex-1 overflow-y-auto">
          {NAV_LINKS.map(({ id, label, Icon, dot }) => {
            const active = activePage === id
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`flex items-center gap-3 h-[46.5px] pl-4 rounded-[8px] w-full text-left cursor-pointer transition-colors duration-200 relative ${
                  active ? 'bg-[#f3f4f6]' : 'hover:bg-[#f9fafb]'
                }`}
              >
                <Icon active={active} />
                <span className={`text-[15px] ${active ? 'font-medium text-[#942fcd]' : 'font-normal text-[#6b7280]'}`}>
                  {label}
                </span>
                {dot && (
                  <span className="absolute right-4 w-[6px] h-[6px] rounded-full bg-[#fbbf24]" />
                )}
              </button>
            )
          })}

          {/* Level progress card */}
          <div
            className="mt-4 rounded-[12px] p-4 flex flex-col gap-3 shrink-0"
            style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)', boxShadow: '0px 4px 12px rgba(148,47,205,0.2)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white opacity-90">Your Level</span>
              <div className="rounded-full px-[10px] py-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <span className="text-[12px] font-semibold text-white">Level 3</span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-[24px] font-bold text-white leading-tight">650</span>
                <span className="text-[13px] text-white/80">/ 1000 XP</span>
              </div>
              <p className="text-[11px] text-white/70">350 XP to Level 4</p>
            </div>

            <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full bg-white rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
        </nav>

      </div>
    </>
  )
}
