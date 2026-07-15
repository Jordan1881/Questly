import { Link } from 'react-router'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'

export function LegalPageShell({ title, children }) {
  return (
    <div className="ds-page flex flex-col items-center px-6 py-16">
      <Link
        to="/"
        className="ds-focus-ring mb-8 rounded-[var(--radius-sm)]"
        aria-label="Questly home"
      >
        <img src={logoHorizontal} alt="Questly" className="w-[160px] h-auto" />
      </Link>

      <div className="ds-card ds-card-pad w-full max-w-[720px] flex flex-col gap-6 shadow-[var(--shadow-soft-md)]">
        <div className="flex items-center justify-between gap-4">
          <h1 className="ds-section-title text-[length:var(--text-h4)]">{title}</h1>
          <Link
            to="/"
            className="ds-focus-ring text-[length:var(--text-body-sm)] font-medium text-[color:var(--color-brand)] hover:underline shrink-0"
          >
            Back to Questly
          </Link>
        </div>
        <div className="ds-body leading-relaxed flex flex-col gap-4">{children}</div>
        <p className="ds-caption pt-2 border-t border-[color:var(--color-border-soft)]">
          Last updated: June 6, 2026 · Contact your workspace administrator or the Questly support
          email listed in the Atlassian app Distribution settings.
        </p>
      </div>
    </div>
  )
}
