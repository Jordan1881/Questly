import { Link } from 'react-router'

const CARD = 'bg-white rounded-[16px] w-full max-w-[720px] p-10 flex flex-col gap-6'
const CARD_SHADOW = { boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.12)' }

export function LegalPageShell({ title, children }) {
  return (
    <div
      className="min-h-screen bg-[#fbfbfb] flex flex-col items-center px-6 py-16"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className={CARD} style={CARD_SHADOW}>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[28px] font-semibold text-[#1f2937]">{title}</h1>
          <Link to="/" className="text-[13px] font-medium text-[#942fcd] hover:underline shrink-0">
            Back to Questly
          </Link>
        </div>
        <div className="text-[14px] text-[#4b5563] leading-relaxed flex flex-col gap-4">{children}</div>
        <p className="text-[12px] text-[#9ca3af] pt-2 border-t border-[#e5e7eb]">
          Last updated: June 6, 2026 · Contact your workspace administrator or the Questly support
          email listed in the Atlassian app Distribution settings.
        </p>
      </div>
    </div>
  )
}
