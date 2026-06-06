import { useEffect, useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar'
import PageHeader from '../components/PageHeader'
import { StarIcon } from '../components/icons'
import JiraIntegrationCard from '../components/JiraIntegrationCard'
import MyRewards from '../components/MyRewards'
import ProfileAvatar from '../components/ProfileAvatar'
import { SkeletonList } from '../components/Skeleton'
import { useAuthStore } from '../stores/authStore'
import { useXpStore } from '../stores/xpStore'
import { useProfileStore } from '../stores/profileStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { xpLevelInfo } from '../lib/xpLevel'
import { apiFetch } from '../lib/api'
import { buildWeeklyXpData, weeklyXpTotal } from '../lib/xpHistoryChart'
import { summarizeTeam } from '../lib/adminMembers'

// ── Tailwind class constants ────────────────────────────────
const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

// ── Icons (local — not shared with other pages) ─────────────

// Small check — used in "Connected" and "Purchased" badges
const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 shrink-0">
    <path d="M2 7l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ShopBagIcon = ({ color = '#942fcd' }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrendUpIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0">
    <path d="M2 14l5-5 4 3 7-8" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 4h4v4" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ── XP History Chart ──────────────────────────────────────────

function XPHistoryChart({ data = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const W = 540, H = 190
  const PAD = { l: 44, r: 20, t: 24, b: 36 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b
  const maxY = Math.max(600, ...data.map((d) => d.xp), 1)
  const n = data.length

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (n - 1)) * cW,
    y: PAD.t + (1 - d.xp / maxY) * cH,
    ...d,
  }))

  // Catmull-Rom → cubic bezier for smooth curve
  const makePath = (points) => {
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[Math.min(points.length - 1, i + 2)]
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
    }
    return d
  }

  const linePath = makePath(pts)
  const areaPath = `${linePath} L ${pts[n - 1].x} ${PAD.t + cH} L ${pts[0].x} ${PAD.t + cH} Z`
  const yLabels  = [0, 150, 300, 450, 600]
  const segW     = cW / (n - 1)

  // Clamp tooltip so it doesn't overflow the chart edges
  const ttW = 72, ttH = 28
  const getTooltipX = (pt) => Math.min(Math.max(pt.x - ttW / 2, PAD.l), W - PAD.r - ttW)

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <linearGradient id="profileAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#942fcd" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#942fcd" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y-axis labels */}
        {yLabels.map(v => {
          const y = PAD.t + (1 - v / maxY) * cH
          return (
            <g key={v}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
                stroke={v === 0 ? '#e5e7eb' : '#f3f4f6'} strokeWidth="1" />
              <text x={PAD.l - 8} y={y} textAnchor="end" dominantBaseline="middle"
                fontSize="11" fill="#9ca3af" fontFamily="Poppins, sans-serif">{v}</text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#profileAreaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#942fcd" strokeWidth="2.5" strokeLinecap="round" />

        {/* X-axis labels */}
        {pts.map((pt, i) => (
          <text key={i} x={pt.x} y={H - 4} textAnchor="middle"
            fontSize="11" fill={hoveredIdx === i ? '#942fcd' : '#9ca3af'}
            fontFamily="Poppins, sans-serif"
            style={{ transition: 'fill 0.15s' }}>
            {pt.day}
          </text>
        ))}

        {/* Invisible hit areas + hover interaction */}
        {pts.map((pt, i) => (
          <g key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer' }}>
            <rect
              x={pt.x - segW / 2} y={PAD.t}
              width={segW} height={cH}
              fill="transparent"
            />
            {/* Vertical guide line on hover */}
            {hoveredIdx === i && (
              <line x1={pt.x} y1={PAD.t} x2={pt.x} y2={PAD.t + cH}
                stroke="#942fcd" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.35" />
            )}
            {/* Data point dot */}
            <circle
              cx={pt.x} cy={pt.y}
              r={hoveredIdx === i ? 6 : 4}
              fill={hoveredIdx === i ? '#942fcd' : 'white'}
              stroke="#942fcd" strokeWidth="2.5"
              style={{ transition: 'r 0.15s ease, fill 0.15s ease' }}
            />
          </g>
        ))}

        {/* Tooltip */}
        {hoveredIdx !== null && (() => {
          const pt = pts[hoveredIdx]
          const tx = getTooltipX(pt)
          const ty = pt.y - ttH - 10
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx} y={ty} width={ttW} height={ttH} rx="7" fill="#1f2937" />
              {/* Arrow */}
              <polygon
                points={`${pt.x - 5},${ty + ttH} ${pt.x + 5},${ty + ttH} ${pt.x},${ty + ttH + 6}`}
                fill="#1f2937"
              />
              <text x={tx + ttW / 2} y={ty + ttH / 2 + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="12" fontWeight="700" fill="white"
                fontFamily="Poppins, sans-serif">
                {pt.xp} XP
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

const CoinIcon = ({ size = 16, color = '#942fcd' }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <path d="M12 7v2M12 15v2M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.4 2.5 1.5-1 1.5-2.5 2-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.5 2.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ClockBadgeIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 shrink-0">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M7 4.5V7l1.5 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const UsersIcon = ({ color = '#942fcd' }) => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0">
    <path d="M12 2L3 7v6c0 5 3.9 9.7 9 11 5.1-1.3 9-6 9-11V7L12 2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ── Profile page ─────────────────────────────────────────────

export default function Profile() {
  const authUser = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.userRole)
  const userXP = useXpStore((s) => s.userXP)
  const profile = useProfileStore((s) => s.profile)
  const purchases = useProfileStore((s) => s.purchases)
  const profileLoading = useProfileStore((s) => s.isLoading)
  const fetchProfile = useProfileStore((s) => s.fetchProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const deletePurchase = useProfileStore((s) => s.deletePurchase)
  const members = useWorkspaceStore((s) => s.members)
  const pendingJoinRequests = useWorkspaceStore((s) => s.pendingJoinRequests)
  const fetchMine = useWorkspaceStore((s) => s.fetchMine)
  const fetchMembers = useWorkspaceStore((s) => s.fetchMembers)
  const fetchPendingJoinRequests = useWorkspaceStore((s) => s.fetchPendingJoinRequests)
  const [showSidebar, setShowSidebar] = useState(false)
  const [xpTransactions, setXpTransactions] = useState([])
  const [xpHistoryLoading, setXpHistoryLoading] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [saveMessage, setSaveMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const isAdmin = userRole === 'admin'
  const displayProfile = profile ?? authUser
  const levelInfo = xpLevelInfo(displayProfile?.lifetimeXp ?? displayProfile?.lifetime_xp ?? 0)

  useEffect(() => {
    fetchProfile().catch(() => {})
  }, [fetchProfile])

  useEffect(() => {
    if (!isAdmin) {
      setXpHistoryLoading(true)
      apiFetch('/api/users/me/xp-history')
        .then(({ transactions }) => setXpTransactions(transactions))
        .catch(() => setXpTransactions([]))
        .finally(() => setXpHistoryLoading(false))
    }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) {
      fetchMine()
        .then((ws) => {
          if (!ws?.id) return null
          return Promise.all([
            fetchMembers(ws.id),
            fetchPendingJoinRequests(ws.id),
          ])
        })
        .catch(() => {})
    }
  }, [isAdmin, fetchMine, fetchMembers, fetchPendingJoinRequests])

  const weeklyXpData = useMemo(() => buildWeeklyXpData(xpTransactions), [xpTransactions])
  const weekXpGain = useMemo(() => weeklyXpTotal(xpTransactions), [xpTransactions])
  const teamSummary = useMemo(
    () => summarizeTeam(members, pendingJoinRequests.length),
    [members, pendingJoinRequests.length],
  )

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username ?? '')
      setEditAvatarUrl(profile.avatarUrl ?? '')
    }
  }, [profile])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage(null)
    try {
      await updateProfile({
        username: editUsername.trim(),
        avatarUrl: editAvatarUrl.trim() || null,
      })
      setSaveMessage({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]" style={{ fontFamily: 'Poppins, sans-serif' }}>

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      <PageHeader
        onOpenSidebar={() => setShowSidebar(true)}
      />

      {/* ── Main ── */}
      <main className="px-12 py-9">
        <div className="flex flex-col gap-6">

          {/* ── Profile Hero Card ── */}
          {isAdmin ? (

            /* Admin Hero */
            <div className={`${CARD} p-8`}>
              <div className="flex items-center gap-8">
                <ProfileAvatar avatarUrl={displayProfile?.avatarUrl} variant="admin" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-[26px] font-bold text-[#1f2937] leading-tight">
                      {displayProfile?.username ?? 'Admin'}
                    </h1>
                    <span
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold text-white shrink-0"
                      style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)' }}
                    >
                      <ShieldIcon />
                      Admin / Manager
                    </span>
                  </div>
                  <p className="text-[14px] text-[#9ca3af] mb-6">{displayProfile?.email}</p>
                  <div className="flex gap-10">
                    {[
                      { label: 'Developers Managed', value: String(teamSummary.total) },
                      { label: 'Active Members',      value: String(teamSummary.active) },
                      { label: 'Pending Approvals',   value: String(teamSummary.pending) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <span className="text-[32px] font-bold text-[#1f2937] leading-none">{value}</span>
                        <span className="text-[13px] text-[#9ca3af]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          ) : (

            /* Developer Hero */
            <div className={`${CARD} p-8`}>
              <div className="flex items-center gap-8">
                <ProfileAvatar avatarUrl={displayProfile?.avatarUrl} variant="developer" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-[26px] font-bold text-[#1f2937] leading-tight">
                      {displayProfile?.username ?? 'Developer'}
                    </h1>
                    <span
                      className="px-3 py-1 rounded-full text-[13px] font-semibold text-white shrink-0"
                      style={{ background: 'linear-gradient(to right, #942fcd, #b565e0)' }}
                    >
                      Level {levelInfo.level}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#9ca3af] mb-5">{displayProfile?.email}</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[36px] font-bold leading-none" style={{ color: '#942fcd' }}>{levelInfo.xpInLevel}</span>
                    <span className="text-[16px] font-medium text-[#6b7280]">/ {levelInfo.levelMax} XP</span>
                  </div>
                  <p className="text-[12px] text-[#9ca3af] mb-3">{levelInfo.xpToNext} XP to reach Level {levelInfo.nextLevel}</p>
                  <div className="max-w-[440px] mt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      {[0, 250, 500, 750].map(n => (
                        <div key={n} className="flex items-center gap-[3px]">
                          <div className="w-px h-[6px] rounded-full bg-[#d1d5db]" />
                          <span className="text-[8.7px] text-[#9ca3af]">{n}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-[3px]">
                        <div className="w-px h-[6px] rounded-full bg-[#942fcd]" />
                        <span className="text-[8.7px] font-medium text-[#942fcd]">1000</span>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-[#e5e7eb] overflow-hidden relative mb-1.5">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{ width: `${levelInfo.percent}%`, background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
                      />
                      <div
                        className="absolute top-0 h-full w-[2.4px] bg-white"
                        style={{ left: `${levelInfo.percent}%`, boxShadow: '0 0 6px rgba(148,47,205,0.6)' }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-[#6b7280]">Progress</span>
                      <span className="text-[11px] font-semibold text-[#942fcd]">{levelInfo.percent}%</span>
                    </div>
                  </div>
                </div>
                <div
                  className="shrink-0 flex flex-col items-center gap-3 px-5 py-[8px]"
                  style={{ background: '#f5eefd', border: '2px solid rgba(148,47,205,0.2)', borderRadius: '40px', boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.25)', minWidth: '110px' }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold leading-[1.2]" style={{ color: '#942fcd', fontSize: '32px' }}>{userXP.toLocaleString()}</span>
                    <span className="text-[14px]" style={{ color: 'rgba(204,204,204,0.8)' }}>Available XP</span>
                  </div>
                </div>
              </div>
            </div>

          )}

          {/* ── Developer-only: XP History + Account Details ── */}
          {!isAdmin && (
            <div className="flex gap-6 items-start">
              <div className={`flex-1 min-w-0 ${CARD} p-6`}>
                <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1f2937]">XP History</h2>
                    <p className="text-[13px] text-[#6b7280] mt-0.5">Your last 7 days</p>
                  </div>
                  {weekXpGain > 0 && (
                    <div className="flex items-center gap-1.5 border border-[#d1fae5] rounded-[8px] px-3 py-1.5 shrink-0" style={{ background: '#f0fdf4' }}>
                      <TrendUpIcon />
                      <span className="text-[13px] font-semibold text-[#059669]">+{weekXpGain} XP this week</span>
                    </div>
                  )}
                </div>
                {xpHistoryLoading ? (
                  <SkeletonList count={2} />
                ) : (
                  <XPHistoryChart data={weeklyXpData} />
                )}
              </div>
              <div className={`w-[288px] shrink-0 ${CARD} p-6`}>
                <h2 className="text-[16px] font-semibold text-[#1f2937] mb-5">Account Details</h2>
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-3 mb-5">
                  <label className="text-[12px] font-medium text-[#374151]">
                    Username
                    <input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[13px]"
                    />
                  </label>
                  <label className="text-[12px] font-medium text-[#374151]">
                    Avatar URL
                    <input
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[13px]"
                    />
                  </label>
                  {saveMessage && (
                    <p className={`text-[12px] ${saveMessage.type === 'success' ? 'text-[#059669]' : 'text-[#ef4444]'}`}>
                      {saveMessage.text}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="self-start px-3 py-1.5 rounded-[6px] text-[12px] font-semibold text-white cursor-pointer disabled:opacity-60"
                    style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
                  >
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </form>
                <JiraIntegrationCard showConnectForm />
                <div className="flex flex-col divide-y divide-[#f3f4f6]">
                  {[
                    { label: 'Sprint XP', value: `${userXP.toLocaleString()} XP`, star: true },
                    { label: 'Lifetime XP', value: `${(displayProfile?.lifetimeXp ?? 0).toLocaleString()} XP`, star: true },
                    { label: 'Streak', value: `${displayProfile?.streakDays ?? 0} days` },
                  ].map(({ label, value, star }) => (
                    <div key={label} className="flex items-center justify-between py-3">
                      <span className="text-[13px] text-[#6b7280]">{label}</span>
                      <div className="flex items-center gap-1">
                        {star && <StarIcon color="#942fcd" size={13} />}
                        <span className="text-[13px] font-semibold text-[#1f2937]">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Admin-only: Team Summary + Account Details ── */}
          {isAdmin && (
            <div className="flex gap-6 items-start">
              <div className={`flex-1 min-w-0 ${CARD} p-6`}>
                <div className="flex items-center gap-3 mb-6">
                  <UsersIcon color="#6366f1" />
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1f2937]">Team Summary</h2>
                    <p className="text-[13px] text-[#6b7280] mt-0.5">Your managed team overview</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total Developers', value: String(teamSummary.total), color: '#6366f1', bg: '#eef2ff' },
                    { label: 'Active Members',   value: String(teamSummary.active), color: '#10b981', bg: '#d1fae5' },
                    { label: 'Inactive Members', value: String(teamSummary.inactive), color: '#9ca3af', bg: '#f3f4f6' },
                    { label: 'Pending Approvals', value: String(teamSummary.pending), color: '#f59e0b', bg: '#fef3c7' },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className="rounded-[10px] p-4 flex flex-col gap-1" style={{ background: bg }}>
                      <span className="text-[28px] font-bold leading-none" style={{ color }}>{value}</span>
                      <span className="text-[12px] text-[#6b7280]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`w-[288px] shrink-0 ${CARD} p-6`}>
                <h2 className="text-[16px] font-semibold text-[#1f2937] mb-5">Account Details</h2>
                <JiraIntegrationCard showConnectForm={false} />
                <div className="flex flex-col divide-y divide-[#f3f4f6]">
                  {[
                    { label: 'Role',        value: 'Admin / Manager' },
                    { label: 'Team Size',   value: `${teamSummary.total} developer${teamSummary.total === 1 ? '' : 's'}` },
                    { label: 'Pending Joins', value: String(teamSummary.pending) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-3">
                      <span className="text-[13px] text-[#6b7280]">{label}</span>
                      <span className="text-[13px] font-semibold text-[#1f2937]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── My Rewards Card (developer only) ── */}
          {!isAdmin && (
            <div className={`${CARD} p-6`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#1f2937]">My Rewards</h2>
                  <p className="text-[13px] text-[#6b7280] mt-0.5">Coupons you've redeemed</p>
                </div>
                {purchases.length > 0 && (
                  <span
                    className="text-[12px] font-semibold px-3 py-1 rounded-[6px]"
                    style={{ background: 'linear-gradient(to right, #f3e8ff, #ede9fe)', color: '#942fcd' }}
                  >
                    {purchases.length} reward{purchases.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <MyRewards
                purchases={purchases}
                onDelete={deletePurchase}
                isLoading={profileLoading}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
