import { DIFFICULTY_STYLES } from '../lib/difficultyStyles'

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
