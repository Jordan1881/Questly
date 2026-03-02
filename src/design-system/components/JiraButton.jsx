import { useState } from 'react'

/**
 * JiraButton — full-width auth overlay button (Jira connect)
 *
 * Default: dark purple gradient  (#942fcd → #b565e0)
 * Hover:   light gradient        (white   → #ba6aff) + purple text
 */
export default function JiraButton({ onClick, children, className = '', type = 'button' }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative overflow-hidden
        w-[528px] h-[56px] rounded-[8px]
        text-[16px] font-semibold
        cursor-pointer
        transition-all duration-300
        active:scale-[0.98]
        ${hovered ? 'scale-[1.02] text-[#942fcd]' : 'scale-100 text-white'}
        ${className}
      `}
      style={{
        fontFamily: 'Poppins, sans-serif',
        background: 'linear-gradient(to bottom, #942fcd, #b565e0)',
        boxShadow: '0px 4px 16px 0px rgba(148, 47, 205, 0.24)',
      }}
    >
      {/* Hover gradient overlay */}
      <span
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(to bottom, white, #ba6aff)',
          opacity: hovered ? 1 : 0,
        }}
      />
      {/* Label */}
      <span className="relative z-10">{children}</span>
    </button>
  )
}
