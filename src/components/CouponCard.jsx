import { useState } from 'react'
import {
  formatExpiryDate,
  isExpiredClient,
  isExpiringSoon,
  maskCouponCode,
} from '../lib/coupon'

export default function CouponCard({ purchase, onDelete, isDeleting = false }) {
  const [revealed, setRevealed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const expired = isExpiredClient(purchase.expiresAt)
  const expiringSoon = !expired && isExpiringSoon(purchase.expiresAt)

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete?.(purchase.id)
    setConfirmDelete(false)
  }

  return (
    <div className="border border-[#e5e7eb] rounded-[12px] p-5 flex flex-col gap-3 bg-white">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-[#1f2937]">{purchase.rewardTitle}</h3>
        {expired && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#fee2e2] text-[#dc2626]">
            Expired
          </span>
        )}
        {expiringSoon && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#fef3c7] text-[#d97706]"
            aria-label="Expiring soon"
          >
            Expiring soon
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="text-left font-mono text-[13px] text-[#374151] bg-[#f9fafb] px-3 py-2 rounded-[8px] border border-[#e5e7eb] cursor-pointer"
      >
        {revealed ? purchase.couponCode : maskCouponCode(purchase.couponCode)}
        <span className="block text-[11px] text-[#9ca3af] mt-1 font-sans">
          {revealed ? 'Hide code' : 'Click to reveal'}
        </span>
      </button>

      <p className="text-[12px] text-[#6b7280]">
        Expires: {formatExpiryDate(purchase.expiresAt)}
      </p>
      <p className="text-[12px] text-[#9ca3af]">{purchase.xpSpent} XP spent</p>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={`text-[12px] font-semibold cursor-pointer disabled:opacity-60 self-start ${
          confirmDelete ? 'text-[#dc2626]' : 'text-[#6b7280] hover:text-[#ef4444]'
        }`}
      >
        {confirmDelete ? 'Confirm remove?' : 'Remove from My Rewards'}
      </button>
    </div>
  )
}
