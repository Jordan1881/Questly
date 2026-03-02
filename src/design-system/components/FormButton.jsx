import { useState } from 'react'

/**
 * FormButton — submit button for Sign In / Login forms
 *
 * Default: dark purple gradient  (#942fcd → #ca9af4)
 * Hover:   light gradient        (white   → #ba6aff) + purple text
 */
export default function FormButton({ onClick, children, className = '', type = 'submit' }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative overflow-hidden
        w-[360px] h-[56px] rounded-[8px]
        text-[16px] font-medium
        cursor-pointer
        transition-all duration-300
        active:scale-[0.98]
        ${hovered ? 'scale-[1.02] text-[#942fcd]' : 'scale-100 text-white'}
        ${className}
      `}
      style={{
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(to bottom, #942fcd, #ca9af4)',
        boxShadow: '0px 4px 16px 0px rgba(148, 47, 205, 0.3)',
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
