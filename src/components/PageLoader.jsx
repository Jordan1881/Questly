// Suspense fallback shown while a lazily-loaded route chunk is fetched.
export default function PageLoader() {
  return (
    <output
      className="min-h-screen flex items-center justify-center bg-[color:var(--color-bg-canvas)]"
      aria-label="Loading page"
    >
      <div className="h-8 w-8 rounded-full border-2 border-[color:var(--color-gray-200)] border-t-[color:var(--color-primary-500)] animate-spin" />
    </output>
  )
}
