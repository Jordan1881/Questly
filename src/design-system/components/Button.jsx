import { useState } from 'react'

/**
 * Button — Hero CTA button component
 *
 * Default (inactive): dark purple gradient  (#942fcd → #ca9af4)
 * On hover:          light gradient         (white   → #ba6aff)
 */
export default function Button({ onClick, children, className = '', type = 'button' }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative overflow-hidden
        w-[170px] h-[65px] rounded-[8px]
        text-[16px] font-medium
        cursor-pointer
        transition-all duration-300
        active:scale-95
        ${hovered ? 'scale-105 text-[#942fcd]' : 'scale-100 text-white'}
        ${className}
      `}
      style={{
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(to bottom, #942fcd, #ca9af4)',
        boxShadow: '0px 4px 16px 0px rgba(148, 47, 205, 0.3)',
      }}
    >
      {/* Hover gradient overlay — fades in on hover */}
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
