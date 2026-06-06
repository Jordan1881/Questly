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
    return <p className="text-[13px] text-[#6b7280]">Loading rewards…</p>
  }

  if (!purchases.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-[15px] font-semibold text-[#1f2937]">No rewards yet</p>
        <p className="text-[13px] text-[#9ca3af]">Visit the Reward Shop to spend sprint XP on coupons.</p>
        <button
          type="button"
          onClick={() => navigate('/rewards')}
          className="px-5 py-2.5 rounded-[8px] text-[14px] font-medium text-white cursor-pointer"
          style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
        >
          Browse Reward Shop
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-[13px] text-[#ef4444]">{error}</p>}
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
