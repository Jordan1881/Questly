export default function PurchaseConfirm({
  reward,
  currentXp,
  isLoading,
  onConfirm,
  onCancel,
}) {
  if (!reward) return null

  const remaining = currentXp - reward.xpCost

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="bg-white rounded-[16px] w-[420px] p-8 flex flex-col gap-5 shadow-xl">
        <h2 className="text-[22px] font-semibold text-[#1f2937]">Confirm purchase</h2>

        <div className="flex flex-col gap-2 text-[14px] text-[#374151]">
          <div className="flex justify-between">
            <span className="text-[#6b7280]">Reward</span>
            <span className="font-medium">{reward.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6b7280]">XP cost</span>
            <span className="font-semibold text-[#942fcd]">{reward.xpCost} XP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6b7280]">Your balance</span>
            <span>{currentXp} XP</span>
          </div>
          <div className="flex justify-between border-t border-[#e5e7eb] pt-2">
            <span className="text-[#6b7280]">Remaining after purchase</span>
            <span className="font-semibold">{remaining} XP</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-[8px] text-[14px] font-medium text-[#374151] border border-[#e5e7eb] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-[8px] text-[14px] font-medium text-white cursor-pointer disabled:opacity-60"
            style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
          >
            {isLoading ? 'Purchasing…' : 'Confirm purchase'}
          </button>
        </div>
      </div>
    </div>
  )
}
