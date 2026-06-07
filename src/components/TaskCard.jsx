import DifficultyBadge from './DifficultyBadge'
import { CheckmarkIcon, StarIcon } from './icons'

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0">
    <circle cx="8" cy="8" r="6.5" stroke="var(--color-text-subtle)" strokeWidth="1.2" />
    <path
      d="M8 4.5V8l2.5 2"
      stroke="var(--color-text-subtle)"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3 shrink-0">
    <path
      d="M1.5 6l3 3 5.5-6"
      stroke="var(--color-success-500)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const JiraBadge = ({ id }) => (
  <span className="bg-[color:var(--color-bg-muted)] text-[color:var(--color-text-muted)] text-[length:var(--text-caption)] font-medium px-[10px] py-1 rounded-[var(--radius-md)] shrink-0">
    {id}
  </span>
)

export default function TaskCard({ task, onToggle }) {
  const isCompleted = task.done

  return (
    <div
      className={`ds-card ds-card-pad w-full transition-opacity duration-200 ${
        isCompleted ? 'opacity-60 bg-[color:var(--color-bg-subtle)]' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          onClick={() => onToggle(task.id)}
          className="w-5 h-5 rounded-[5.8px] flex items-center justify-center shrink-0 mt-[3px] cursor-pointer transition-colors duration-200"
          style={{
            background: isCompleted ? 'var(--color-success-500)' : 'var(--color-gray-200)',
          }}
        >
          {isCompleted && <CheckmarkIcon />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <DifficultyBadge level={task.difficulty} />
            <JiraBadge id={task.jiraId} />
            {isCompleted && (
              <span className="flex items-center gap-1.5 bg-[color:var(--color-success-50)] text-[color:var(--color-success-500)] text-[length:var(--text-caption)] font-medium px-[10px] py-1 rounded-[var(--radius-md)]">
                <CheckIcon />
                Completed
              </span>
            )}
            {!isCompleted && (
              <span className="ml-auto bg-[color:var(--color-success-50)] text-[color:var(--color-success-600)] text-[length:var(--text-caption)] font-medium px-[10px] py-1 rounded-[var(--radius-md)]">
                Active
              </span>
            )}
          </div>

          <h3
            className={`text-[length:var(--text-h5)] font-semibold mb-2 leading-[var(--leading-h5)] ${
              isCompleted
                ? 'line-through text-[color:var(--color-gray-800)]'
                : 'text-[color:var(--color-gray-800)]'
            }`}
          >
            {task.title}
          </h3>

          <p className="ds-body leading-[1.6] mb-3">{task.desc}</p>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
              <ClockIcon />
              {isCompleted ? `Completed ${task.due}` : `Due ${task.due}`}
            </span>
            {task.highPriority && (
              <span className="flex items-center gap-1.5 text-[length:var(--text-caption)] font-medium text-[color:var(--color-error-500)]">
                <span className="w-1 h-1 rounded-full bg-[color:var(--color-error-500)] shrink-0" />
                High Priority
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <StarIcon color={isCompleted ? 'var(--color-success-500)' : 'var(--color-brand)'} size={20} />
          <span
            className="text-[length:var(--text-h4)] font-bold"
            style={{ color: isCompleted ? 'var(--color-success-500)' : 'var(--color-brand)' }}
          >
            +{task.xp}XP
          </span>
        </div>
      </div>
    </div>
  )
}
