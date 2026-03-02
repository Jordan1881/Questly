import jiraLogo from '../assets/jira-original-wordmark.svg'
import JiraButton from '../design-system/components/JiraButton'

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-[14px] h-[14px]">
    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const features = [
  'Sync tasks automatically',
  'Track progress & earn XP',
  'Read-only access (no changes in Jira)',
]

export default function JiraAuth({ onClose, onConnect }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'heroFadeUp 0.35s ease both' }}
      >

        {/* ── Main card ── */}
        <div
          className="bg-white rounded-[16px] w-[640px] pt-[56px] px-[56px] pb-[56px] relative flex flex-col items-center gap-8"
          style={{ boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.12)' }}
        >

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-[#9ca3af] hover:text-[#374151] text-[22px] leading-none cursor-pointer transition-colors duration-200"
          >
            ✕
          </button>

          {/* Jira icon */}
          <div
            className="w-[80px] h-[80px] rounded-[16px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(to bottom, #fcfcfc, #87b9fb)',
              boxShadow: '0px 4px 16px 0px rgba(0, 82, 204, 0.2)',
            }}
          >
            <img src={jiraLogo} alt="Jira" className="w-[52px] h-[52px] object-contain" />
          </div>

          {/* Heading */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h2
              className="text-[36px] font-semibold text-black leading-tight"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Connect your Jira account
            </h2>
            <p
              className="text-[18px] text-[#6b7280]"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Sync your Jira tasks to start earning XP in Questly.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-4 w-[400px]">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)' }}
                >
                  <CheckIcon />
                </div>
                <span
                  className="text-[16px] font-medium text-[#1f2937]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Connect button */}
          <JiraButton onClick={onConnect}>
            Connect with Jira
          </JiraButton>

        </div>

        {/* Security note — outside the card */}
        <p
          className="text-[14px] text-[#9ca3af] text-center max-w-[611px] leading-[1.6]"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          We use secure OAuth 2.0 authentication. Questly only has read-only access to your Jira tasks.
        </p>

      </div>
    </div>
  )
}
