// ── Shared SVG icon components ────────────────────────────────
// Used across multiple pages. Import only what you need.

export const BurgerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
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
