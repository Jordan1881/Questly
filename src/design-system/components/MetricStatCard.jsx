import { StarIcon } from '../../components/icons'

/**
 * Figma: Available XP metric tile (node 3575:97)
 * Purple pill card with icon, large value, and caption label.
 */
export default function MetricStatCard({
  value,
  label,
  suffix,
  tone = 'brand',
  icon,
  className = '',
}) {
  const toneClass = tone === 'warning'
    ? 'bg-[color:var(--color-warning-50)] border-[color:var(--color-warning-200)]'
    : 'bg-[color:var(--color-bg-brand-subtle)] border-[color:var(--color-border-brand)]'

  const valueClass = tone === 'warning'
    ? 'text-[color:var(--color-warning-600)]'
    : 'text-[color:var(--color-brand)]'

  const iconWrapClass = tone === 'warning'
    ? 'bg-[color:var(--color-warning-100)]'
    : 'bg-[rgba(148,47,205,0.1)]'

  return (
    <div
      className={`${toneClass} border-2 flex flex-col items-center gap-3 px-1 py-6 rounded-[40px] shadow-[0px_4px_2px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div className={`${iconWrapClass} w-10 h-10 rounded-full flex items-center justify-center shrink-0`}>
        {icon ?? <StarIcon color="var(--color-brand)" size={20} />}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline gap-1">
          <span className={`text-[32px] font-bold leading-[38px] ${valueClass}`}>{value}</span>
          {suffix ? (
            <span className="text-[length:var(--text-body)] text-[color:var(--color-text-muted)]">{suffix}</span>
          ) : null}
        </div>
        <span className="text-[length:var(--text-body)] text-[color:var(--color-text-muted)]">{label}</span>
      </div>
    </div>
  )
}
