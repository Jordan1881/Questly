import DifficultyBadge from './DifficultyBadge'
import { CheckmarkIcon, StarIcon } from './icons'

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0">
    <circle cx="8" cy="8" r="6.5" stroke="#9ca3af" strokeWidth="1.2" />
    <path d="M8 4.5V8l2.5 2" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 shrink-0">
    <path d="M1.5 6l3 3 5.5-6" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const JiraBadge = ({ id }) => (
  <span className="bg-[#f3f4f6] text-[#6b7280] text-[11px] font-medium px-[10px] py-[4px] rounded-[6px] shrink-0">
    {id}
  </span>
)

export default function TaskCard({ task, onToggle }) {
  const isCompleted = task.done

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-[12px] px-6 py-6 w-full transition-opacity duration-200"
      style={{ opacity: isCompleted ? 0.6 : 1, background: isCompleted ? '#f9fafb' : 'white' }}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          onClick={() => onToggle(task.id)}
          className="w-5 h-5 rounded-[5.8px] flex items-center justify-center shrink-0 mt-[3px] cursor-pointer transition-colors duration-200"
          style={{ background: isCompleted ? '#00c950' : '#e5e7eb' }}
        >
          {isCompleted && <CheckmarkIcon />}
        </button>

        <div className="flex-1 min-w-0">
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
