import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import {
  StarIcon,
  CoffeeIcon, PackageIcon, ShoeIcon, FoodIcon,
  HeadphonesIcon, FilmIcon, BookIcon, ControllerIcon,
} from '../components/icons'
import { useAuthStore } from '../stores/authStore'
import { useXpStore } from '../stores/xpStore'
import { useShopContext } from '../AppProviders'

// ── Tailwind class constants ────────────────────────────────
const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

// ── Icons (local — not shared with other pages) ─────────────

const CartIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size} className="shrink-0">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0">
    <path d="M2.5 8l4 4 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.8" />
    <path d="M12 8v.5M12 11v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const CoinIcon = ({ size = 16, color = '#942fcd' }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <path d="M12 7v2M12 15v2M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.4 2.5 1.5-1 1.5-2.5 2-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.5 2.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const PencilIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
    <path d="M11 2l3 3-8 8H3v-3L11 2z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ── Data ────────────────────────────────────────────────────

const COIN_GOAL = 300

// Rewards priced in Coins (XP / 10)
const REWARDS = [
  { id: 1, title: 'Starbucks $10 Gift Card',      desc: 'Enjoy your favorite coffee on us',          cost: 40,  Icon: CoffeeIcon      },
  { id: 2, title: 'Amazon $25 Gift Card',          desc: 'Shop anything you want on Amazon',          cost: 80,  Icon: PackageIcon     },
  { id: 3, title: 'Nike Store $20 Voucher',        desc: 'Get the latest sportswear and gear',        cost: 60,  Icon: ShoeIcon        },
  { id: 4, title: 'Uber Eats $15 Credit',          desc: 'Order your favorite meal delivered',        cost: 45,  Icon: FoodIcon        },
  { id: 5, title: 'Spotify Premium 3 Months',      desc: 'Unlimited music streaming ad-free',         cost: 150, Icon: HeadphonesIcon  },
  { id: 6, title: 'Netflix 1 Month Subscription',  desc: 'Unlimited movies and TV shows',             cost: 50,  Icon: FilmIcon        },
  { id: 7, title: 'Audible Credits (3 Books)',      desc: 'Listen to your favorite audiobooks',        cost: 180, Icon: BookIcon        },
  { id: 8, title: 'Steam $50 Gift Card',            desc: 'Buy the latest games on Steam',             cost: 160, Icon: ControllerIcon  },
]

// ── Reward Card ─────────────────────────────────────────────

function RewardCard({ reward, userCoins, inCart, isPurchased, isPending, onToggleCart, isAdmin, editMode }) {
  const { title, desc, cost, Icon } = reward
  const canAfford = cost <= userCoins

  let status = 'available'
  if (isPurchased)           status = 'purchased'
  else if (isPending)        status = 'pending'
  else if (inCart)           status = 'in-cart'
  else if (!canAfford && !isAdmin) status = 'unaffordable'

  const dimmed = status === 'purchased'

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-[12px] p-6 flex flex-col gap-4 transition-all duration-200 relative"
      style={{
        opacity: dimmed ? 0.6 : 1,
        boxShadow: dimmed ? 'none' : '0px 1px 3px 0px rgba(0,0,0,0.10)',
      }}
      onMouseEnter={e => { if (!dimmed) e.currentTarget.style.boxShadow = '0px 8px 24px 0px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = dimmed ? 'none' : '0px 1px 3px 0px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Admin edit mode overlay */}
      {editMode && (
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <button
            type="button"
            className="w-7 h-7 rounded-[6px] bg-white border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:text-[#942fcd] hover:border-[#942fcd] cursor-pointer transition-colors duration-150"
            title="Edit reward"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded-[6px] bg-white border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:text-[#ef4444] hover:border-[#ef4444] cursor-pointer transition-colors duration-150"
            title="Delete reward"
          >
            <TrashIcon />
          </button>
        </div>
      )}

      {/* Icon box */}
      <div
        className="w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0"
        style={{
          background: dimmed ? '#f3f4f6' : 'linear-gradient(to bottom, #942fcd, #ca9af4)',
          boxShadow: dimmed ? 'none' : '0px 4px 12px rgba(148,47,205,0.2)',
        }}
      >
        <div style={{ opacity: dimmed ? 0.4 : 1 }}>
          <Icon />
        </div>
      </div>

      {/* Status badges */}
      {status === 'purchased' && (
        <span className="flex items-center gap-1.5 bg-[#d1fae5] text-[#059669] text-[11px] font-semibold px-2.5 py-1 rounded-[6px] w-fit">
          <CheckIcon />
          Redeemed
        </span>
      )}
      {status === 'pending' && (
        <span className="flex items-center gap-1.5 bg-[#fef3c7] text-[#d97706] text-[11px] font-semibold px-2.5 py-1 rounded-[6px] w-fit">
          <ClockIcon />
          Pending Approval
        </span>
      )}

      {/* Title & description */}
      <div className="flex-1">
        <h3 className="text-[15px] font-semibold text-[#1f2937] leading-snug mb-1.5">{title}</h3>
        <p className="text-[13px] text-[#6b7280] leading-[1.6]">{desc}</p>
      </div>

      {/* Cost in Coins */}
      <div className="flex items-center gap-1.5">
        <CoinIcon size={16} color={dimmed ? '#d1d5db' : '#942fcd'} />
        <span className="text-[20px] font-bold" style={{ color: dimmed ? '#d1d5db' : '#942fcd' }}>
          {cost}
        </span>
        <span className="text-[13px] font-medium text-[#6b7280]">Coins</span>
      </div>

      {/* Action buttons — hidden for admin, hidden for purchased/pending */}
      {!isAdmin && (
        <>
          {status === 'purchased' && (
            <div className="h-[42px] flex items-center justify-center rounded-[8px] bg-[#f3f4f6]">
              <span className="text-[14px] font-medium text-[#9ca3af]">Redeemed</span>
            </div>
          )}
          {status === 'pending' && (
            <div className="h-[42px] flex items-center justify-center rounded-[8px] bg-[#fef3c7] border border-[#fde68a]">
              <span className="text-[14px] font-medium text-[#d97706]">Awaiting Approval</span>
            </div>
          )}
          {status === 'in-cart' && (
            <button
              onClick={() => onToggleCart(reward.id)}
              className="h-[42px] flex items-center justify-center gap-2 rounded-[8px] text-[14px] font-medium cursor-pointer transition-all duration-200 text-white"
              style={{ background: 'linear-gradient(to bottom, #10b981, #059669)', boxShadow: '0px 2px 6px rgba(16,185,129,0.3)' }}
            >
              <CheckIcon />
              Added to Cart
            </button>
          )}
          {status === 'available' && (
            <button
              onClick={() => onToggleCart(reward.id)}
              className="h-[42px] flex items-center justify-center rounded-[8px] text-[14px] font-medium text-white cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ background: '#942fcd', boxShadow: '0px 2px 6px rgba(148,47,205,0.3)' }}
            >
              Redeem
            </button>
          )}
          {status === 'unaffordable' && (
            <div className="flex flex-col gap-1.5">
              <div className="h-[42px] flex items-center justify-center rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb]">
                <span className="text-[14px] font-medium text-[#d1d5db]">Redeem</span>
              </div>
              <p className="text-[12px] font-medium text-[#ef4444] text-center">
                Need {cost - userCoins} more Coins
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Cart Panel ───────────────────────────────────────────────

function CartPanel({ cartItems, userCoins, onRemove, onConfirm }) {
  const total     = cartItems.reduce((s, r) => s + r.cost, 0)
  const canAfford = total <= userCoins

  return (
    <div className={`${CARD} sticky top-6 overflow-hidden`}>
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(to right, #942fcd, #b565e0)' }}
      >
        <div className="flex items-center gap-2 text-white">
          <CartIcon size={18} />
          <span className="text-[15px] font-semibold">Redemption Cart</span>
        </div>
        {cartItems.length > 0 && (
          <span className="bg-white text-[#942fcd] text-[12px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {cartItems.length}
          </span>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="px-5 py-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center text-[#9ca3af]">
            <CartIcon size={22} />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-medium text-[#374151]">Cart is empty</p>
            <p className="text-[12px] text-[#9ca3af] mt-1">Click Redeem on a reward to add it here</p>
          </div>
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-4">
          {/* Cart items */}
          <div className="flex flex-col gap-3">
            {cartItems.map(r => (
              <div key={r.id} className="flex items-start justify-between gap-2 p-3 bg-[#f9fafb] rounded-[8px]">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#1f2937] leading-snug">{r.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <CoinIcon size={12} color="#942fcd" />
                    <span className="text-[12px] font-semibold text-[#942fcd]">{r.cost} Coins</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(r.id)}
                  className="text-[#9ca3af] hover:text-[#ef4444] cursor-pointer transition-colors duration-150 shrink-0 mt-0.5"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-[#e5e7eb]" />

          {/* Coins summary */}
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Total cost</span>
              <span className="font-semibold text-[#1f2937]">{total} Coins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Your balance</span>
              <span className="font-medium text-[#942fcd]">{userCoins} Coins</span>
            </div>
          </div>

          {/* Approval note */}
          <div className="bg-[#fef3c7] border border-[#fde68a] rounded-[8px] px-3 py-2">
            <p className="text-[11px] text-[#92400e] leading-[1.5]">
              Requests need admin approval before coins are deducted.
            </p>
          </div>

          {/* Insufficient coins warning */}
          {!canAfford && (
            <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-[8px] px-3 py-2">
              <p className="text-[12px] text-[#dc2626] font-medium text-center">
                Not enough Coins — remove some items
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={onConfirm}
            disabled={!canAfford}
            className="w-full h-[44px] rounded-[8px] text-[14px] font-medium text-white transition-all duration-200 cursor-pointer"
            style={canAfford
              ? { background: 'linear-gradient(to bottom, #942fcd, #b565e0)', boxShadow: '0px 4px 12px rgba(148,47,205,0.3)' }
              : { background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed', boxShadow: 'none' }
            }
          >
            Submit Requests
          </button>
        </div>
      )}
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────────

function Toast({ message }) {
  return (
    <div
      className="fixed top-6 left-1/2 z-50 flex items-center gap-3 bg-[#1f2937] text-white px-5 py-3 rounded-[10px] text-[14px] font-medium"
      style={{ transform: 'translateX(-50%)', boxShadow: '0px 8px 24px rgba(0,0,0,0.2)', animation: 'fadeInDown 0.25s ease' }}
    >
      <span className="text-[18px]">🎉</span>
      {message}
    </div>
  )
}

// ── RewardShop page ──────────────────────────────────────────

export default function RewardShop() {
  const userRole = useAuthStore((s) => s.userRole)
  const userCoins = useXpStore((s) => s.userCoins)
  const setUserCoins = useXpStore((s) => s.setUserCoins)
  const { purchased, setPurchased, pendingRequests, setPendingRequests } = useShopContext()
  const [showSidebar, setShowSidebar] = useState(false)
  const [cart, setCart]               = useState([])
  const [toast, setToast]             = useState(null)
  const [editMode, setEditMode]       = useState(false)

  const isAdmin = userRole === 'admin'

  const cartRewards = REWARDS.filter(r => cart.includes(r.id))
  const cartTotal   = cartRewards.reduce((s, r) => s + r.cost, 0)

  const toggleCart = (id) => {
    setCart(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const confirmRedeem = () => {
    if (cartTotal > userCoins) return
    setPendingRequests(prev => new Set([...prev, ...cart]))
    const count = cartRewards.length
    setCart([])
    setToast(`${count} request${count > 1 ? 's' : ''} submitted! Awaiting admin approval.`)
    setTimeout(() => setToast(null), 3500)
  }

  const coinPercent = Math.min((userCoins / COIN_GOAL) * 100, 100)

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {toast && <Toast message={toast} />}

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <PageHeader
        onOpenSidebar={() => setShowSidebar(true)}
      />

      {/* ── Main ── */}
      <main className="px-12 py-9">
        <div className="flex gap-8 items-start">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Page heading + edit mode toggle */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[32px] font-semibold text-[#1f2937] leading-tight">Reward Shop</h1>
                <p className="text-[15px] text-[#6b7280] mt-1">
                  {isAdmin ? 'Manage reward catalog' : 'Redeem your Coins for coupons'}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-2 px-4 h-10 rounded-[8px] text-[14px] font-medium border cursor-pointer transition-all duration-200"
                  style={editMode
                    ? { background: 'linear-gradient(to bottom, #942fcd, #b565e0)', color: 'white', border: 'none', boxShadow: '0px 4px 12px rgba(148,47,205,0.3)' }
                    : { background: 'white', color: '#374151', borderColor: '#e5e7eb' }
                  }
                >
                  <PencilIcon />
                  {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
                </button>
              )}
            </div>

            {/* Coins Balance card — hidden for admin */}
            {!isAdmin && (
              <div className={`${CARD} p-8`}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[14px] font-medium text-[#6b7280] mb-2">Your Coins</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[48px] font-bold leading-none" style={{ color: '#942fcd' }}>
                        {userCoins}
                      </span>
                      <span className="text-[20px] font-medium text-[#6b7280]">Coins</span>
                    </div>
                  </div>
                  <div
                    className="w-16 h-16 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)', boxShadow: '0px 4px 12px rgba(148,47,205,0.2)' }}
                  >
                    <CoinIcon size={32} color="white" />
                  </div>
                </div>

                {/* Coins progress bar */}
                <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${coinPercent}%`, background: 'linear-gradient(to right, #942fcd, #ca9af4)' }}
                  />
                </div>
                <p className="text-[13px] text-[#9ca3af]">
                  {userCoins} of {COIN_GOAL} Coins to next reward tier
                </p>
              </div>
            )}

            {/* Add Reward button — edit mode only */}
            {isAdmin && editMode && (
              <button
                type="button"
                className="flex items-center gap-2 px-5 py-3 rounded-[10px] border-2 border-dashed border-[#942fcd] text-[#942fcd] text-[14px] font-medium cursor-pointer hover:bg-[#f5eefd] transition-colors duration-200 w-fit"
              >
                <PlusIcon />
                Add Reward
              </button>
            )}

            {/* Rewards grid */}
            <div className="grid grid-cols-4 gap-5">
              {REWARDS.map(reward => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userCoins={userCoins}
                  inCart={cart.includes(reward.id)}
                  isPurchased={purchased?.has(reward.id) ?? false}
                  isPending={pendingRequests?.has(reward.id) ?? false}
                  onToggleCart={toggleCart}
                  isAdmin={isAdmin}
                  editMode={editMode}
                />
              ))}
            </div>

            {/* How it works card */}
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[12px] px-6 py-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: '#942fcd' }}>
                <InfoIcon />
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-[#1f2937] mb-2">How it works</h4>
                <p className="text-[14px] text-[#6b7280] leading-[1.6]">
                  {isAdmin
                    ? 'Manage the reward catalog using Edit Mode. Review and approve developer redemption requests in the Admin panel under the Rewards tab.'
                    : 'Complete tasks to earn XP and Coins, then request rewards. Each request requires admin approval before your Coins are deducted and the coupon is granted.'
                  }
                </p>
              </div>
            </div>

          </div>

          {/* ── Right column — Cart (developer only) ── */}
          {!isAdmin && (
            <div className="w-[272px] shrink-0">
              <CartPanel
                cartItems={cartRewards}
                userCoins={userCoins}
                onRemove={toggleCart}
                onConfirm={confirmRedeem}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
