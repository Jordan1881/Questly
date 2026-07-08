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
    <div className="ds-card ds-card-pad ds-card-lift flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="ds-subsection-title">{purchase.rewardTitle}</h3>
        {expired && (
          <span className="text-[length:var(--text-caption)] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] bg-[color:var(--color-error-100)] text-[color:var(--color-error-600)]">
            Expired
          </span>
        )}
        {expiringSoon && (
          <span
            className="text-[length:var(--text-caption)] font-semibold px-2 py-0.5 rounded-[var(--radius-sm)] bg-[color:var(--color-warning-100)] text-[color:var(--color-warning-600)]"
            aria-label="Expiring soon"
          >
            Expiring soon
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="ds-focus-ring text-left font-mono text-[length:var(--text-body-sm)] text-[color:var(--color-gray-700)] bg-[color:var(--color-bg-subtle)] px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] cursor-pointer transition-colors duration-200 hover:border-[color:var(--color-border-brand)] hover:bg-[color:var(--color-bg-brand-subtle)]"
      >
        {revealed ? purchase.couponCode : maskCouponCode(purchase.couponCode)}
        <span className="block text-[11px] text-[color:var(--color-text-subtle)] mt-1 font-sans">
          {revealed ? 'Hide code' : 'Click to reveal'}
        </span>
      </button>

      <p className="ds-body-sm">Expires: {formatExpiryDate(purchase.expiresAt)}</p>
      <p className="ds-caption">{purchase.coinsSpent} Coins spent</p>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className={`ds-focus-ring text-[length:var(--text-body-sm)] font-semibold cursor-pointer disabled:opacity-60 self-start transition-colors duration-200 ${
          confirmDelete ? 'text-[color:var(--color-error-600)]' : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error-500)]'
        }`}
      >
        {confirmDelete ? 'Confirm remove?' : 'Remove from My Rewards'}
      </button>
    </div>
  )
}
