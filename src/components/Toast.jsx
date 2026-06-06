import { useToastStore } from '../stores/toastStore'

export default function Toast() {
  const message = useToastStore((s) => s.message)

  if (!message) return null

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-[10px] text-[14px] font-semibold text-white shadow-lg"
      style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
      role="status"
    >
      {message}
    </div>
  )
}
