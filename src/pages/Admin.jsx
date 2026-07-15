import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import { useAuthStore } from '../stores/authStore'
import { pagePath } from '../lib/workspaceNav'
import JoinRequestsTab from '../components/JoinRequestsTab'
import XpApprovalsTab from '../components/XpApprovalsTab'
import WorkspaceInviteCode from '../components/WorkspaceInviteCode'
import JiraSyncTab from '../components/JiraSyncTab'
import SprintManagementTab from '../components/SprintManagementTab'
import RewardManagementTab from '../components/RewardManagementTab'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useWorkspaceJiraOAuthCallback } from '../hooks/useWorkspaceJiraOAuthCallback'
import { mapMemberToDeveloper } from '../lib/adminMembers'
import { SkeletonList } from '../components/Skeleton'

// ── Constants ──────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #a855f7)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
]

// ── Icons ──────────────────────────────────────────────────

const ListIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const GridIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0">
    <path d="M2 7l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const CoinIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <circle cx="12" cy="12" r="9" stroke="var(--color-warning-500)" strokeWidth="1.8" />
    <path d="M12 7v2M12 15v2M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.4 2.5 1.5-1 1.5-2.5 2-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.5 2.5-1.5" stroke="var(--color-warning-500)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const SaveIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M2 2h9l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="5" y="2" width="4" height="4" rx="0.5" stroke="white" strokeWidth="1.3" />
    <rect x="3" y="9" width="10" height="5" rx="0.5" stroke="white" strokeWidth="1.3" />
  </svg>
)

// ── Shared sub-components ─────────────────────────────────

function DevAvatar({ idx, size = 36 }) {
  return (
    <div
      className="rounded-full overflow-hidden shrink-0"
      style={{ width: size, height: size, background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}
    >
      <svg viewBox="0 0 40 40" fill="none" width={size} height={size}>
        <circle cx="20" cy="26" r="12" fill="rgba(255,255,255,0.25)" />
        <circle cx="20" cy="15" r="7"  fill="rgba(255,255,255,0.45)" />
      </svg>
    </div>
  )
}

function StatusBadge({ status }) {
  return status === 'active' ? (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] bg-[color:var(--color-success-100)] text-[color:var(--color-success-600)]">Active</span>
  ) : (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] bg-[color:var(--color-gray-100)] text-[color:var(--color-text-subtle)]">Inactive</span>
  )
}

// ── Team Tab ──────────────────────────────────────────────

function TeamTab({ developers }) {
  const [view, setView] = useState('leaderboard')
  const sorted = [...developers].sort((a, b) => b.xp - a.xp)
  const MEDALS = ['🥇', '🥈', '🥉']
  const TH = 'text-[length:var(--text-caption)] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wide text-left py-3 px-4'
  const TD = 'py-3.5 px-4 text-[length:var(--text-body-sm)] text-[color:var(--color-gray-700)]'

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-6">
        <p className="ds-body-sm">{developers.length} developers on your team</p>
        <div className="flex gap-1 p-1 bg-[color:var(--color-gray-100)] rounded-[var(--radius-md)]">
          {[
            { id: 'leaderboard', label: 'Leaderboard', Icon: ListIcon },
            { id: 'cards',       label: 'Cards',       Icon: GridIcon },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`ds-focus-ring flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-[length:var(--text-body-sm)] font-medium transition-all duration-150 cursor-pointer ${
                view === id
                  ? 'bg-[color:var(--color-bg)] text-[color:var(--color-gray-800)] shadow-sm'
                  : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gray-700)]'
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'leaderboard' ? (

        <div className="ds-card overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[color:var(--color-gray-100)]">
                <th className={TH}>Rank</th>
                <th className={TH}>Developer</th>
                <th className={TH}>Level</th>
                <th className={TH}>XP</th>
                <th className={TH}>Coins</th>
                <th className={TH}>Tasks Done</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((dev, i) => (
                <tr key={dev.id} className="border-b border-[color:var(--color-gray-50)] hover:bg-[color:var(--color-gray-50)] transition-colors">
                  <td className={`${TD} w-16`}>
                    <span className="text-[length:var(--text-h6)]">{i < 3 ? MEDALS[i] : `#${i + 1}`}</span>
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-2.5">
                      <DevAvatar idx={dev.avatarIdx ?? 0} size={32} />
                      <span className="font-medium text-[color:var(--color-gray-800)]">{dev.name}</span>
                    </div>
                  </td>
                  <td className={TD}>
                    <span className="ds-brand-gradient px-2 py-0.5 rounded-full text-[11px] font-semibold text-white">
                      Lv {dev.level}
                    </span>
                  </td>
                  <td className={TD}>
                    <span className="font-semibold text-[color:var(--color-gray-800)]">{dev.xp.toLocaleString()}</span>
                    <span className="text-[color:var(--color-text-subtle)] ml-1">XP</span>
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-1">
                      <CoinIcon size={13} />
                      <span className="font-semibold">{dev.coins}</span>
                    </div>
                  </td>
                  <td className={TD}><span className="font-medium">{dev.tasks}</span></td>
                  <td className={TD}><StatusBadge status={dev.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        <div className="grid grid-cols-4 gap-4">
          {sorted.map((dev) => {
            const pct = Math.round((dev.xp / dev.xpMax) * 100)
            return (
              <div key={dev.id} className="ds-card ds-card-pad ds-card-lift flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <DevAvatar idx={dev.id - 1} size={44} />
                  <div className="min-w-0">
                    <p className="text-[length:var(--text-body)] font-semibold text-[color:var(--color-gray-800)] truncate">{dev.name}</p>
                    <StatusBadge status={dev.status} />
                  </div>
                </div>
                <span className="ds-brand-gradient w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold text-white">
                  Level {dev.level}
                </span>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[color:var(--color-text-muted)]">XP Progress</span>
                    <span className="font-medium text-[color:var(--color-gray-800)]">{dev.xp.toLocaleString()} / {dev.xpMax.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[color:var(--color-gray-200)] overflow-hidden">
                    <div className="ds-progress-gradient h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[color:var(--color-gray-100)]">
                  <div className="flex items-center gap-1">
                    <CoinIcon size={13} />
                    <span className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-gray-700)]">{dev.coins} Coins</span>
                  </div>
                  <span className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">{dev.tasks} tasks</span>
                </div>
              </div>
            )
          })}
        </div>

      )}
    </div>
  )
}

// ── XP Settings Tab ───────────────────────────────────────

function XPSettingsTab() {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const fetchMine = useWorkspaceStore((s) => s.fetchMine)
  const updateWorkspaceSettings = useWorkspaceStore((s) => s.updateWorkspaceSettings)
  const isLoading = useWorkspaceStore((s) => s.isLoading)
  const [settings, setSettings] = useState({ easy: 50, medium: 100, hard: 200, rate: 10 })
  const [requireXpApproval, setRequireXpApproval] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    fetchMine()
      .then((ws) => setRequireXpApproval(Boolean(ws?.require_xp_approval)))
      .catch(() => {})
  }, [fetchMine])

  const update = (key, val) => setSettings(s => ({ ...s, [key]: Number(val) || 0 }))

  const save = async () => {
    if (!workspace?.id) return
    try {
      await updateWorkspaceSettings(workspace.id, { require_xp_approval: requireXpApproval })
      setToast(true)
      setTimeout(() => setToast(false), 3000)
    } catch {
      // error surfaced via store
    }
  }

  const INPUT = 'w-24 h-10 border border-[color:var(--color-border)] rounded-[var(--radius-md)] px-3 text-[length:var(--text-body)] font-medium text-[color:var(--color-gray-800)] text-right focus:outline-none focus:border-[color:var(--color-brand)] transition-colors ds-focus-ring'

  return (
    <div className="max-w-[560px]">
      {toast && (
        <div
          className="mb-6 flex items-center gap-2 px-4 py-3 rounded-[10px] text-[length:var(--text-body-sm)] font-medium text-[color:var(--color-success-600)] bg-[color:var(--color-success-100)] border border-[color:var(--color-success-200)]"
          style={{ animation: 'fadeInDown 0.3s ease' }}
        >
          <CheckIcon />
          XP verification settings saved!
        </div>
      )}

      <div className="ds-card ds-card-pad flex flex-col gap-6 mb-6">
        <div>
          <h3 className="ds-section-title mb-1">XP verification</h3>
          <p className="ds-body-sm">
            When enabled, developers submit completed tasks for your approval before XP and coins are awarded.
          </p>
        </div>

        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-[length:var(--text-body)] font-medium text-[color:var(--color-gray-700)]">Require admin approval for task XP</span>
          <input
            type="checkbox"
            checked={requireXpApproval}
            onChange={(e) => setRequireXpApproval(e.target.checked)}
            className="w-5 h-5 accent-[color:var(--color-brand)] cursor-pointer ds-focus-ring"
          />
        </label>
      </div>

      <div className="ds-card ds-card-pad flex flex-col gap-6">

        <div>
          <h3 className="ds-section-title mb-1">Task XP Rewards</h3>
          <p className="ds-body-sm">XP values come from Jira story points during sync (display only)</p>
        </div>

        <div className="flex flex-col gap-4">
          {[
            { key: 'easy',   label: 'Easy Tasks',   color: 'var(--color-success-600)', bg: 'var(--color-success-100)' },
            { key: 'medium', label: 'Medium Tasks',  color: 'var(--color-warning-600)', bg: 'var(--color-warning-100)' },
            { key: 'hard',   label: 'Hard Tasks',    color: 'var(--color-error-600)', bg: 'var(--color-error-100)' },
          ].map(({ key, label, color, bg }) => (
            <div key={key} className="flex items-center justify-between">
              <span
                className="px-3 py-1 rounded-full text-[length:var(--text-caption)] font-semibold"
                style={{ background: bg, color }}
              >
                {label}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings[key]}
                  onChange={e => update(key, e.target.value)}
                  className={INPUT}
                  min={0}
                />
                <span className="ds-body-sm w-8">XP</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[color:var(--color-gray-100)]">
          <h3 className="ds-section-title mb-1">XP → Coins Conversion</h3>
          <p className="ds-body-sm mb-2">
            Coins are awarded with approved XP at <strong>10 XP = 1 Coin</strong> (e.g. 170 XP → 17 Coins).
          </p>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={isLoading}
          className="ds-btn-primary ds-focus-ring flex items-center justify-center gap-2 w-full h-11 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold"
        >
          <SaveIcon />
          {isLoading ? 'Saving…' : 'Save Verification Setting'}
        </button>

      </div>
    </div>
  )
}

// ── Users Tab ─────────────────────────────────────────────

function UsersTab({ developers, isLoading }) {
  const TH = 'text-[length:var(--text-caption)] font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wide text-left py-3 px-4'
  const TD = 'py-3.5 px-4 text-[length:var(--text-body-sm)] text-[color:var(--color-gray-700)] align-top'

  if (isLoading) return <SkeletonList count={4} />

  if (developers.length === 0) {
    return (
      <div className="ds-card ds-card-pad py-10 text-center flex flex-col items-center gap-3">
        <p className="text-[length:var(--text-body-lg)] font-medium text-[color:var(--color-gray-700)]">No team members yet</p>
        <p className="ds-body-sm">Share your workspace code so developers can request to join.</p>
      </div>
    )
  }

  return (
    <div className="ds-card overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[color:var(--color-gray-100)]">
            <th className={TH}>Developer</th>
            <th className={TH}>Status</th>
            <th className={TH}>Sprint XP</th>
            <th className={TH}>Coins</th>
          </tr>
        </thead>
        <tbody>
          {developers.map((dev) => (
            <tr key={dev.id} className="border-b border-[color:var(--color-gray-50)] hover:bg-[color:var(--color-gray-50)] transition-colors">
              <td className={TD}>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <DevAvatar idx={dev.avatarIdx ?? 0} size={32} />
                  <div>
                    <p className="font-medium text-[color:var(--color-gray-800)]">{dev.name}</p>
                    <p className="text-[11px] text-[color:var(--color-text-subtle)]">Level {dev.level}</p>
                  </div>
                </div>
              </td>
              <td className={TD}><StatusBadge status={dev.status} /></td>
              <td className={TD}>
                <span className="font-semibold text-[color:var(--color-gray-800)]">{dev.xp.toLocaleString()}</span>
                <span className="text-[color:var(--color-text-subtle)] ml-1 text-[11px]">XP</span>
              </td>
              <td className={TD}>
                <div className="flex items-center gap-1">
                  <CoinIcon size={13} />
                  <span className="font-medium">{dev.coins}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Admin page ────────────────────────────────────────────

export default function Admin() {
  useWorkspaceJiraOAuthCallback()
  const { workspaceId: routeWorkspaceId } = useParams()
  const userRole = useAuthStore((s) => s.userRole)
  const memberships = useAuthStore((s) => s.memberships)
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId)
  const multiWorkspace = Array.isArray(memberships)
  const workspace = useWorkspaceStore((s) => s.workspace)
  const members = useWorkspaceStore((s) => s.members)
  const fetchMine = useWorkspaceStore((s) => s.fetchMine)
  const fetchMembers = useWorkspaceStore((s) => s.fetchMembers)
  const pendingJoinRequests = useWorkspaceStore((s) => s.pendingJoinRequests)
  const pendingXpApprovals = useWorkspaceStore((s) => s.pendingXpApprovals)
  const fetchPendingXpApprovals = useWorkspaceStore((s) => s.fetchPendingXpApprovals)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState('team')
  const [membersLoading, setMembersLoading] = useState(
    () => useWorkspaceStore.getState().members.length === 0,
  )
  const homePath = pagePath('admin', multiWorkspace ? (routeWorkspaceId || activeWorkspaceId) : null)

  const developers = members.map(mapMemberToDeveloper)
  const totalJoinPending = pendingJoinRequests.length
  const totalXpPending = pendingXpApprovals.length

  const loadMembers = (options = {}) => {
    const { showSkeleton = true } = options
    if (showSkeleton) setMembersLoading(true)
    fetchMine()
      .then((ws) => {
        if (!ws?.id) return []
        return Promise.all([
          fetchMembers(ws.id),
          fetchPendingXpApprovals(ws.id),
        ])
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false))
  }

  useEffect(() => {
    if (userRole !== 'admin') return
    if (activeTab !== 'team' && activeTab !== 'users') return
    // Wait until URL workspace matches session context so /mine is not called with a stale header.
    if (routeWorkspaceId && activeWorkspaceId && routeWorkspaceId !== activeWorkspaceId) return
    // Skeleton only when we have nothing yet — avoids Admin panel "twitch" on re-fetch.
    loadMembers({ showSkeleton: members.length === 0 })
    // Intentionally not keyed on pendingJoinRequests / members updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, activeTab, routeWorkspaceId, activeWorkspaceId])

  const TABS = [
    { id: 'team',    label: 'Team'           },
    { id: 'jira',    label: 'Jira'           },
    { id: 'sprints', label: 'Sprints'        },
    { id: 'joins',   label: 'Join Requests'  },
    { id: 'xp-approvals', label: 'XP Approvals' },
    { id: 'rewards', label: 'Rewards'        },
    { id: 'xp',      label: 'XP Settings'    },
    { id: 'users',   label: 'Users'          },
  ]

  return (
    <div className="ds-page">

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <PageHeader
        onOpenSidebar={() => setShowSidebar(true)}
      />

      <main className="ds-page-main">
        <Link
          to={homePath}
          className="inline-block mb-4 ds-focus-ring rounded-[var(--radius-md)]"
        >
          <img src={logoHorizontal} alt="Questly" className="h-8" />
        </Link>

        <h1 className="ds-page-title mb-6">Admin Panel</h1>

        {workspace?.code && (
          <div className="mb-8 flex flex-col gap-3">
            <WorkspaceInviteCode code={workspace.code} workspaceName={workspace.name} />
            {multiWorkspace && (
              <p className="ds-body-sm text-[color:var(--color-text-muted)]">
                Need another team? Open the{' '}
                <Link
                  to={pagePath('workspace', routeWorkspaceId || activeWorkspaceId)}
                  className="font-semibold text-[color:var(--color-brand)] hover:underline ds-focus-ring rounded-[var(--radius-sm)]"
                >
                  Workspace
                </Link>{' '}
                tab to create or join another one.
              </p>
            )}
          </div>
        )}

        {/* Sub-tab bar */}
        <div className="flex gap-0 border-b border-[color:var(--color-border)] mb-8">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`ds-focus-ring px-5 py-3 text-[length:var(--text-body)] font-medium transition-all duration-150 cursor-pointer relative ${
                activeTab === id
                  ? 'text-[color:var(--color-brand)] font-semibold'
                  : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-gray-700)]'
              }`}
            >
              {label}
              {id === 'joins' && totalJoinPending > 0 && (
                <span className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full text-[color:var(--color-secondary-600)] bg-[color:var(--color-secondary-100)]">
                  {totalJoinPending}
                </span>
              )}
              {id === 'xp-approvals' && totalXpPending > 0 && (
                <span className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full text-[color:var(--color-brand)] bg-[color:var(--color-bg-brand-subtle)]">
                  {totalXpPending}
                </span>
              )}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[color:var(--color-brand)]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'team' && (
          membersLoading ? <SkeletonList count={4} /> : <TeamTab developers={developers} />
        )}
        {activeTab === 'jira' && <JiraSyncTab />}
        {activeTab === 'sprints' && <SprintManagementTab />}
        {activeTab === 'joins' && <JoinRequestsTab />}
        {activeTab === 'xp-approvals' && <XpApprovalsTab />}
        {activeTab === 'rewards' && <RewardManagementTab />}
        {activeTab === 'xp' && <XPSettingsTab />}
        {activeTab === 'users' && (
          <UsersTab developers={developers} isLoading={membersLoading} />
        )}

      </main>
    </div>
  )
}
