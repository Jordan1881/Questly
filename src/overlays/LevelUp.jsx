import AnimatedModal from '../components/motion/AnimatedModal'

export default function LevelUp({ level, onContinue }) {
  if (!level) return null

  return (
    <AnimatedModal open={Boolean(level)}>
      <div
        className="bg-white rounded-[16px] w-[420px] px-10 py-12 text-center flex flex-col items-center gap-6"
        style={{ boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.18)' }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-[32px] font-bold text-white"
          style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)' }}
        >
          {level}
        </div>
        <div>
          <h2 className="text-[28px] font-semibold text-[#1f2937] mb-2">Level Up!</h2>
          <p className="text-[15px] text-[#6b7280]">
            You reached <span className="font-semibold text-[#942fcd]">Level {level}</span>. Keep completing quests to unlock more rewards.
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-12 rounded-[8px] text-[15px] font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)' }}
        >
          Continue
        </button>
      </div>
    </AnimatedModal>
  )
}
