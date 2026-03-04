import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import DifficultyBadge, { DIFFICULTY_STYLES } from '../components/DifficultyBadge'
import { CheckmarkIcon, StarIcon } from '../components/icons'

// ── Icons (local — not shared with other pages) ─────────────

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0">
    <circle cx="8" cy="8" r="6.5" stroke="#9ca3af" strokeWidth="1.2" />
    <path d="M8 4.5V8l2.5 2" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Green check — used in the "Completed" status badge on a task card
const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 shrink-0">
    <path d="M1.5 6l3 3 5.5-6" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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

// ── Data ────────────────────────────────────────────────────

const INITIAL_TASKS = [
  {
    id: 1, jiraId: 'PROJ-123', difficulty: 'HARD', xp: 70,
    title: 'Complete React Dashboard',
    desc: 'Build the analytics dashboard with charts and user metrics for the admin panel.',
    due: 'Feb 24, 2026', highPriority: false, done: false,
  },
  {
    id: 2, jiraId: 'PROJ-124', difficulty: 'MEDIUM', xp: 40,
    title: 'Review Pull Requests',
    desc: 'Go through team PRs and provide feedback on code quality and implementation.',
    due: 'Feb 22, 2026', highPriority: true, done: false,
  },
  {
    id: 3, jiraId: 'PROJ-125', difficulty: 'EASY', xp: 20,
    title: 'Update Documentation',
    desc: 'Add new API endpoints documentation and update the getting started guide.',
    due: 'Feb 28, 2026', highPriority: false, done: false,
  },
  {
    id: 4, jiraId: 'PROJ-122', difficulty: 'HARD', xp: 70,
    title: 'Fix Critical Bug in Payment Flow',
    desc: 'Investigate and resolve the payment processing error reported by users.',
    due: 'Feb 21, 2026', highPriority: false, done: true,
  },
]

// Filter tab definitions — group 1 = status, group 2 = difficulty
const FILTERS = [
  { id: 'all',          label: 'All',           group: 1 },
  { id: 'completed',    label: 'Completed',     group: 1 },
  { id: 'highpriority', label: 'High Priority', group: 1 },
  { id: 'easy',   label: 'Easy',   group: 2, border: DIFFICULTY_STYLES.EASY.border,   color: DIFFICULTY_STYLES.EASY.color   },
  { id: 'medium', label: 'Medium', group: 2, border: DIFFICULTY_STYLES.MEDIUM.border, color: DIFFICULTY_STYLES.MEDIUM.color },
  { id: 'hard',   label: 'Hard',   group: 2, border: DIFFICULTY_STYLES.HARD.border,   color: DIFFICULTY_STYLES.HARD.color   },
]

// ── Sub-components ──────────────────────────────────────────

const JiraBadge = ({ id }) => (
  <span className="bg-[#f3f4f6] text-[#6b7280] text-[11px] font-medium px-[10px] py-[4px] rounded-[6px] shrink-0">
    {id}
  </span>
)

const TaskCard = ({ task, onToggle }) => {
  const isCompleted = task.done
  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-[12px] px-6 py-6 w-full transition-opacity duration-200"
      style={{ opacity: isCompleted ? 0.6 : 1, background: isCompleted ? '#f9fafb' : 'white' }}
    >
      <div className="flex items-start gap-4">
        {/* Completion checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className="w-5 h-5 rounded-[5.8px] flex items-center justify-center shrink-0 mt-[3px] cursor-pointer transition-colors duration-200"
          style={{ background: isCompleted ? '#00c950' : '#e5e7eb' }}
        >
          {isCompleted && <CheckmarkIcon />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <DifficultyBadge level={task.difficulty} />
            <JiraBadge id={task.jiraId} />
            {isCompleted && (
              <span className="flex items-center gap-1.5 bg-[#ecfdf5] text-[#10b981] text-[11px] font-medium px-[10px] py-[4px] rounded-[6px]">
                <CheckIcon />
                Completed
              </span>
            )}
          </div>

          <h3
            className={`text-[18px] font-semibold mb-2 leading-[1.5] ${isCompleted ? 'line-through text-[#1f2937]' : 'text-[#1f2937]'}`}
          >
            {task.title}
          </h3>

          <p className="text-[14px] text-[#6b7280] leading-[1.6] mb-3">{task.desc}</p>

          {/* Meta row */}
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[13px] text-[#6b7280]">
              <ClockIcon />
              {isCompleted ? `Completed ${task.due}` : `Due ${task.due}`}
            </span>
            {task.highPriority && (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#ef4444]">
                <span className="w-1 h-1 rounded-full bg-[#ef4444] shrink-0" />
                High Priority
              </span>
            )}
          </div>
        </div>

        {/* XP reward */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <StarIcon color={isCompleted ? '#10b981' : '#942fcd'} size={20} />
          <span
            className="text-[24px] font-bold"
            style={{ color: isCompleted ? '#10b981' : '#942fcd' }}
          >
            +{task.xp}XP
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Calendar Card ───────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']

function CalendarCard({ tasks }) {
  // Today = March 2, 2026 per project context
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

  // Parse "Feb 24, 2026" → Date
  const taskDates = tasks.map(t => ({ date: new Date(t.due), done: t.done }))

  const getTasksForDay = (day) =>
    taskDates.filter(t =>
      t.date.getFullYear() === year &&
      t.date.getMonth()    === month &&
      t.date.getDate()     === day
    )

  // Build calendar grid
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
      {/* Month header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[15px] font-semibold text-[#1f2937]">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#f3f4f6] cursor-pointer transition-colors duration-150"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[#f3f4f6] cursor-pointer transition-colors duration-150"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Day-name header row */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-[#9ca3af] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
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
              {/* Dot indicators for task due dates */}
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

      {/* Legend */}
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

// ── TaskList page ────────────────────────────────────────────

export default function TaskList({ onNavigate }) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [tasks, setTasks] = useState(INITIAL_TASKS)

  const toggleTask = (id) =>
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const filtered = tasks.filter(t => {
    if (activeFilter === 'completed')    return t.done
    if (activeFilter === 'highpriority') return t.highPriority
    if (activeFilter === 'easy')         return t.difficulty === 'EASY'
    if (activeFilter === 'medium')       return t.difficulty === 'MEDIUM'
    if (activeFilter === 'hard')         return t.difficulty === 'HARD'
    return true
  })

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activePage="tasklist"
        onNavigate={onNavigate}
      />

      <PageHeader
        activePage="tasklist"
        onNavigate={onNavigate}
        onOpenSidebar={() => setShowSidebar(true)}
      />

      {/* ── Main content ── */}
      <main className="px-12 py-9">
        <div className="flex gap-8 items-start">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">

            {/* Page heading + Jira sync badge */}
            <div className="flex items-start justify-between mb-8 gap-4">
              <div>
                <h1 className="text-[32px] font-semibold text-[#1f2937] leading-tight">Task List</h1>
                <p className="text-[15px] text-[#6b7280] mt-1">Manage and track your Questly tasks</p>
              </div>
              <div className="flex items-center gap-3 bg-[#ecfdf5] border border-[#86efac] rounded-[8px] px-4 py-2.5 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] opacity-50 shrink-0" />
                  <span className="text-[14px] font-medium text-[#059669]">Synced with Jira</span>
                </div>
                <div className="w-px h-4 bg-[#86efac]" />
                <span className="text-[13px] text-[#6b7280]">Last updated 5 min ago</span>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {FILTERS.filter(f => f.group === 1).map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="h-[41px] px-5 rounded-[8px] text-[14px] cursor-pointer transition-all duration-200"
                  style={activeFilter === f.id
                    ? { background: '#942fcd', color: 'white', border: 'none', boxShadow: '0px 2px 6px rgba(148,47,205,0.2)' }
                    : { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }
                  }
                >
                  {f.label}
                </button>
              ))}
              <div className="w-px h-6 bg-[#e5e7eb]" />
              {FILTERS.filter(f => f.group === 2).map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="h-[41px] px-5 rounded-[8px] text-[14px] cursor-pointer transition-all duration-200"
                  style={activeFilter === f.id
                    ? { background: '#942fcd', color: 'white', border: 'none', boxShadow: '0px 2px 6px rgba(148,47,205,0.2)' }
                    : { background: 'white', color: f.color, border: `1px solid ${f.border}` }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Task cards */}
            <div className="flex flex-col gap-4 mb-6">
              {filtered.length > 0 ? (
                filtered.map(task => (
                  <TaskCard key={task.id} task={task} onToggle={toggleTask} />
                ))
              ) : (
                <div className="bg-white border border-[#e5e7eb] rounded-[12px] px-6 py-12 text-center">
                  <p className="text-[15px] text-[#9ca3af]">No tasks match this filter.</p>
                </div>
              )}
            </div>

            {/* Jira sync info card */}
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[12px] px-6 py-6 flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: '#942fcd' }}>
                <SyncIcon />
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-[#1f2937] mb-2">Tasks are synced from Jira</h4>
                <p className="text-[14px] text-[#6b7280] leading-[1.6]">
                  Questly automatically syncs your Jira tasks. Complete tasks here to earn XP and level up.
                  Task difficulty is defined by your manager in Jira. Earn 20XP (Easy), 40XP (Medium), or 70XP (Hard) per task.
                </p>
              </div>
            </div>

            <p className="text-center text-[14px] text-[#9ca3af]">
              Showing {filtered.length} of {tasks.length} tasks
            </p>

          </div>

          {/* ── Right column — Calendar ── */}
          <div className="w-[260px] shrink-0">
            <CalendarCard tasks={tasks} />
          </div>

        </div>
      </main>
    </div>
  )
}
