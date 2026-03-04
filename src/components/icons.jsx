// ── Shared SVG icon components ────────────────────────────────
// Used across multiple pages. Import only what you need.

export const BurgerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Grey avatar — used in the header of Dashboard, TaskList, RewardShop
export const AvatarPlaceholder = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <circle cx="24" cy="54" r="22" fill="#9ca3af" />
    <circle cx="24" cy="18" r="10" fill="#6b7280" />
  </svg>
)

// White/transparent avatar — used in the Profile header and hero card (purple background)
export const ProfileAvatarPlaceholder = () => (
  <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
    <circle cx="60" cy="80" r="38" fill="rgba(255,255,255,0.25)" />
    <circle cx="60" cy="44" r="22" fill="rgba(255,255,255,0.45)" />
  </svg>
)

// White checkmark — used inside the green task-completion checkbox
export const CheckmarkIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
    <path d="M1.5 5l2.5 2.5 4-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Star / XP icon — color and size are configurable
export const StarIcon = ({ color = '#942fcd', size = 16 }) => (
  <svg viewBox="0 0 16 16" fill="none" width={size} height={size} className="shrink-0">
    <path d="M8 1.5l1.5 3.5 3.5.5-2.5 2.5.5 3.5L8 9.5 5.5 11l.5-3.5L3.5 5l3.5-.5z" fill={color} />
  </svg>
)

// ── Reward icons (used in RewardShop and Profile) ─────────────
// All accept an optional `color` prop (default white) for reuse on different backgrounds.

export const CoffeeIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M5 8h14v10a5 5 0 01-5 5H10a5 5 0 01-5-5V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 10h2a3 3 0 010 6h-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 5c0-1.5 2-1.5 2-3M13 5c0-1.5 2-1.5 2-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const PackageIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M22 9.5L14 14M14 14L6 9.5M14 14V23" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 9.5l8-4.5 8 4.5v9l-8 4.5L6 18.5V9.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 7.5l8 4.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const ShoeIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M3 17c0 2 1.5 4 4 4h15c1.5 0 3-1 3-3 0-1.5-1-2.5-2.5-3L19 14l-4-6-3 3-2-1.5L3 14v3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 11l4 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const FoodIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M9 4v6c0 2.5 2 4 4 4s4-1.5 4-4V4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13 14v10M9 22h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 4v20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

export const HeadphonesIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M5 16V13a9 9 0 0118 0v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <rect x="3" y="16" width="5" height="7" rx="2" stroke={color} strokeWidth="1.8" />
    <rect x="20" y="16" width="5" height="7" rx="2" stroke={color} strokeWidth="1.8" />
  </svg>
)

export const FilmIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <rect x="3" y="5" width="22" height="18" rx="2" stroke={color} strokeWidth="1.8" />
    <path d="M3 10h22M3 18h22M8 5v5M8 18v5M20 5v5M20 18v5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 13l5 3-5 3V13z" fill={color} />
  </svg>
)

export const BookIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M4 5a2 2 0 012-2h10v20H6a2 2 0 01-2-2V5z" stroke={color} strokeWidth="1.8" />
    <path d="M16 3h6a2 2 0 012 2v16a2 2 0 01-2 2h-6V3z" stroke={color} strokeWidth="1.8" />
    <path d="M16 3v20" stroke={color} strokeWidth="1.5" />
    <path d="M7 9h5M7 13h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const ControllerIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M6 10h16l-2 10H8L6 10z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 13v4M9 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="18" cy="13.5" r="1" fill={color} />
    <circle cx="20.5" cy="15.5" r="1" fill={color} />
  </svg>
)
