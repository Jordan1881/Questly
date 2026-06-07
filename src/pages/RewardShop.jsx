import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import RewardCard from '../components/RewardCard'
import PurchaseConfirm from '../overlays/PurchaseConfirm'
import { StarIcon } from '../components/icons.jsx'
import { useAuthStore } from '../stores/authStore'
import { useXpStore } from '../stores/xpStore'
import { useRewardStore } from '../stores/rewardStore'
import { useToastStore } from '../stores/toastStore'
import { SkeletonRewardGrid } from '../components/Skeleton'

export default function RewardShop() {
  const user = useAuthStore((s) => s.user)
  const userXp = useXpStore((s) => s.userXP)
  const rewards = useRewardStore((s) => s.rewards)
  const isLoading = useRewardStore((s) => s.isLoading)
  const isPurchasing = useRewardStore((s) => s.isPurchasing)
  const error = useRewardStore((s) => s.error)
  const fetchRewards = useRewardStore((s) => s.fetchRewards)
  const purchaseReward = useRewardStore((s) => s.purchaseReward)

  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedReward, setSelectedReward] = useState(null)

  const workspaceId = user?.workspace_id

  useEffect(() => {
    if (workspaceId) {
      fetchRewards(workspaceId).catch(() => {})
    }
  }, [workspaceId, fetchRewards])

  const handleConfirmPurchase = async () => {
    if (!selectedReward) return
    try {
      const result = await purchaseReward(selectedReward.id)
      setSelectedReward(null)
      useToastStore.getState().showSuccess(
        `Purchased! Your coupon code: ${result.purchase.couponCode}`,
      )
    } catch {
      // Global toast shows API error
    }
  }

  const handleRetry = () => {
    if (workspaceId) fetchRewards(workspaceId).catch(() => {})
  }

  return (
    <div className="ds-page">
      {selectedReward && (
        <PurchaseConfirm
          reward={selectedReward}
          currentXp={userXp}
          isLoading={isPurchasing}
          onConfirm={handleConfirmPurchase}
          onCancel={() => setSelectedReward(null)}
        />
      )}

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <PageHeader onOpenSidebar={() => setShowSidebar(true)} />

      <main className="ds-page-main">
        <div className="flex flex-col gap-6 max-w-6xl">
          <div>
            <h1 className="ds-page-title">Reward Shop</h1>
            <p className="ds-body mt-1">Spend sprint XP on workspace rewards</p>
          </div>

          <div className="ds-card ds-card-pad-lg flex items-center justify-between">
            <div>
              <p className="text-[length:var(--text-body)] font-medium text-[color:var(--color-gray-500)] mb-2">
                Your sprint XP
              </p>
              <span className="text-[length:var(--text-h2)] font-bold leading-none text-[color:var(--color-brand)]">
                {userXp}
              </span>
            </div>
            <div className="w-16 h-16 rounded-[var(--radius-lg)] flex items-center justify-center ds-brand-gradient shadow-[var(--shadow-primary-sm)]">
              <StarIcon color="white" size={28} />
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--color-error-200)] bg-[color:var(--color-error-50)] px-4 py-3">
              <p className="ds-body text-[color:var(--color-error-700)]">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="text-[length:var(--text-body-sm)] font-medium text-[color:var(--color-brand)] hover:underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
          {!workspaceId && (
            <p className="ds-body">Join a workspace to browse rewards.</p>
          )}

          {isLoading && <SkeletonRewardGrid count={4} />}

          {!isLoading && workspaceId && rewards.length === 0 && (
            <div className="ds-card ds-card-pad py-10 text-center">
              <p className="ds-subsection-title">No rewards available yet</p>
              <p className="ds-body mt-2">
                Your admin can add rewards from the Admin panel.
              </p>
            </div>
          )}

          {!isLoading && rewards.length > 0 && (
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
