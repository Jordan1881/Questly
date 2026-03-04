// Shared between Dashboard and TaskList.
// Also export DIFFICULTY_STYLES so TaskList can use them for its filter button colors.

export const DIFFICULTY_STYLES = {
  HARD:   { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
  MEDIUM: { bg: '#fff7ed', border: '#fdba74', color: '#ea580c' },
  EASY:   { bg: '#f0fdf4', border: '#86efac', color: '#16a34a' },
}

export default function DifficultyBadge({ level }) {
  const s = DIFFICULTY_STYLES[level]
  return (
    <span
      className="px-[11px] py-[5px] rounded-[6px] text-[11px] font-medium tracking-[0.5px] uppercase border shrink-0"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}
    >
      {level}
    </span>
  )
}
