import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { apiFetch } from '../lib/api'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import NoWorkspacePrompt from '../components/NoWorkspacePrompt'
import TeamJiraBanner from '../components/TeamJiraBanner'
import DifficultyBadge from '../components/DifficultyBadge'
import { CheckmarkIcon, StarIcon } from '../components/icons'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'
import { useDashboardStore } from '../stores/dashboardStore'
import XPProgressBar from '../components/XPProgressBar'
import SprintStatusWidget from '../components/SprintStatusWidget'
import { useXP } from '../hooks/useXP'
import XPHistory from '../components/XPHistory'
import { SkeletonCard, SkeletonList } from '../components/Skeleton'
import MetricStatCard from '../design-system/components/MetricStatCard'
import AnimatedReveal from '../components/motion/AnimatedReveal'
import { useTaskCompleteMotion } from '../hooks/useTaskCompleteMotion'

// ── Icons (local — not shared with other pages) ─────────────

const CheckCircleIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <circle cx="10" cy="10" r="9" stroke="var(--color-success-500)" strokeWidth="1.5" />
    <path
      d="M6.5 10.5l2.5 2.5 4.5-5"
      stroke="var(--color-success-500)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const LightningBoltIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <path d="M13 2L4 13.5h7l-1 8.5 10-13H13L14 2z" fill="var(--color-warning-500)" />
  </svg>
)

const QuestCountIcon = ({ count = 0 }) => (
  <span className="text-[length:var(--text-h6)] font-bold text-[color:var(--color-brand)]">{count}</span>
)

function PriorityTaskRow({ task, onToggle }) {
  const cardRef = useRef(null)
  const checkboxRef = useRef(null)
  const xpGhostRef = useRef(null)
  const { playCompleteJuice } = useTaskCompleteMotion({ cardRef, checkboxRef, xpGhostRef })

  const handleToggle = async () => {
    if (task.done) {
      await onToggle(task.id)
      return
    }

    const result = await onToggle(task.id)
    await playCompleteJuice({
      xp: task.xp,
      compressed: Boolean(result?.levelUp),
    })
  }

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden border border-[color:var(--color-border)] rounded-[var(--radius-md)] px-5 py-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <span
        ref={xpGhostRef}
        data-task-xp-ghost
        data-xp-amount={task.xp}
        className="pointer-events-none absolute right-5 top-5 z-10 text-[length:var(--text-h4)] font-semibold text-[color:var(--color-brand)] invisible"
        aria-hidden="true"
      >
        +{task.xp} XP
      </span>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            ref={checkboxRef}
            type="button"
            aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
            onClick={handleToggle}
            className="w-5 h-5 rounded-[5.8px] flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-200 ds-focus-ring"
            style={{
              background: task.done ? 'var(--color-success-500)' : 'var(--color-gray-200)',
            }}
          >
            {task.done && <CheckmarkIcon />}
          </button>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <DifficultyBadge level={task.difficulty} />
              <span
                className={`text-[length:var(--text-h6)] font-medium ${
                  task.done
                    ? 'line-through text-[color:var(--color-text-subtle)]'
                    : 'text-[color:var(--color-gray-800)]'
                }`}
              >
                {task.title}
              </span>
            </div>
            <span className="ds-body-sm">Due {task.due}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <StarIcon color="var(--color-brand)" size={16} />
          <span className="text-[length:var(--text-h4)] font-semibold text-[color:var(--color-brand)]">
            +{task.xp}XP
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

const StatBar = ({ label, value, percent, color }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="ds-body">{label}</span>
      <span className="text-[length:var(--text-body)] font-medium text-[color:var(--color-gray-800)]">{value}</span>
    </div>
    <div className="h-2 rounded-full bg-[color:var(--color-gray-200)] overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
    </div>
  </div>
)

// ── Dashboard page ──────────────────────────────────────────

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.userRole)
  const { lifetimeXP } = useXP()
  const tasks = useTaskStore((s) => s.tasks)
  const tasksLoading = useTaskStore((s) => s.isLoading)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion)
  const dashboardData = useDashboardStore((s) => s.data)
  const dashboardLoading = useDashboardStore((s) => s.isLoading)
  const fetchDashboard = useDashboardStore((s) => s.fetchDashboard)
  const [showSidebar, setShowSidebar] = useState(false)
  const [xpHistory, setXpHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)

  const loadXpHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const { transactions } = await apiFetch('/api/users/me/xp-history')
      setXpHistory(transactions)
    } catch (err) {
      setHistoryError(err.message)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      fetchDashboard(),
      fetchTasks(),
      loadXpHistory(),
    ])
  }, [fetchDashboard, fetchTasks, loadXpHistory])

  const hasWorkspace = Boolean(user?.workspace_id)

  useEffect(() => {
    if (userRole === 'developer' && hasWorkspace) {
      refreshDashboard().catch(() => {})
    }
  }, [userRole, hasWorkspace, refreshDashboard])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.done).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    const highPriorityOpen = tasks.filter((task) => task.highPriority && !task.done).length

    return { total, completed, completionRate, highPriorityOpen }
  }, [tasks])

  const priorityTasks = dashboardData?.highPriorityTasks ?? []
  const activeSprint = dashboardData?.activeSprint ?? null
  const streakDays = dashboardData?.streak ?? user?.streak_days ?? 0

  const displayName = user?.username || 'Developer'
  const isInitialLoading = hasWorkspace && dashboardLoading && !dashboardData

  const toggleTask = async (id) => {
    try {
      const result = await toggleTaskCompletion(id)
      await refreshDashboard()
      return result
    } catch {
      // taskStore handles rollback; global toast shows API error
    }
  }

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

        <AnimatedReveal>
          <h1 data-motion-reveal className="ds-page-title mb-6">Welcome back, {displayName}</h1>
        </AnimatedReveal>

        {hasWorkspace && <TeamJiraBanner user={user} />}

        {!hasWorkspace ? (
          <NoWorkspacePrompt showJiraHint />
        ) : (
        <AnimatedReveal className="flex gap-8 items-start" stagger={0.12}>

          {/* ── Left column ── */}
          <div data-motion-reveal className="w-[314px] flex flex-col gap-6 shrink-0">

            {isInitialLoading ? (
              <SkeletonCard />
            ) : (
              <div className="ds-card ds-card-pad-sm">
                <XPProgressBar xp={lifetimeXP} />
              </div>
            )}

            {isInitialLoading ? (
              <SkeletonCard />
            ) : (
              <div className="ds-card ds-card-pad-sm">
                <p className="text-[length:var(--text-body)] font-semibold text-[color:var(--color-gray-800)] mb-4">
                  Active Sprint
                </p>
                <SprintStatusWidget sprint={activeSprint} />
              </div>
            )}

            <div className="ds-card ds-card-pad">
              <h3 className="ds-subsection-title mb-6">User Stats</h3>
              <div className="flex flex-col gap-5">
                <StatBar
                  label="Tasks Completed"
                  value={`${stats.completed}/${stats.total}`}
                  percent={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
                  color="var(--color-primary-400)"
                />
                <StatBar
                  label="Current Streak"
                  value={`${streakDays} day${streakDays === 1 ? '' : 's'}`}
                  percent={Math.min(100, streakDays * 10)}
                  color="var(--color-primary-300)"
                />
                <StatBar
                  label="Completion Rate"
                  value={`${stats.completionRate}%`}
                  percent={stats.completionRate}
                  color="var(--color-success-400)"
                />
                <StatBar
                  label="Open High Priority"
                  value={String(stats.highPriorityOpen)}
                  percent={stats.total > 0 ? Math.round((stats.highPriorityOpen / stats.total) * 100) : 0}
                  color="var(--color-warning-400)"
                />
              </div>
            </div>

          </div>

          {/* ── Right column ── */}
          <div data-motion-reveal className="flex-1 flex flex-col gap-6">

            <div className="ds-card ds-card-pad">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="ds-section-title">Questly Progress</h2>
                  <p className="ds-body-sm mt-1">Task completion rate</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon />
                  <span className="text-[length:var(--text-h5)] font-semibold text-[color:var(--color-gray-800)]">
                    {hasWorkspace ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[length:var(--text-body)] font-medium text-[color:var(--color-gray-600)]">
                    Overall Progress
                  </span>
                  <span className="text-[length:var(--text-h6)] font-semibold text-[color:var(--color-gray-800)]">
                    {stats.completionRate}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[color:var(--color-gray-200)] overflow-hidden">
                  <div
                    className="h-full rounded-full ds-progress-gradient"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <MetricStatCard
                value={streakDays}
                suffix="days"
                label="Tasking Streak"
                tone="warning"
                icon={<LightningBoltIcon />}
              />
              <MetricStatCard
                value={stats.completed}
                suffix={`/ ${stats.total}`}
                label="Active Quests completed"
                icon={<QuestCountIcon count={stats.total} />}
              />
            </div>

            <div className="ds-card ds-card-pad">
              <h2 className="ds-subsection-title mb-6">High Priority Tasks</h2>

              {isInitialLoading && <SkeletonList count={3} />}

              {!isInitialLoading && priorityTasks.length === 0 && (
                <div className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border)] px-5 py-8 text-center">
                  <p className="ds-body-sm">
                    {stats.total === 0 && !tasksLoading
                      ? 'No tasks yet. Ask your admin to sync Jira tasks.'
                      : 'No high-priority tasks right now.'}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {priorityTasks.map((task) => (
                  <PriorityTaskRow key={task.id} task={task} onToggle={toggleTask} />
                ))}
              </div>

              <div className="mt-6 border-t border-[color:var(--color-border)] pt-6">
                <div className="rounded-[var(--radius-md)] bg-[color:var(--color-bg-subtle)] p-4">
                  <p className="text-[length:var(--text-body-sm)] font-medium text-[color:var(--color-gray-700)] mb-2">
                    💡 How XP Works
                  </p>
                  <p className="ds-caption leading-relaxed">
                    Complete tasks to earn XP based on difficulty. Easy = 20XP, Medium = 40XP, Hard = 70XP.
                    Accumulate 1000 XP to level up and unlock new rewards.
                  </p>
                </div>
              </div>

            </div>

            <div className="ds-card ds-card-pad">
              <h2 className="ds-subsection-title mb-6">XP History</h2>
              <XPHistory
                transactions={xpHistory}
                isLoading={historyLoading}
                error={historyError}
              />
            </div>

          </div>
        </AnimatedReveal>
        )}
      </main>
    </div>
  )
}
