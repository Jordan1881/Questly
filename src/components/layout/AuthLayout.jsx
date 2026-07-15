import { Link } from 'react-router'
import logoHorizontal from '../../assets/LOGO-HORIZENTAL.svg'
import WorkspaceSwitcher from '../WorkspaceSwitcher'
import { useAuthStore } from '../../stores/authStore'

/** Shared auth form input styling — ds-input-field + brand subtle background */
export const authInputClass = `
  ds-input-field ds-focus-ring
  w-full h-[56px] rounded-[8px] bg-[color:var(--color-bg-brand-subtle)]
  border border-transparent
  px-5 text-[15px] text-[color:var(--color-gray-900)]
  placeholder-[color:var(--color-primary-300)]
  outline-none
`

function AuthCenteredShell({ children, className = '', logoClassName = '' }) {
  const memberships = useAuthStore((s) => s.memberships)
  const showSwitcher = Array.isArray(memberships)

  return (
    <div className={`ds-page flex items-center justify-center relative px-6 ${className}`.trim()}>
      <div className="absolute top-[48px] left-6 right-6 md:left-[75px] md:right-auto flex items-center gap-4 flex-wrap">
        <Link
          to="/"
          className={`ds-focus-ring rounded-[var(--radius-sm)] ${logoClassName}`.trim()}
          aria-label="Questly home"
        >
          <img
            src={logoHorizontal}
            alt="Questly"
            className="w-[180px] h-auto cursor-pointer hidden md:block"
          />
        </Link>
        {showSwitcher ? <WorkspaceSwitcher /> : null}
      </div>
      {children}
    </div>
  )
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  footer,
  leftExtra,
  centered = false,
  className = '',
  logoClassName = '',
}) {
  if (centered) {
    return (
      <AuthCenteredShell className={className} logoClassName={logoClassName}>
        {children}
      </AuthCenteredShell>
    )
  }

  return (
    <div className={`ds-page flex items-center justify-center relative ${className}`.trim()}>
      <Link
        to="/"
        className={`absolute top-[60px] left-[75px] ds-focus-ring rounded-[var(--radius-sm)] ${logoClassName}`.trim()}
        aria-label="Questly home"
      >
        <img
          src={logoHorizontal}
          alt="Questly"
          className="w-[180px] h-auto cursor-pointer"
        />
      </Link>

      <div className="flex items-center justify-between w-[941px] max-w-full px-6">
        {(title || subtitle || footer || leftExtra) && (
          <div className="flex flex-col gap-8 max-w-[421px]">
            {(title || subtitle) && (
              <div className="flex flex-col gap-4">
                {title && (
                  <h1 className="text-[48px] font-semibold text-[color:var(--color-gray-900)] leading-[1.2]">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-[24px] font-medium text-[color:var(--color-gray-900)] leading-[1.4] max-w-[418px]">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            {footer && <div className="flex flex-col gap-2 ds-body">{footer}</div>}
            {leftExtra}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
