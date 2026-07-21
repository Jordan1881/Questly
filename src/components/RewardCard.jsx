import { StarIcon } from './icons.jsx'

export default function RewardCard({
  reward,
  userCoins = 0,
  onBuy,
  disabled = false,
}) {
  const { title, description, coinCost, stockCount = 0, allExpired = false, imageUrl } = reward
  const canAfford = userCoins >= coinCost
  const hasStock = stockCount > 0
  const buyDisabled = disabled || !canAfford || !hasStock || allExpired

  let helperText = null
  if (!hasStock || allExpired) helperText = 'Out of stock'
  else if (!canAfford) helperText = 'Not enough coins'

  return (
    <div className="ds-card ds-card-pad ds-card-lift flex flex-col gap-4 transition-all duration-200">
      <div
        className="w-full aspect-[4/3] rounded-[var(--radius-lg)] flex items-center justify-center shrink-0 overflow-hidden shadow-[var(--shadow-primary-sm)]"
        style={{
          background: imageUrl ? 'var(--color-gray-100)' : undefined,
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center ds-brand-gradient">
            <StarIcon color="white" size={40} />
          </div>
        )}
      </div>

      {allExpired && (
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-[var(--radius-md)] w-fit bg-[color:var(--color-error-100)] text-[color:var(--color-error-600)]">
          Expired
        </span>
      )}

      <div className="flex-1">
        <h3 className="text-[length:var(--text-body-lg)] font-semibold text-[color:var(--color-gray-800)] leading-snug mb-1.5">
          {title}
        </h3>
        <p className="ds-body-sm leading-[1.6]">{description}</p>
      </div>

      <div className="flex items-center justify-between text-[length:var(--text-body-sm)]">
        <div className="flex items-center gap-1.5">
          <span className="text-[length:var(--text-h5)] font-bold text-[color:var(--color-brand)]">{coinCost}</span>
          <span className="font-medium text-[color:var(--color-gray-500)]">Coins</span>
        </div>
        <span className="text-[color:var(--color-gray-500)]">{stockCount} left</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => !buyDisabled && onBuy?.(reward)}
          disabled={buyDisabled}
          title={helperText || undefined}
          className={`h-[42px] flex items-center justify-center rounded-[var(--radius-md)] text-[length:var(--text-body)] font-medium transition-all duration-200 ${
            buyDisabled
              ? 'bg-[color:var(--color-gray-200)] text-[color:var(--color-gray-400)] cursor-not-allowed'
              : 'ds-btn-primary ds-focus-ring text-white rounded-[var(--radius-md)] h-[42px] shadow-[var(--shadow-primary-sm)]'
          }`}
        >
          Buy
        </button>
        {helperText && (
          <p className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-error-500)] text-center">
            {helperText}
          </p>
        )}
      </div>
    </div>
  )
}
