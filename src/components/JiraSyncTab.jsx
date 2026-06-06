import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import jiraLogo from '../assets/jira-original-wordmark.svg'
import { useWorkspaceStore } from '../stores/workspaceStore'

const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

const SyncIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <path
      d="M4 10a6 6 0 0110.24-4.24M16 10a6 6 0 01-10.24 4.24"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M14 3h2.5V5.5M6 17H3.5V14.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

function formatSyncTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function FieldLabel({ children }) {
  return <label className="text-[13px] font-medium text-[#374151]">{children}</label>
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-[8px] border border-[#e5e7eb] text-[14px] text-[#1f2937] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#942fcd]/30 focus:border-[#942fcd]"
    />
  )
}

export default function JiraSyncTab() {
  const navigate = useNavigate()
  const {
    workspace,
    fetchMine,
    connectJira,
    disconnectJira,
    syncJiraTasks,
    lastJiraSyncAt,
    lastJiraSyncResult,
    isLoading,
    error,
    clearError,
  } = useWorkspaceStore()
  const [toast, setToast] = useState(null)
  const [siteUrl, setSiteUrl] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    fetchMine().catch(() => {})
  }, [fetchMine])

  useEffect(() => {
    if (!workspace) return
    setSiteUrl(workspace.jira_site_url || '')
    setProjectKey(workspace.jira_project_key || '')
    setAccessToken('')
  }, [workspace])

  const handleConnect = async (e) => {
    e.preventDefault()
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      await connectJira(workspace.id, {
        jira_site_url: siteUrl.trim(),
        jira_project_key: projectKey.trim(),
        access_token: accessToken.trim(),
      })
      setAccessToken('')
      setToast({ type: 'success', message: 'Jira connected successfully.' })
    } catch {
      setToast({ type: 'error', message: 'Failed to connect Jira. Check your credentials and try again.' })
    }
  }

  const handleDisconnect = async () => {
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      await disconnectJira(workspace.id)
      setSiteUrl('')
      setProjectKey('')
      setAccessToken('')
      setToast({ type: 'success', message: 'Jira disconnected.' })
    } catch {
      setToast({ type: 'error', message: 'Failed to disconnect Jira.' })
    }
  }

  const handleSync = async () => {
    if (!workspace?.id) return
    clearError()
    setToast(null)
    try {
      const result = await syncJiraTasks(workspace.id)
      setToast({
        type: 'success',
        message: `Synced ${result.synced} issue${result.synced === 1 ? '' : 's'} from Jira.`,
      })
    } catch {
      setToast({
        type: 'error',
        message: 'Jira sync failed. Check your connection settings and try again.',
      })
    }
  }

  if (!workspace) {
    return (
      <div className={`${CARD} p-10 flex flex-col items-center gap-4 text-center max-w-[560px]`}>
        <img src={jiraLogo} alt="Jira" className="w-12 h-12 object-contain" />
        <p className="text-[16px] font-semibold text-[#1f2937]">Create a workspace first</p>
        <p className="text-[13px] text-[#6b7280]">
          You need a workspace before syncing tasks from Jira.
        </p>
        <button
          type="button"
          onClick={() => navigate('/workspace/create')}
          className="px-5 py-2.5 rounded-[8px] text-[14px] font-semibold text-white cursor-pointer"
          style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
        >
          Create Workspace
        </button>
      </div>
    )
  }

  const isConnected = Boolean(workspace.jira_connected)

  return (
    <div className="max-w-[640px] flex flex-col gap-6">
      {toast && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-[10px] text-[13px] font-medium ${
            toast.type === 'success'
              ? 'text-[#059669] bg-[#d1fae5] border border-[#a7f3d0]'
              : 'text-[#ef4444] bg-[#fee2e2] border border-[#fecaca]'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className={`${CARD} p-6 flex flex-col gap-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(to bottom, #fcfcfc, #87b9fb)',
                boxShadow: '0px 4px 16px 0px rgba(0, 82, 204, 0.15)',
              }}
            >
              <img src={jiraLogo} alt="Jira" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h3 className="text-[18px] font-semibold text-[#1f2937]">Connect Jira</h3>
              <p className="text-[13px] text-[#6b7280] mt-1">
                Store your workspace Jira credentials for syncing tasks into{' '}
                <strong>{workspace.name}</strong>.
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-[6px] ${
              isConnected
                ? 'bg-[#d1fae5] text-[#059669]'
                : 'bg-[#f3f4f6] text-[#6b7280]'
            }`}
          >
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {error && (
          <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleConnect} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Jira site URL</FieldLabel>
            <TextInput
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yourteam.atlassian.net"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Project key</FieldLabel>
            <TextInput
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              placeholder="QUEST"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>API token</FieldLabel>
            <TextInput
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={isConnected ? 'Enter a new token to update' : 'Your Atlassian API token'}
            />
            <p className="text-[11px] text-[#9ca3af]">
              Use the email on your Questly admin account with this token. Tokens are stored securely
              and never shown again.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={isLoading || !siteUrl.trim() || !projectKey.trim() || !accessToken.trim()}
              className="px-5 py-2.5 rounded-[8px] text-[14px] font-semibold text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
            >
              {isLoading ? 'Connecting…' : isConnected ? 'Update connection' : 'Connect'}
            </button>
            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-[8px] text-[14px] font-semibold text-[#ef4444] bg-[#fee2e2] border border-[#fecaca] cursor-pointer disabled:opacity-60"
              >
                Disconnect
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={`${CARD} p-6 flex flex-col gap-6`}>
        <div>
          <h3 className="text-[18px] font-semibold text-[#1f2937]">Sync tasks from Jira</h3>
          <p className="text-[13px] text-[#6b7280] mt-1">
            Pull issues from your Jira project. Developers see assigned tasks on their Task List.
          </p>
        </div>

        <div className="rounded-[10px] bg-[#f9fafb] border border-[#e5e7eb] px-4 py-3 text-[13px] text-[#6b7280] leading-relaxed">
          Difficulty and XP come from <strong>Jira story points</strong>: 1–2 pts → Easy (20 XP),
          3–5 → Medium (40 XP), 8+ → Hard (70 XP). Coins are awarded when developers complete tasks.
        </div>

        {lastJiraSyncResult && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Issues synced', value: lastJiraSyncResult.synced },
              { label: 'Created', value: lastJiraSyncResult.created },
              { label: 'Updated', value: lastJiraSyncResult.updated },
              { label: 'Assignments', value: lastJiraSyncResult.assignments },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-[8px] bg-[#f5eefd] border border-[#e9d5ff] px-3 py-2 text-center"
              >
                <p className="text-[20px] font-bold text-[#942fcd]">{value ?? 0}</p>
                <p className="text-[11px] text-[#6b7280]">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-[12px] text-[#9ca3af]">
            {lastJiraSyncAt
              ? `Last synced ${formatSyncTime(lastJiraSyncAt)}`
              : 'Not synced yet this session'}
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={isLoading || !isConnected}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[14px] font-semibold text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
          >
            <SyncIcon />
            {isLoading ? 'Syncing…' : 'Sync with Jira'}
          </button>
        </div>
      </div>
    </div>
  )
}
