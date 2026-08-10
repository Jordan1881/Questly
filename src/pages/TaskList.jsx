import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import NoWorkspacePrompt from '../components/NoWorkspacePrompt'
import TaskCard from '../components/TaskCard'
import FilterBar from '../components/FilterBar'
import { filterTasks } from '../lib/filterTasks'
import AnimatedReveal from '../components/motion/AnimatedReveal'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'

const SyncIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path
      d="M4 12a8 8 0 018-8 8 8 0 016.93 4M20 12a8 8 0 01-8 8 8 8 0 01-6.93-4"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M18.5 4.5L20 8h-3.5M5.5 19.5L4 16h3.5"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path
      d="M10 3L6 8l4 5"
      stroke="var(--color-text-muted)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ChevronRightIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path
      d="M6 3l4 5-4 5"
      stroke="var(--color-text-muted)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function CalendarCard({ tasks }) {
  const TODAY = new Date(2026, 2, 2)

  const [year, setYear] = useState(TODAY.getFullYear())
  const [month, setMonth] = useState(TODAY.getMonth())

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const taskDates = tasks
    .filter((t) => t.due && t.due !== 'No due date')
    .map((t) => ({ date: new Date(t.due), done: t.done }))

  const getTasksForDay = (day) =>
    taskDates.filter(
      (t) =>
        t.date.getFullYear() === year &&
        t.date.getMonth() === month &&
        t.date.getDate() === day,
    )

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i -= 1) cells.push({ day: daysInPrev - i, current: false })
  for (let d = 1; d <= daysInMonth; d += 1) cells.push({ day: d, current: true })
  let next = 1
  while (cells.length < 42) {
    cells.push({ day: next, current: false })
    next += 1
  }

  const isToday = (day) =>
    year === TODAY.getFullYear() &&
    month === TODAY.getMonth() &&
    day === TODAY.getDate()

  return (
    <div className="ds-card ds-card-pad sticky top-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[length:var(--text-body-lg)] font-semibold text-[color:var(--color-gray-800)]">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[color:var(--color-bg-muted)] cursor-pointer transition-colors duration-150"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] hover:bg-[color:var(--color-bg-muted)] cursor-pointer transition-colors duration-150"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[length:var(--text-caption)] font-medium text-[color:var(--color-text-subtle)] py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          const dayTasks = cell.current ? getTasksForDay(cell.day) : []
          const hasPending = dayTasks.some((t) => !t.done)
          const hasDone = dayTasks.some((t) => t.done)
          const today = cell.current && isToday(cell.day)

          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div
                className={`w-7 h-7 flex items-center justify-center rounded-full text-[length:var(--text-body-sm)] transition-colors duration-150 ${
                  today
                    ? 'bg-[color:var(--color-brand)] text-white font-semibold'
                    : cell.current
                    ? 'text-[color:var(--color-gray-800)] hover:bg-[color:var(--color-bg-muted)] cursor-pointer'
                    : 'text-[color:var(--color-gray-300)]'
                }`}
              >
                {cell.day}
              </div>
              {(hasPending || hasDone) && (
                <div className="flex gap-[3px] mt-0.5">
                  {hasPending && <span className="w-1 h-1 rounded-full bg-[color:var(--color-brand)]" />}
                  {hasDone && <span className="w-1 h-1 rounded-full bg-[color:var(--color-success-500)]" />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[color:var(--color-border-soft)] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[color:var(--color-brand)] shrink-0" />
          <span className="ds-caption">Task due</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[color:var(--color-success-500)] shrink-0" />
          <span className="ds-caption">Completed</span>
        </div>
      </div>
    </div>
  )
}

export default function TaskList() {
  const user = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.userRole)
  const tasks = useTaskStore((s) => s.tasks)
  const isLoading = useTaskStore((s) => s.isLoading)
  const error = useTaskStore((s) => s.error)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const toggleTaskCompletion = useTaskStore((s) => s.toggleTaskCompletion)
  const [showSidebar, setShowSidebar] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')

  const hasWorkspace = Boolean(user?.workspace_id)
  const jiraConnected = Boolean(user?.jira_connected)
  const syncLabel = isLoading
    ? 'Loading tasks…'
    : error
    ? 'Tasks unavailable'
    : jiraConnected
    ? 'Synced from Jira'
    : 'Jira not connected'

  useEffect(() => {
    if (userRole === 'developer' && hasWorkspace) {
      fetchTasks().catch(() => {})
    }
  }, [userRole, hasWorkspace, fetchTasks])

  const toggleTask = async (id) => {
    try {
      return await toggleTaskCompletion(id)
    } catch {
      return undefined
    }
  }

  const filtered = filterTasks(tasks, { status: statusFilter, difficulty: difficultyFilter })

  return (
    <div className="ds-page">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <PageHeader onOpenSidebar={() => setShowSidebar(true)} />

      <main className="ds-page-main">
        {!hasWorkspace ? (
          <NoWorkspacePrompt
            title="Join a team to see your quests"
            description="Quests sync from Jira after you join a workspace. Ask your admin for a join code, then complete quests to earn XP, coins, and season score."
            showJiraHint
          />
        ) : (
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-8 gap-4">
              <div>
                <h1 className="ds-page-title leading-tight">Task List</h1>
                <p className="text-[length:var(--text-body-lg)] text-[color:var(--color-text-muted)] mt-1">
                  Your Jira-backed quests — complete them for XP, coins, and season score
                </p>
              </div>
              <div
                className={`flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 shrink-0 border ${
                  jiraConnected && !error
                    ? 'bg-[color:var(--color-success-50)] border-[color:var(--color-success-300)]'
                    : 'bg-[color:var(--color-warning-50)] border-[color:var(--color-warning-200)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      jiraConnected && !error
                        ? 'bg-[color:var(--color-success-500)]'
                        : 'bg-[color:var(--color-warning-500)]'
                    }`}
                  />
                  <span
                    className={`text-[length:var(--text-body)] font-medium ${
                      jiraConnected && !error
                        ? 'text-[color:var(--color-success-600)]'
                        : 'text-[color:var(--color-warning-600)]'
                    }`}
                  >
                    {jiraConnected ? 'Jira connected' : 'Jira not connected'}
                  </span>
                </div>
                <div
                  className={`w-px h-4 ${
                    jiraConnected && !error
                      ? 'bg-[color:var(--color-success-300)]'
                      : 'bg-[color:var(--color-warning-200)]'
                  }`}
                />
                <span className="ds-body-sm">{syncLabel}</span>
              </div>
            </div>

            <FilterBar
              statusFilter={statusFilter}
              difficultyFilter={difficultyFilter}
              onStatusChange={setStatusFilter}
              onDifficultyChange={setDifficultyFilter}
            />

            <AnimatedReveal
              className="flex flex-col gap-4 mb-6"
              stagger={0.08}
              refreshKey={`${statusFilter}-${difficultyFilter}-${filtered.length}`}
            >
              {isLoading && tasks.length === 0 ? (
                <div data-motion-reveal className="ds-card ds-card-pad py-10 text-center ds-body-sm">
                  Loading tasks from Jira…
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((task) => (
                  <div key={task.id} data-motion-reveal>
                    <TaskCard task={task} onToggle={toggleTask} />
                  </div>
                ))
              ) : (
                <div data-motion-reveal className="ds-card ds-card-pad py-12 text-center">
                  <p className="text-[length:var(--text-body-lg)] text-[color:var(--color-text-subtle)]">
                    {tasks.length === 0
                      ? 'No quests assigned yet. Ask your admin to sync Jira, then check back to earn XP and climb the season board.'
                      : 'No quests match this filter.'}
                  </p>
                </div>
              )}
            </AnimatedReveal>

            <div className="ds-card ds-card-pad bg-[color:var(--color-bg-subtle)] flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ds-brand-gradient">
                <SyncIcon />
              </div>
              <div>
                <h4 className="ds-subsection-title mb-2">Tasks are synced from Jira</h4>
                <p className="ds-body leading-[1.6]">
                  Questly automatically syncs your Jira tasks. Complete tasks here to earn XP and level up.
                  Difficulty is based on Jira story points. Earn 20XP (1–2 pts), 40XP (3–5 pts), or 70XP (8+ pts) per task.
                </p>
              </div>
            </div>

            <p className="text-center ds-body-sm text-[color:var(--color-text-subtle)]">
              Showing {filtered.length} of {tasks.length} tasks
            </p>
          </div>

          <div className="w-[260px] shrink-0">
            <CalendarCard tasks={tasks} />
          </div>
        </div>
        )}
      </main>
    </div>
  )
}
