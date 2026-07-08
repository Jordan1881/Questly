import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useRewardStore } from '../stores/rewardStore'

const INPUT_CLASS =
  'ds-input-field ds-focus-ring px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] text-[length:var(--text-body)] text-[color:var(--color-gray-800)] bg-[color:var(--color-bg)] w-full'

const emptyForm = {
  title: '',
  description: '',
  coinCost: '',
  imageUrl: '',
  couponCodes: '',
}

function rewardToForm(reward) {
  return {
    title: reward.title ?? '',
    description: reward.description ?? '',
    coinCost: String(reward.coinCost ?? ''),
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

    const coinCost = Number(form.coinCost)
    if (!form.title.trim() || !Number.isInteger(coinCost) || coinCost <= 0) {
      setMessage({ type: 'error', text: 'Title and a positive coin cost are required.' })
      return
    }

    setSubmitting(true)
    setMessage(null)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        coinCost,
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
      <div className="ds-card ds-card-pad">
        <h2 className="ds-section-title mb-4">
          {isEditing ? 'Edit reward' : 'Add reward'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className={`${INPUT_CLASS} resize-y`}
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">Coin cost</span>
              <input
                type="number"
                min="1"
                value={form.coinCost}
                onChange={(e) => setForm((f) => ({ ...f, coinCost: e.target.value }))}
                className={INPUT_CLASS}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">Image URL</span>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className={INPUT_CLASS}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="ds-body-sm font-medium text-[color:var(--color-gray-700)]">
              {isEditing ? 'Add coupon codes (one per line)' : 'Coupon codes (one per line)'}
            </span>
            <textarea
              value={form.couponCodes}
              onChange={(e) => setForm((f) => ({ ...f, couponCodes: e.target.value }))}
              rows={4}
              placeholder="CODE-001&#10;CODE-002"
              className={`${INPUT_CLASS} font-mono resize-y`}
            />
          </label>

          {message && (
            <p className={`ds-body-sm ${message.type === 'success' ? 'text-[color:var(--color-success-600)]' : 'text-[color:var(--color-error-500)]'}`}>
              {message.text}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="ds-btn-primary ds-focus-ring px-4 py-2 rounded-[var(--radius-md)] text-[length:var(--text-body)] font-semibold"
            >
              {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create reward'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-[var(--radius-md)] ds-body font-medium text-[color:var(--color-gray-700)] border border-[color:var(--color-border)] cursor-pointer hover:bg-[color:var(--color-bg-subtle)] ds-focus-ring transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="ds-card ds-card-pad">
        <h2 className="ds-section-title mb-4">Catalog</h2>
        {isLoading && <p className="ds-body-sm">Loading rewards…</p>}
        {!isLoading && rewards.length === 0 && (
          <p className="ds-body-sm">No rewards yet.</p>
        )}
        <div className="flex flex-col gap-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={`flex items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] border ${
                editingRewardId === reward.id
                  ? 'border-[color:var(--color-brand)] bg-[color:var(--color-primary-50)]'
                  : 'border-[color:var(--color-border)]'
              }`}
            >
              <div>
                <p className="ds-body font-semibold text-[color:var(--color-gray-800)]">{reward.title}</p>
                <p className="ds-caption">
                  {reward.coinCost} Coins · {reward.stockCount ?? 0} in stock
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(reward)}
                  className="ds-caption font-semibold text-[color:var(--color-brand)] cursor-pointer hover:underline ds-focus-ring rounded-[var(--radius-sm)] px-1"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(reward.id)}
                  className="ds-caption font-semibold text-[color:var(--color-error-500)] cursor-pointer hover:underline ds-focus-ring rounded-[var(--radius-sm)] px-1"
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
