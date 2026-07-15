import { forwardRef } from 'react'
import { xpLevelInfo } from '../lib/xpLevel'
import { ECONOMY } from '../lib/economyCopy'

const ArrowUpIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" className="w-[9px] h-[9px]">
    <path d="M5 8.5V1.5M2.5 4L5 1.5 7.5 4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const XPProgressBar = forwardRef(function XPProgressBar({ xp = 0, className = '' }, ref) {
  const { level, xpInLevel, levelMax, percent, xpToNext, nextLevel } = xpLevelInfo(xp)

  return (
    <div ref={ref} className={className} data-xp-progress-bar>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] font-semibold text-[#1f2937]">{ECONOMY.levelProgress}</span>
        <div className="flex items-center gap-1.5 bg-[rgba(99,102,241,0.1)] px-3 py-[5px] rounded-full">
          <ArrowUpIcon />
          <span className="text-[11px] font-medium text-[#6366f1]">Level {level}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="text-[32px] font-bold text-[#1f2937] leading-tight">{xpInLevel}</span>
        <span className="text-[16px] font-medium text-[#6b7280]">XP</span>
      </div>
      <p className="text-[11px] text-[#9ca3af] mb-0.5">Out of {levelMax} lifetime XP this level</p>
      <p className="text-[10px] mb-4">
        <span className="font-semibold text-[#1f2937]">{xpToNext} XP</span>
        <span className="text-[#6b7280]"> to reach Level {nextLevel}</span>
      </p>

      <div className="flex items-center justify-between mb-1.5">
        {[0, 250, 500, 750].map((n) => (
          <div key={n} className="flex items-center gap-[3px]">
            <div className="w-px h-[6px] rounded-full bg-[#d1d5db]" />
            <span className="text-[8.7px] text-[#9ca3af]">{n}</span>
          </div>
        ))}
        <div className="flex items-center gap-[3px]">
          <div className="w-px h-[6px] rounded-full bg-[#942fcd]" />
          <span className="text-[8.7px] font-medium text-[#942fcd]">{levelMax}</span>
        </div>
      </div>

      <div className="h-3 rounded-full bg-[#e5e7eb] overflow-hidden relative mb-1.5">
        <div
          data-xp-bar-fill
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: `${percent}%`, background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
        />
        <div
          className="absolute top-0 h-full w-[2.4px] bg-white"
          style={{ left: `${percent}%`, boxShadow: '0 0 6px rgba(148,47,205,0.6)' }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-[#6b7280]">Progress</span>
        <span className="text-[11px] font-semibold text-[#942fcd]">{percent}%</span>
      </div>
    </div>
  )
})

export default XPProgressBar
