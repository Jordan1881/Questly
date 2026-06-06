import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useRewardStore } from '../stores/rewardStore'

const CARD = 'bg-white border border-[#e5e7eb] rounded-[12px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]'

const emptyForm = {
  title: '',
  description: '',
  xpCost: '',
  imageUrl: '',
  couponCodes: '',
}

function rewardToForm(reward) {
  return {
    title: reward.title ?? '',
    description: reward.description ?? '',
    xpCost: String(reward.xpCost ?? ''),
    imageUrl: reward.imageUrl ?? '',
    couponCodes: '',
  }
}

export default function RewardManagementTab() {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const fetchMine = useWorkspaceStore((s) => s.fetchMine)
  const rewards = useRewardStore((s) => s.rewards)
  const isLoading = useRewardStore((s) => s.isLoading)
  const fetchRewards = useRewardStore((s) => s.fetchRewards)
  const createReward = useRewardStore((s) => s.createReward)
  const updateReward = useRewardStore((s) => s.updateReward)
  const uploadCoupons = useRewardStore((s) => s.uploadCoupons)
  const deleteReward = useRewardStore((s) => s.deleteReward)

  const [form, setForm] = useState(emptyForm)
  const [editingRewardId, setEditingRewardId] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = editingRewardId !== null

  useEffect(() => {
    fetchMine()
      .then((ws) => {
        if (ws?.id) fetchRewards(ws.id).catch(() => {})
      })
      .catch(() => {})
  }, [fetchMine, fetchRewards])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingRewardId(null)
  }

  const handleEdit = (reward) => {
    setEditingRewardId(reward.id)
    setForm(rewardToForm(reward))
    setMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!workspace?.id) return

    const xpCost = Number(form.xpCost)
    if (!form.title.trim() || !Number.isInteger(xpCost) || xpCost <= 0) {
      setMessage({ type: 'error', text: 'Title and a positive XP cost are required.' })
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        xpCost,
        imageUrl: form.imageUrl.trim() || null,
      }

      let rewardId = editingRewardId
      if (isEditing) {
        await updateReward(editingRewardId, payload)
      } else {
        const reward = await createReward(workspace.id, payload)
        rewardId = reward.id
      }

      if (form.couponCodes.trim()) {
        await uploadCoupons(rewardId, form.couponCodes)
      }

      resetForm()
      setMessage({
        type: 'success',
        text: isEditing ? 'Reward updated successfully.' : 'Reward created successfully.',
      })
      await fetchRewards(workspace.id)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (rewardId) => {
    if (!workspace?.id) return
    setMessage(null)
    try {
      await deleteReward(rewardId)
      if (editingRewardId === rewardId) resetForm()
      setMessage({ type: 'success', text: 'Reward deleted.' })
      await fetchRewards(workspace.id)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className={`${CARD} p-6`}>
        <h2 className="text-[18px] font-semibold text-[#1f2937] mb-4">
          {isEditing ? 'Edit reward' : 'Add reward'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#374151]">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[14px]"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#374151]">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[14px]"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#374151]">XP cost</span>
              <input
                type="number"
                min="1"
                value={form.xpCost}
                onChange={(e) => setForm((f) => ({ ...f, xpCost: e.target.value }))}
                className="px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[14px]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#374151]">Image URL</span>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[14px]"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[#374151]">
              {isEditing ? 'Add coupon codes (one per line)' : 'Coupon codes (one per line)'}
            </span>
            <textarea
              value={form.couponCodes}
              onChange={(e) => setForm((f) => ({ ...f, couponCodes: e.target.value }))}
              rows={4}
              placeholder="CODE-001&#10;CODE-002"
              className="px-3 py-2 rounded-[8px] border border-[#e5e7eb] text-[14px] font-mono"
            />
          </label>

          {message && (
            <p className={`text-[13px] ${message.type === 'success' ? 'text-[#059669]' : 'text-[#ef4444]'}`}>
              {message.text}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-[8px] text-[14px] font-semibold text-white cursor-pointer disabled:opacity-60"
              style={{ background: 'linear-gradient(to bottom, #942fcd, #b565e0)' }}
            >
              {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create reward'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-[8px] text-[14px] font-medium text-[#374151] border border-[#e5e7eb] cursor-pointer hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={`${CARD} p-6`}>
        <h2 className="text-[18px] font-semibold text-[#1f2937] mb-4">Catalog</h2>
        {isLoading && <p className="text-[13px] text-[#6b7280]">Loading rewards…</p>}
        {!isLoading && rewards.length === 0 && (
          <p className="text-[13px] text-[#6b7280]">No rewards yet.</p>
        )}
        <div className="flex flex-col gap-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={`flex items-center justify-between gap-4 p-4 rounded-[10px] border ${
                editingRewardId === reward.id ? 'border-[#942fcd] bg-[#faf5ff]' : 'border-[#e5e7eb]'
              }`}
            >
              <div>
                <p className="text-[14px] font-semibold text-[#1f2937]">{reward.title}</p>
                <p className="text-[12px] text-[#6b7280]">
                  {reward.xpCost} XP · {reward.stockCount ?? 0} in stock
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(reward)}
                  className="text-[12px] font-semibold text-[#942fcd] cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(reward.id)}
                  className="text-[12px] font-semibold text-[#ef4444] cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
