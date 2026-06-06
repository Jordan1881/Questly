import { useNavigate } from 'react-router'
import FormButton from '../design-system/components/FormButton'

const CARD_SHADOW = '0px 8px 32px 0px rgba(148, 47, 205, 0.12)'

export default function NoWorkspacePrompt({
  title = 'Join a team to get started',
  description = 'You need an admin to approve you into a workspace before tasks, XP, and Jira sync are available.',
  showJiraHint = false,
}) {
  const navigate = useNavigate()

  return (
    <div
      className="bg-white rounded-[16px] w-full max-w-[560px] p-10 flex flex-col gap-4 text-center mx-auto"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="w-14 h-14 rounded-full bg-[#f5eefd] text-[#942fcd] flex items-center justify-center mx-auto text-2xl">
        👋
      </div>
      <h2 className="text-[24px] font-semibold text-[#1f2937]">{title}</h2>
      <p className="text-[15px] text-[#6b7280] leading-relaxed">{description}</p>
      {showJiraHint && (
        <p className="text-[13px] text-[#9ca3af]">
          After you are approved, connect your Jira account on Profile to receive assigned tasks.
        </p>
      )}
      <FormButton type="button" className="w-full mt-2" onClick={() => navigate('/workspace/join')}>
        Join a workspace
      </FormButton>
    </div>
  )
}
