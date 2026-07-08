/**
 * Button — Hero CTA (marketing pages)
 * Hover: light gradient overlay via CSS (.ds-btn-hero)
 */
export default function Button({ onClick, children, className = '', type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        ds-btn-hero ds-focus-ring
        w-[170px] h-[65px] rounded-[var(--radius-md)]
        text-[length:var(--text-body-lg)] font-medium
        ${className}
      `}
    >
      <span>{children}</span>
    </button>
  )
}
