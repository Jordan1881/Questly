import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import RewardCard from '../components/RewardCard'
import PurchaseConfirm from '../overlays/PurchaseConfirm'
import { StarIcon } from '../components/icons.jsx'
import { useAuthStore } from '../stores/authStore'
import { useXpStore } from '../stores/xpStore'
import { useRewardStore } from '../stores/rewardStore'

const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

export default function RewardShop() {
  const user = useAuthStore((s) => s.user)
  const userXp = useXpStore((s) => s.userXP)
  const rewards = useRewardStore((s) => s.rewards)
  const isLoading = useRewardStore((s) => s.isLoading)
  const error = useRewardStore((s) => s.error)
  const fetchRewards = useRewardStore((s) => s.fetchRewards)
  const purchaseReward = useRewardStore((s) => s.purchaseReward)

  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)
  const [purchasing, setPurchasing] = useState(false)
  const [toast, setToast] = useState(null)

  const workspaceId = user?.workspace_id

  useEffect(() => {
    if (workspaceId) {
      fetchRewards(workspaceId).catch(() => {})
    }
  }, [workspaceId, fetchRewards])

  const handleConfirmPurchase = async () => {
    if (!selectedReward) return
    setPurchasing(true)
    try {
      const result = await purchaseReward(selectedReward.id)
      setSelectedReward(null)
      setToast(`Purchased! Your coupon code: ${result.purchase.couponCode}`)
      setTimeout(() => setToast(null), 4000)
    } catch (err) {
      setToast(err.message)
      setTimeout(() => setToast(null), 3500)
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {toast && (
        <div
          className="fixed top-6 left-1/2 z-50 px-5 py-3 rounded-[10px] text-[14px] font-medium text-white bg-[#1f2937]"
          style={{ transform: 'translateX(-50%)' }}
        >
          {toast}
        </div>
      )}

      {selectedReward && (
        <PurchaseConfirm
          reward={selectedReward}
          currentXp={userXp}
          isLoading={purchasing}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setSelectedReward(null)}
        />
      )}

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <PageHeader onOpenSidebar={() => setShowSidebar(true)} />

      <main className="px-12 py-9">
        <div className="flex flex-col gap-6 max-w-6xl">
          <div>
            <h1 className="text-[32px] font-semibold text-[#1f2937] leading-tight">Reward Shop</h1>
            <p className="text-[15px] text-[#6b7280] mt-1">Spend sprint XP on workspace rewards</p>
          </div>

          <div className={`${CARD} p-8 flex items-center justify-between`}>
            <div>
              <p className="text-[14px] font-medium text-[#6b7280] mb-2">Your sprint XP</p>
              <span className="text-[48px] font-bold leading-none text-[#942fcd]">{userXp}</span>
            </div>
            <div
              className="w-16 h-16 rounded-[12px] flex items-center justify-center"
              style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)' }}
            >
              <StarIcon />
            </div>
          </div>

          {error && <p className="text-[14px] text-[#ef4444]">{error}</p>}
          {!workspaceId && (
            <p className="text-[14px] text-[#6b7280]">Join a workspace to browse rewards.</p>
          )}

          {isLoading && <p className="text-[14px] text-[#6b7280]">Loading rewards…</p>}

          {!isLoading && workspaceId && rewards.length === 0 && (
            <div className={`${CARD} p-10 text-center`}>
              <p className="text-[16px] font-medium text-[#374151]">No rewards available yet</p>
              <p className="text-[14px] text-[#6b7280] mt-2">
                Your admin can add rewards from the Admin panel.
              </p>
            </div>
          )}

          {rewards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userXp={userXp}
                  onBuy={setSelectedReward}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
