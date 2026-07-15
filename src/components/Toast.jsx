import { useToastStore } from '../stores/toastStore'

const STYLES = {
  success: {
    background: 'linear-gradient(to bottom, #942fcd, #b565e0)',
    className: 'text-white',
  },
  error: {
    background: 'var(--color-error-50)',
    className: 'text-[color:var(--color-error-700)] border border-[color:var(--color-error-200)]',
  },
}

export default function Toast() {
  const message = useToastStore((s) => s.message)
  const type = useToastStore((s) => s.type)

  if (!message) return null

  const style = STYLES[type] ?? STYLES.success

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-[var(--radius-lg)] text-[14px] font-semibold shadow-[var(--shadow-soft-md)] ${style.className}`}
      style={{ background: style.background }}
      role={type === 'error' ? 'alert' : 'status'}
    >
      {message}
    </div>
  )
}
