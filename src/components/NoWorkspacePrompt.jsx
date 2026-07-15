import { useNavigate } from 'react-router'
import FormButton from '../design-system/components/FormButton'

export default function NoWorkspacePrompt({
  title = 'Join a team to get started',
  description = 'Join a workspace to turn Jira issues into quests, earn XP and coins, climb the season board, and spend rewards with your team.',
  showJiraHint = false,
}) {
  const navigate = useNavigate()

  return (
    <div className="ds-card ds-card-pad w-full max-w-[560px] flex flex-col gap-4 text-center mx-auto">
      <div className="w-14 h-14 rounded-full bg-[color:var(--color-bg-brand-subtle)] text-[color:var(--color-brand)] flex items-center justify-center mx-auto text-2xl">
        👋
      </div>
      <h2 className="ds-section-title">{title}</h2>
      <p className="ds-body leading-relaxed">{description}</p>
      {showJiraHint && (
        <p className="ds-body-sm">
          After you are approved, connect your Jira account on Profile to receive assigned tasks.
        </p>
      )}
      <FormButton type="button" className="w-full mt-2" onClick={() => navigate('/workspace/join')}>
        Join a workspace
      </FormButton>
    </div>
  )
}
