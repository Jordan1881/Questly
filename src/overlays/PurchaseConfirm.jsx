export default function PurchaseConfirm({
  reward,
  currentCoins,
  isLoading,
  onConfirm,
  onCancel,
}) {
  if (!reward) return null

  const remaining = currentCoins - reward.coinCost

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="ds-card rounded-[var(--radius-lg)] w-[420px] p-8 flex flex-col gap-5 shadow-[var(--shadow-soft-md)]">
        <h2 className="text-[length:var(--text-h4)] font-semibold text-[color:var(--color-gray-800)]">
          Confirm purchase
        </h2>

        <div className="flex flex-col gap-2 text-[length:var(--text-body)] text-[color:var(--color-gray-700)]">
          <div className="flex justify-between">
            <span className="text-[color:var(--color-gray-500)]">Reward</span>
            <span className="font-medium">{reward.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[color:var(--color-gray-500)]">Coin cost</span>
            <span className="font-semibold text-[color:var(--color-brand)]">{reward.coinCost} Coins</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[color:var(--color-gray-500)]">Your balance</span>
            <span>{currentCoins} Coins</span>
          </div>
          <div className="flex justify-between border-t border-[color:var(--color-border-soft)] pt-2">
            <span className="text-[color:var(--color-gray-500)]">Remaining after purchase</span>
            <span className="font-semibold">{remaining} Coins</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-medium text-[color:var(--color-gray-700)] border border-[color:var(--color-border-soft)] cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-medium text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
          >
            {isLoading ? 'Purchasing…' : 'Confirm purchase'}
          </button>
        </div>
      </div>
    </div>
  )
}
