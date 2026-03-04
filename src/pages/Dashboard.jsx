import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import DifficultyBadge from '../components/DifficultyBadge'
import { CheckmarkIcon, StarIcon } from '../components/icons'

// ── Tailwind class constants ────────────────────────────────
const CARD     = 'bg-white rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]'
const BTN_GHOST = 'flex-1 h-12 rounded-[8px] border border-[#e5e7eb] bg-white flex items-center justify-center gap-2 text-[14px] text-[#374151] cursor-pointer hover:bg-[#f9fafb] transition-colors duration-200'

// ── Icons (local — not shared with other pages) ─────────────

const ArrowUpIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" className="w-[9px] h-[9px]">
    <path d="M5 8.5V1.5M2.5 4L5 1.5 7.5 4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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

const CodeIcon = ({ size = 24 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
    <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 6.5l-4 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

// ── Data ────────────────────────────────────────────────────

const INITIAL_TASKS = [
  { id: 1, title: 'Implement Zustand store',   difficulty: 'HARD',   xp: 70, due: 'Oct 20', done: true  },
  { id: 2, title: 'Design Add Task Modal',     difficulty: 'MEDIUM', xp: 40, due: 'Oct 28', done: true  },
  { id: 3, title: 'Create Calculation Logic',  difficulty: 'EASY',   xp: 20, due: 'Oct 31', done: true  },
]

// ── Dashboard page ──────────────────────────────────────────

export default function Dashboard({ onNavigate }) {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [showSidebar, setShowSidebar] = useState(false)

  const toggleTask = (id) =>
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activePage="dashboard"
        onNavigate={onNavigate}
      />

      <PageHeader
        activePage="dashboard"
        onNavigate={onNavigate}
        onOpenSidebar={() => setShowSidebar(true)}
      />

      {/* ── Main content ── */}
      <main className="px-12 py-9">

        <h1 className="text-[32px] font-semibold text-[#1f2937] mb-6">Welcome back, Ashton</h1>

        {/* Two-column layout */}
        <div className="flex gap-8 items-start">

          {/* ── Left column ── */}
          <div className="w-[314px] flex flex-col gap-6 shrink-0">

            {/* XP Progress Card */}
            <div className={`${CARD} p-5`}>

              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-semibold text-[#1f2937]">XP Progress</span>
                <div className="flex items-center gap-1.5 bg-[rgba(99,102,241,0.1)] px-3 py-[5px] rounded-full">
                  <ArrowUpIcon />
                  <span className="text-[11px] font-medium text-[#6366f1]">Level 3</span>
                </div>
              </div>

              {/* XP amount */}
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="text-[32px] font-bold text-[#1f2937] leading-tight">650</span>
                <span className="text-[16px] font-medium text-[#6b7280]">XP</span>
              </div>
              <p className="text-[11px] text-[#9ca3af] mb-0.5">Out of 1000 XP</p>
              <p className="text-[10px] mb-4">
                <span className="font-semibold text-[#1f2937]">350 XP</span>
                <span className="text-[#6b7280]"> to reach Level 4</span>
              </p>

              {/* Tick markers */}
              <div className="flex items-center justify-between mb-1.5">
                {[0, 250, 500, 750].map(n => (
                  <div key={n} className="flex items-center gap-[3px]">
                    <div className="w-px h-[6px] rounded-full bg-[#d1d5db]" />
                    <span className="text-[8.7px] text-[#9ca3af]">{n}</span>
                  </div>
                ))}
                <div className="flex items-center gap-[3px]">
                  <div className="w-px h-[6px] rounded-full bg-[#942fcd]" />
                  <span className="text-[8.7px] font-medium text-[#942fcd]">1000</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 rounded-full bg-[#e5e7eb] overflow-hidden relative mb-1.5">
                <div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{ width: '65%', background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
                />
                <div
                  className="absolute top-0 h-full w-[2.4px] bg-white"
                  style={{ left: '65%', boxShadow: '0 0 6px rgba(148,47,205,0.6)' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-[#6b7280]">Progress</span>
                <span className="text-[11px] font-semibold text-[#942fcd]">65%</span>
              </div>

            </div>

            {/* User Stats Card */}
            <div className={`${CARD} p-6`}>
              <h3 className="text-[16px] font-medium text-[#374151] mb-6">User Stats</h3>
              <div className="flex flex-col gap-5">
                <StatBar label="Tasks Completed" value="24/30"   percent={80} color="#60a5fa" />
                <StatBar label="Current Streak"  value="12 days" percent={60} color="#c084fc" />
                <StatBar label="Efficiency Score" value="85%"    percent={85} color="#4ade80" />
                <StatBar label="Debugging"        value="45%"    percent={45} color="#facc15" />
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
                  <p className="text-[13px] text-[#6b7280] mt-1">Weekly completion rate</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon />
                  <span className="text-[20px] font-semibold text-[#1f2937]">Connected</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#4b5563]">Overall Progress</span>
                  <span className="text-[16px] font-semibold text-[#1f2937]">45%</span>
                </div>
                <div className="h-3 rounded-full bg-[#e5e7eb] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: '45%', background: 'linear-gradient(to bottom, #6366f1, #a855f7)' }}
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
                  <span className="text-[40px] font-bold text-[#1f2937] leading-tight">12</span>
                  <span className="text-[16px] text-[#6b7280]">days</span>
                </div>
              </div>

              {/* GitHub Commits */}
              <div className={`${CARD} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(to bottom, #06b6d4, #0891b2)' }}
                  >
                    <CodeIcon size={24} />
                  </div>
                  <span className="text-[16px] font-medium text-[#374151]">GitHub Commits</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] font-bold text-[#1f2937] leading-tight">87</span>
                  <span className="text-[16px] text-[#6b7280]">this month</span>
                </div>
              </div>

            </div>

            {/* High Priority Tasks */}
            <div className={`${CARD} p-6`}>
              <h2 className="text-[18px] font-medium text-[#374151] mb-6">High Priority Tasks</h2>

              <div className="flex flex-col gap-4">
                {tasks.map(task => (
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

          </div>
        </div>
      </main>
    </div>
  )
}
