import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import { useAuthStore } from '../stores/authStore'
import { useXpStore } from '../stores/xpStore'
import { useShopContext } from '../AppProviders'
import JoinRequestsTab from '../components/JoinRequestsTab'
import JiraSyncTab from '../components/JiraSyncTab'
import { useWorkspaceStore } from '../stores/workspaceStore'

// ── Constants ──────────────────────────────────────────────

const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #a855f7)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #14b8a6, #0d9488)',
]

const INITIAL_DEVELOPERS = [
  { id: 1, name: 'Alex Kim',     level: 5, xp: 3200, xpMax: 4000, coins: 320, tasks: 28, status: 'active'   },
  { id: 2, name: 'Jordan Lee',   level: 4, xp: 2750, xpMax: 3000, coins: 275, tasks: 22, status: 'active'   },
  { id: 3, name: 'Sam Rivera',   level: 6, xp: 4100, xpMax: 5000, coins: 410, tasks: 35, status: 'active'   },
  { id: 4, name: 'Taylor Park',  level: 3, xp: 1900, xpMax: 2000, coins: 190, tasks: 15, status: 'active'   },
  { id: 5, name: 'Morgan Chen',  level: 5, xp: 3050, xpMax: 4000, coins: 305, tasks: 26, status: 'active'   },
  { id: 6, name: 'Casey Kim',    level: 2, xp: 1200, xpMax: 2000, coins: 120, tasks: 9,  status: 'inactive' },
  { id: 7, name: 'Riley Hassan', level: 4, xp: 2400, xpMax: 3000, coins: 240, tasks: 19, status: 'active'   },
  { id: 8, name: 'Drew Yamada',  level: 7, xp: 5300, xpMax: 6000, coins: 530, tasks: 44, status: 'active'   },
]

const REWARD_NAMES = {
  1: 'Starbucks $10 Gift Card',
  2: 'Amazon $25 Gift Card',
  3: 'Nike Store $20 Voucher',
  4: 'Uber Eats $15 Credit',
  5: 'Spotify Premium 3 Months',
  6: 'Netflix 1 Month',
  7: 'Audible Credits (3 Books)',
  8: 'Steam $50 Gift Card',
}

const REWARD_COSTS = { 1: 40, 2: 80, 3: 60, 4: 45, 5: 150, 6: 50, 7: 180, 8: 160 }

const INITIAL_MOCK_PENDING = [
  { id: 'mp1', devName: 'Alex Kim',    devIdx: 0, rewardId: 2, date: 'Mar 10, 2026' },
  { id: 'mp2', devName: 'Sam Rivera',  devIdx: 2, rewardId: 5, date: 'Mar 11, 2026' },
  { id: 'mp3', devName: 'Drew Yamada', devIdx: 7, rewardId: 8, date: 'Mar 12, 2026' },
]

// ── Icons ──────────────────────────────────────────────────

const ListIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const GridIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0">
    <path d="M2 7l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const CoinIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="1.8" />
    <path d="M12 7v2M12 15v2M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.4 2.5 1.5-1 1.5-2.5 2-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.5 2.5-1.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const SaveIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M2 2h9l3 3v9a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="5" y="2" width="4" height="4" rx="0.5" stroke="white" strokeWidth="1.3" />
    <rect x="3" y="9" width="10" height="5" rx="0.5" stroke="white" strokeWidth="1.3" />
  </svg>
)

// ── Shared sub-components ─────────────────────────────────

function DevAvatar({ idx, size = 36 }) {
  return (
    <div
      className="rounded-full overflow-hidden shrink-0"
      style={{ width: size, height: size, background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}
    >
      <svg viewBox="0 0 40 40" fill="none" width={size} height={size}>
        <circle cx="20" cy="26" r="12" fill="rgba(255,255,255,0.25)" />
        <circle cx="20" cy="15" r="7"  fill="rgba(255,255,255,0.45)" />
      </svg>
    </div>
  )
}

function StatusBadge({ status }) {
  return status === 'active' ? (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#d1fae5] text-[#059669]">Active</span>
  ) : (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px] bg-[#f3f4f6] text-[#9ca3af]">Inactive</span>
  )
}

// ── Team Tab ──────────────────────────────────────────────

function TeamTab({ developers }) {
  const [view, setView] = useState('leaderboard')
  const sorted = [...developers].sort((a, b) => b.xp - a.xp)
  const MEDALS = ['🥇', '🥈', '🥉']
  const TH = 'text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide text-left py-3 px-4'
  const TD = 'py-3.5 px-4 text-[13px] text-[#374151]'

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[14px] text-[#6b7280]">{developers.length} developers on your team</p>
        <div className="flex gap-1 p-1 bg-[#f3f4f6] rounded-[8px]">
          {[
            { id: 'leaderboard', label: 'Leaderboard', Icon: ListIcon },
            { id: 'cards',       label: 'Cards',       Icon: GridIcon },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                view === id ? 'bg-white text-[#1f2937] shadow-sm' : 'text-[#6b7280] hover:text-[#374151]'
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'leaderboard' ? (

        <div className={`${CARD} overflow-hidden`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f3f4f6]">
                <th className={TH}>Rank</th>
                <th className={TH}>Developer</th>
                <th className={TH}>Level</th>
                <th className={TH}>XP</th>
                <th className={TH}>Coins</th>
                <th className={TH}>Tasks Done</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((dev, i) => (
                <tr key={dev.id} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
                  <td className={`${TD} w-16`}>
                    <span className="text-[16px]">{i < 3 ? MEDALS[i] : `#${i + 1}`}</span>
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-2.5">
                      <DevAvatar idx={dev.id - 1} size={32} />
                      <span className="font-medium text-[#1f2937]">{dev.name}</span>
                    </div>
                  </td>
                  <td className={TD}>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                      style={{ background: 'linear-gradient(to right, #942fcd, #b565e0)' }}
                    >
                      Lv {dev.level}
                    </span>
                  </td>
                  <td className={TD}>
                    <span className="font-semibold text-[#1f2937]">{dev.xp.toLocaleString()}</span>
                    <span className="text-[#9ca3af] ml-1">XP</span>
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-1">
                      <CoinIcon size={13} />
                      <span className="font-semibold">{dev.coins}</span>
                    </div>
                  </td>
                  <td className={TD}><span className="font-medium">{dev.tasks}</span></td>
                  <td className={TD}><StatusBadge status={dev.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      ) : (

        <div className="grid grid-cols-4 gap-4">
          {sorted.map((dev) => {
            const pct = Math.round((dev.xp / dev.xpMax) * 100)
            return (
              <div key={dev.id} className={`${CARD} p-5 flex flex-col gap-3`}>
                <div className="flex items-center gap-3">
                  <DevAvatar idx={dev.id - 1} size={44} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-[#1f2937] truncate">{dev.name}</p>
                    <StatusBadge status={dev.status} />
                  </div>
                </div>
                <span
                  className="w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                  style={{ background: 'linear-gradient(to right, #942fcd, #b565e0)' }}
                >
                  Level {dev.level}
                </span>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[#6b7280]">XP Progress</span>
                    <span className="font-medium text-[#1f2937]">{dev.xp.toLocaleString()} / {dev.xpMax.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: 'linear-gradient(to right, #942fcd, #b565e0)' }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#f3f4f6]">
                  <div className="flex items-center gap-1">
                    <CoinIcon size={13} />
                    <span className="text-[12px] font-medium text-[#374151]">{dev.coins} Coins</span>
                  </div>
                  <span className="text-[12px] text-[#6b7280]">{dev.tasks} tasks</span>
                </div>
              </div>
            )
          })}
        </div>

      )}
    </div>
  )
}

// ── Rewards Tab ───────────────────────────────────────────

function RewardsTab({ mockPending, setMockPending, pendingRequests, setPendingRequests, purchased, setPurchased, userCoins, setUserCoins }) {
  const [rowStatus, setRowStatus] = useState({})

  const livePending = [...pendingRequests].map(rId => ({
    id: `live-${rId}`,
    devName: 'Ashton Rodriguez',
    devIdx: 0,
    rewardId: rId,
    date: 'Mar 12, 2026',
    isLive: true,
  }))

  const allRequests = [...mockPending, ...livePending]

  const handle = (req, action) => {
    setRowStatus(s => ({ ...s, [req.id]: action }))
    setTimeout(() => {
      if (req.isLive) {
        setPendingRequests(prev => { const n = new Set(prev); n.delete(req.rewardId); return n })
        if (action === 'approved') {
          setPurchased(prev => new Set([...prev, req.rewardId]))
          setUserCoins(c => Math.max(0, c - (REWARD_COSTS[req.rewardId] ?? 0)))
        }
      } else {
        setMockPending(prev => prev.filter(r => r.id !== req.id))
      }
      setRowStatus(s => { const n = { ...s }; delete n[req.id]; return n })
    }, 1200)
  }

  const TH = 'text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide text-left py-3 px-4'
  const TD = 'py-3.5 px-4 text-[13px] text-[#374151]'

  return (
    <div>
      <div className="mb-6">
        <p className="text-[14px] font-semibold text-[#1f2937]">Pending Approvals</p>
        <p className="text-[13px] text-[#6b7280] mt-0.5">
          {allRequests.length} request{allRequests.length !== 1 ? 's' : ''} awaiting your review
        </p>
      </div>

      {allRequests.length === 0 ? (

        <div className={`${CARD} p-12 flex flex-col items-center gap-3 text-center`}>
          <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center text-[#059669]">
            <CheckIcon />
          </div>
          <p className="text-[15px] font-semibold text-[#1f2937]">All caught up!</p>
          <p className="text-[13px] text-[#9ca3af]">No pending reward requests at this time.</p>
        </div>

      ) : (

        <div className={`${CARD} overflow-hidden`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f3f4f6]">
                <th className={TH}>Developer</th>
                <th className={TH}>Reward</th>
                <th className={TH}>Coin Cost</th>
                <th className={TH}>Requested</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allRequests.map((req) => {
                const status = rowStatus[req.id]
                const rowBg = status === 'approved'
                  ? 'bg-[#f0fdf4]'
                  : status === 'denied'
                  ? 'bg-[#fff5f5]'
                  : 'hover:bg-[#fafafa]'
                return (
                  <tr key={req.id} className={`border-b border-[#f9fafb] transition-colors ${rowBg}`}>
                    <td className={TD}>
                      <div className="flex items-center gap-2.5">
                        <DevAvatar idx={req.devIdx ?? 0} size={32} />
                        <span className="font-medium text-[#1f2937]">{req.devName}</span>
                      </div>
                    </td>
                    <td className={TD}>{REWARD_NAMES[req.rewardId] ?? '—'}</td>
                    <td className={TD}>
                      <div className="flex items-center gap-1">
                        <CoinIcon size={13} />
                        <span className="font-semibold">{REWARD_COSTS[req.rewardId] ?? '—'}</span>
                      </div>
                    </td>
                    <td className={TD}>{req.date}</td>
                    <td className={TD}>
                      {status ? (
                        <span className={`text-[12px] font-semibold ${status === 'approved' ? 'text-[#059669]' : 'text-[#ef4444]'}`}>
                          {status === 'approved' ? '✓ Approved' : '✗ Denied'}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handle(req, 'approved')}
                            className="flex items-center gap-1 px-3 py-1 rounded-[6px] text-[12px] font-semibold bg-[#d1fae5] text-[#059669] cursor-pointer hover:bg-[#a7f3d0] transition-colors"
                          >
                            <CheckIcon />
                            Approve
                          </button>
                          <button
                            onClick={() => handle(req, 'denied')}
                            className="flex items-center gap-1 px-3 py-1 rounded-[6px] text-[12px] font-semibold bg-[#fee2e2] text-[#ef4444] cursor-pointer hover:bg-[#fecaca] transition-colors"
                          >
                            <XIcon />
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      )}
    </div>
  )
}

// ── XP Settings Tab ───────────────────────────────────────

function XPSettingsTab() {
  const [settings, setSettings] = useState({ easy: 50, medium: 100, hard: 200, rate: 10 })
  const [toast, setToast] = useState(false)

  const update = (key, val) => setSettings(s => ({ ...s, [key]: Number(val) || 0 }))

  const save = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const INPUT = 'w-24 h-10 border border-[#e5e7eb] rounded-[8px] px-3 text-[14px] font-medium text-[#1f2937] text-right focus:outline-none focus:border-[#942fcd] transition-colors'

  return (
    <div className="max-w-[560px]">
      {toast && (
        <div
          className="mb-6 flex items-center gap-2 px-4 py-3 rounded-[10px] text-[13px] font-medium text-[#059669]"
          style={{ background: '#d1fae5', border: '1px solid #a7f3d0', animation: 'fadeInDown 0.3s ease' }}
        >
          <CheckIcon />
          XP settings saved successfully!
        </div>
      )}

      <div className={`${CARD} p-6 flex flex-col gap-6`}>

        <div>
          <h3 className="text-[15px] font-semibold text-[#1f2937] mb-1">Task XP Rewards</h3>
          <p className="text-[13px] text-[#6b7280]">Set the XP earned when completing tasks of each difficulty</p>
        </div>

        <div className="flex flex-col gap-4">
          {[
            { key: 'easy',   label: 'Easy Tasks',   color: '#10b981', bg: '#d1fae5' },
            { key: 'medium', label: 'Medium Tasks',  color: '#f59e0b', bg: '#fef3c7' },
            { key: 'hard',   label: 'Hard Tasks',    color: '#ef4444', bg: '#fee2e2' },
          ].map(({ key, label, color, bg }) => (
            <div key={key} className="flex items-center justify-between">
              <span
                className="px-3 py-1 rounded-full text-[12px] font-semibold"
                style={{ background: bg, color }}
              >
                {label}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings[key]}
                  onChange={e => update(key, e.target.value)}
                  className={INPUT}
                  min={0}
                />
                <span className="text-[13px] text-[#6b7280] w-8">XP</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#f3f4f6]">
          <h3 className="text-[15px] font-semibold text-[#1f2937] mb-1">XP → Coins Conversion</h3>
          <p className="text-[13px] text-[#6b7280] mb-4">Coins are automatically awarded alongside XP at this rate</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[13px] text-[#374151]">Every</span>
            <input
              type="number"
              value={100}
              readOnly
              className="w-20 h-10 border border-[#e5e7eb] rounded-[8px] px-3 text-[14px] font-medium text-[#6b7280] text-right bg-[#f9fafb]"
            />
            <span className="text-[13px] text-[#374151]">XP earned =</span>
            <input
              type="number"
              value={settings.rate}
              onChange={e => update('rate', e.target.value)}
              className={INPUT}
              min={0}
            />
            <span className="text-[13px] text-[#6b7280]">Coins</span>
          </div>
          <p className="text-[12px] text-[#9ca3af] mt-2">
            Current rate: 1 XP = {(settings.rate / 100).toFixed(2)} Coins
          </p>
        </div>

        <button
          onClick={save}
          className="flex items-center justify-center gap-2 w-full h-11 rounded-[8px] text-[14px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)', boxShadow: '0px 4px 12px rgba(148,47,205,0.3)' }}
        >
          <SaveIcon />
          Save Changes
        </button>

      </div>
    </div>
  )
}

// ── Users Tab ─────────────────────────────────────────────

function UsersTab({ developers, setDevelopers }) {
  const [adjustingId, setAdjustingId] = useState(null)
  const [xpAmount, setXpAmount] = useState('')

  const toggleStatus = (id) =>
    setDevelopers(prev => prev.map(d =>
      d.id === id ? { ...d, status: d.status === 'active' ? 'inactive' : 'active' } : d
    ))

  const applyXP = (id, delta) => {
    setDevelopers(prev => prev.map(d => d.id === id ? { ...d, xp: Math.max(0, d.xp + delta) } : d))
    setAdjustingId(null)
    setXpAmount('')
  }

  const TH = 'text-[12px] font-semibold text-[#6b7280] uppercase tracking-wide text-left py-3 px-4'
  const TD = 'py-3.5 px-4 text-[13px] text-[#374151] align-top'

  return (
    <div className={`${CARD} overflow-hidden`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#f3f4f6]">
            <th className={TH}>Developer</th>
            <th className={TH}>Status</th>
            <th className={TH}>XP</th>
            <th className={TH}>Coins</th>
            <th className={TH}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {developers.map((dev) => (
            <tr key={dev.id} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
              <td className={TD}>
                <div className="flex items-center gap-2.5 pt-0.5">
                  <DevAvatar idx={dev.id - 1} size={32} />
                  <div>
                    <p className="font-medium text-[#1f2937]">{dev.name}</p>
                    <p className="text-[11px] text-[#9ca3af]">Level {dev.level}</p>
                  </div>
                </div>
              </td>
              <td className={TD}><StatusBadge status={dev.status} /></td>
              <td className={TD}>
                <span className="font-semibold text-[#1f2937]">{dev.xp.toLocaleString()}</span>
                <span className="text-[#9ca3af] ml-1 text-[11px]">XP</span>
              </td>
              <td className={TD}>
                <div className="flex items-center gap-1">
                  <CoinIcon size={13} />
                  <span className="font-medium">{dev.coins}</span>
                </div>
              </td>
              <td className={TD}>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => toggleStatus(dev.id)}
                    className={`px-3 py-1 rounded-[6px] text-[12px] font-semibold cursor-pointer transition-colors ${
                      dev.status === 'active'
                        ? 'bg-[#fee2e2] text-[#ef4444] hover:bg-[#fecaca]'
                        : 'bg-[#d1fae5] text-[#059669] hover:bg-[#a7f3d0]'
                    }`}
                  >
                    {dev.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { setAdjustingId(adjustingId === dev.id ? null : dev.id); setXpAmount('') }}
                    className="flex items-center gap-1 px-3 py-1 rounded-[6px] text-[12px] font-semibold bg-[#eef2ff] text-[#6366f1] cursor-pointer hover:bg-[#e0e7ff] transition-colors"
                  >
                    <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                    Adjust XP
                  </button>
                </div>
                {adjustingId === dev.id && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={xpAmount}
                      onChange={e => setXpAmount(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-24 h-8 border border-[#e5e7eb] rounded-[6px] px-2 text-[12px] focus:outline-none focus:border-[#6366f1]"
                    />
                    <button
                      onClick={() => applyXP(dev.id, Number(xpAmount) || 0)}
                      className="px-2 py-1 rounded-[6px] text-[11px] font-semibold bg-[#d1fae5] text-[#059669] cursor-pointer hover:bg-[#a7f3d0]"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => applyXP(dev.id, -(Number(xpAmount) || 0))}
                      className="px-2 py-1 rounded-[6px] text-[11px] font-semibold bg-[#fee2e2] text-[#ef4444] cursor-pointer hover:bg-[#fecaca]"
                    >
                      − Sub
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Admin page ────────────────────────────────────────────

export default function Admin() {
  const userRole = useAuthStore((s) => s.userRole)
  const userCoins = useXpStore((s) => s.userCoins)
  const setUserCoins = useXpStore((s) => s.setUserCoins)
  const { pendingRequests, setPendingRequests, purchased, setPurchased } = useShopContext()
  const [showSidebar, setShowSidebar]     = useState(false)
  const [activeTab, setActiveTab]         = useState('team')
  const [developers, setDevelopers]       = useState(INITIAL_DEVELOPERS)
  const [mockPending, setMockPending]     = useState(INITIAL_MOCK_PENDING)
  const pendingJoinRequests = useWorkspaceStore((s) => s.pendingJoinRequests)

  const totalPending = mockPending.length + pendingRequests.size
  const totalJoinPending = pendingJoinRequests.length

  const TABS = [
    { id: 'team',    label: 'Team'           },
    { id: 'jira',    label: 'Jira'           },
    { id: 'joins',   label: 'Join Requests'  },
    { id: 'rewards', label: 'Rewards'        },
    { id: 'xp',      label: 'XP Settings'    },
    { id: 'users',   label: 'Users'          },
  ]

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <PageHeader
        onOpenSidebar={() => setShowSidebar(true)}
      />

      <main className="px-12 py-9">
        <h1 className="text-[32px] font-semibold text-[#1f2937] mb-6">Admin Panel</h1>

        {/* Sub-tab bar */}
        <div className="flex gap-0 border-b border-[#e5e7eb] mb-8">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-3 text-[14px] font-medium transition-all duration-150 cursor-pointer relative ${
                activeTab === id ? 'text-[#942fcd] font-semibold' : 'text-[#6b7280] hover:text-[#374151]'
              }`}
            >
              {label}
              {id === 'joins' && totalJoinPending > 0 && (
                <span
                  className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)' }}
                >
                  {totalJoinPending}
                </span>
              )}
              {id === 'rewards' && totalPending > 0 && (
                <span
                  className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: '#942fcd', background: 'rgba(148,47,205,0.1)' }}
                >
                  {totalPending}
                </span>
              )}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#942fcd]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'team' && (
          <TeamTab developers={developers} />
        )}
        {activeTab === 'jira' && <JiraSyncTab />}
        {activeTab === 'joins' && <JoinRequestsTab />}
        {activeTab === 'rewards' && (
          <RewardsTab
            mockPending={mockPending}
            setMockPending={setMockPending}
            pendingRequests={pendingRequests}
            setPendingRequests={setPendingRequests}
            purchased={purchased}
            setPurchased={setPurchased}
            userCoins={userCoins}
            setUserCoins={setUserCoins}
          />
        )}
        {activeTab === 'xp' && <XPSettingsTab />}
        {activeTab === 'users' && (
          <UsersTab developers={developers} setDevelopers={setDevelopers} />
        )}

      </main>
    </div>
  )
}
