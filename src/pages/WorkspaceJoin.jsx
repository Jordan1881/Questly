import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import logoHorizontal from '../assets/LOGO-HORIZENTAL.svg'
import FormButton from '../design-system/components/FormButton'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useAuthStore } from '../stores/authStore'

const inputClass = `
  w-full h-[56px] rounded-[8px] bg-[#f5eefd]
  border border-transparent px-5 text-[15px] text-black
  placeholder-[#a7a3ff] outline-none uppercase tracking-widest text-center
  focus:border-[#942fcd] focus:border-opacity-40 transition-colors duration-200
`

export default function WorkspaceJoin() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const {
    lookupByCode,
    submitJoinRequest,
    fetchMyJoinRequest,
    joinRequest,
    isLoading,
    error,
    clearError,
  } = useWorkspaceStore()
  const [code, setCode] = useState('')
  const [targetWorkspace, setTargetWorkspace] = useState(null)

  useEffect(() => {
    fetchMyJoinRequest().catch(() => {})
    if (user?.workspace_id) navigate('/dashboard', { replace: true })
  }, [user?.workspace_id, navigate, fetchMyJoinRequest])

  const handleLookup = async (e) => {
    e.preventDefault()
    clearError()
    const workspace = await lookupByCode(code)
    setTargetWorkspace(workspace)
  }

  const handleSubmit = async () => {
    if (!targetWorkspace) return
    await submitJoinRequest(targetWorkspace.id)
    setTargetWorkspace(null)
    setCode('')
  }

  if (joinRequest) {
    return (
      <div className="min-h-screen bg-[#fbfbfb] flex items-center justify-center px-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="bg-white rounded-[16px] w-full max-w-[520px] p-10 flex flex-col gap-4 text-center" style={{ boxShadow: '0px 8px 32px 0px rgba(148, 47, 205, 0.12)' }}>
          <div className="w-14 h-14 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center mx-auto text-2xl">⏳</div>
          <h1 className="text-[28px] font-semibold text-[#1f2937]">Join Request Pending</h1>
          <p className="text-[15px] text-[#6b7280]">
            Your request to join the workspace is waiting for admin approval. You will get access once approved.
          </p>
          <p className="text-[13px] text-[#9ca3af]">
            After approval, connect your Jira account on Profile to receive assigned tasks from your
            team&apos;s Jira site.
          </p>
          <FormButton type="button" className="w-full mt-4" onClick={async () => {
            const refreshed = await fetchMe()
            if (refreshed?.workspace_id) navigate('/dashboard')
          }}>
            Check Status
          </FormButton>
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
          <h1 className="text-[32px] font-medium text-black">Join a Workspace</h1>
          <p className="text-[15px] text-[#6b6b6b] mt-2">Enter the workspace code shared by your admin.</p>
        </div>

        {error && (
          <div className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        {!targetWorkspace ? (
          <form onSubmit={handleLookup} className="flex flex-col gap-6">
            <input
              type="text"
              placeholder="WORKSPACE CODE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={inputClass}
              maxLength={12}
            />
            <FormButton type="submit" className="w-full" disabled={isLoading || !code.trim()}>
              {isLoading ? 'Looking up…' : 'Find Workspace'}
            </FormButton>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-[12px] bg-[#f9fafb] border border-[#e5e7eb] px-5 py-4">
              <p className="text-[13px] text-[#6b7280]">You are requesting to join</p>
              <p className="text-[20px] font-semibold text-[#1f2937]">{targetWorkspace.name}</p>
              <p className="text-[13px] text-[#942fcd] font-medium mt-1">Code: {targetWorkspace.code}</p>
            </div>
            <div className="flex gap-3">
              <FormButton type="button" className="flex-1" onClick={() => setTargetWorkspace(null)}>Back</FormButton>
              <FormButton type="button" className="flex-1" disabled={isLoading} onClick={handleSubmit}>
                {isLoading ? 'Submitting…' : 'Submit Request'}
              </FormButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
