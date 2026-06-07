// Shared between Dashboard and TaskList.
// Also export DIFFICULTY_STYLES so TaskList can use them for its filter button colors.

export const DIFFICULTY_STYLES = {
  HARD: {
    bg: 'var(--color-error-50)',
    border: 'var(--color-error-300)',
    color: 'var(--color-error-600)',
  },
  MEDIUM: {
    bg: 'var(--color-warning-50)',
    border: 'var(--color-warning-300)',
    color: 'var(--color-warning-600)',
  },
  EASY: {
    bg: 'var(--color-success-50)',
    border: 'var(--color-success-300)',
    color: 'var(--color-success-600)',
  },
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
