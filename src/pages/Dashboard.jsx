import { useEffect, useMemo, useState, useCallback } from 'react'
import { apiFetch } from '../lib/api'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import NoWorkspacePrompt from '../components/NoWorkspacePrompt'
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

// ── Tailwind class constants ────────────────────────────────
const CARD     = 'bg-white rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]'
const BTN_GHOST = 'flex-1 h-12 rounded-[8px] border border-[#e5e7eb] bg-white flex items-center justify-center gap-2 text-[14px] text-[#374151] cursor-pointer hover:bg-[#f9fafb] transition-colors duration-200'

// ── Icons (local — not shared with other pages) ─────────────

const CheckCircleIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
    <circle cx="10" cy="10" r="9" stroke="#10b981" strokeWidth="1.5" />
    <path d="M6.5 10.5l2.5 2.5 4.5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const PlayIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M5 3l8 5-8 5V3z" fill="#374151" />
  </svg>
)

const TrainIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M8 1.5l1.5 3.5 3.5.5-2.5 2.5.5 3.5L8 9.5 5.5 11l.5-3.5L3.5 5l3.5-.5z" fill="#374151" />
  </svg>
)

const LightningBoltIcon = ({ size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <path d="M13 2L4 13.5h7l-1 8.5 10-13H13L14 2z" fill="white" />
  </svg>
)

// ── Sub-components ──────────────────────────────────────────

const StatBar = ({ label, value, percent, color }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-[#4b5563]">{label}</span>
      <span className="text-[14px] font-medium text-[#1f2937]">{value}</span>
    </div>
    <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
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
      await toggleTaskCompletion(id)
      await refreshDashboard()
    } catch {
      // taskStore handles rollback; global toast shows API error
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <PageHeader
        onOpenSidebar={() => setShowSidebar(true)}
      />

      {/* ── Main content ── */}
      <main className="px-12 py-9">

        <h1 className="text-[32px] font-semibold text-[#1f2937] mb-6">Welcome back, {displayName}</h1>

        {!hasWorkspace ? (
          <NoWorkspacePrompt showJiraHint />
        ) : (
        <div className="flex gap-8 items-start">

          {/* ── Left column ── */}
          <div className="w-[314px] flex flex-col gap-6 shrink-0">

            {/* XP Progress Card */}
            {isInitialLoading ? (
              <SkeletonCard />
            ) : (
              <div className={`${CARD} p-5`}>
                <XPProgressBar xp={lifetimeXP} />
              </div>
            )}

            {/* Active Sprint Card */}
            {isInitialLoading ? (
              <SkeletonCard />
            ) : (
              <div className={`${CARD} p-5`}>
                <p className="text-[14px] font-semibold text-[#1f2937] mb-4">Active Sprint</p>
                <SprintStatusWidget sprint={activeSprint} />
              </div>
            )}

            {/* User Stats Card */}
            <div className={`${CARD} p-6`}>
              <h3 className="text-[16px] font-medium text-[#374151] mb-6">User Stats</h3>
              <div className="flex flex-col gap-5">
                <StatBar
                  label="Tasks Completed"
                  value={`${stats.completed}/${stats.total}`}
                  percent={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
                  color="#60a5fa"
                />
                <StatBar
                  label="Current Streak"
                  value={`${streakDays} day${streakDays === 1 ? '' : 's'}`}
                  percent={Math.min(100, streakDays * 10)}
                  color="#c084fc"
                />
                <StatBar
                  label="Completion Rate"
                  value={`${stats.completionRate}%`}
                  percent={stats.completionRate}
                  color="#4ade80"
                />
                <StatBar
                  label="Open High Priority"
                  value={String(stats.highPriorityOpen)}
                  percent={stats.total > 0 ? Math.round((stats.highPriorityOpen / stats.total) * 100) : 0}
                  color="#facc15"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                className="w-full h-12 rounded-[8px] flex items-center justify-center gap-2 text-[15px] font-medium text-white cursor-pointer hover:opacity-90 transition-opacity duration-200"
                style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)', boxShadow: '0px 4px 12px rgba(148,47,205,0.3)' }}
              >
                <PlusIcon />
                Feed with Code
              </button>
              <div className="flex gap-3">
                <button className={BTN_GHOST}><PlayIcon />Play</button>
                <button className={BTN_GHOST}><TrainIcon />Train</button>
              </div>
            </div>

          </div>

          {/* ── Right column ── */}
          <div className="flex-1 flex flex-col gap-6">

            {/* Questly Progress Card */}
            <div className={`${CARD} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-semibold text-[#1f2937]">Questly Progress</h2>
                  <p className="text-[13px] text-[#6b7280] mt-1">Task completion rate</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon />
                  <span className="text-[20px] font-semibold text-[#1f2937]">
                    {hasWorkspace ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#4b5563]">Overall Progress</span>
                  <span className="text-[16px] font-semibold text-[#1f2937]">{stats.completionRate}%</span>
                </div>
                <div className="h-3 rounded-full bg-[#e5e7eb] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${stats.completionRate}%`, background: 'linear-gradient(to bottom, #6366f1, #a855f7)' }}
                  />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-6">

              {/* Tasking Streak */}
              <div className={`${CARD} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)' }}
                  >
                    <LightningBoltIcon size={24} />
                  </div>
                  <span className="text-[16px] font-medium text-[#374151]">Tasking Streak</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] font-bold text-[#1f2937] leading-tight">{streakDays}</span>
                  <span className="text-[16px] text-[#6b7280]">days</span>
                </div>
              </div>

              {/* Assigned tasks */}
              <div className={`${CARD} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
                  >
                    <span className="text-white text-[18px] font-bold">{stats.total}</span>
                  </div>
                  <span className="text-[16px] font-medium text-[#374151]">Active Quests</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] font-bold text-[#1f2937] leading-tight">{stats.completed}</span>
                  <span className="text-[16px] text-[#6b7280]">completed</span>
                </div>
              </div>

            </div>

            {/* High Priority Tasks */}
            <div className={`${CARD} p-6`}>
              <h2 className="text-[18px] font-medium text-[#374151] mb-6">High Priority Tasks</h2>

              {isInitialLoading && <SkeletonList count={3} />}

              {!isInitialLoading && priorityTasks.length === 0 && (
                <div className="rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] px-5 py-8 text-center">
                  <p className="text-[14px] text-[#6b7280]">
                    {stats.total === 0 && !tasksLoading
                      ? 'No tasks yet. Ask your admin to sync Jira tasks.'
                      : 'No high-priority tasks right now.'}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {priorityTasks.map(task => (
                  <div key={task.id} className="border border-[#e5e7eb] rounded-[8px] px-5 py-5">
                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Completion checkbox */}
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="w-5 h-5 rounded-[5.8px] flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-200"
                          style={{ background: task.done ? '#00c950' : '#e5e7eb' }}
                        >
                          {task.done && <CheckmarkIcon />}
                        </button>

                        <div className="flex flex-col gap-2 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <DifficultyBadge level={task.difficulty} />
                            <span className={`text-[16px] font-medium ${task.done ? 'line-through text-[#9ca3af]' : 'text-[#1f2937]'}`}>
                              {task.title}
                            </span>
                          </div>
                          <span className="text-[13px] text-[#6b7280]">Due {task.due}</span>
                        </div>
                      </div>

                      {/* XP reward */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-4">
                        <StarIcon color="#942fcd" size={16} />
                        <span className="text-[18px] font-semibold text-[#942fcd]">+{task.xp}XP</span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* XP info banner */}
              <div className="mt-6 border-t border-[#e5e7eb] pt-6">
                <div className="bg-[#f9fafb] rounded-[8px] p-4">
                  <p className="text-[13px] font-medium text-[#374151] mb-2">💡 How XP Works</p>
                  <p className="text-[12px] text-[#6b7280] leading-relaxed">
                    Complete tasks to earn XP based on difficulty. Easy = 20XP, Medium = 40XP, Hard = 70XP. Accumulate 1000 XP to level up and unlock new rewards.
                  </p>
                </div>
              </div>

            </div>

            {/* XP History */}
            <div className={`${CARD} p-6`}>
              <h2 className="text-[18px] font-medium text-[#374151] mb-6">XP History</h2>
              <XPHistory
                transactions={xpHistory}
                isLoading={historyLoading}
                error={historyError}
              />
            </div>

          </div>
        </div>
        )}
      </main>
    </div>
  )
}
