import AnimatedModal from '../components/motion/AnimatedModal'

async function navigateToRewards() {
  const { router } = await import('../router')
  router.navigate('/rewards')
}

export default function LevelUp({ level, onContinue }) {
  if (!level) return null

  const goToShop = () => {
    onContinue?.()
    navigateToRewards()
  }

  return (
    <AnimatedModal open={Boolean(level)}>
      <div
        className="ds-card w-[420px] px-10 py-12 text-center flex flex-col items-center gap-6 border-[color:var(--color-border-soft)]"
        style={{ boxShadow: 'var(--shadow-soft-md), 0 12px 40px rgba(148, 47, 205, 0.12)' }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-[32px] font-bold text-white ds-brand-gradient"
          style={{ boxShadow: 'var(--shadow-primary-sm)' }}
        >
          {level}
        </div>
        <div>
          <h2 className="text-[28px] font-semibold text-[color:var(--color-gray-800)] mb-2">Level Up!</h2>
          <p className="text-[15px] text-[color:var(--color-text-muted)]">
            You reached{' '}
            <span className="font-semibold text-[color:var(--color-brand)]">Level {level}</span>.
            Lifetime XP built this level — spend coins in the Reward Shop or keep completing quests.
          </p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={goToShop}
            className="ds-btn-primary ds-focus-ring w-full h-12 rounded-[var(--radius-md)] text-[15px] font-medium"
          >
            Visit Reward Shop
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="ds-focus-ring w-full h-12 rounded-[var(--radius-md)] text-[15px] font-medium text-[color:var(--color-text-muted)] cursor-pointer border border-[color:var(--color-border-soft)] bg-[color:var(--color-card-surface)] hover:bg-[color:var(--color-bg-canvas)] transition-colors"
          >
            Keep questing
          </button>
        </div>
      </div>
    </AnimatedModal>
  )
}
