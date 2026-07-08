import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import AuthLayout, { authInputClass } from '../components/layout/AuthLayout'
import FormButton from '../design-system/components/FormButton'
import { useWorkspaceStore } from '../stores/workspaceStore'

export default function WorkspaceCreate() {
  const navigate = useNavigate()
  const { createWorkspace, fetchMine, isLoading, error, clearError } = useWorkspaceStore()
  const [name, setName] = useState('')
  const [created, setCreated] = useState(null)

  useEffect(() => {
    fetchMine()
      .then(() => navigate('/admin', { replace: true }))
      .catch(() => {})
  }, [fetchMine, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    if (!name.trim()) return
    try {
      const workspace = await createWorkspace(name.trim())
      setCreated(workspace)
    } catch {
      // error surfaced via store
    }
  }

  const copyCode = async () => {
    if (!created?.code) return
    await navigator.clipboard.writeText(created.code)
  }

  if (created) {
    return (
      <AuthLayout centered>
        <div className="ds-card ds-card-pad w-full max-w-[520px] flex flex-col gap-6 shadow-[var(--shadow-lg)]">
          <h1 className="text-[32px] font-medium text-[color:var(--color-gray-900)]">Workspace Created</h1>
          <p className="ds-body">
            Share this code with developers so they can request to join <strong>{created.name}</strong>.
          </p>
          <div className="rounded-[12px] bg-[color:var(--color-bg-brand-subtle)] border border-[color:var(--color-border-brand)] px-6 py-5 text-center">
            <p className="text-[13px] uppercase tracking-wide text-[color:var(--color-brand)] font-semibold mb-2">Workspace Code</p>
            <p className="text-[36px] font-bold tracking-[0.2em] text-[color:var(--color-gray-800)]">{created.code}</p>
          </div>
          <div className="flex gap-3">
            <FormButton type="button" className="flex-1" onClick={copyCode}>Copy Code</FormButton>
            <FormButton type="button" className="flex-1" onClick={() => navigate('/admin')}>Go to Admin</FormButton>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout centered>
      <div className="ds-card ds-card-pad w-full max-w-[520px] flex flex-col gap-8 shadow-[var(--shadow-lg)]">
        <div>
          <h1 className="text-[32px] font-medium text-[color:var(--color-gray-900)]">Create Workspace</h1>
          <p className="ds-body mt-2">Set up your team workspace and get a shareable join code.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[color:var(--color-gray-900)]">Workspace Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={authInputClass}
            />
          </div>

          <FormButton type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create Workspace'}
          </FormButton>
        </form>
      </div>
    </AuthLayout>
  )
}
