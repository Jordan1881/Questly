import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import NoWorkspacePrompt from '../components/NoWorkspacePrompt'
import TaskCard from '../components/TaskCard'
import FilterBar, { filterTasks } from '../components/FilterBar'
import { useAuthStore } from '../stores/authStore'
import { useTaskStore } from '../stores/taskStore'

const SyncIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M4 12a8 8 0 018-8 8 8 0 016.93 4M20 12a8 8 0 01-8 8 8 8 0 01-6.93-4"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M18.5 4.5L20 8h-3.5M5.5 19.5L4 16h3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M10 3L6 8l4 5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M6 3l4 5-4 5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']

function CalendarCard({ tasks }) {
  const TODAY = new Date(2026, 2, 2)

  const [year,  setYear]  = useState(TODAY.getFullYear())
  const [month, setMonth] = useState(TODAY.getMonth())

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const taskDates = tasks
    .filter((t) => t.due && t.due !== 'No due date')
    .map((t) => ({ date: new Date(t.due), done: t.done }))

  const getTasksForDay = (day) =>
    taskDates.filter(t =>
      t.date.getFullYear() === year &&
      t.date.getMonth()    === month &&
      t.date.getDate()     === day
    )

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const daysInPrev   = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, current: false })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true })
  let next = 1
  while (cells.length < 42)
    cells.push({ day: next++, current: false })

  const isToday = (day) =>
    year  === TODAY.getFullYear() &&
    month === TODAY.getMonth()    &&
    day   === TODAY.getDate()

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)] p-6 sticky top-6">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[15px] font-semibold text-[#1f2937]">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#f3f4f6] cursor-pointer transition-colors duration-150">
            <ChevronLeftIcon />
          </button>
          <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#f3f4f6] cursor-pointer transition-colors duration-150">
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-[#9ca3af] py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          const dayTasks  = cell.current ? getTasksForDay(cell.day) : []
          const hasPending = dayTasks.some(t => !t.done)
          const hasDone    = dayTasks.some(t =>  t.done)
          const today      = cell.current && isToday(cell.day)

          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div
                className={`w-7 h-7 flex items-center justify-center rounded-full text-[13px] transition-colors duration-150 ${
                  today
                    ? 'bg-[#942fcd] text-white font-semibold'
                    : cell.current
                    ? 'text-[#1f2937] hover:bg-[#f3f4f6] cursor-pointer'
                    : 'text-[#d1d5db]'
                }`}
              >
                {cell.day}
              </div>
              {(hasPending || hasDone) && (
                <div className="flex gap-[3px] mt-0.5">
                  {hasPending && <span className="w-1 h-1 rounded-full bg-[#942fcd]" />}
                  {hasDone    && <span className="w-1 h-1 rounded-full bg-[#10b981]" />}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[#e5e7eb] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#942fcd] shrink-0" />
          <span className="text-[12px] text-[#6b7280]">Task due</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" />
          <span className="text-[12px] text-[#6b7280]">Completed</span>
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
    await toggleTaskCompletion(id).catch(() => {})
  }

  const filtered = filterTasks(tasks, { status: statusFilter, difficulty: difficultyFilter })

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <PageHeader onOpenSidebar={() => setShowSidebar(true)} />

      <main className="px-12 py-9">
        {!hasWorkspace ? (
          <NoWorkspacePrompt
            title="Join a team to see your tasks"
            description="Tasks are synced from Jira after you join a workspace. Ask your admin for a join code."
            showJiraHint
          />
        ) : (
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-8 gap-4">
              <div>
                <h1 className="text-[32px] font-semibold text-[#1f2937] leading-tight">Task List</h1>
                <p className="text-[15px] text-[#6b7280] mt-1">Manage and track your Questly tasks</p>
              </div>
              <div
                className={`flex items-center gap-3 rounded-[8px] px-4 py-2.5 shrink-0 border ${
                  jiraConnected && !error
                    ? 'bg-[#ecfdf5] border-[#86efac]'
                    : 'bg-[#fffbeb] border-[#fde68a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      jiraConnected && !error ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
                    }`}
                  />
                  <span className={`text-[14px] font-medium ${jiraConnected && !error ? 'text-[#059669]' : 'text-[#d97706]'}`}>
                    {jiraConnected ? 'Jira connected' : 'Jira not connected'}
                  </span>
                </div>
                <div className={`w-px h-4 ${jiraConnected && !error ? 'bg-[#86efac]' : 'bg-[#fde68a]'}`} />
                <span className="text-[13px] text-[#6b7280]">{syncLabel}</span>
              </div>
            </div>

            <FilterBar
              statusFilter={statusFilter}
              difficultyFilter={difficultyFilter}
              onStatusChange={setStatusFilter}
              onDifficultyChange={setDifficultyFilter}
            />

            <div className="flex flex-col gap-4 mb-6">
              {isLoading && tasks.length === 0 ? (
                <div className="bg-white border border-[#e5e7eb] rounded-[12px] px-6 py-10 text-center text-[#6b7280]">
                  Loading tasks from Jira…
                </div>
              ) : filtered.length > 0 ? (
                filtered.map(task => (
                  <TaskCard key={task.id} task={task} onToggle={toggleTask} />
                ))
              ) : (
                <div className="bg-white border border-[#e5e7eb] rounded-[12px] px-6 py-12 text-center">
                  <p className="text-[15px] text-[#9ca3af]">No tasks match this filter.</p>
                </div>
              )}
            </div>

            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[12px] px-6 py-6 flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: '#942fcd' }}>
                <SyncIcon />
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-[#1f2937] mb-2">Tasks are synced from Jira</h4>
                <p className="text-[14px] text-[#6b7280] leading-[1.6]">
                  Questly automatically syncs your Jira tasks. Complete tasks here to earn XP and level up.
                  Difficulty is based on Jira story points. Earn 20XP (1–2 pts), 40XP (3–5 pts), or 70XP (8+ pts) per task.
                </p>
              </div>
            </div>

            <p className="text-center text-[14px] text-[#9ca3af]">
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
