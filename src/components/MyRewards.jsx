import { useState } from 'react'
import { useNavigate } from 'react-router'
import CouponCard from './CouponCard'

export default function MyRewards({ purchases, onDelete, isLoading }) {
  const navigate = useNavigate()
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)

  const handleDelete = async (id) => {
    setError(null)
    setDeletingId(id)
    try {
      await onDelete(id)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return <p className="ds-body-sm">Loading rewards…</p>
  }

  if (!purchases.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-[length:var(--text-body-lg)] font-semibold text-[color:var(--color-gray-800)]">No rewards yet</p>
        <p className="ds-body-sm">Visit the Reward Shop to spend coins on coupons.</p>
        <button
          type="button"
          onClick={() => navigate('/rewards')}
          className="px-5 py-2.5 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-medium text-white cursor-pointer ds-brand-gradient"
        >
          Browse Reward Shop
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-error-500)]">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {purchases.map((purchase) => (
          <CouponCard
            key={purchase.id}
            purchase={purchase}
            onDelete={handleDelete}
            isDeleting={deletingId === purchase.id}
          />
        ))}
      </div>
    </div>
  )
}
