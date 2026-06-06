import { StarIcon } from './icons.jsx'

export default function RewardCard({
  reward,
  userXp = 0,
  onBuy,
  disabled = false,
}) {
  const { title, description, xpCost, stockCount = 0, allExpired = false, imageUrl } = reward
  const canAfford = userXp >= xpCost
  const hasStock = stockCount > 0
  const buyDisabled = disabled || !canAfford || !hasStock || allExpired

  let helperText = null
  if (!hasStock || allExpired) helperText = 'Out of stock'
  else if (!canAfford) helperText = 'Not enough XP'

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-[12px] p-6 flex flex-col gap-4 transition-all duration-200"
      style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.10)' }}
    >
      <div
        className="w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden"
        style={{
          background: imageUrl ? '#f3f4f6' : 'linear-gradient(to bottom, #942fcd, #ca9af4)',
          boxShadow: '0px 4px 12px rgba(148,47,205,0.2)',
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <StarIcon />
        )}
      </div>

      {allExpired && (
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-[6px] w-fit bg-[#fee2e2] text-[#dc2626]">
          Expired
        </span>
      )}

      <div className="flex-1">
        <h3 className="text-[15px] font-semibold text-[#1f2937] leading-snug mb-1.5">{title}</h3>
        <p className="text-[13px] text-[#6b7280] leading-[1.6]">{description}</p>
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[20px] font-bold text-[#942fcd]">{xpCost}</span>
          <span className="font-medium text-[#6b7280]">XP</span>
        </div>
        <span className="text-[#6b7280]">{stockCount} left</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => !buyDisabled && onBuy?.(reward)}
          disabled={buyDisabled}
          title={helperText || undefined}
          className="h-[42px] flex items-center justify-center rounded-[8px] text-[14px] font-medium text-white transition-all duration-200"
          style={
            buyDisabled
              ? { background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' }
              : { background: '#942fcd', boxShadow: '0px 2px 6px rgba(148,47,205,0.3)', cursor: 'pointer' }
          }
        >
          Buy
        </button>
        {helperText && (
          <p className="text-[12px] font-medium text-[#ef4444] text-center">{helperText}</p>
        )}
      </div>
    </div>
  )
}
