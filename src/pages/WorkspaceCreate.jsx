import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import FormButton from '../design-system/components/FormButton'
import { useWorkspaceStore } from '../stores/workspaceStore'

const inputClass = `
  w-full h-[56px] rounded-[8px] bg-[#f5eefd]
  border border-transparent px-5 text-[15px] text-black
  placeholder-[#a7a3ff] outline-none
  focus:border-[#942fcd] focus:border-opacity-40 transition-colors duration-200
`

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
      <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center px-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="bg-white rounded-[16px] w-full max-w-[520px] p-10 flex flex-col gap-6" style={{ boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.12)' }}>
          <h1 className="text-[32px] font-medium text-black">Workspace Created</h1>
          <p className="text-[15px] text-[#6b6b6b]">
            Share this code with developers so they can request to join <strong>{created.name}</strong>.
          </p>
          <div className="rounded-[12px] bg-[#f5eefd] border border-[#e9d5ff] px-6 py-5 text-center">
            <p className="text-[13px] uppercase tracking-wide text-[#942fcd] font-semibold mb-2">Workspace Code</p>
            <p className="text-[36px] font-bold tracking-[0.2em] text-[#1f2937]">{created.code}</p>
          </div>
          <div className="flex gap-3">
            <FormButton type="button" className="flex-1" onClick={copyCode}>Copy Code</FormButton>
            <FormButton type="button" className="flex-1" onClick={() => navigate('/admin')}>Go to Admin</FormButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center relative px-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <img
        src={logoHorizontal}
        alt="Questly"
        className="absolute top-[60px] left-[75px] w-[180px] cursor-pointer hidden md:block"
        onClick={() => navigate('/')}
      />

      <div className="bg-white rounded-[16px] w-full max-w-[520px] p-10 flex flex-col gap-8" style={{ boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.12)' }}>
        <div>
          <h1 className="text-[32px] font-medium text-black">Create Workspace</h1>
          <p className="text-[15px] text-[#6b6b6b] mt-2">Set up your team workspace and get a shareable join code.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-black">Workspace Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <FormButton type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create Workspace'}
          </FormButton>
        </form>
      </div>
    </div>
  )
}
