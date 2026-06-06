import { Link } from 'react-router'

const linkClass = 'text-[#942fcd] hover:underline font-medium'

export function LegalAgreementText({ className = 'text-[12px] text-[#6b7280] text-center leading-relaxed' }) {
  return (
    <p className={className}>
      By using Questly, you agree to our{' '}
      <Link to="/terms" className={linkClass}>
        Terms of Service
      </Link>{' '}
      and{' '}
      <Link to="/privacy" className={linkClass}>
        Privacy Policy
      </Link>
      .
    </p>
  )
}

export default function LegalFooterLinks({
  className = 'flex items-center justify-center gap-3 text-[12px] text-[#9ca3af]',
}) {
  return (
    <nav className={className} aria-label="Legal">
      <Link to="/terms" className={`${linkClass} text-[12px]`}>
        Terms of Service
      </Link>
      <span aria-hidden="true">·</span>
      <Link to="/privacy" className={`${linkClass} text-[12px]`}>
        Privacy Policy
      </Link>
    </nav>
  )
}
