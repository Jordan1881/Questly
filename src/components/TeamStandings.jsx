/**
 * Developer-facing team climb (season score = current sprint XP).
 */
export default function TeamStandings({ standings = [], currentUserId, className = '' }) {
  if (!standings.length) {
    return (
      <div className={`rounded-[var(--radius-md)] bg-[color:var(--color-bg-subtle)] border border-[color:var(--color-border)] px-5 py-6 text-center ${className}`}>
        <p className="ds-body-sm">No teammates on the board yet. Complete quests to take the lead this season.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <ul className="flex flex-col divide-y divide-[color:var(--color-gray-100)]">
        {standings.map((row) => {
          const isYou = row.userId === currentUserId
          return (
            <li
              key={row.userId}
              className={`flex items-center justify-between gap-3 py-3 px-1 ${
                isYou ? 'bg-[color:var(--color-bg-brand-subtle)] rounded-[var(--radius-sm)] px-2' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-7 shrink-0 text-[length:var(--text-body-sm)] font-semibold text-[color:var(--color-text-muted)]">
                  #{row.rank}
                </span>
                <div className="min-w-0">
                  <p className="text-[length:var(--text-body-sm)] font-medium text-[color:var(--color-gray-800)] truncate">
                    {row.username}
                    {isYou ? (
                      <span className="ml-1.5 text-[length:var(--text-caption)] font-semibold text-[color:var(--color-brand)]">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="ds-caption">Level {row.level}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[length:var(--text-body-sm)] font-semibold text-[color:var(--color-gray-800)]">
                  {row.seasonXp.toLocaleString()}
                </p>
                <p className="ds-caption">season</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
