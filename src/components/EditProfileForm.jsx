import { useRef, useState } from 'react'
import ProfileAvatar from './ProfileAvatar'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'
import avatarUploadLimits from '../../shared/avatarUploadLimits.json'

const fieldClass =
  'mt-1 w-full px-3 py-2 rounded-[var(--radius-md)] border border-[color:var(--color-border-soft)] text-[length:var(--text-body-sm)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand)]/30'

function EditProfileFields({
  displayProfile,
  variant,
  updateProfile,
  uploadAvatar,
}) {
  const [username, setUsername] = useState(displayProfile?.username ?? '')
  const [email, setEmail] = useState(displayProfile?.email ?? '')
  const [age, setAge] = useState(displayProfile?.age != null ? String(displayProfile.age) : '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(
    displayProfile?.avatarUrl ?? displayProfile?.avatar_url ?? null,
  )
  const [saveMessage, setSaveMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const originalEmail = (displayProfile?.email ?? '').toLowerCase()
  const emailChanged = email.trim().toLowerCase() !== originalEmail

  const readImageMinSide = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(Math.min(img.naturalWidth, img.naturalHeight))
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read image — try another file.'))
      }
      img.src = url
    })

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setSaveMessage(null)
    try {
      if (file.size > avatarUploadLimits.maxBytes) {
        throw new Error(`Avatar must be ${avatarUploadLimits.maxMbLabel} or smaller`)
      }

      const minSide = await readImageMinSide(file)
      if (minSide < avatarUploadLimits.minSourcePx) {
        throw new Error(
          `Photo is only ${minSide}px on the short side. Use at least ${avatarUploadLimits.minSourcePx}×${avatarUploadLimits.minSourcePx} pixels for a sharp profile picture.`,
        )
      }

      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
      const profile = await uploadAvatar(file)
      setAvatarPreview(profile.avatarUrl ?? profile.avatar_url ?? previewUrl)
      setSaveMessage({ type: 'success', text: 'Profile photo updated.' })
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message })
      setAvatarPreview(displayProfile?.avatarUrl ?? displayProfile?.avatar_url ?? null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMessage(null)

    const patch = {
      username: username.trim(),
      email: email.trim(),
    }

    if (age.trim() === '') {
      patch.age = null
    } else {
      patch.age = Number.parseInt(age, 10)
    }

    if (emailChanged) {
      if (!currentPassword) {
        setSaveMessage({ type: 'error', text: 'Enter your current password to change email.' })
        setSaving(false)
        return
      }
      patch.currentPassword = currentPassword
    }

    try {
      await updateProfile(patch)
      setCurrentPassword('')
      setSaveMessage({ type: 'success', text: 'Profile updated.' })
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <ProfileAvatar avatarUrl={avatarPreview} variant={variant} size={88} />
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={avatarUploadLimits.allowedMime.join(',')}
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="self-start px-3 py-1.5 rounded-[var(--radius-md)] text-[length:var(--text-caption)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
          >
            {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
          <p className="text-[11px] text-[color:var(--color-gray-400)]">
            JPEG, PNG, WebP, or GIF · max {avatarUploadLimits.maxMbLabel} · min{' '}
            {avatarUploadLimits.minSourcePx}×{avatarUploadLimits.minSourcePx} px recommended
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <label className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-gray-700)]">
          Display name
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={fieldClass}
            required
            minLength={2}
            maxLength={50}
          />
        </label>

        <label className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-gray-700)]">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            required
          />
        </label>

        {emailChanged && (
          <label className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-gray-700)]">
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={fieldClass}
              placeholder="Required to change email"
              required
            />
          </label>
        )}

        <label className="text-[length:var(--text-caption)] font-medium text-[color:var(--color-gray-700)]">
          Age
          <input
            type="number"
            min={13}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={fieldClass}
            placeholder="Optional"
          />
        </label>

        {saveMessage && (
          <p
            className={`text-[length:var(--text-caption)] ${
              saveMessage.type === 'success'
                ? 'text-[color:var(--color-success-600)]'
                : 'text-[color:var(--color-error-500)]'
            }`}
          >
            {saveMessage.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start px-4 py-2 rounded-[var(--radius-md)] text-[length:var(--text-body-sm)] font-semibold text-white cursor-pointer disabled:opacity-60 ds-brand-gradient"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </>
  )
}

export default function EditProfileForm({ variant = 'developer' }) {
  const authUser = useAuthStore((s) => s.user)
  const userRole = useAuthStore((s) => s.userRole)
  const profile = useProfileStore((s) => s.profile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const uploadAvatar = useProfileStore((s) => s.uploadAvatar)

  const displayProfile = profile ?? authUser
  const resolvedVariant = variant === 'admin' || userRole === 'admin' ? 'admin' : 'developer'
  const formKey = [
    displayProfile?.id,
    displayProfile?.username,
    displayProfile?.email,
    displayProfile?.age,
    displayProfile?.avatarUrl ?? displayProfile?.avatar_url,
  ].join(':')

  return (
    <div className="ds-card ds-card-pad">
      <h2 className="ds-subsection-title mb-1">Edit profile</h2>
      <p className="ds-body-sm mb-5">Update your name, email, photo, and age.</p>

      <EditProfileFields
        key={formKey}
        displayProfile={displayProfile}
        variant={resolvedVariant}
        updateProfile={updateProfile}
        uploadAvatar={uploadAvatar}
      />
    </div>
  )
}
