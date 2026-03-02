import { useState } from 'react'
import Sidebar from '../components/Sidebar'

// ── Icons ───────────────────────────────────────────────────

const BurgerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const AvatarPlaceholder = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <circle cx="24" cy="54" r="22" fill="#9ca3af" />
    <circle cx="24" cy="18" r="10" fill="#6b7280" />
  </svg>
)
const StarIcon = ({ color = '#942fcd', size = 16 }) => (
  <svg viewBox="0 0 16 16" fill="none" width={size} height={size} className="shrink-0">
    <path d="M8 1.5l1.5 3.5 3.5.5-2.5 2.5.5 3.5L8 9.5 5.5 11l.5-3.5L3.5 5l3.5-.5z" fill={color} />
  </svg>
)
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

// ── Reward Icons ─────────────────────────────────────────────
const CoffeeIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M5 8h14v10a5 5 0 01-5 5H10a5 5 0 01-5-5V8z" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 10h2a3 3 0 010 6h-2" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 5c0-1.5 2-1.5 2-3M13 5c0-1.5 2-1.5 2-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const PackageIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M22 9.5L14 14M14 14L6 9.5M14 14V23" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 9.5l8-4.5 8 4.5v9l-8 4.5L6 18.5V9.5z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 7.5l8 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const ShoeIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M3 17c0 2 1.5 4 4 4h15c1.5 0 3-1 3-3 0-1.5-1-2.5-2.5-3L19 14l-4-6-3 3-2-1.5L3 14v3z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 11l4 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const FoodIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M9 4v6c0 2.5 2 4 4 4s4-1.5 4-4V4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M13 14v10M9 22h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 4v20" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const HeadphonesIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M5 16V13a9 9 0 0118 0v3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="3" y="16" width="5" height="7" rx="2" stroke="white" strokeWidth="1.8" />
    <rect x="20" y="16" width="5" height="7" rx="2" stroke="white" strokeWidth="1.8" />
  </svg>
)
const FilmIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <rect x="3" y="5" width="22" height="18" rx="2" stroke="white" strokeWidth="1.8" />
    <path d="M3 10h22M3 18h22M8 5v5M8 18v5M20 5v5M20 18v5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 13l5 3-5 3V13z" fill="white" />
  </svg>
)
const BookIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M4 5a2 2 0 012-2h10v20H6a2 2 0 01-2-2V5z" stroke="white" strokeWidth="1.8" />
    <path d="M16 3h6a2 2 0 012 2v16a2 2 0 01-2 2h-6V3z" stroke="white" strokeWidth="1.8" />
    <path d="M16 3v20" stroke="white" strokeWidth="1.5" />
    <path d="M7 9h5M7 13h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const ControllerIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
    <path d="M6 10h16l-2 10H8L6 10z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 13v4M9 15h4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="18" cy="13.5" r="1" fill="white" />
    <circle cx="20.5" cy="15.5" r="1" fill="white" />
  </svg>
)

// ── Data ────────────────────────────────────────────────────

const NAV_LINKS = [
  { id: 'dashboard',  label: 'Dashboard'   },
  { id: 'profile',    label: 'Profile'     },
  { id: 'tasklist',   label: 'Tasks'       },
  { id: 'rewardshop', label: 'Reward Shop' },
]

const XP_GOAL = 3000

const REWARDS = [
  { id: 1, title: 'Starbucks $10 Gift Card',      desc: 'Enjoy your favorite coffee on us',          cost: 400,  Icon: CoffeeIcon      },
  { id: 2, title: 'Amazon $25 Gift Card',          desc: 'Shop anything you want on Amazon',          cost: 800,  Icon: PackageIcon     },
  { id: 3, title: 'Nike Store $20 Voucher',        desc: 'Get the latest sportswear and gear',        cost: 600,  Icon: ShoeIcon,  initialPurchased: true },
  { id: 4, title: 'Uber Eats $15 Credit',          desc: 'Order your favorite meal delivered',        cost: 450,  Icon: FoodIcon        },
  { id: 5, title: 'Spotify Premium 3 Months',      desc: 'Unlimited music streaming ad-free',         cost: 1500, Icon: HeadphonesIcon  },
  { id: 6, title: 'Netflix 1 Month Subscription',  desc: 'Unlimited movies and TV shows',             cost: 500,  Icon: FilmIcon        },
  { id: 7, title: 'Audible Credits (3 Books)',      desc: 'Listen to your favorite audiobooks',        cost: 1800, Icon: BookIcon        },
  { id: 8, title: 'Steam $50 Gift Card',            desc: 'Buy the latest games on Steam',             cost: 1600, Icon: ControllerIcon  },
]

// ── Reward Card ─────────────────────────────────────────────

function RewardCard({ reward, userXP, inCart, isPurchased, onToggleCart }) {
  const { title, desc, cost, Icon } = reward
  const canAfford   = cost <= userXP
  const isAdded     = inCart

  let status = 'available'
  if (isPurchased) status = 'purchased'
  else if (isAdded) status = 'in-cart'
  else if (!canAfford) status = 'unaffordable'

  return (
    <div
      className="bg-white border border-[#e5e7eb] rounded-[12px] p-6 flex flex-col gap-4 transition-all duration-200 group"
      style={{
        opacity: isPurchased ? 0.6 : 1,
        boxShadow: isPurchased ? 'none' : '0px 1px 3px 0px rgba(0,0,0,0.10)',
        transform: 'translateY(0)',
      }}
      onMouseEnter={e => { if (!isPurchased) e.currentTarget.style.boxShadow = '0px 8px 24px 0px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isPurchased ? 'none' : '0px 1px 3px 0px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Icon box */}
      <div
        className="w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0"
        style={{
          background: isPurchased
            ? '#f3f4f6'
            : 'linear-gradient(to bottom, #942fcd, #ca9af4)',
          boxShadow: isPurchased ? 'none' : '0px 4px 12px rgba(148,47,205,0.2)',
        }}
      >
        <div style={{ opacity: isPurchased ? 0.4 : 1 }}>
          <Icon />
        </div>
      </div>

      {/* Purchased badge */}
      {isPurchased && (
        <span className="flex items-center gap-1.5 bg-[#f3f4f6] text-[#6b7280] text-[11px] font-medium px-2.5 py-1 rounded-[6px] w-fit">
          <CheckIcon />
          Purchased
        </span>
      )}

      {/* Title & description */}
      <div className="flex-1">
        <h3 className="text-[15px] font-semibold text-[#1f2937] leading-snug mb-1.5">{title}</h3>
        <p className="text-[13px] text-[#6b7280] leading-[1.6]">{desc}</p>
      </div>

      {/* Cost */}
      <div className="flex items-center gap-1.5">
        <StarIcon color={isPurchased ? '#d1d5db' : '#942fcd'} size={16} />
        <span className="text-[20px] font-bold" style={{ color: isPurchased ? '#d1d5db' : '#942fcd' }}>
          {cost.toLocaleString()}
        </span>
        <span className="text-[13px] font-medium text-[#6b7280]">XP</span>
      </div>

      {/* Button area */}
      {status === 'purchased' && (
        <div className="h-[42px] flex items-center justify-center rounded-[8px] bg-[#f3f4f6]">
          <span className="text-[14px] font-medium text-[#9ca3af]">Purchased</span>
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
            Need {(cost - userXP).toLocaleString()} more XP
          </p>
        </div>
      )}
    </div>
  )
}

// ── Cart Panel ───────────────────────────────────────────────

function CartPanel({ cartItems, userXP, onRemove, onConfirm }) {
  const total   = cartItems.reduce((s, r) => s + r.cost, 0)
  const after   = userXP - total
  const canAfford = after >= 0

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)] sticky top-6 overflow-hidden">
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
        /* Empty state */
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
                    <StarIcon color="#942fcd" size={12} />
                    <span className="text-[12px] font-semibold text-[#942fcd]">{r.cost} XP</span>
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

          {/* Divider */}
          <div className="border-t border-[#e5e7eb]" />

          {/* Summary */}
          <div className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Total cost</span>
              <span className="font-semibold text-[#1f2937]">{total.toLocaleString()} XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Your balance</span>
              <span className="font-medium text-[#942fcd]">{userXP.toLocaleString()} XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">After redeem</span>
              <span className={`font-semibold ${canAfford ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                {canAfford ? after.toLocaleString() : '—'} XP
              </span>
            </div>
          </div>

          {/* Warning */}
          {!canAfford && (
            <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-[8px] px-3 py-2">
              <p className="text-[12px] text-[#dc2626] font-medium text-center">
                Not enough XP — remove some items
              </p>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={onConfirm}
            disabled={!canAfford}
            className="w-full h-[44px] rounded-[8px] text-[14px] font-medium text-white transition-all duration-200 cursor-pointer"
            style={canAfford
              ? { background: 'linear-gradient(to bottom, #942fcd, #b565e0)', boxShadow: '0px 4px 12px rgba(148,47,205,0.3)' }
              : { background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed', boxShadow: 'none' }
            }
          >
            Confirm &amp; Redeem
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

export default function RewardShop({ onNavigate, userXP, setUserXP, purchased, setPurchased }) {
  const [showSidebar, setShowSidebar]   = useState(false)
  const [cart, setCart]                 = useState([])
  const [toast, setToast]               = useState(null)

  const cartRewards = REWARDS.filter(r => cart.includes(r.id))
  const cartTotal   = cartRewards.reduce((s, r) => s + r.cost, 0)

  const toggleCart = (id) => {
    setCart(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const confirmRedeem = () => {
    if (cartTotal > userXP) return
    setPurchased(prev => new Set([...prev, ...cart]))
    setUserXP(prev => prev - cartTotal)
    const count = cartRewards.length
    setCart([])
    setToast(`${count} reward${count > 1 ? 's' : ''} redeemed successfully!`)
    setTimeout(() => setToast(null), 3000)
  }

  const xpPercent = Math.min((userXP / XP_GOAL) * 100, 100)

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {toast && <Toast message={toast} />}

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activePage="rewardshop"
        onNavigate={onNavigate}
      />

      {/* ── Header ── */}
      <header className="bg-white border-b border-[#e5e7eb] px-12 h-[79px] flex items-stretch">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-stretch gap-6 h-full">
            <button
              onClick={() => setShowSidebar(true)}
              className="flex items-center justify-center cursor-pointer bg-transparent hover:bg-[#f9fafb] rounded-[8px] px-2 transition-colors duration-200"
            >
              <BurgerIcon />
            </button>
            <nav className="flex items-stretch gap-10 h-full">
              {NAV_LINKS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onNavigate?.(id)}
                  className={`h-full border-b-2 text-[16px] cursor-pointer transition-colors duration-200 bg-transparent ${
                    id === 'rewardshop'
                      ? 'border-[#942fcd] text-[#942fcd] font-semibold'
                      : 'border-transparent text-[#6b7280] font-normal hover:text-[#1f2937]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[16px] font-semibold text-[#1f2937]">Ashton_44</span>
            <div className="w-12 h-12 rounded-full bg-[#e5e7eb] overflow-hidden shrink-0">
              <AvatarPlaceholder />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="px-12 py-9">
        <div className="flex gap-8 items-start">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Page heading */}
            <div>
              <h1 className="text-[32px] font-semibold text-[#1f2937] leading-tight">Reward Shop</h1>
              <p className="text-[15px] text-[#6b7280] mt-1">Redeem your XP for coupons</p>
            </div>

            {/* XP Balance card */}
            <div className="bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)] p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[14px] font-medium text-[#6b7280] mb-2">Your XP</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[48px] font-bold leading-none" style={{ color: '#942fcd' }}>
                      {userXP.toLocaleString()}
                    </span>
                    <span className="text-[20px] font-medium text-[#6b7280]">XP</span>
                  </div>
                </div>
                <div
                  className="w-16 h-16 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(to bottom, #942fcd, #ca9af4)', boxShadow: '0px 4px 12px rgba(148,47,205,0.2)' }}
                >
                  <StarIcon color="white" size={32} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%`, background: 'linear-gradient(to right, #942fcd, #ca9af4)' }}
                />
              </div>
              <p className="text-[13px] text-[#9ca3af]">
                {userXP.toLocaleString()} of {XP_GOAL.toLocaleString()} XP to next reward tier
              </p>
            </div>

            {/* Rewards grid */}
            <div className="grid grid-cols-4 gap-5">
              {REWARDS.map(reward => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userXP={userXP}
                  inCart={cart.includes(reward.id)}
                  isPurchased={purchased.has(reward.id)}
                  onToggleCart={toggleCart}
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
                  Complete tasks to earn XP, then redeem your XP for exclusive coupons. Each coupon can only be purchased once.
                  After redemption, your coupon will appear in the "My Rewards" section.
                  This is an MVP simulation — coupons are not real.
                </p>
              </div>
            </div>

          </div>

          {/* ── Right column — Cart ── */}
          <div className="w-[272px] shrink-0">
            <CartPanel
              cartItems={cartRewards}
              userXP={userXP}
              onRemove={toggleCart}
              onConfirm={confirmRedeem}
            />
          </div>

        </div>
      </main>
    </div>
  )
}
