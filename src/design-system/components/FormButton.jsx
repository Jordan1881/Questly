/**
 * FormButton — submit button for Sign In / Sign Up forms
 */
export default function FormButton({ onClick, children, className = '', type = 'submit', disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ds-btn-hero ds-focus-ring
        w-[360px] h-[var(--btn-height-md)] rounded-[var(--radius-md)]
        text-[length:var(--text-body-lg)] font-medium
        disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
    >
      <span>{children}</span>
    </button>
  )
}
