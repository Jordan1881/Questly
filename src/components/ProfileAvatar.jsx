import { useState } from 'react'
import { resolveAvatarUrl } from '../lib/displayUser'

const PLACEHOLDER_STYLE = {
  developer: 'linear-gradient(135deg, #942fcd 0%, #ca9af4 100%)',
  admin: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
}

export default function ProfileAvatar({ avatarUrl, variant = 'developer', size = 110 }) {
  const [failed, setFailed] = useState(false)
  const src = resolveAvatarUrl(avatarUrl)
  const showImage = src && !failed

  return (
    <div
      className="rounded-full overflow-hidden shrink-0"
      style={{
        width: size,
        height: size,
        background: PLACEHOLDER_STYLE[variant] ?? PLACEHOLDER_STYLE.developer,
        boxShadow: variant === 'admin'
          ? '0px 8px 28px rgba(99,102,241,0.35)'
          : '0px 8px 28px rgba(148,47,205,0.35)',
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          decoding="async"
          loading="lazy"
          className="w-full h-full object-cover object-center"
          onError={() => setFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
          <circle cx="60" cy="80" r="38" fill="rgba(255,255,255,0.25)" />
          <circle cx="60" cy="44" r="22" fill="rgba(255,255,255,0.45)" />
        </svg>
      )}
    </div>
  )
}
